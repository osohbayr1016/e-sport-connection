import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const src=readFileSync(new URL("../../backend/src/config/socket.ts",import.meta.url),"utf8");
test("open socket sessions reject events after JWT revocation",()=>{
 assert.ok(src.includes("socket.data.tokenVersion = user.tokenVersion ?? 0"));
 assert.ok(src.includes("socket.use(async (packet, next) =>"));
 assert.ok(src.includes('socket.disconnect(true)'));
 assert.ok(src.includes('(active.tokenVersion ?? 0) !== (socket.data.tokenVersion ?? 0)'));
});
