import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = p => readFileSync(new URL("../../" + p, import.meta.url),"utf8");
test("both tournament registration routes use transactional core",()=>{
 const free=read("backend/src/routes/tournamentRoutes.ts");
 const paid=read("backend/src/routes/tournamentRegistrationRoutes.ts");
 const service=read("backend/src/services/tournamentRegistrationService.ts");
 assert.ok(free.includes("createTournamentRegistration({"));
 assert.ok(paid.includes("createTournamentRegistration({"));
 assert.ok(paid.includes("cancelTournamentRegistration("));
 assert.ok(service.includes("session.withTransaction"));
 assert.ok(service.includes('$expr: { $lt: ["$currentSquads", "$maxSquads"] }'));
 assert.ok(service.includes('currentSquads: { $gt: 0 }'));
 assert.ok(service.includes("await created.save({ session })"));
});
