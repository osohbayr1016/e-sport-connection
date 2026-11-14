import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const routes=readFileSync(new URL("../../backend/src/routes/squadRoutes.ts",import.meta.url),"utf8");
test("invitations and applications update status and roster atomically",()=>{
 const count=(routes.match(/session\.withTransaction\(async \(\) => \{/g)||[]).length;
 assert.ok(count >= 2);
 assert.ok(routes.includes("invitation.squad.toString() !== id"));
 assert.ok(routes.includes("application.squad.toString() !== id"));
 assert.ok(routes.includes("memberId: claimed.applicant.toString(), leaderId: userId, session"));
 assert.ok(routes.includes("memberId: userId, session"));
});
