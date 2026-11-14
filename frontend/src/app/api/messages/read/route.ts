import { NextRequest, NextResponse } from "next/server";

// Get API base URL from environment or default to localhost
const getApiBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  return "http://localhost:8000";
};

const API_BASE_URL = getApiBaseUrl();

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization");
    const token = request.cookies.get("token")?.value;
    const body = await request.json();

    const response = await fetch(`${API_BASE_URL}/api/messages/read`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authorization && { Authorization: authorization }),
        ...(!authorization && token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to mark messages as read",
        error: String(error),
      },
      { status: 500 }
    );
  }
}
