import mongoose from "mongoose";
import Tournament from "../models/Tournament";
import Squad from "../models/Squad";
import TournamentRegistration from "../models/TournamentRegistration";

export class TournamentRegistrationError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = "TournamentRegistrationError";
  }
}

const fail = (code: number, message: string): never => {
  throw new TournamentRegistrationError(code, message);
};

export async function createTournamentRegistration({
  tournamentId, squadId, actorId, paymentProof, requireFree = false,
}: {
  tournamentId: string;
  squadId: string;
  actorId: string;
  paymentProof?: string;
  requireFree?: boolean;
}) {
  if (![tournamentId, squadId, actorId].every((id) => mongoose.isValidObjectId(id))) {
    fail(400, "Invalid tournament, squad or player ID");
  }
  const [tournament, squad] = await Promise.all([
    Tournament.findById(tournamentId),
    Squad.findById(squadId),
  ]);
  if (!tournament) fail(404, "Tournament not found");
  if (!squad) fail(404, "Squad not found");
  if (squad.leader.toString() !== actorId) fail(403, "Only the squad leader can register");
  if (!["upcoming", "registration_open"].includes(tournament.status)) {
    fail(409, "Tournament registration is closed");
  }
  if (requireFree && (tournament.tournamentType !== "free" || tournament.entryFee !== 0)) {
    fail(400, "Use the payment verification flow for paid tournaments");
  }
  const isFree = tournament.tournamentType === "free" && tournament.entryFee === 0;
  if (!isFree && (typeof paymentProof !== "string" || !paymentProof.trim())) {
    fail(400, "Payment proof is required for paid tournaments");
  }
  if (await TournamentRegistration.exists({ tournament: tournamentId, squad: squadId })) {
    fail(409, "Squad is already registered for this tournament");
  }

  const session = await mongoose.startSession();
  let registration: InstanceType<typeof TournamentRegistration> | undefined;
  try {
    await session.withTransaction(async () => {
      // Compare-and-increment is atomic. The transaction also rolls back this
      // reservation if the unique registration insert fails.
      const reserved = await Tournament.findOneAndUpdate(
        {
          _id: tournamentId,
          status: { $in: ["upcoming", "registration_open"] },
          $expr: { $lt: ["$currentSquads", "$maxSquads"] },
        },
        { $inc: { currentSquads: 1 } },
        { session, new: true }
      );
      if (!reserved) fail(409, "Registration closed or tournament is full");
      const created = new TournamentRegistration({
        tournament: tournamentId,
        squad: squadId,
        squadLeader: squad.leader,
        squadMembers: squad.members,
        registrationFee: isFree ? 0 : tournament.entryFee,
        paymentProof: isFree ? undefined : paymentProof?.trim(),
        paymentStatus: isFree ? "paid" : "pending",
        status: "registered",
        isApproved: isFree,
        approvalStatus: isFree ? "approved" : "pending",
      });
      await created.save({ session });
      registration = created;
    });
  } catch (error: any) {
    if (error?.code === 11000) fail(409, "Squad is already registered for this tournament");
    throw error;
  } finally {
    await session.endSession();
  }
  if (!registration) fail(500, "Unable to create tournament registration");
  return { registration, tournament, squad };
}

export async function cancelTournamentRegistration(registrationId: string, actorId: string) {
  if (![registrationId, actorId].every((id) => mongoose.isValidObjectId(id))) {
    fail(400, "Invalid registration or player ID");
  }
  const existing = await TournamentRegistration.findById(registrationId);
  if (!existing) fail(404, "Registration not found");
  if (existing.squadLeader.toString() !== actorId) fail(403, "Only squad leader can cancel registration");
  // Settled paid entries require a documented refund process; don't silently delete them.
  const tournament = await Tournament.findById(existing.tournament);
  if (!tournament) fail(404, "Tournament not found");
  if (tournament.tournamentType !== "free" && existing.paymentStatus === "paid") {
    fail(409, "Contact the organizer for a paid registration refund");
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const removed = await TournamentRegistration.findOneAndDelete(
        { _id: registrationId, squadLeader: actorId },
        { session }
      );
      if (!removed) fail(409, "Registration has already been cancelled");
      const changed = await Tournament.updateOne(
        {
          _id: removed.tournament,
          status: { $in: ["upcoming", "registration_open", "registration_closed"] },
          currentSquads: { $gt: 0 },
        },
        { $inc: { currentSquads: -1 } },
        { session }
      );
      if (changed.modifiedCount !== 1) fail(409, "Tournament is already active or registration count needs reconciliation");
    });
  } finally {
    await session.endSession();
  }
}

export function handleTournamentRegistrationError(error: unknown, reply: import("fastify").FastifyReply) {
  if (error instanceof TournamentRegistrationError) {
    return reply.status(error.statusCode).send({ success: false, message: error.message });
  }
  reply.log.error({ err: error }, "Tournament registration failed");
  return reply.status(500).send({ success: false, message: "Tournament registration failed" });
}
