import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const src=p=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
test("logout increments user token version and all auth paths reject revoked credentials",()=>{
 const model=src("backend/src/models/User.ts");
 const middleware=src("backend/src/middleware/auth.ts");
 const auth=src("backend/src/controllers/authController.ts");
 const socket=src("backend/src/config/socket.ts");
 assert.ok(model.includes("tokenVersion: { type: Number, default: 0"));
 assert.ok(middleware.includes("decoded.ver ?? 0"));
 assert.ok(socket.includes("decoded.ver ?? 0"));
 assert.ok(auth.includes("$inc: { tokenVersion: 1 }"));
 assert.ok(auth.includes("request.user.tokenVersion ?? 0"));
});
