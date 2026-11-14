import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, message: "Admin authentication required" }, { status: 401 });
    }
    const { action, reason } = await request.json();
    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 });
    }
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
    const response = await fetch(`${backendUrl}/api/tournament-registrations/${encodeURIComponent(id)}/approve`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: authorization },
      body: JSON.stringify({ action, reason }),
      cache: "no-store",
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ success: false, message: "Unable to process registration" }, { status: 500 });
  }
}
