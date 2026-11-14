import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read=p=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
test("admin payment and approval proxies preserve bearer authentication",()=>{
 const approve=read("frontend/src/app/api/tournament-registrations/[id]/approve/route.ts");
 const payment=read("frontend/src/app/api/tournament-registrations/[id]/payment/route.ts");
 const pending=read("frontend/src/app/api/tournament-registrations/pending-tax/route.ts");
 for(const code of [approve,payment,pending]){
   assert.ok(code.includes('request.headers.get("authorization")'));
   assert.ok(code.includes("Authorization: authorization"));
   assert.ok(code.includes('cache: "no-store"'));
 }
});
test("admin UI requires manual recorded reference before approval",()=>{
 const ui=read("frontend/src/app/admin/tournament-registrations/page.tsx");
 assert.ok(ui.includes("verifyPayment"));
 assert.ok(ui.includes("TOURNAMENT_REGISTRATIONS.PAYMENT"));
 assert.ok(ui.includes("paymentStatus !== \"paid\""));
});
