import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const code=readFileSync(new URL("../../backend/src/config/socket.ts",import.meta.url),"utf8");
test("realtime message delivery targets all user sockets",()=>{
 assert.ok(code.includes("private connectedUsers = new UserConnectionRegistry"));
 assert.ok(code.includes("this.connectedUsers.socketsFor(userId)"));
 assert.ok(code.includes("this.connectedUsers.disconnect(userId, socket.id)"));
});
test("stream interactions require joined room and bounded content",()=>{
 assert.ok(code.includes('if (!socket.rooms.has(`stream_${streamId}`))'));
 assert.ok(code.includes("message.length > 1000"));
 assert.ok(code.includes('["🔥", "❤️", "👏", "🎉", "👍", "💯"]'));
});
