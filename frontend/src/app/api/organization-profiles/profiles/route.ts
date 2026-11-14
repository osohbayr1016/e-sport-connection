import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/organization-profiles/profiles`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error fetching organization profiles:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch organization profiles" },
      { status: 500 }
    );
  }
}
