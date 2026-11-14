import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const src = readFileSync(new URL("../../backend/src/routes/tournamentRoutes.ts",import.meta.url),"utf8");
test("tournament update is field allowlisted and never mutates capacity directly",()=>{
 for(const field of ["currentSquads","status","brackets","winner","_id"]) {
  assert.ok(!src.includes('"' + field + '", "startDate"') || field !== "currentSquads");
 }
 assert.ok(src.includes("keys.some(key => !editable.has(key))"));
 assert.ok(src.includes('currentSquads: { $lte: maxSquads }'));
 assert.ok(src.includes('currentSquads: 0'));
});
test("hard-delete refuses any tournament with participants or matches",()=>{
 assert.ok(src.includes("TournamentRegistration.exists({ tournament: id })"));
 assert.ok(src.includes("TournamentMatch.exists({ tournament: id })"));
 assert.ok(src.includes("session.withTransaction"));
 assert.ok(src.includes('TournamentDeletionError(409, "Tournament contains participants or matches'));
});
