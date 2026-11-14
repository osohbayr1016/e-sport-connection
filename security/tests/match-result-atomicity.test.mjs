import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source = p => readFileSync(new URL("../../"+p, import.meta.url),"utf8");
test("tournament completion and coin rewards share one MongoDB session",()=>{
 const route=source("backend/src/routes/tournamentMatchRoutes.ts");
 const service=source("backend/src/services/tournamentResultService.ts");
 const division=source("backend/src/services/divisionService.ts");
 assert.ok(route.includes("finalizeMatchWithRewards("));
 assert.ok(!route.includes("await DivisionService.processMatchResult(matchId);"));
 assert.ok(service.includes("await DivisionService.processMatchResult(matchId, session)"));
 assert.ok(service.includes("await session.withTransaction"));
 assert.ok(division.includes("providedSession?: ClientSession"));
});
