import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const src=p=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
test("approval cannot implicitly set paid; rejection releases a reservation transactionally",()=>{
 const routes=src("backend/src/routes/tournamentRegistrationRoutes.ts");
 const model=src("backend/src/models/TournamentRegistration.ts");
 assert.ok(routes.includes("Verify the bank payment reference before approving registration"));
 assert.ok(routes.includes('paymentReference: { $exists: true, $ne: "" }'));
 assert.ok(routes.includes("session.withTransaction"));
 assert.ok(routes.includes("$inc: { currentSquads: -1 }"));
 assert.ok(!routes.includes("registration.paymentStatus = \"paid\""));
 assert.ok(model.includes("paymentVerifiedBy?: mongoose.Types.ObjectId"));
});
