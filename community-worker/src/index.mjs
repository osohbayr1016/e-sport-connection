const MODERATION_STATUSES = new Set(["approved", "planned", "in_progress", "shipped", "rejected"]);
const TYPES = new Set(["feature", "bug", "experience"]);

function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      ...headers,
    },
  });
}

function corsHeaders(origin, env) {
  if (!origin || origin !== env.ALLOWED_ORIGIN) return {};
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "Content-Type, Authorization",
    "vary": "Origin",
  };
}

function error(message, status, headers) {
  return json({ success: false, message }, status, headers);
}

async function digest(value) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function isAdmin(request, env) {
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!env.FEEDBACK_ADMIN_TOKEN || env.FEEDBACK_ADMIN_TOKEN.length < 32 || !token) return false;
  return (await digest(token)) === (await digest(env.FEEDBACK_ADMIN_TOKEN));
}

function validate(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  if (!TYPES.has(payload.type)) return null;
  if (typeof payload.title !== "string" || typeof payload.description !== "string") return null;
  if (payload.alias !== undefined && typeof payload.alias !== "string") return null;
  const title = payload.title.trim();
  const description = payload.description.trim();
  const alias = (payload.alias || "").trim();
  if (title.length < 8 || title.length > 100 || description.length < 20 || description.length > 1200 || alias.length > 40) return null;
  return { type: payload.type, title, description, alias };
}

async function hmacHex(secret, input) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const result = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(input));
  return Array.from(new Uint8Array(result), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function limitSubmission(env, request) {
  if (!env.RATE_LIMIT_SALT || env.RATE_LIMIT_SALT.length < 32) return { configured: false };
  const day = new Date().toISOString().slice(0, 10);
  let identity = "";
  const visitor = request.headers.get("x-community-visitor");
  const signature = request.headers.get("x-community-signature");
  const proxyDay = request.headers.get("x-community-day");

  if (visitor || signature || proxyDay) {
    if (!env.COMMUNITY_PROXY_SECRET || env.COMMUNITY_PROXY_SECRET.length < 32) return { configured: false };
    if (!visitor || !/^[a-f0-9]{64}$/.test(visitor) || !signature || !/^[a-f0-9]{64}$/.test(signature) || proxyDay !== day) {
      return { configured: true, allowed: false };
    }
    const expected = await hmacHex(env.COMMUNITY_PROXY_SECRET, day + ":" + visitor);
    if (signature !== expected) return { configured: true, allowed: false };
    identity = "trusted-proxy:" + visitor;
  } else {
    // Cloudflare controls CF-Connecting-IP on direct incoming requests.
    // Do not trust client-supplied X-Real-IP or X-Forwarded-For.
    const ip = request.headers.get("cf-connecting-ip");
    if (!ip) return { configured: true, allowed: false };
    identity = "direct:" + ip;
  }
  const fingerprint = await digest(env.RATE_LIMIT_SALT + ":" + day + ":" + identity);
  const allowed = await env.DB.prepare(
    "INSERT INTO feedback_limits (fingerprint, day, count) VALUES (?, ?, 1) " +
    "ON CONFLICT(fingerprint, day) DO UPDATE SET count = count + 1 WHERE count < 3 RETURNING count"
  ).bind(fingerprint, day).first();
  return { configured: true, allowed: Boolean(allowed) };
}

async function listFeedback(env, admin) {
  const rows = await env.DB.prepare(
    admin
      ? "SELECT id, type, title, description, alias, status, created_at FROM feedback ORDER BY created_at DESC LIMIT 100"
      : "SELECT id, type, title, description, alias, status, created_at FROM feedback WHERE status IN ('approved','planned','in_progress','shipped') ORDER BY created_at DESC LIMIT 40"
  ).all();
  return json({ success: true, feedback: rows.results || [] });
}


const TOURNAMENT_STATUSES = new Set(["upcoming", "registration_open", "ongoing", "completed", "cancelled"]);

function validDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value) && !Number.isNaN(Date.parse(value));
}

function validateTournament(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const fields = ["title", "description", "format", "venue", "organizer", "game"];
  if (fields.some((key) => typeof payload[key] !== "string")) return null;
  const title = payload.title.trim();
  const description = payload.description.trim();
  const format = payload.format.trim();
  const venue = payload.venue.trim();
  const organizer = payload.organizer.trim();
  const game = payload.game.trim();
  if (title.length < 8 || title.length > 120 || description.length < 20 || description.length > 2000) return null;
  if (!format || format.length > 80 || !venue || venue.length > 100 || !organizer || organizer.length > 80 || !game || game.length > 60) return null;
  if (!TOURNAMENT_STATUSES.has(payload.status) || !validDate(payload.starts_at)) return null;
  if (payload.registration_closes_at != null && !validDate(payload.registration_closes_at)) return null;
  if (!Number.isInteger(payload.max_teams) || payload.max_teams < 2 || payload.max_teams > 1024) return null;
  if (!Number.isInteger(payload.prize_pool_mnt) || payload.prize_pool_mnt < 0 || payload.prize_pool_mnt > 1_000_000_000) return null;
  let registrationUrl = "";
  if (payload.registration_url != null && payload.registration_url !== "") {
    if (typeof payload.registration_url !== "string" || payload.registration_url.length > 500) return null;
    try {
      const url = new URL(payload.registration_url);
      if (url.protocol !== "https:" || url.username || url.password) return null;
      registrationUrl = url.href;
    } catch { return null; }
  }
  if (typeof payload.published !== "boolean") return null;
  return {
    title, description, format, venue, organizer, game, status: payload.status,
    starts_at: payload.starts_at, registration_closes_at: payload.registration_closes_at || null,
    max_teams: payload.max_teams, prize_pool_mnt: payload.prize_pool_mnt,
    registration_url: registrationUrl, published: payload.published ? 1 : 0,
  };
}

