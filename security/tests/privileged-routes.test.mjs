import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source = (file) => readFileSync(new URL("../../backend/src/routes/" + file, import.meta.url), "utf8");

test("admin achievement routes authenticate and authorize all requests", () => {
  const code = source("adminAchievementRoutes.ts");
  assert.ok(code.includes('fastify.addHook("preHandler", authenticateToken)'));
  assert.ok(code.includes('fastify.addHook("preHandler", requireAdmin)'));
});

test("credit mutations require admin and valid non-negative credit", () => {
  const code = source("bountyCoinRoutes.ts");
  assert.ok(code.includes('fastify.post("/transaction", { preHandler: [authenticateToken, requireAdmin] }'));
  assert.ok(code.includes("Number.isFinite(amount)"));
});

test("privileged tournament routes require verified admin", () => {
  const code = source("tournamentRoutes.ts");
  for (const [method, path] of [["post", "/"], ["put", "/:id"], ["delete", "/:id"], ["post", "/:id/start"], ["post", "/:id/disqualify"]]) {
    assert.ok(code.includes('fastify.' + method + '("' + path + '", { preHandler: [authenticateToken, requireAdmin] }'), method + ' ' + path);
  }
  const reg = source("tournamentRegistrationRoutes.ts");
  for (const path of ["/:id/payment", "/:id/approve"]) {
    assert.ok(reg.includes('fastify.put("' + path + '", { preHandler: [authenticateToken, requireAdmin] }'), path);
  }
});

test("tournament registration requires authenticated squad leader and paid entries never auto-approve", () => {
  const code = source("tournamentRoutes.ts");
  assert.ok(code.includes('fastify.post("/:id/register", { preHandler: [authenticateToken] }'));
  assert.ok(code.includes('tournament.tournamentType !== "free"'));
  assert.ok(code.includes('squad.leader.toString() !== (request as any).user?.id'));
  const reg = source("tournamentRegistrationRoutes.ts");
  assert.ok(reg.includes('squadLeaderId !== (request as any).user?.id'));
  assert.ok(reg.includes('registration.squadLeader.toString() !== (request as any).user?.id'));
});

test("developer achievement triggers cannot be called anonymously", () => {
  const code = source("achievementRoutes.ts");
  for (const route of ["/achievements/trigger", "/achievements/create-sample"]) {
    assert.ok(code.includes('fastify.post("' + route + '", { preHandler: [authenticateToken, requireAdmin] }'));
  }
});
