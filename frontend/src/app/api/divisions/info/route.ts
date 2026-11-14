import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  try {
    const url = `${API_BASE_URL}/api/divisions/info`;

    const authorization = request.headers.get("authorization");
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(authorization && { Authorization: authorization }),
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error fetching divisions info:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch divisions info" },
      { status: 500 }
    );
  }
}
