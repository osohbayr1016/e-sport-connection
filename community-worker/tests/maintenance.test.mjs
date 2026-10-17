import assert from "node:assert/strict";
import { test } from "node:test";
import worker from "../src/index.mjs";

test("scheduled cleanup removes old rate-limit fingerprints", async () => {
  const cutoffs = [];
  const state = {
    DB: {
      prepare(sql) {
        assert.match(sql, /^DELETE FROM feedback_limits WHERE day < \?/);
        return {
          bind(cutoff) {
            cutoffs.push(cutoff);
            return { run: async () => ({ meta: { changes: 0 } }) };
          },
        };
      },
    },
  };
  const pending = [];
  await worker.scheduled({}, state, { waitUntil(task) { pending.push(task); } });
  await Promise.all(pending);
  assert.equal(cutoffs.length, 1);
  assert.match(cutoffs[0], /^\d{4}-\d{2}-\d{2}$/);
});
