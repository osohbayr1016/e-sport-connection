import { NextRequest, NextResponse } from "next/server";

const FAILURE = "Санал хүсэлтийн үйлчилгээ түр боломжгүй байна. Дараа дахин оролдоно уу.";

function workerOrigin(): string | null {
  const raw = process.env.COMMUNITY_API_ORIGIN;
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && parsed.hostname === "localhost")) return null;
    if (parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== "/") return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

async function hmacHex(secret: string, value: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signed = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(signed), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function proxy(request: NextRequest, method: "GET" | "POST") {
  if (method === "POST" && process.env.VERCEL_ENV === "preview") {
    return NextResponse.json({ success: false, message: "Preview орчинд санал илгээх боломжгүй." }, { status: 403 });
  }
  const origin = workerOrigin();
  if (!origin) {
    return NextResponse.json({ success: false, message: FAILURE }, { status: 503 });
  }

  try {
    let body: string | undefined;
    const forwardHeaders: Record<string, string> = { accept: "application/json" };
    if (method === "POST") {
      const sourceOrigin = request.headers.get("origin");
      if (sourceOrigin && sourceOrigin !== new URL(request.url).origin) {
        return NextResponse.json({ success: false, message: "Хүсэлтийг зөвшөөрсөнгүй." }, { status: 403 });
      }
      const type = request.headers.get("content-type") || "";
      if (!type.toLowerCase().startsWith("application/json")) {
        return NextResponse.json({ success: false, message: "JSON шаардлагатай." }, { status: 415 });
      }
      // Vercel overwrites x-vercel-forwarded-for with its trusted client IP.
      // A per-visitor HMAC lets Worker rate-limit individual visitors instead
      // of sharing one bucket across all visitors behind Vercel.
      const secret = process.env.COMMUNITY_PROXY_SECRET;
      const clientIp = (request.headers.get("x-vercel-forwarded-for") ||
        (process.env.NODE_ENV !== "production" ? request.headers.get("x-forwarded-for") || "127.0.0.1" : "")).split(",")[0].trim();
      if (!secret || secret.length < 32 || !clientIp) {
        return NextResponse.json({ success: false, message: FAILURE }, { status: 503 });
      }
      const day = new Date().toISOString().slice(0, 10);
      const visitor = await hmacHex(secret, day + ":" + clientIp);
      forwardHeaders["x-community-visitor"] = visitor;
      forwardHeaders["x-community-signature"] = await hmacHex(secret, day + ":" + visitor);
      forwardHeaders["x-community-day"] = day;
      forwardHeaders["content-type"] = "application/json";
      body = await request.text();
      if (body.length > 8192) {
        return NextResponse.json({ success: false, message: "Хүсэлт хэт урт байна." }, { status: 413 });
      }
    }

    const upstream = await fetch(origin + "/api/feedback", {
      method,
      body,
      headers: forwardHeaders,
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
      redirect: "error",
    });
    const responseText = await upstream.text();
    if (responseText.length > 500000) throw new Error("Invalid upstream response size");
    const data = JSON.parse(responseText);
    if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("Invalid response");
    return NextResponse.json(data, {
      status: upstream.status,
      headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" },
    });
  } catch (error) {
    console.error("Community feedback proxy error", error instanceof Error ? error.name : "unknown");
    return NextResponse.json({ success: false, message: FAILURE }, { status: 503 });
  }
}

export async function GET(request: NextRequest) {
  return proxy(request, "GET");
}

export async function POST(request: NextRequest) {
  return proxy(request, "POST");
}
