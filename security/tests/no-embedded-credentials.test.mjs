import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (path) => readFileSync(new URL("../../" + path, import.meta.url), "utf8");

test("Render blueprint never commits MongoDB login credentials", () => {
  const config = read("backend/render.yaml");
  assert.match(config, /-\s*key:\s*MONGODB_URI\s*\n\s*sync:\s*false/);
  assert.doesNotMatch(config, /mongodb(?:\+srv)?:\/\//i);
});

test("checked-in configuration and docs never contain concrete MongoDB login URLs", () => {
  const files = [
    "backend/render.yaml",
    "backend/env.example",
    "DEPLOYMENT_GUIDE.md",
    "COPY_THIS_TO_RENDER.txt",
  ];
  for (const file of files) {
    const content = read(file);
    // Placeholders with angle brackets are fine; literal credentials are not.
    assert.doesNotMatch(content, /mongodb(?:\+srv)?:\/\/(?!<)[^\s]+:[^@\s]+@[^\s]+/i, file);
  }
});
