import { NextRequest, NextResponse } from "next/server";

// Get API base URL from environment or default to localhost
const getApiBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  return "http://localhost:8000";
};

const API_BASE_URL = getApiBaseUrl();

export async function GET(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization");
    const token = request.cookies.get("token")?.value;

    const response = await fetch(`${API_BASE_URL}/api/messages/unread/count`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(authorization && { Authorization: authorization }),
        ...(!authorization && token && { Authorization: `Bearer ${token}` }),
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error fetching unread messages count:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch unread messages count",
        error: String(error),
      },
      { status: 500 }
    );
  }
}
