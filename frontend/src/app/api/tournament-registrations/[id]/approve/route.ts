import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { adminId, action, reason } = body;

    // Validate required fields
    if (!adminId || !action) {
      return NextResponse.json(
        { success: false, message: "Admin ID and action are required" },
        { status: 400 }
      );
    }

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json(
        {
          success: false,
          message: "Action must be either 'approve' or 'reject'",
        },
        { status: 400 }
      );
    }

    // Call backend API
    const backendUrl = process.env.BACKEND_URL || "http://localhost:5001";
    const response = await fetch(
      `${backendUrl}/api/tournament-registrations/${id}/approve`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ adminId, action, reason }),
      }
    );

    const data = await response.json();

    if (response.ok) {
      return NextResponse.json(data);
    } else {
      return NextResponse.json(
        {
          success: false,
          message: data.message || "Failed to process approval",
        },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error("Tournament registration approval error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

