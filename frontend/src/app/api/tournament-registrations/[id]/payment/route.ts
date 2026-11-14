import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, message: "Admin authentication required" }, { status: 401 });
    }
    const { paymentStatus, paymentReference } = await request.json();
    if (paymentStatus !== "paid" || typeof paymentReference !== "string" ||
        !/^[A-Za-z0-9_-]{6,80}$/.test(paymentReference.trim())) {
      return NextResponse.json({ success: false, message: "Valid bank reference required" }, { status: 400 });
    }
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
    const response = await fetch(`${backendUrl}/api/tournament-registrations/${encodeURIComponent(id)}/payment`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: authorization },
      body: JSON.stringify({ paymentStatus, paymentReference }),
      cache: "no-store",
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ success: false, message: "Unable to verify payment" }, { status: 500 });
  }
}
