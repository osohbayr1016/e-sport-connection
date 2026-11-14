import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const authorization = request.headers.get("authorization");

    const response = await fetch(
      `${API_BASE_URL}/api/squads/user/${userId}/applications`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(authorization && { Authorization: authorization }),
        },
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error fetching user applications:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch user applications" },
      { status: 500 }
    );
  }
}
