import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = p => readFileSync(new URL("../../"+p,import.meta.url),"utf8");
test("payout settlement requires recorded bank transfer reference",()=>{
 const routes=read("backend/src/routes/bountyCoinRoutes.ts");
 const svc=read("backend/src/services/coinTransactionService.ts");
 const model=read("backend/src/models/WithdrawRequest.ts");
 assert.ok(routes.includes("request.params.id, bankTransferReference"));
 assert.ok(svc.includes("bankTransferReference: reference.trim()"));
 assert.ok(svc.includes('status: "APPROVED", bankTransferReference: { $exists: false }'));
 assert.ok(model.includes("bankTransferReference?: string"));
});
test("direct minting cannot change the authoritative wallet",()=>{
 const svc=read("backend/src/services/divisionService.ts");
 assert.ok(svc.includes("Direct coin minting is disabled"));
 assert.ok(!svc.includes("squad.currentBountyCoins += amount"));
});
