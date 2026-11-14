import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const src=readFileSync(new URL("../../backend/src/services/tournamentMatchService.ts",import.meta.url),"utf8");
test("event starts and bracket insertion are all-or-nothing",()=>{
 assert.ok(src.includes("startTournamentWithBrackets(tournamentId"));
 assert.ok(src.includes("session.withTransaction("));
 assert.ok(src.includes('status: { $in: ["upcoming", "registration_open", "registration_closed"] }'));
 assert.ok(src.includes("await generateTournamentMatches(tournamentId, session)"));
 assert.ok(src.includes("await TournamentMatch.insertMany(matches, { session })"));
});
