import { createTournamentRegistration, cancelTournamentRegistration, handleTournamentRegistrationError } from "../services/tournamentRegistrationService";
import { authenticateToken, requireAdmin } from "../middleware/auth";
import { FastifyInstance, FastifyPluginAsync } from "fastify";
import TournamentRegistration from "../models/TournamentRegistration";
import Tournament from "../models/Tournament";
import Squad from "../models/Squad";
import User from "../models/User";

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

  // Update payment status (admin only)
  fastify.put("/:id/payment", { preHandler: [authenticateToken, requireAdmin] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { paymentStatus } = request.body as any;

      if (!["pending", "paid", "failed", "refunded"].includes(paymentStatus)) {
        return reply.status(400).send({ success: false, message: "Invalid payment status" });
      }

      const registration = await TournamentRegistration.findById(id);
      if (!registration) {
        return reply.status(404).send({
          success: false,
          message: "Registration not found",
        });
      }

      registration.paymentStatus = paymentStatus;
      if (paymentStatus === "paid") {
        registration.paymentDate = new Date();
      }

      await registration.save();

      const updatedRegistration = await TournamentRegistration.findById(id)
        .populate("tournament", "name game startDate")
        .populate("squad", "name tag")
        .populate("squadLeader", "name email")
        .populate("squadMembers", "name email")
        .lean();

      return reply.status(200).send({
        success: true,
        message: "Payment status updated successfully",
        registration: updatedRegistration,
      });
    } catch (error) {
      console.error("Update payment status error:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to update payment status",
      });
    }
  });

  // Approve registration (admin only)
  fastify.put("/:id/approve", { preHandler: [authenticateToken, requireAdmin] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { action, reason } = request.body as any;

      // Validate required fields
      if (!action) {
        return reply.status(400).send({
          success: false,
          message: "Action is required",
        });
      }

      if (!["approve", "reject"].includes(action)) {
        return reply.status(400).send({
          success: false,
          message: "Action must be either 'approve' or 'reject'",
        });
      }

      // Check if registration exists
      const registration = await TournamentRegistration.findById(id);
      if (!registration) {
        return reply.status(404).send({
          success: false,
          message: "Registration not found",
        });
      }

      // Check if tournament is tax type
      const tournament = await Tournament.findById(registration.tournament);
      if (!tournament) {
        return reply.status(404).send({
          success: false,
          message: "Tournament not found",
        });
      }
      
      // Default to tax tournament type if not specified (for backward compatibility)
      const tournamentType = tournament.tournamentType || "tax";
      if (tournamentType !== "tax") {
        return reply.status(400).send({
          success: false,
          message: "Only tax tournament registrations can be approved/rejected",
        });
      }

      // Update registration based on action
      if (action === "approve") {
        registration.isApproved = true;
        registration.approvalStatus = "approved";
        registration.approvedBy = (request as any).user?.id;
        registration.approvedAt = new Date();
        registration.paymentStatus = "paid";
        registration.paymentDate = new Date();
      } else if (action === "reject") {
        registration.isApproved = false;
        registration.approvalStatus = "rejected";
        registration.rejectionReason = reason || "No reason provided";
      }

      await registration.save();

      const updatedRegistration = await TournamentRegistration.findById(id)
        .populate("tournament", "name game startDate tournamentType")
        .populate("squad", "name tag")
        .populate("squadLeader", "name email")
        .populate("squadMembers", "name email")
        .populate("approvedBy", "name email")
        .lean();

      return reply.status(200).send({
        success: true,
        message: `Registration ${action}d successfully`,
        registration: updatedRegistration,
      });
    } catch (error) {
      console.error("Admin approval error:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to process approval",
      });
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
