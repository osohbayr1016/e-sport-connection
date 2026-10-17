import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function source(path) {
  return readFileSync(new URL("../../" + path, import.meta.url), "utf8");
}

test("news create, edit and delete require authenticated administrator", () => {
  const code = source("backend/src/routes/newsRoutes.ts");
  assert.ok(code.includes("const adminOnly = { preHandler: [authenticateToken, requireAdmin] };"));
  for (const [method, path] of [["post", "/"], ["put", "/:id"], ["delete", "/:id"]]) {
    assert.ok(code.includes('fastify.' + method + '("' + path + '", adminOnly,'), method + " " + path);
  }
});

test("every admin achievement route uses administrator guard", () => {
  const code = source("backend/src/routes/adminAchievementRoutes.ts");
  assert.ok(code.includes("const adminOnly = { preHandler: [authenticateToken, requireAdmin] };"));
  const routes = [...code.matchAll(/fastify\.(?:get|post|put|delete)\(\s*"\/admin\/[^"]+"/g)];
  assert.ok(routes.length >= 10);
  for (const match of routes) {
    const declaration = code.slice(match.index, match.index + 130);
    assert.ok(declaration.includes(", adminOnly,"), "unguarded route: " + declaration.slice(0, 90));
  }
});
