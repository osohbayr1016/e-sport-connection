import mongoose, { ClientSession } from "mongoose";
import Squad from "../models/Squad";
import BountyCoin from "../models/BountyCoin";
import WithdrawRequest from "../models/WithdrawRequest";
import PurchaseRequest from "../models/PurchaseRequest";
import { getDivisionInfo } from "../utils/divisionSystem";

export class FinanceError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message); this.name = "FinanceError";
  }
}
const fail = (code: number, message: string): never => { throw new FinanceError(code, message); };
const validId = (id: string) => mongoose.isValidObjectId(id);
const validAmount = (a: number) => Number.isSafeInteger(a) && a > 0 && a <= 100000000;

async function atomic<T>(task: (session: ClientSession) => Promise<T>): Promise<T> {
  const session = await mongoose.startSession();
  let result: T | undefined;
  try {
    await session.withTransaction(async () => { result = await task(session); });
    if (result === undefined) throw new Error("Transaction did not complete");
    return result;
  } finally { await session.endSession(); }
}

async function syncLedger(session: ClientSession, squad: any, actor: string, type: "withdraw" | "earn" | "purchase", amount: number, description: string) {
  await BountyCoin.updateOne(
    { userId: actor },
    {
      $set: {
        squadId: squad._id,
        balance: squad.currentBountyCoins,
        totalEarned: squad.totalBountyCoinsEarned,
        totalSpent: squad.totalBountyCoinsSpent,
      },
      $push: { transactions: { type, amount, description, timestamp: new Date() } },
    },
    { session, upsert: true }
  );
}

export async function requestCoinWithdrawal(actor: string, input: {
  squadId: string; amountCoins: number; bankName: string; iban: string;
}) {
  const { squadId, amountCoins, bankName, iban } = input || ({} as any);
  if (!validId(actor) || !validId(squadId) || !validAmount(amountCoins) ||
      typeof bankName !== "string" || !bankName.trim() || bankName.length > 120 ||
      typeof iban !== "string" || !/^[A-Za-z0-9 -]{8,64}$/.test(iban)) {
    fail(400, "Invalid squad, amount or bank details");
  }
  return atomic(async session => {
    const squad = await Squad.findById(squadId).session(session);
    if (!squad) fail(404, "Squad not found");
    if (squad.leader.toString() !== actor) fail(403, "Only squad leader may withdraw");
    const rate = getDivisionInfo(squad.division);
    const amountMNT = Math.round(amountCoins / rate.bountyCoinAmount * rate.bountyCoinPrice);
    if (!Number.isSafeInteger(amountMNT) || amountMNT <= 0) fail(400, "Invalid payout calculation");
    const reserved = await Squad.findOneAndUpdate(
      { _id: squadId, leader: actor, currentBountyCoins: { $gte: amountCoins } },
      { $inc: { currentBountyCoins: -amountCoins, totalBountyCoinsSpent: amountCoins } },
      { session, new: true }
    );
    if (!reserved) fail(409, "Insufficient bounty coin balance");
    const wr = new WithdrawRequest({
      squadId, requestedBy: actor, amountCoins, amountMNT,
      bankName: bankName.trim(), iban: iban.trim(), status: "PENDING",
    });
    await wr.save({ session });
    await syncLedger(session, reserved, actor, "withdraw", amountCoins, "Coins reserved for withdrawal");
    return wr;
  });
}

export async function decideCoinWithdrawal(actor: string, id: string, decision: string, adminNotes?: string) {
  if (!validId(actor) || !validId(id) || !["APPROVE", "REJECT"].includes(decision)) fail(400, "Invalid decision");
  return atomic(async session => {
    const wr = await WithdrawRequest.findOneAndUpdate(
      { _id: id, status: "PENDING" },
      { $set: { status: decision === "APPROVE" ? "APPROVED" : "REJECTED", adminNotes, processedBy: actor, processedAt: new Date() } },
      { session, new: true }
    );
    if (!wr) fail(409, "Withdrawal already processed or missing");
    if (decision === "REJECT") {
      const squad = await Squad.findByIdAndUpdate(
        wr.squadId,
        { $inc: { currentBountyCoins: wr.amountCoins, totalBountyCoinsSpent: -wr.amountCoins } },
        { session, new: true }
      );
      if (!squad) fail(409, "Referenced squad no longer exists");
      await syncLedger(session, squad, wr.requestedBy.toString(), "earn", wr.amountCoins, "Withdrawal rejected and refunded");
    }
    return wr;
  });
}

export async function markCoinWithdrawalPaid(actor: string, id: string) {
  if (!validId(actor) || !validId(id)) fail(400, "Invalid request");
  const wr = await WithdrawRequest.findOneAndUpdate(
    { _id: id, status: "APPROVED" },
    { $set: { status: "PAID", paidBy: actor, paidAt: new Date() } },
    { new: true }
  );
  if (!wr) fail(409, "Only approved unpaid withdrawals can be marked paid");
  return wr;
}

export async function decideCoinPurchase(actor: string, id: string, decision: string, adminNotes?: string) {
  if (!validId(actor) || !validId(id) || !["APPROVE", "REJECT"].includes(decision)) fail(400, "Invalid decision");
  return atomic(async session => {
    const pr = await PurchaseRequest.findOneAndUpdate(
      { _id: id, status: "PENDING" },
      { $set: { status: decision === "APPROVE" ? "APPROVED" : "REJECTED", adminNotes, processedBy: actor, processedAt: new Date() } },
      { session, new: true }
    );
    if (!pr) fail(409, "Purchase already processed or missing");
    if (decision === "APPROVE") {
      if (!validAmount(pr.amount)) fail(409, "Stored amount invalid");
      const squad = await Squad.findByIdAndUpdate(
        pr.squadId, { $inc: { currentBountyCoins: pr.amount, totalBountyCoinsEarned: pr.amount } },
        { session, new: true }
      );
      if (!squad) fail(409, "Referenced squad no longer exists");
      await syncLedger(session, squad, pr.requestedBy.toString(), "purchase", pr.amount, "Purchase approved");
    }
    return pr;
  });
}

export function handleFinanceError(error: unknown, reply: import("fastify").FastifyReply) {
  if (error instanceof FinanceError) {
    return reply.status(error.statusCode).send({ success: false, message: error.message });
  }
  reply.log.error({ err: error }, "Financial operation failed");
  return reply.status(500).send({ success: false, message: "Financial operation failed" });
}