async function handleTournaments(request, env, path, cors) {
  if (path === "/api/tournaments" && request.method === "GET") {
    const rawLimit = new URL(request.url).searchParams.get("limit") || "20";
    const limit = /^\d{1,2}$/.test(rawLimit) ? Math.min(50, Math.max(1, Number(rawLimit))) : 20;
    const rows = await env.DB.prepare(
      "SELECT id, title, description, format, venue, organizer, game, status, starts_at, registration_closes_at, max_teams, prize_pool_mnt, registration_url FROM tournaments WHERE published = 1 ORDER BY CASE WHEN status IN ('registration_open','upcoming') THEN 0 WHEN status = 'ongoing' THEN 1 ELSE 2 END, starts_at ASC LIMIT ?"
    ).bind(limit).all();
    return json({ success: true, tournaments: rows.results || [] }, 200, cors);
  }

  if (path === "/api/tournaments" && request.method === "POST") {
    if (!(await isAdmin(request, env))) return error("Unauthorized", 401, cors);
    if (!(request.headers.get("content-type") || "").toLowerCase().startsWith("application/json")) return error("JSON required", 415, cors);
    const raw = await request.text();
    if (raw.length > 8192) return error("Request too large", 413, cors);
    let payload;
    try { payload = JSON.parse(raw); } catch { return error("Invalid JSON", 400, cors); }
    const data = validateTournament(payload);
    if (!data) return error("Invalid tournament data", 400, cors);
    const id = crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO tournaments (id, title, description, format, venue, organizer, game, status, starts_at, registration_closes_at, max_teams, prize_pool_mnt, registration_url, published, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(id, data.title, data.description, data.format, data.venue, data.organizer, data.game, data.status, data.starts_at, data.registration_closes_at, data.max_teams, data.prize_pool_mnt, data.registration_url, data.published, new Date().toISOString()).run();
    return json({ success: true, id, published: Boolean(data.published) }, 201, cors);
  }

  const detail = path.match(/^\/api\/tournaments\/([0-9a-f-]{36})$/i);
  if (detail && request.method === "GET") {
    const row = await env.DB.prepare(
      "SELECT id, title, description, format, venue, organizer, game, status, starts_at, registration_closes_at, max_teams, prize_pool_mnt, registration_url FROM tournaments WHERE id = ? AND published = 1"
    ).bind(detail[1]).first();
    if (!row) return error("Tournament not found", 404, cors);
    return json({ success: true, tournament: row }, 200, cors);
  }

  const edit = path.match(/^\/api\/tournaments\/([0-9a-f-]{36})\/status$/i);
  if (edit && request.method === "POST") {
    if (!(await isAdmin(request, env))) return error("Unauthorized", 401, cors);
    let payload;
    try { payload = await request.json(); } catch { return error("Invalid JSON", 400, cors); }
    if (!payload || !TOURNAMENT_STATUSES.has(payload.status) || typeof payload.published !== "boolean") {
      return error("Invalid status or publication flag", 400, cors);
    }
    const result = await env.DB.prepare("UPDATE tournaments SET status = ?, published = ? WHERE id = ?")
      .bind(payload.status, payload.published ? 1 : 0, edit[1]).run();
    if (!result.meta?.changes) return error("Tournament not found", 404, cors);
    return json({ success: true, id: edit[1], status: payload.status, published: payload.published }, 200, cors);
  }
  return error("Not found", 404, cors);
}

export default {
  async scheduled(_event, env, ctx) {
    if (!env.DB) return;
    // Limit fingerprints are pseudonymous, but should not be retained indefinitely.
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const cleanup = env.DB.prepare("DELETE FROM feedback_limits WHERE day < ?").bind(cutoff).run();
    if (ctx && typeof ctx.waitUntil === "function") ctx.waitUntil(cleanup);
    else await cleanup;
  },
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";
    const origin = request.headers.get("origin");
    const cors = corsHeaders(origin, env);

    if (request.method === "OPTIONS" && (path.startsWith("/api/feedback") || path.startsWith("/api/tournaments"))) {
      if (!origin || origin !== env.ALLOWED_ORIGIN) return error("Origin not allowed", 403);
      return new Response(null, { status: 204, headers: cors });
    }
    if (origin && origin !== env.ALLOWED_ORIGIN && request.method !== "GET" && request.method !== "HEAD") {
      return error("Origin not allowed", 403);
    }

    if (path === "/health" && request.method === "GET") {
      // A bound database is not sufficient: a missing migration or secret
      // makes writes fail. Health must reflect the ACTUAL submission path.
      const configured = Boolean(
        env.DB &&
        typeof env.ALLOWED_ORIGIN === "string" && env.ALLOWED_ORIGIN.startsWith("https://") &&
        typeof env.RATE_LIMIT_SALT === "string" && env.RATE_LIMIT_SALT.length >= 32 &&
        typeof env.COMMUNITY_PROXY_SECRET === "string" && env.COMMUNITY_PROXY_SECRET.length >= 32 &&
        typeof env.FEEDBACK_ADMIN_TOKEN === "string" && env.FEEDBACK_ADMIN_TOKEN.length >= 32
      );
      if (!configured) return json({ status: "unconfigured", service: "community-feedback" }, 503, cors);
      try {
        await env.DB.prepare("SELECT id FROM feedback LIMIT 1").first();
        return json({ status: "ready", service: "community-feedback" }, 200, cors);
      } catch {
        return json({ status: "unavailable", service: "community-feedback" }, 503, cors);
      }
    }
    if (path.startsWith("/api/tournaments")) {
      if (!env.DB) return error("Tournament database is not configured", 503, cors);
      try { return await handleTournaments(request, env, path, cors); }
      catch (err) {
        console.error("Tournament API request failed", err instanceof Error ? err.message : "unknown error");
        return error("Service temporarily unavailable", 503, cors);
      }
    }

    if (!path.startsWith("/api/feedback")) return error("Not found", 404, cors);
    if (!env.DB) return error("Feedback database is not configured", 503, cors);

    try {
      if (path === "/api/feedback" && request.method === "GET") {
        const requestedAdmin = url.searchParams.get("scope") === "admin";
        const admin = requestedAdmin && (await isAdmin(request, env));
        if (requestedAdmin && !admin) return error("Unauthorized", 401, cors);
        const result = await listFeedback(env, admin);
        return new Response(result.body, { status: result.status, headers: { ...Object.fromEntries(result.headers), ...cors } });
      }

      if (path === "/api/feedback" && request.method === "POST") {
        const declaredSize = Number(request.headers.get("content-length") || 0);
        if (declaredSize > 8192) return error("Request too large", 413, cors);
        if (!(request.headers.get("content-type") || "").toLowerCase().startsWith("application/json")) {
          return error("JSON required", 415, cors);
        }
        const raw = await request.text();
        if (raw.length > 8192) return error("Request too large", 413, cors);
        let payload;
        try { payload = JSON.parse(raw); } catch { return error("Invalid JSON", 400, cors); }
        if (payload && typeof payload.website === "string" && payload.website.trim()) {
          return json({ success: true, message: "Баярлалаа. Санал хүлээн авлаа." }, 202, cors);
        }
        const feedback = validate(payload);
        if (!feedback) return error("Саналын төрөл, гарчиг эсвэл тайлбарыг шалгана уу.", 400, cors);

        const limit = await limitSubmission(env, request);
        if (!limit.configured) return error("Submission protection is not configured", 503, cors);
        if (!limit.allowed) return error("Өнөөдрийн хүсэлтийн хязгаарт хүрсэн. Дараа дахин оролдоно уу.", 429, cors);

        const id = crypto.randomUUID();
        await env.DB.prepare(
          "INSERT INTO feedback (id, type, title, description, alias, status, created_at) VALUES (?, ?, ?, ?, ?, 'pending', ?)"
        ).bind(id, feedback.type, feedback.title, feedback.description, feedback.alias, new Date().toISOString()).run();
        return json({ success: true, id, status: "pending", message: "Санал хүлээн авлаа. Хянасны дараа нийтлэгдэнэ." }, 201, cors);
      }

      const match = path.match(/^\/api\/feedback\/([0-9a-f-]{36})\/moderate$/i);
      if (match && request.method === "POST") {
        if (!(await isAdmin(request, env))) return error("Unauthorized", 401, cors);
        let payload;
        try { payload = await request.json(); } catch { return error("Invalid JSON", 400, cors); }
        if (!payload || !MODERATION_STATUSES.has(payload.status)) return error("Invalid status", 400, cors);
        const result = await env.DB.prepare("UPDATE feedback SET status = ? WHERE id = ?")
          .bind(payload.status, match[1]).run();
        if (!result.meta?.changes) return error("Not found", 404, cors);
        return json({ success: true, id: match[1], status: payload.status }, 200, cors);
      }
      return error("Method not allowed", 405, { ...cors, allow: "GET, POST" });
    } catch (err) {
      console.error("Feedback API request failed", err instanceof Error ? err.message : "unknown error");
      return error("Service temporarily unavailable", 503, cors);
    }
  },
};
