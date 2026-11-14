import { buildApp } from "../src/index";
import type { FastifyInstance } from "fastify";

describe("authentication end-to-end", () => {
  let app: FastifyInstance;
  beforeAll(async () => { app = await buildApp(); await app.ready(); });
  afterAll(async () => { await app.close(); });

  const register = (email = "player@example.com", role = "PLAYER") =>
    app.inject({ method: "POST", url: "/api/auth/register", payload: {
      name: "Example Player", email, password: "a-long-test-password", role,
    } });

  test("registration and password login work and never return hashes", async () => {
    const signup = await register();
    expect(signup.statusCode).toBe(201);
    const created = signup.json();
    expect(created.success).toBe(true);
    expect(created.token).toBeDefined();
    expect(created.user.password).toBeUndefined();

    const login = await app.inject({ method: "POST", url: "/api/auth/login",
      payload: { email: "player@example.com", password: "a-long-test-password" } });
    expect(login.statusCode).toBe(200);
    expect(login.json().token).toBeDefined();
    expect(login.json().user.password).toBeUndefined();

    const current = await app.inject({ method: "GET", url: "/api/auth/me",
      headers: { authorization: "Bearer " + login.json().token } });
    expect(current.statusCode).toBe(200);
  });

  test("public registration can never grant administrator privileges", async () => {
    const response = await register("admin-attempt@example.com", "ADMIN");
    expect(response.statusCode).toBe(400);
  });

  test("rejects incorrect passwords and unauthenticated profile reads", async () => {
    await register();
    const login = await app.inject({ method: "POST", url: "/api/auth/login",
      payload: { email: "player@example.com", password: "incorrect" } });
    expect(login.statusCode).toBe(401);
    expect((await app.inject({ method: "GET", url: "/api/auth/me" })).statusCode).toBe(401);
  });

  test("logout invalidates both original and refreshed tokens", async () => {
    const registration = await register("logout@example.com");
    expect(registration.statusCode).toBe(201);
    const token = registration.json().token;
    const before = await app.inject({ method: "POST", url: "/api/auth/refresh",
      headers: { authorization: "Bearer " + token } });
    expect(before.statusCode).toBe(200);
    const refreshedToken = before.json().token;
    const logout = await app.inject({ method: "POST", url: "/api/auth/logout",
      headers: { authorization: "Bearer " + token } });
    expect(logout.statusCode).toBe(200);
    for (const revoked of [token, refreshedToken]) {
      const profile = await app.inject({ method: "GET", url: "/api/auth/me",
        headers: { authorization: "Bearer " + revoked } });
      expect(profile.statusCode).toBe(401);
    }
    const login = await app.inject({ method: "POST", url: "/api/auth/login",
      payload: { email: "logout@example.com", password: "a-long-test-password" } });
    expect(login.statusCode).toBe(200);
    expect((await app.inject({ method: "GET", url: "/api/auth/me",
      headers: { authorization: "Bearer " + login.json().token } })).statusCode).toBe(200);
  });

  test("rejects duplicate emails", async () => {
    await register();
    const duplicate = await register();
    expect(duplicate.statusCode).toBe(409);
  });
});
