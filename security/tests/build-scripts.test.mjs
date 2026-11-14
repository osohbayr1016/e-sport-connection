import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("backend build and cleanup scripts work without PowerShell", () => {
  const pkg = JSON.parse(readFileSync(new URL("../../backend/package.json", import.meta.url), "utf8"));
  assert.ok(pkg.scripts["clean:dist"].includes("node -e"));
  assert.ok(!pkg.scripts["clean:dist"].includes("powershell"));
  assert.ok(pkg.scripts["fresh-install"].includes("npm ci"));
});
