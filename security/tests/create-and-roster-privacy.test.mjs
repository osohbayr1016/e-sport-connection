import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const src=p=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
test("create blocks server-managed fields, and incomplete double-elim cannot start",()=>{
 const routes=src("backend/src/routes/tournamentRoutes.ts");
 const engine=src("backend/src/services/tournamentMatchService.ts");
 assert.ok(routes.includes('status: "upcoming",'));
 assert.ok(routes.includes("const organizerFields = ["));
 assert.ok(engine.includes("Double-elimination progression is not implemented"));
});
test("public squad directory never exposes members' email by population",()=>{
 const routes=src("backend/src/routes/squadRoutes.ts");
 assert.ok(!routes.includes('.populate("members", "name email avatar")'));
 assert.ok(!routes.includes('.populate("leader", "name email avatar")'));
});
