import { NextResponse } from "next/server";

export function communityOrigin(): string | null {
  const raw = process.env.COMMUNITY_API_ORIGIN;
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && url.hostname === "localhost")) return null;
    if (url.username || url.password || url.search || url.hash || url.pathname !== "/") return null;
    return url.origin;
  } catch {
    return null;
  }
}

export async function communityGet(path: string): Promise<NextResponse> {
  const origin = communityOrigin();
  if (!origin) return NextResponse.json({ success: false, message: "Тэмцээний үйлчилгээ түр боломжгүй байна." }, { status: 503 });
  if (!/^\/api\/tournaments(?:\?limit=\d{1,2}|\/[0-9a-f-]{36})?$/i.test(path)) {
    return NextResponse.json({ success: false, message: "Invalid request" }, { status: 400 });
  }
  try {
    const upstream = await fetch(origin + path, { method: "GET", cache: "no-store", redirect: "error", signal: AbortSignal.timeout(8000) });
    const body = await upstream.text();
    if (body.length > 500000) throw new Error("Oversized response");
    const data: unknown = JSON.parse(body);
    if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("Invalid response");
    return NextResponse.json(data, { status: upstream.status, headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" } });
  } catch (error) {
    console.error("Community tournament upstream unavailable", error instanceof Error ? error.name : "unknown");
    return NextResponse.json({ success: false, message: "Тэмцээний үйлчилгээ түр боломжгүй байна." }, { status: 503 });
  }
}
