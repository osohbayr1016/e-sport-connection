import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ squadId: string }> }
) {
  try {
    const { squadId } = await params;
    const body = await request.json();
    const authorization = request.headers.get("authorization");

    const url = `${API_BASE_URL}/api/divisions/upgrade/${squadId}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authorization && { Authorization: authorization }),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error upgrading division:", error);
    return NextResponse.json(
      { success: false, message: "Failed to upgrade division" },
      { status: 500 }
    );
  }
}
