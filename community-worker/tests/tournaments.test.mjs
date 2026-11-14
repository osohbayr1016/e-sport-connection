import assert from "node:assert/strict";
import { test } from "node:test";
import worker from "../src/index.mjs";

function request(path) {
  return new Request("https://worker.example" + path);
}

test("tournament API fails closed without database", async () => {
  const response = await worker.fetch(request("/api/tournaments"), {});
  assert.equal(response.status, 503);
});

test("empty tournament database does not invent events", async () => {
  const state = {
    DB: {
      prepare(query) {
        assert.match(query, /FROM tournaments WHERE published = 1/);
        return {
          bind(limit) {
            assert.equal(limit, 20);
            return { all: async () => ({ results: [] }) };
          },
        };
      },
    },
  };
  const response = await worker.fetch(request("/api/tournaments"), state);
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).tournaments, []);
});

test("unpublished tournament is never returned by detail endpoint", async () => {
  const state = {
    DB: {
      prepare(query) {
        assert.match(query, /published = 1/);
        return { bind: () => ({ first: async () => null }) };
      },
    },
  };
  const response = await worker.fetch(request("/api/tournaments/00000000-0000-4000-8000-000000000000"), state);
  assert.equal(response.status, 404);
});
