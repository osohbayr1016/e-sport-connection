import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = (file) => readFileSync(new URL("../../" + file, import.meta.url), "utf8");

test("admin-managed passwords use exactly one Mongoose pre-save hash", () => {
  const routes = source("backend/src/routes/userRoutes.ts");
  const model = source("backend/src/models/User.ts");
  assert.ok(!routes.includes("bcrypt.hash("), "route must not prehash password");
  assert.match(routes, /password:?,?\s*\/\/ Mongoose pre-save hook performs hashing|password,/);
  assert.match(model, /this.password = await bcrypt.hash\(this.password, salt\)/);
  assert.match(model, /select: false/);
});

test("login and registration enforce authentication-specific rate limits", () => {
  const routes = source("backend/src/routes/authRoutes.ts");
  for (const route of ["login", "register"]) {
    assert.ok(routes.includes('fastify.post("/' + route + '", { config: { rateLimit: rateLimitConfig.auth } }'));
  }
});

test("tournament audit actors come from authenticated request", () => {
  const routes = source("backend/src/routes/tournamentRoutes.ts");
  assert.ok(routes.includes("adminId: (request as any).user?.id"));
  assert.ok(!routes.includes("const { squadId, reason, adminId }"));
});

test("registration payment status and cancellations are protected", () => {
  const routes = source("backend/src/routes/tournamentRegistrationRoutes.ts");
  assert.ok(routes.includes('"Invalid payment status"'));
  assert.ok(routes.includes("TournamentRegistration.findOneAndDelete("));
  assert.ok(routes.includes('currentSquads: { $gt: 0 }'));
  assert.ok(!routes.includes("const { squadLeaderId } = request.body"));
});

test("production deployment requires explicit manual confirmation", () => {
  const workflow = source(".github/workflows/deploy-community-worker.yml");
  assert.ok(workflow.includes("github.event_name == 'workflow_dispatch' && inputs.confirm_deploy == 'YES'"));
});
