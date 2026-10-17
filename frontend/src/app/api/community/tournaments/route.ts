import { communityGet } from "../../../../lib/communityRead";

export async function GET() {
  return communityGet("/api/tournaments?limit=40");
}
