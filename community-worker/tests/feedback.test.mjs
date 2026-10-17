import assert from "node:assert/strict";
import { test } from "node:test";
import worker from "../src/index.mjs";

function request(path, options = {}) {
  return new Request("https://worker.example" + path, options);
}
function mockDatabase() {
  const entries = [];
  const rate = new Map();
  return {
    entries,
    prepare(query) {
      return {
        bind(...args) {
          return {
            async first() {
              if (!query.includes("feedback_limits")) throw new Error("unexpected statement");
              const key = args[0] + ":" + args[1];
              const count = rate.get(key) || 0;
              if (count >= 3) return null;
              rate.set(key, count + 1);
              return { count: count + 1 };
            },
            async run() {
              if (query.startsWith("INSERT INTO feedback ")) {
                entries.push({ id: args[0], type: args[1], title: args[2], description: args[3], alias: args[4], status: "pending", created_at: args[5] });
                return { meta: { changes: 1 } };
              }
              if (query.startsWith("UPDATE feedback")) {
                const row = entries.find((entry) => entry.id === args[1]);
                if (!row) return { meta: { changes: 0 } };
                row.status = args[0];
                return { meta: { changes: 1 } };
              }
              throw new Error("unexpected statement");
            },
          };
        },
        async all() {
          return { results: entries.filter((entry) => query.includes("WHERE status") ? entry.status === "approved" || entry.status === "planned" || entry.status === "in_progress" || entry.status === "shipped" : true) };
        },
      };
    },
  };
}
const adminToken = "test_secret_ABCDEFGHIJKLMNOPQRSTUVWXYZ012345";
const env = () => ({ DB: mockDatabase(), ALLOWED_ORIGIN: "https://e-sport-connection.vercel.app", RATE_LIMIT_SALT: "test_salt_ABCDEFGHIJKLMNOPQRSTUVWXYZ012345", FEEDBACK_ADMIN_TOKEN: adminToken });
function post(body, headers = {}) {
  return request("/api/feedback", { method: "POST", headers: { "content-type": "application/json", "cf-connecting-ip": "203.0.113.1", ...headers }, body: JSON.stringify(body) });
}
const valid = { type: "feature", title: "Team search filters", description: "Please add search filters for teams and squad profiles." };

test("health fails closed without D1", async () => {
  const response = await worker.fetch(request("/health"), {});
  assert.equal(response.status, 503);
});
test("invalid and cross-origin submissions cannot write", async () => {
  const state = env();
  const invalid = await worker.fetch(post({ ...valid, title: "tiny" }), state);
  assert.equal(invalid.status, 400);
  const foreign = await worker.fetch(post(valid, { origin: "https://evil.example" }), state);
  assert.equal(foreign.status, 403);
  assert.equal(state.DB.entries.length, 0);
});
test("valid requests are pending and never publicly listed before moderation", async () => {
  const state = env();
  const created = await worker.fetch(post(valid), state);
  assert.equal(created.status, 201);
  assert.equal((await created.json()).status, "pending");
  const publicList = await worker.fetch(request("/api/feedback"), state);
  assert.equal((await publicList.json()).feedback.length, 0);
  const privateList = await worker.fetch(request("/api/feedback?scope=admin", { headers: { authorization: "Bearer " + adminToken } }), state);
  assert.equal((await privateList.json()).feedback.length, 1);
  const id = state.DB.entries[0].id;
  const noAuth = await worker.fetch(request("/api/feedback/" + id + "/moderate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: "approved" }) }), state);
  assert.equal(noAuth.status, 401);
  const approved = await worker.fetch(request("/api/feedback/" + id + "/moderate", { method: "POST", headers: { authorization: "Bearer " + adminToken, "content-type": "application/json" }, body: JSON.stringify({ status: "approved" }) }), state);
  assert.equal(approved.status, 200);
  const after = await worker.fetch(request("/api/feedback"), state);
  assert.equal((await after.json()).feedback.length, 1);
});
test("daily rate limit blocks fourth submission", async () => {
  const state = env();
  for (let count = 0; count < 3; count++) assert.equal((await worker.fetch(post(valid), state)).status, 201);
  assert.equal((await worker.fetch(post(valid), state)).status, 429);
});
test("missing salt blocks writes and invalid routes are 404", async () => {
  const state = env();
  state.RATE_LIMIT_SALT = "";
  assert.equal((await worker.fetch(post(valid), state)).status, 503);
  assert.equal((await worker.fetch(request("/unknown"), state)).status, 404);
});
