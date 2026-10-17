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

async function proxy(request: NextRequest, method: "GET" | "POST") {
  const origin = workerOrigin();
  if (!origin) {
    return NextResponse.json({ success: false, message: FAILURE }, { status: 503 });
  }

  try {
    let body: string | undefined;
    if (method === "POST") {
      const sourceOrigin = request.headers.get("origin");
      if (sourceOrigin && sourceOrigin !== new URL(request.url).origin) {
        return NextResponse.json({ success: false, message: "Хүсэлтийг зөвшөөрсөнгүй." }, { status: 403 });
      }
      const type = request.headers.get("content-type") || "";
      if (!type.toLowerCase().startsWith("application/json")) {
        return NextResponse.json({ success: false, message: "JSON шаардлагатай." }, { status: 415 });
      }
      body = await request.text();
      if (body.length > 8192) {
        return NextResponse.json({ success: false, message: "Хүсэлт хэт урт байна." }, { status: 413 });
      }
    }

    const upstream = await fetch(origin + "/api/feedback", {
      method,
      body,
      headers: { accept: "application/json", ...(method === "POST" ? { "content-type": "application/json" } : {}) },
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
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
