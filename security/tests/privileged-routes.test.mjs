import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source = (file) => readFileSync(new URL("../../backend/src/routes/" + file, import.meta.url), "utf8");

test("admin achievement routes authenticate and authorize all requests", () => {
  const code = source("adminAchievementRoutes.ts");
  const hookBased = code.includes('fastify.addHook("preHandler", authenticateToken)') &&
    code.includes('fastify.addHook("preHandler", requireAdmin)');
  const routeBased = code.includes('const adminOnly = { preHandler: [authenticateToken, requireAdmin] }') &&
    [...code.matchAll(/fastify\.(?:get|post|put|delete)\("[^"]+", ([^\n]+)$/gm)]
      .every(([, options]) => options.startsWith("adminOnly,"));
  assert.ok(hookBased || routeBased, "Every admin achievement handler must be protected");
});

test("unsafe direct ledger editing is retired", () => {
  const code = source("bountyCoinRoutes.ts");
  assert.ok(code.includes('fastify.post("/transaction", { preHandler: [authenticateToken, requireAdmin] }'));
  assert.ok(code.includes('"Direct ledger adjustments are disabled. Use an audited financial workflow."'));
  assert.ok(!code.includes("bountyCoinData.balance += amount"));
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

test("both tournament routes delegate to server-authorized transactional service", () => {
  const quick = source("tournamentRoutes.ts");
  const paid = source("tournamentRegistrationRoutes.ts");
  assert.ok(quick.includes('fastify.post("/:id/register", { preHandler: [authenticateToken] }'));
  assert.ok(paid.includes('fastify.post("/register", { preHandler: [authenticateToken] }'));
  const service = readFileSync(new URL("../../backend/src/services/tournamentRegistrationService.ts", import.meta.url), "utf8");
  assert.ok(service.includes('squad.leader.toString() !== actorId'));
  assert.ok(service.includes('requireFree && (tournament.tournamentType !== "free"'));
  assert.ok(service.includes('isApproved: isFree'));
  assert.ok(service.includes("session.withTransaction("));
});

test("developer achievement triggers cannot be called anonymously", () => {
  const code = source("achievementRoutes.ts");
  for (const route of ["/achievements/trigger", "/achievements/create-sample"]) {
    assert.ok(code.includes('fastify.post("' + route + '", { preHandler: [authenticateToken, requireAdmin] }'));
  }
});
