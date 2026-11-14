import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const src=p=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
test("squad join and leader add use compare-and-add atomic Mongo updates",()=>{
 const routes=src("backend/src/routes/squadRoutes.ts");
 const service=src("backend/src/services/squadMembershipService.ts");
 assert.ok(service.includes('$expr: { $lt: [{ $size: "$members" }, "$maxMembers"] }'));
 assert.ok(service.includes('$addToSet: { members: member }'));
 assert.ok(routes.includes('onlyOpen: true'));
 assert.ok(routes.includes('memberId: newMemberId, leaderId'));
});
