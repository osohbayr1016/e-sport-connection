import { buildApp } from "../src/index";
import type { FastifyInstance } from "fastify";

describe("tournament route authorization", () => {
  let app: FastifyInstance;
  beforeAll(async () => { app = await buildApp(); await app.ready(); });
  afterAll(async () => { await app.close(); });

  test("public tournament discovery remains available", async () => {
    const res = await app.inject({ method: "GET", url: "/api/tournaments" });
    expect(res.statusCode).toBe(200);
    expect(res.json().success).toBe(true);
  });

  test("tournament creation requires verified admin role", async () => {
    const without = await app.inject({ method: "POST", url: "/api/tournaments", payload: {} });
    expect(without.statusCode).toBe(401);
    const registration = await app.inject({ method: "POST", url: "/api/auth/register",
      payload: { name: "Competitor", email: "player@example.com", password: "secure-test-password", role: "PLAYER" } });
    const withPlayer = await app.inject({ method: "POST", url: "/api/tournaments",
      headers: { authorization: "Bearer " + registration.json().token }, payload: {} });
    expect(withPlayer.statusCode).toBe(403);
  });

  test("match results and bounty coin settings reject unauthenticated callers", async () => {
    for (const [method, url] of [
      ["PUT", "/api/tournament-matches/507f1f77bcf86cd799439011/result"],
      ["PUT", "/api/tournament-matches/507f1f77bcf86cd799439011/bounty"],
      ["POST", "/api/tournament-matches"],
      ["DELETE", "/api/tournament-matches/507f1f77bcf86cd799439011"]
    ] as const) {
      const res = await app.inject({ method, url, payload: {} });
      expect(res.statusCode).toBe(401);
    }
  });
});
