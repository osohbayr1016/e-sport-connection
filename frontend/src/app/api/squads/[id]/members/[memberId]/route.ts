import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const { id, memberId } = params;
    const authorization = request.headers.get("authorization");
    const body = await request.json().catch(() => ({}));

    const response = await fetch(
      `${API_BASE_URL}/api/squads/${id}/members/${memberId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(authorization && { Authorization: authorization }),
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error removing member:", error);
    return NextResponse.json(
      { success: false, message: "Failed to remove member" },
      { status: 500 }
    );
  }
}
