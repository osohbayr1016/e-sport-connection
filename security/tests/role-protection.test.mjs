import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function source(path) {
  return readFileSync(new URL("../../" + path, import.meta.url), "utf8");
}
test("public registration excludes ADMIN roles", () => {
  const code = source("backend/src/controllers/authController.ts");
  const registration = code.slice(code.indexOf("// User registration"), code.indexOf("// Get current user profile"));
  assert.ok(registration.includes('const validRoles = ["PLAYER", "COACH", "ORGANIZATION"];'));
  assert.equal(registration.includes('"ADMIN"'), false);
});
test("unauthenticated role update endpoint is removed", () => {
  const code = source("backend/src/routes/userRoutes.ts");
  assert.equal(code.includes('fastify.put("/update-role"'), false);
  assert.ok(code.includes('{ preHandler: [authenticateToken] }'));
});
test("public admin setup page is disabled and nav has no email shortcut", () => {
  assert.ok(source("frontend/src/app/admin-setup/page.tsx").includes("notFound()"));
  const nav = source("frontend/src/app/components/Navigation.tsx");
  assert.equal(nav.includes('user?.email === "admin@esport-connection.com"'), false);
});
