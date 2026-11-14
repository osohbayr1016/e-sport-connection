import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = p => readFileSync(new URL("../../"+p,import.meta.url),"utf8");
test("public tournament participant list excludes private payment and email data",()=>{
 const src=read("backend/src/routes/tournamentRoutes.ts");
 assert.ok(src.includes('isApproved: true, isBanned: { $ne: true }'));
 assert.ok(src.includes('.select("tournament squad squadLeader squadMembers registrationDate status isApproved approvalStatus")'));
 assert.ok(src.includes('.populate("squadLeader", "name avatar")'));
});
test("registration payment and squad history are not public",()=>{
 const src=read("backend/src/routes/tournamentRegistrationRoutes.ts");
 assert.ok(src.includes('fastify.get("/tournament/:tournamentId", { preHandler: [authenticateToken, requireAdmin] }'));
 assert.ok(src.includes('fastify.get("/squad/:squadId", { preHandler: [authenticateToken] }'));
 assert.ok(src.includes('squad.leader.toString() !== actor?.id'));
});
