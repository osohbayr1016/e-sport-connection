import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const code = p => readFileSync(new URL("../../"+p,import.meta.url),"utf8");
test("all tournament match mutation routes require authenticated admins",()=>{
 const src=code("backend/src/routes/tournamentMatchRoutes.ts");
 for(const [m,p] of [["post","/generate/:tournamentId"],["put","/:matchId/result"],["put","/:matchId/bounty"],["post","/"],["put","/:matchId"],["put","/:matchId/status"],["delete","/:matchId"]]) assert.ok(src.includes('fastify.'+m+'("'+p+'", { preHandler: [authenticateToken, requireAdmin] }'),p);
});
test("squad operations authenticate users and reject client-selected identity and balances",()=>{
 const src=code("backend/src/routes/squadRoutes.ts");
 for(const [m,p] of [["post","/"],["put","/:id"],["put","/:id/join-settings"],["post","/:id/invite"],["post","/:id/respond-invitation"],["post","/:id/respond-application"],["post","/:id/join"],["post","/:id/leave"],["post","/:id/members"],["delete","/:id/members/:memberId"],["put","/:id/leader"]]) assert.ok(src.includes('fastify.'+m+'("'+p+'", { preHandler: authenticateToken }'),m+" "+p);
 assert.ok(!/\buserId\s*}\s*=\s*request.body/.test(src));
 assert.ok(src.includes("squadData.leader = actorId"));
 assert.ok(!src.includes("const updateData = request.body as any;"));
});
test("socket never converts invalid tokens into anonymous authenticated connections",()=>{
 const src=code("backend/src/config/socket.ts");
 assert.ok(src.includes('next(new Error("Invalid or expired authentication token"))'));
 assert.ok(src.includes('if (!user || (decoded.ver ?? 0) !== (user.tokenVersion ?? 0))'));
});
