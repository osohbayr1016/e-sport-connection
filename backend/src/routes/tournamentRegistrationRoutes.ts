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

  // Register squad for tournament
  fastify.post("/register", { preHandler: [authenticateToken] }, async (request, reply) => {
    try {
      const { tournamentId, squadId, squadLeaderId, paymentProof } =
        request.body as any;

      // Validate required fields
      if (!tournamentId || !squadId || !squadLeaderId) {
        return reply.status(400).send({
          success: false,
          message: "Tournament ID, Squad ID, and Squad Leader ID are required",
        });
      }

      if (squadLeaderId !== (request as any).user?.id) {
        return reply.status(403).send({ success: false, message: "Only the authenticated squad leader can register" });
      }
      // Check if tournament exists and registration is open
      const tournament = await Tournament.findById(tournamentId);
      if (!tournament) {
        return reply.status(404).send({
          success: false,
          message: "Tournament not found",
        });
      }

      // Registration remains open until the tournament is started by admin.
      if (
        tournament.status === "ongoing" ||
        tournament.status === "completed"
      ) {
        return reply.status(400).send({
          success: false,
          message: "Tournament has already started",
        });
      }

      // Check if tournament is full
      if (tournament.currentSquads >= tournament.maxSquads) {
        return reply.status(400).send({
          success: false,
          message: "Tournament is full",
        });
      }

      // Check if squad exists and leader is valid
      const squad = await Squad.findById(squadId);
      if (!squad) {
        return reply.status(404).send({
          success: false,
          message: "Squad not found",
        });
      }

      if (squad.leader.toString() !== squadLeaderId) {
        return reply.status(403).send({
          success: false,
          message: "Only squad leader can register for tournament",
        });
      }

      // Check if squad is already registered
      const existingRegistration = await TournamentRegistration.findOne({
        tournament: tournamentId,
        squad: squadId,
      });

      if (existingRegistration) {
        return reply.status(400).send({
          success: false,
          message: "Squad is already registered for this tournament",
        });
      }

      // Handle different tournament types
      let paymentStatus = "pending";
      let isApproved = false;
      let approvalStatus = "pending";

      // Default to tax tournament type if not specified (for backward compatibility)
      const tournamentType = tournament.tournamentType || "tax";

      if (tournamentType === "free") {
        // Free tournaments are automatically approved
        paymentStatus = "paid";
        isApproved = true;
        approvalStatus = "approved";
      } else if (tournamentType === "tax") {
        // Tax tournaments require payment proof and admin approval
        if (!paymentProof) {
          return reply.status(400).send({
            success: false,
            message: "Payment proof is required for tax tournaments",
          });
        }
        paymentStatus = "pending";
        isApproved = false;
        approvalStatus = "pending";
      }

      // Create registration
      const registration = new TournamentRegistration({
        tournament: tournamentId,
        squad: squadId,
        squadLeader: squadLeaderId,
        squadMembers: squad.members,
        registrationFee: tournament.entryFee,
        paymentProof,
        paymentStatus,
        isApproved,
        approvalStatus,
        paymentDate: paymentProof ? new Date() : undefined,
      });

      await registration.save();

      // Update tournament participant count
      tournament.currentSquads += 1;
      await tournament.save();

      const populatedRegistration = await TournamentRegistration.findById(
        registration._id
      )
        .populate("tournament", "name game startDate")
        .populate("squad", "name tag")
        .populate("squadLeader", "name email")
        .populate("squadMembers", "name email")
        .lean();

      return reply.status(201).send({
        success: true,
        message: "Squad registered successfully",
        registration: populatedRegistration,
      });
    } catch (error) {
      console.error("Register squad for tournament error:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to register squad for tournament",
      });
    }
  });

  // Update payment status (admin only)
  fastify.put("/:id/payment", { preHandler: [authenticateToken, requireAdmin] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { paymentStatus, adminId } = request.body as any;

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
      const { adminId, action, reason } = request.body as any;

      // Validate required fields
      if (!action) {
        return reply.status(400).send({
          success: false,
          message: "Admin ID and action are required",
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
  fastify.get("/tournament/:tournamentId", async (request, reply) => {
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
  fastify.get("/squad/:squadId", async (request, reply) => {
    try {
      const { squadId } = request.params as { squadId: string };

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

  // Cancel registration (squad leader only)
  fastify.delete("/:id", { preHandler: [authenticateToken] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { squadLeaderId } = request.body as any;

      const registration = await TournamentRegistration.findById(id);
      if (!registration) {
        return reply.status(404).send({
          success: false,
          message: "Registration not found",
        });
      }

      if (registration.squadLeader.toString() !== (request as any).user?.id || squadLeaderId !== (request as any).user?.id) {
        return reply.status(403).send({
          success: false,
          message: "Only squad leader can cancel registration",
        });
      }

      // Update tournament participant count
      const tournament = await Tournament.findById(registration.tournament);
      if (tournament) {
        tournament.currentSquads -= 1;
        await tournament.save();
      }

      await TournamentRegistration.findByIdAndDelete(id);

      return reply.status(200).send({
        success: true,
        message: "Registration cancelled successfully",
      });
    } catch (error) {
      console.error("Cancel registration error:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to cancel registration",
      });
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
