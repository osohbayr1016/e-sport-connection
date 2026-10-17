import { NextResponse } from "next/server";
import { communityGet } from "../../../../../lib/communityRead";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ success: false, message: "Invalid tournament ID" }, { status: 400 });
  }
  return communityGet("/api/tournaments/" + id);
}
