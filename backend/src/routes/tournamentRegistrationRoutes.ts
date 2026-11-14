import mongoose from "mongoose";
import { createTournamentRegistration, cancelTournamentRegistration, handleTournamentRegistrationError } from "../services/tournamentRegistrationService";
import { authenticateToken, requireAdmin } from "../middleware/auth";
import { FastifyInstance, FastifyPluginAsync } from "fastify";
import TournamentRegistration from "../models/TournamentRegistration";
import Tournament from "../models/Tournament";
import Squad from "../models/Squad";
import User from "../models/User";

class TournamentReviewConflict extends Error {
  constructor() { super("Registration changed during review"); }
}

const tournamentRegistrationRoutes: FastifyPluginAsync = async (
  fastify: FastifyInstance
) => {
  // Health check
  fastify.get("/health", async (request, reply) => {
    return reply.send({
      success: true,
      message: "Tournament registration routes available",
      timestamp: new Date().toISOString(),
    });
  });

  // Get all tournament registrations (admin only)
  fastify.get("/", { preHandler: [authenticateToken, requireAdmin] }, async (request, reply) => {
    try {
      const {
        page = 1,
        limit = 10,
        tournament,
        squad,
        paymentStatus,
        isApproved,
        status,
      } = request.query as any;

      const query: any = {};

      // Apply filters
      if (tournament) {
        query.tournament = tournament;
      }

      if (squad) {
        query.squad = squad;
      }

      if (paymentStatus) {
        query.paymentStatus = paymentStatus;
      }

      if (isApproved !== undefined) {
        query.isApproved = isApproved === "true";
      }

      if (status) {
        query.status = status;
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [registrations, total] = await Promise.all([
        TournamentRegistration.find(query)
          .populate("tournament", "name game startDate")
          .populate("squad", "name tag")
          .populate("squadLeader", "name email")
          .populate("squadMembers", "name email")
          .populate("approvedBy", "name email")
          .sort({ registrationDate: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        TournamentRegistration.countDocuments(query),
      ]);

      return reply.status(200).send({
        success: true,
        registrations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error("Get tournament registrations error:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to get tournament registrations",
      });
    }
  });

  // Only the authenticated user may see their own registrations.
  fastify.get("/my", { preHandler: [authenticateToken] }, async (request, reply) => {
    try {
      const actorId = (request as any).user?.id;
      const registrations = await TournamentRegistration.find({ squadLeader: actorId })
        .select("tournament squad registrationDate isApproved approvalStatus paymentStatus checkedInAt status")
        .populate("tournament", "name game startDate endDate status bannerImage maxSquads currentSquads")
        .populate("squad", "name tag logo")
        .sort({ registrationDate: -1 }).limit(100).lean();
      return reply.send({ success: true, registrations });
    } catch (error) {
      request.log.error({ error }, "My tournaments query failed");
      return reply.status(500).send({ success: false, message: "Unable to load registrations" });
    }
  });

  // An approved team leader can check in during the 24h before tournament start.
  fastify.post("/:id/check-in", { preHandler: [authenticateToken] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const actorId = (request as any).user?.id;
      if (!mongoose.isValidObjectId(id)) return reply.status(400).send({ success: false, message: "Invalid registration ID" });
      const registration = await TournamentRegistration.findOne({ _id: id, squadLeader: actorId });
      if (!registration) return reply.status(404).send({ success: false, message: "Registration not found" });
      if (!registration.isApproved || registration.paymentStatus !== "paid") {
        return reply.status(409).send({ success: false, message: "Registration must be approved before check-in" });
      }
      const tournament = await Tournament.findById(registration.tournament);
      if (!tournament) return reply.status(404).send({ success: false, message: "Tournament not found" });
      if (!["upcoming", "registration_open", "registration_closed"].includes(tournament.status)) {
        return reply.status(409).send({ success: false, message: "Tournament check-in is closed" });
      }
      const start = new Date(tournament.startDate).getTime();
      const now = Date.now();
      if (!Number.isFinite(start) || now < start - 86400000 || now >= start) {
        return reply.status(409).send({ success: false, message: "Check-in opens 24 hours before tournament start" });
      }
      if (registration.checkedInAt) return reply.send({ success: true, alreadyCheckedIn: true, checkedInAt: registration.checkedInAt });
      const updated = await TournamentRegistration.findOneAndUpdate(
        { _id: id, squadLeader: actorId, isApproved: true, paymentStatus: "paid", checkedInAt: { $exists: false } },
        { $set: { checkedInAt: new Date() } },
        { new: true }
      );
      if (!updated) {
        const existing = await TournamentRegistration.findById(id).select("checkedInAt").lean();
        if (existing?.checkedInAt) return reply.send({ success: true, alreadyCheckedIn: true, checkedInAt: existing.checkedInAt });
        return reply.status(409).send({ success: false, message: "Registration changed; refresh and try again" });
      }
      return reply.send({ success: true, alreadyCheckedIn: false, checkedInAt: updated.checkedInAt });
    } catch (error) {
      request.log.error({ error }, "Tournament check-in failed");
      return reply.status(500).send({ success: false, message: "Unable to check in" });
    }
  });

  fastify.post("/register", { preHandler: [authenticateToken] }, async (request, reply) => {
    try {
      const { tournamentId, squadId, paymentProof } = request.body as {
        tournamentId: string; squadId: string; paymentProof?: string;
      };
      const result = await createTournamentRegistration({
        tournamentId, squadId, paymentProof, actorId: (request as any).user?.id,
      });
      const populated = await TournamentRegistration.findById(result.registration._id)
        .populate("tournament", "name game startDate")
        .populate("squad", "name tag")
        .populate("squadLeader", "name email")
        .populate("squadMembers", "name email")
        .lean();
      return reply.status(201).send({
        success: true, message: "Squad registered successfully", registration: populated,
      });
    } catch (error) {
      return handleTournamentRegistrationError(error, reply);
    }
  });

  // Manual verification records the external bank transaction reference.
  // It is not proof from a signed bank webhook and must be reconciled offline.
  fastify.put("/:id/payment", { preHandler: [authenticateToken, requireAdmin] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { paymentStatus, paymentReference } = request.body as {
        paymentStatus: string; paymentReference?: string;
      };
      if (!mongoose.isValidObjectId(id)) {
        return reply.status(400).send({ success: false, message: "Invalid registration ID" });
      }
      if (paymentStatus !== "paid" && paymentStatus !== "failed") {
        return reply.status(400).send({ success: false, message: "Only a pending payment can be verified or failed" });
      }
      if (paymentStatus === "paid" &&
          (typeof paymentReference !== "string" || !/^[A-Za-z0-9_-]{6,80}$/.test(paymentReference.trim()))) {
        return reply.status(400).send({ success: false, message: "Verified bank reference (6–80 characters) is required" });
      }
      const existing = await TournamentRegistration.findById(id);
      if (!existing) return reply.status(404).send({ success: false, message: "Registration not found" });
      const tournament = await Tournament.findById(existing.tournament);
      if (!tournament || tournament.tournamentType !== "tax") {
        return reply.status(409).send({ success: false, message: "Only paid tournament registration can be manually verified" });
      }
      const paymentPredicate = paymentStatus === "paid"
        ? { $or: [
          { paymentStatus: { $in: ["pending", "failed"] } },
          { paymentStatus: "paid", paymentReference: { $exists: false } },
        ] }
        : { paymentStatus: "pending" };
      const updated = await TournamentRegistration.findOneAndUpdate(
        { _id: id, approvalStatus: "pending", ...paymentPredicate },
        { $set: paymentStatus === "paid" ? {
          paymentStatus: "paid", paymentReference: paymentReference!.trim().toUpperCase(),
          paymentVerifiedBy: (request as any).user.id, paymentVerifiedAt: new Date(),
          paymentDate: new Date(),
        } : { paymentStatus: "failed" } },
        { new: true, runValidators: true }
      );
      if (!updated) return reply.status(409).send({ success: false, message: "Payment already settled or registration no longer pending" });
      return reply.send({ success: true, message: "Payment state recorded", registration: updated });
    } catch (error: any) {
      if (error?.code === 11000) {
        return reply.status(409).send({ success: false, message: "This payment reference has already been used" });
      }
      request.log.error({ error }, "Payment verification failed");
      return reply.status(500).send({ success: false, message: "Unable to record payment" });
    }
  });

  // Registration approval cannot automatically create a PAID transaction.
  fastify.put("/:id/approve", { preHandler: [authenticateToken, requireAdmin] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { action, reason } = request.body as { action: "approve" | "reject"; reason?: string };
      if (!mongoose.isValidObjectId(id) || !["approve", "reject"].includes(action)) {
        return reply.status(400).send({ success: false, message: "Invalid registration or action" });
      }
      const existing = await TournamentRegistration.findById(id);
      if (!existing) return reply.status(404).send({ success: false, message: "Registration not found" });
      const tournament = await Tournament.findById(existing.tournament);
      if (!tournament || tournament.tournamentType !== "tax") {
        return reply.status(409).send({ success: false, message: "Only paid tournament registrations can be reviewed" });
      }
      if (!["upcoming", "registration_open", "registration_closed"].includes(tournament.status)) {
        return reply.status(409).send({ success: false, message: "Tournament is no longer accepting approvals" });
      }
      if (action === "approve") {
        const updated = await TournamentRegistration.findOneAndUpdate(
          { _id: id, approvalStatus: "pending", paymentStatus: "paid",
            paymentReference: { $exists: true, $ne: "" }, isApproved: false },
          { $set: { approvalStatus: "approved", isApproved: true,
            approvedBy: (request as any).user.id, approvedAt: new Date() } },
          { new: true }
        );
        if (!updated) return reply.status(409).send({
          success: false, message: "Verify the bank payment reference before approving registration",
        });
        return reply.send({ success: true, message: "Registration approved", registration: updated });
      }
      // Rejection releases the reserved slot, but cannot silently discard
      // money that was already marked as received.
      if (existing.paymentStatus === "paid") {
        return reply.status(409).send({ success: false, message: "Refund the verified payment before rejecting this registration" });
      }
      const session = await mongoose.startSession();
      try {
        let result: typeof existing | undefined;
        await session.withTransaction(async () => {
          const updated = await TournamentRegistration.findOneAndUpdate(
            { _id: id, approvalStatus: "pending", paymentStatus: { $in: ["pending", "failed"] } },
            { $set: { isApproved: false, approvalStatus: "rejected",
              rejectionReason: typeof reason === "string" && reason.trim() ? reason.trim().slice(0, 500) : "Rejected by organizer" } },
            { new: true, session }
          );
          if (!updated) throw new TournamentReviewConflict();
          const reduced = await Tournament.updateOne(
            { _id: updated.tournament, status: { $in: ["upcoming", "registration_open", "registration_closed"] },
              currentSquads: { $gt: 0 } },
            { $inc: { currentSquads: -1 } }, { session }
          );
          if (reduced.modifiedCount !== 1) throw new TournamentReviewConflict();
          result = updated;
        });
        return reply.send({ success: true, message: "Registration rejected and capacity released", registration: result });
      } finally { await session.endSession(); }
    } catch (error) {
      if (error instanceof TournamentReviewConflict) {
        return reply.status(409).send({ success: false, message: "Registration changed; refresh and retry" });
      }
      request.log.error({ error }, "Registration approval failed");
      return reply.status(500).send({ success: false, message: "Unable to review registration" });
    }
  });

  // Get tournament registrations by tournament ID
  fastify.get("/tournament/:tournamentId", { preHandler: [authenticateToken, requireAdmin] }, async (request, reply) => {
    try {
      const { tournamentId } = request.params as { tournamentId: string };
      const { page = 1, limit = 10 } = request.query as any;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [registrations, total] = await Promise.all([
        TournamentRegistration.find({ tournament: tournamentId })
          .populate("squad", "name tag logo")
          .populate("squadLeader", "name email avatar")
          .populate("squadMembers", "name email avatar")
          .populate("approvedBy", "name email")
          .sort({ registrationDate: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        TournamentRegistration.countDocuments({ tournament: tournamentId }),
      ]);

      return reply.status(200).send({
        success: true,
        registrations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error("Get tournament registrations error:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to get tournament registrations",
      });
    }
  });

  // Get squad registrations by squad ID
  fastify.get("/squad/:squadId", { preHandler: [authenticateToken] }, async (request, reply) => {
    try {
      const { squadId } = request.params as { squadId: string };
      const actor = (request as any).user;
      const squad = await Squad.findById(squadId).select("leader");
      if (!squad) return reply.status(404).send({ success: false, message: "Squad not found" });
      if (actor?.role !== "ADMIN" && squad.leader.toString() !== actor?.id) {
        return reply.status(403).send({ success: false, message: "Only squad leader can view registration payments" });
      }

      const registrations = await TournamentRegistration.find({
        squad: squadId,
      })
        .populate("tournament", "name game startDate endDate status")
        .populate("approvedBy", "name email")
        .sort({ registrationDate: -1 })
        .lean();

      return reply.status(200).send({
        success: true,
        registrations,
      });
    } catch (error) {
      console.error("Get squad registrations error:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to get squad registrations",
      });
    }
  });

  fastify.delete("/:id", { preHandler: [authenticateToken] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      await cancelTournamentRegistration(id, (request as any).user?.id);
      return reply.status(200).send({ success: true, message: "Registration cancelled successfully" });
    } catch (error) {
      return handleTournamentRegistrationError(error, reply);
    }
  });

  // Get pending tax tournament registrations (admin only)
  fastify.get("/pending-tax", { preHandler: [authenticateToken, requireAdmin] }, async (request, reply) => {
    try {
      const { page = 1, limit = 10 } = request.query as any;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const query = {
        approvalStatus: "pending",
      };

      const [registrations, total] = await Promise.all([
        TournamentRegistration.find(query)
          .populate("tournament", "name game startDate tournamentType")
          .populate("squad", "name tag")
          .populate("squadLeader", "name email")
          .populate("squadMembers", "name email")
          .sort({ registrationDate: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        TournamentRegistration.countDocuments(query),
      ]);

      return reply.status(200).send({
        success: true,
        registrations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error("Get pending tax registrations error:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to get pending tax registrations",
      });
    }
  });
};

export default tournamentRegistrationRoutes;
