import { buildApp } from "../src/index";
import type { FastifyInstance } from "fastify";

describe("squad access control", () => {
  let app: FastifyInstance;
  beforeAll(async () => { app = await buildApp(); await app.ready(); });
  afterAll(async () => { await app.close(); });

  async function player(email: string) {
    const signup = await app.inject({ method: "POST", url: "/api/auth/register",
      payload: { name: email, email, password: "secure-test-password", role: "PLAYER" } });
    expect(signup.statusCode).toBe(201);
    return signup.json();
  }

  const payload = {
    name: "Test Squad", tag: "QA5", game: "Mobile Legends: Bang Bang", maxMembers: 5
  };

  test("creating a squad needs authentication", async () => {
    const res = await app.inject({ method: "POST", url: "/api/squads", payload });
    expect(res.statusCode).toBe(401);
  });

  test("ignores forged leader and financial fields on create", async () => {
    const leader = await player("leader@example.com");
    const outsider = await player("outsider@example.com");
    const res = await app.inject({ method: "POST", url: "/api/squads",
      headers: { authorization: "Bearer " + leader.token },
      payload: { ...payload, leader: outsider.user.id, currentBountyCoins: 999999 } });
    expect(res.statusCode).toBe(201);
    const squad = res.json().squad;
    expect(squad.leader._id || squad.leader).toBe(leader.user.id);
    expect(squad.currentBountyCoins).toBe(0);
  });

  test("outsiders cannot take over squads by forging userId", async () => {
    const leader = await player("leader@example.com");
    const outsider = await player("outsider@example.com");
    const created = await app.inject({ method: "POST", url: "/api/squads",
      headers: { authorization: "Bearer " + leader.token }, payload });
    const id = created.json().squad._id;
    const attempt = await app.inject({ method: "PUT", url: "/api/squads/" + id,
      headers: { authorization: "Bearer " + outsider.token },
      payload: { userId: leader.user.id, name: "Hijacked" } });
    expect(attempt.statusCode).toBe(403);
  });

  test("leaders cannot directly edit financial balances", async () => {
    const leader = await player("leader@example.com");
    const created = await app.inject({ method: "POST", url: "/api/squads",
      headers: { authorization: "Bearer " + leader.token }, payload });
    const id = created.json().squad._id;
    const attempt = await app.inject({ method: "PUT", url: "/api/squads/" + id,
      headers: { authorization: "Bearer " + leader.token },
      payload: { currentBountyCoins: 200000 } });
    expect(attempt.statusCode).toBe(400);
  });
});
