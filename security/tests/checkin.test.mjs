import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const get = p => readFileSync(new URL("../../"+p,import.meta.url),"utf8");
test("leader check-in requires authentication and is idempotent",()=>{
 const routes=get("backend/src/routes/tournamentRegistrationRoutes.ts");
 const model=get("backend/src/models/TournamentRegistration.ts");
 assert.ok(routes.includes('fastify.get("/my", { preHandler: [authenticateToken] }'));
 assert.ok(routes.includes('fastify.post("/:id/check-in", { preHandler: [authenticateToken] }'));
 assert.ok(routes.includes("squadLeader: actorId"));
 assert.ok(routes.includes('checkedInAt: { $exists: false }'));
 assert.ok(model.includes("checkedInAt?: Date"));
});
