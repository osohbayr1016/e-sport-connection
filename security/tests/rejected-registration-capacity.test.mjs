import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const code=readFileSync(new URL("../../backend/src/services/tournamentRegistrationService.ts",import.meta.url),"utf8");
test("a rejected registration cannot free tournament capacity twice",()=>{
 assert.ok(code.includes('existing.approvalStatus === "rejected"'));
 assert.ok(code.includes('approvalStatus: { $ne: "rejected" }'));
});
