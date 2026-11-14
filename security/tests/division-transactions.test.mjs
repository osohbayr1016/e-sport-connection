import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const src=readFileSync(new URL("../../backend/src/services/divisionService.ts",import.meta.url),"utf8");
test("match rewards and division changes commit atomically and only once",()=>{
 assert.ok(src.includes('session.withTransaction('));
 assert.ok(src.includes('match.divisionChangesProcessed) return'));
 assert.ok(src.includes('await match.save({ session })'));
 assert.ok(src.includes('await squad.save({ session })'));
 assert.ok(src.includes('winner === firstId && loser === secondId'));
});
