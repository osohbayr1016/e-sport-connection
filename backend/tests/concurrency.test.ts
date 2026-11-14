import { buildApp } from "../src/index";
import type { FastifyInstance } from "fastify";
import jwt from "jsonwebtoken";
import User from "../src/models/User";
import Squad from "../src/models/Squad";
import Tournament from "../src/models/Tournament";
import TournamentRegistration from "../src/models/TournamentRegistration";
import WithdrawRequest from "../src/models/WithdrawRequest";
import PurchaseRequest from "../src/models/PurchaseRequest";

describe("concurrent tournament and financial writes", () => {
  let app: FastifyInstance;
  beforeAll(async () => { app = await buildApp(); await app.ready(); });
  afterAll(async () => { await app.close(); });

  const tokenFor = (user: any) => jwt.sign({
    id: user._id.toString(), email: user.email, role: user.role,
  }, process.env.JWT_SECRET!, { expiresIn: "1h" });

  async function account(prefix: string, role = "PLAYER") {
    return User.create({
      name: prefix, email: prefix + "@example.com",
      password: "secure-test-password", role,
    });
  }
  async function squadFor(user: any, suffix: string, balance = 0) {
    return Squad.create({
      name: "Squad " + suffix, tag: suffix, leader: user._id,
      members: [user._id], maxMembers: 5, game: "Mobile Legends: Bang Bang",
      currentBountyCoins: balance,
    });
  }
  async function tournament(maxSquads = 2) {
    const start = new Date(Date.now() + 86400000 * 5);
    return Tournament.create({
      name: "Concurrent Cup", description: "Concurrency regression",
      game: "Mobile Legends: Bang Bang",
      startDate: start, endDate: new Date(start.getTime() + 86400000),
      prizePool: 0, prizeDistribution: { firstPlace: 0, secondPlace: 0, thirdPlace: 0 },
      maxSquads, currentSquads: 0, status: "registration_open",
      location: "Online", organizer: "Admin",
      rules: "No cheating", registrationDeadline: new Date(start.getTime() - 86400000),
      entryFee: 0, tournamentType: "free", format: "Single Elimination",
    });
  }
  function register(tournamentId: string, squadId: string, token: string) {
    return app.inject({
      method: "POST", url: "/api/tournament-registrations/register",
      headers: { authorization: "Bearer " + token }, payload: { tournamentId, squadId },
    });
  }

  test("parallel registration never exceeds tournament capacity", async () => {
    const users = await Promise.all(["one","two","three"].map(accountName => account(accountName)));
    const squads = await Promise.all(users.map((user, i) => squadFor(user, "S" + i)));
    const cup = await tournament(2);
    const responses = await Promise.all(squads.map((s, i) =>
      register(cup._id.toString(), s._id.toString(), tokenFor(users[i]))));
    expect(responses.filter(r => r.statusCode === 201)).toHaveLength(2);
    expect(responses.filter(r => r.statusCode === 409)).toHaveLength(1);
    expect((await Tournament.findById(cup._id))!.currentSquads).toBe(2);
    expect(await TournamentRegistration.countDocuments({ tournament: cup._id })).toBe(2);
  });

  test("parallel duplicate registration consumes only one slot", async () => {
    const user = await account("duplicate");
    const squad = await squadFor(user, "DUP");
    const cup = await tournament(2);
    const requests = Array.from({ length: 2 }, () =>
      register(cup._id.toString(), squad._id.toString(), tokenFor(user)));
    const outcomes = await Promise.all(requests);
    expect(outcomes.filter(r => r.statusCode === 201)).toHaveLength(1);
    expect((await Tournament.findById(cup._id))!.currentSquads).toBe(1);
    expect(await TournamentRegistration.countDocuments({ tournament: cup._id })).toBe(1);
  });

  test("withdrawal reserves exact coins, and a rejected request refunds once", async () => {
    const leader = await account("financeleader");
    const admin = await account("financeadmin", "ADMIN");
    const squad = await squadFor(leader, "FNA", 100);
    const requested = await app.inject({ method: "POST", url: "/api/bounty-coins/withdraw",
      headers: { authorization: "Bearer " + tokenFor(leader) },
      payload: { squadId: squad._id.toString(), amountCoins: 30, bankName: "Test Bank", iban: "MN12345678901" } });
    expect(requested.statusCode).toBe(200);
    expect((await Squad.findById(squad._id))!.currentBountyCoins).toBe(70);
    const wr = requested.json().data;
    const decision = () => app.inject({ method: "POST", url: "/api/bounty-coins/withdraw/" + wr._id + "/decision",
      headers: { authorization: "Bearer " + tokenFor(admin) },
      payload: { decision: "REJECT" } });
    const first = await decision();
    const second = await decision();
    expect(first.statusCode).toBe(200);
    expect(second.statusCode).toBe(409);
    expect((await Squad.findById(squad._id))!.currentBountyCoins).toBe(100);
    expect((await WithdrawRequest.findById(wr._id))!.status).toBe("REJECTED");
  });

  test("purchase approval credits once even on repeated requests", async () => {
    const leader = await account("purchaseleader");
    const admin = await account("purchaseadmin", "ADMIN");
    const squad = await squadFor(leader, "PNA", 0);
    const purchase = await PurchaseRequest.create({
      squadId: squad._id, requestedBy: leader._id, amount: 50, status: "PENDING",
    });
    const approve = () => app.inject({ method: "POST", url: "/api/bounty-coins/purchase/" + purchase._id + "/decision",
      headers: { authorization: "Bearer " + tokenFor(admin) }, payload: { decision: "APPROVE" } });
    expect((await approve()).statusCode).toBe(200);
    expect((await approve()).statusCode).toBe(409);
    expect((await Squad.findById(squad._id))!.currentBountyCoins).toBe(50);
  });
  test("check-in is leader-only, limited to the event window and idempotent", async () => {
    const leader = await account("checkinleader");
    const stranger = await account("checkinoutsider");
    const squad = await squadFor(leader, "CIN");
    const cup = await tournament(2);
    cup.startDate = new Date(Date.now() + 6 * 3600000);
    cup.endDate = new Date(Date.now() + 24 * 3600000);
    await cup.save();
    const registration = await TournamentRegistration.create({
      tournament: cup._id, squad: squad._id, squadLeader: leader._id,
      squadMembers: [leader._id], registrationFee: 0,
      paymentStatus: "paid", isApproved: true, approvalStatus: "approved",
      status: "registered",
    });
    const endpoint = "/api/tournament-registrations/" + registration._id + "/check-in";
    const unauthorized = await app.inject({ method: "POST", url: endpoint });
    expect(unauthorized.statusCode).toBe(401);
    const outsider = await app.inject({ method: "POST", url: endpoint,
      headers: { authorization: "Bearer " + tokenFor(stranger) } });
    expect(outsider.statusCode).toBe(404);
    const checkin = () => app.inject({ method: "POST", url: endpoint,
      headers: { authorization: "Bearer " + tokenFor(leader) } });
    const first = await checkin();
    const second = await checkin();
    expect(first.statusCode).toBe(200);
    expect(second.statusCode).toBe(200);
    expect(first.json().alreadyCheckedIn).toBe(false);
    expect(second.json().alreadyCheckedIn).toBe(true);
    expect((await TournamentRegistration.findById(registration._id))!.checkedInAt).toBeDefined();

    const lateCup = await tournament(2);
    const early = await TournamentRegistration.create({
      tournament: lateCup._id, squad: squad._id, squadLeader: leader._id,
      squadMembers: [leader._id], registrationFee: 0, paymentStatus: "paid",
      isApproved: true, approvalStatus: "approved", status: "registered",
    });
    const premature = await app.inject({ method: "POST",
      url: "/api/tournament-registrations/" + early._id + "/check-in",
      headers: { authorization: "Bearer " + tokenFor(leader) } });
    expect(premature.statusCode).toBe(409);
  });

});
