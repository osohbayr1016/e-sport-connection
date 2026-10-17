import { NextResponse } from "next/server";

// This route must never forward a destructive wipe to the legacy backend.
export async function DELETE() {
  return NextResponse.json(
    { success: false, message: "Bulk deletion API is permanently disabled" },
    { status: 410, headers: { "cache-control": "no-store" } }
  );
}
