import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = p => readFileSync(new URL("../../"+p,import.meta.url),"utf8");
test("division endpoints cannot mint coins or process results anonymously",()=>{
 const src=read("backend/src/routes/divisionRoutes.ts");
 assert.ok(src.includes('fastify.post("/process-match/:matchId", { preHandler: [authenticateToken, requireAdmin] }'));
 assert.ok(src.includes('fastify.post("/protection/:squadId", { preHandler: [authenticateToken] }'));
 assert.ok(src.includes('fastify.post("/purchase/:squadId", { preHandler: [authenticateToken] }'));
 assert.ok(src.includes('Direct purchase disabled'));
 assert.ok(src.includes("const userId = (request as any).user?.id"));
});
test("player profile ownership cannot be impersonated",()=>{
 const src=read("backend/src/routes/playerProfileRoutes.ts");
 assert.ok(src.includes('fastify.post("/create-profile", { preHandler: authenticateToken }'));
 assert.ok(src.includes('fastify.put("/update-profile", { preHandler: authenticateToken }'));
 assert.ok(src.includes('userId: (request as any).user.id'));
 assert.ok(!src.includes("userId: decoded.id,\n        ...profileData"));
 assert.ok(!src.includes("const updateData = request.body as any;"));
});
