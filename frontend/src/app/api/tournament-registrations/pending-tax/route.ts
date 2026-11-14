import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "10";

    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, message: "Admin authentication required" }, { status: 401 });
    }
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
    const response = await fetch(
      `${backendUrl}/api/tournament-registrations/pending-tax?page=${page}&limit=${limit}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: authorization,
        },
        cache: "no-store",
      }
    );

    const data = await response.json();

    if (response.ok) {
      return NextResponse.json(data);
    } else {
      return NextResponse.json(
        {
          success: false,
          message: data.message || "Failed to fetch registrations",
        },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error("Get pending tax registrations error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

