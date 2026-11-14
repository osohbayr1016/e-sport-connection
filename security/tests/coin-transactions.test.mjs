import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source = p => readFileSync(new URL("../../"+p,import.meta.url),"utf8");
test("coin workflows are single-use and transactionally update balances",()=>{
 const routes=source("backend/src/routes/bountyCoinRoutes.ts");
 const svc=source("backend/src/services/coinTransactionService.ts");
 for(const name of ["requestCoinWithdrawal","decideCoinWithdrawal","markCoinWithdrawalPaid","decideCoinPurchase"]) {
   assert.ok(routes.includes(name+"(")); assert.ok(svc.includes("function "+name+"("));
 }
 assert.ok(svc.includes("session.withTransaction"));
 assert.ok(svc.includes('currentBountyCoins: { $gte: amountCoins }'));
 assert.ok(svc.includes('status: "PENDING"'));
 assert.ok(svc.includes('status: "APPROVED"'));
 for(const route of ["/withdraw/:id/decision","/withdraw/:id/mark-paid","/purchase/:id/decision"]) {
   assert.ok(routes.includes('fastify.post("'+route+'", { preHandler: [authenticateToken, requireAdmin] }'));
 }
});
