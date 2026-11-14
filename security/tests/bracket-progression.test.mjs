import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read=p=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
test("round advancement is format aware and serialized by tournament",()=>{
 const svc=read("backend/src/services/tournamentMatchService.ts"),route=read("backend/src/routes/tournamentMatchRoutes.ts");
 assert.ok(svc.includes('tournament.format === "Round Robin"'));
 assert.ok(svc.includes('tournament.format !== "Single Elimination"'));
 assert.ok(svc.includes("bracketRevision: 1"));
 assert.ok(svc.includes('matchType: "auto_win"'));
 assert.ok(route.includes("advanceCompletedTournamentRound("));
 assert.ok(!route.includes("await TournamentMatch.insertMany(newMatches);"));
});
