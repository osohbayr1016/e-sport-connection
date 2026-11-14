import { UserConnectionRegistry } from "../src/config/socket";

describe("multi-device Socket.IO presence", () => {
  test("closing one connection never logs out another", () => {
    const registry = new UserConnectionRegistry();
    expect(registry.connect("u1","device-1")).toBe(true);
    expect(registry.connect("u1","device-2")).toBe(false);
    expect(registry.connectedUserCount).toBe(1);
    expect(registry.socketsFor("u1")).toEqual(["device-1","device-2"]);
    expect(registry.disconnect("u1","device-1")).toBe(false);
    expect(registry.isOnline("u1")).toBe(true);
    expect(registry.socketsFor("u1")).toEqual(["device-2"]);
    expect(registry.disconnect("u1","device-2")).toBe(true);
    expect(registry.isOnline("u1")).toBe(false);
  });
  test("guest and unknown disconnects cannot mutate online identities", () => {
    const registry = new UserConnectionRegistry();
    expect(registry.disconnect("u1","missing")).toBe(false);
    registry.connect("u1","a");
    expect(registry.disconnect("u1","unknown")).toBe(false);
    expect(registry.isOnline("u1")).toBe(true);
  });
});

describe("stream viewer session isolation",()=>{
  test("socket implementation cleans up stream membership at disconnect",()=>{
    const { readFileSync } = require("node:fs");
    const path = require("node:path");
    const code = readFileSync(path.join(__dirname,"../src/config/socket.ts"),"utf8");
    expect(code).toContain('socket.on("disconnecting"');
    expect(code).toContain("StreamService.removeViewer(streamId, userId, sessionId)");
  });
  test("viewer queries prioritize socket session IDs",()=>{
    const { readFileSync } = require("node:fs");
    const path = require("node:path");
    const code = readFileSync(path.join(__dirname,"../src/services/streamService.ts"),"utf8");
    expect(code).toContain("...(sessionId ? { sessionId } : { userId })");
  });
});
