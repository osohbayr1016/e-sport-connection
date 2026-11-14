import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read=p=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
test("both WebSocket and REST messaging check same-conversation references",()=>{
 const rest=read("backend/src/routes/messageRoutes.ts");
 const socket=read("backend/src/config/socket.ts");
 const policy=read("backend/src/services/directMessagePolicy.ts");
 assert.ok(rest.includes("await validateDirectMessageReply(replyToId, currentUserId, receiverId)"));
 assert.ok(socket.includes("await validateDirectMessageReply(replyToId, senderId, receiverId)"));
 assert.ok(rest.includes("sameConversationReply(msg.replyToId, msg.senderId, msg.receiverId)"));
 assert.ok(policy.includes("Message.exists({"));
});
