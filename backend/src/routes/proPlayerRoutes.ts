import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import {
  authenticateToken,
  requireAdmin,
  AuthenticatedRequest,
} from "../middleware/auth";
import ProPlayer, { ProPlayerStatus } from "../models/ProPlayer";
import User, { UserRole } from "../models/User";

export default async function proPlayerRoutes(fastify: FastifyInstance) {
  // Get all approved pro players (public)
  fastify.get("/", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { game, status, page = 1, limit = 10 } = request.query as any;

      const filter: any = {
        status: ProPlayerStatus.APPROVED,
        isAvailable: true,
      };

      if (game) filter.game = game;

      const skip = (Number(page) - 1) * Number(limit);

      const proPlayers = await ProPlayer.find(filter)
        .populate("userId", "name avatar rating totalReviews")
        .sort({ rating: -1, totalBoosts: -1 })
        .skip(skip)
        .limit(Number(limit));

      const total = await ProPlayer.countDocuments(filter);

      reply.send({
        proPlayers,
        pagination: {
          current: Number(page),
          total: Math.ceil(total / Number(limit)),
          hasMore: skip + proPlayers.length < total,
        },
      });
    } catch (error: any) {
      reply.status(500).send({ message: "Server error", error: error.message });
    }
  });

  // Get pro player by ID (public)
  fastify.get("/:id", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const proPlayer = await ProPlayer.findById(id)
        .populate("userId", "name avatar rating totalReviews bio gameExpertise")
        .populate("approvedBy", "name");

      if (!proPlayer) {
        return reply.status(404).send({ message: "Pro player not found" });
      }

      reply.send(proPlayer);
    } catch (error: any) {
      reply.status(500).send({ message: "Server error", error: error.message });
    }
  });

  // Create pro player profile (authenticated users)
  fastify.post(
    "/",
    {
      preHandler: authenticateToken,
    },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      try {
        const {
          game,
          rank,
          currentRank,
          targetRank,
          price,
          estimatedTime,
          description,
        } = request.body as any;

        // Check if user already has a pro player profile
        const existingProfile = await ProPlayer.findOne({
          userId: request.user!.id,
        });
        if (existingProfile) {
          return reply
            .status(400)
            .send({ message: "You already have a pro player profile" });
        }

        const proPlayer = new ProPlayer({
          userId: request.user!.id,
          game,
          rank,
          currentRank,
          targetRank,
          price,
          estimatedTime,
          description,
        });

        await proPlayer.save();

        reply.status(201).send(proPlayer);
      } catch (error: any) {
        reply
          .status(500)
          .send({ message: "Server error", error: error.message });
      }
    }
  );

  // Update pro player profile (owner only)
  fastify.put(
    "/:id",
    {
      preHandler: authenticateToken,
    },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const proPlayer = await ProPlayer.findById(id);

        if (!proPlayer) {
          return reply
            .status(404)
            .send({ message: "Pro player profile not found" });
        }

        if (proPlayer.userId.toString() !== request.user!.id) {
          return reply.status(403).send({ message: "Not authorized" });
        }

        // Only allow updates if status is not approved
        if (proPlayer.status === ProPlayerStatus.APPROVED) {
          return reply.status(400).send({
            message:
              "Cannot update approved profile. Contact admin for changes.",
          });
        }

        const updatedProPlayer = await ProPlayer.findByIdAndUpdate(
          id,
          request.body,
          { new: true, runValidators: true }
        );

        reply.send(updatedProPlayer);
      } catch (error: any) {
        reply
          .status(500)
          .send({ message: "Server error", error: error.message });
      }
    }
  );

  // Delete pro player profile (owner only)
  fastify.delete(
    "/:id",
    {
      preHandler: authenticateToken,
    },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const proPlayer = await ProPlayer.findById(id);

        if (!proPlayer) {
          return reply
            .status(404)
            .send({ message: "Pro player profile not found" });
        }

        if (proPlayer.userId.toString() !== request.user!.id) {
          return reply.status(403).send({ message: "Not authorized" });
        }

        await ProPlayer.findByIdAndDelete(id);

        reply.send({ message: "Profile deleted successfully" });
      } catch (error: any) {
        reply
          .status(500)
          .send({ message: "Server error", error: error.message });
      }
    }
  );

  // Admin routes
  // Get all pro player applications (admin only)
  fastify.get(
    "/admin/applications",
    {
      preHandler: [authenticateToken, requireAdmin],
    },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      try {
        const { status, page = 1, limit = 20 } = request.query as any;

        const filter: any = {};
        if (status) filter.status = status;

        const skip = (Number(page) - 1) * Number(limit);

        const applications = await ProPlayer.find(filter)
          .populate("userId", "name email avatar")
          .populate("approvedBy", "name")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit));

        const total = await ProPlayer.countDocuments(filter);

        reply.send({
          applications,
          pagination: {
            current: Number(page),
            total: Math.ceil(total / Number(limit)),
            hasMore: skip + applications.length < total,
          },
        });
      } catch (error: any) {
        reply
          .status(500)
          .send({ message: "Server error", error: error.message });
      }
    }
  );

  // Approve/reject pro player application (admin only)
  fastify.patch(
    "/admin/:id/status",
    {
      preHandler: [authenticateToken, requireAdmin],
    },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const { status, adminNotes } = request.body as any;

        if (!Object.values(ProPlayerStatus).includes(status)) {
          return reply.status(400).send({ message: "Invalid status" });
        }

        const updateData: any = { status };

        if (status === ProPlayerStatus.APPROVED) {
          updateData.approvedBy = request.user!.id;
          updateData.approvedAt = new Date();
        }

        if (adminNotes) {
          updateData.adminNotes = adminNotes;
        }

        const proPlayer = await ProPlayer.findByIdAndUpdate(id, updateData, {
          new: true,
          runValidators: true,
        }).populate("userId", "name email");

        if (!proPlayer) {
          return reply
            .status(404)
            .send({ message: "Pro player profile not found" });
        }

        reply.send(proPlayer);
      } catch (error: any) {
        reply
          .status(500)
          .send({ message: "Server error", error: error.message });
      }
    }
  );

  // Get pro player stats (admin only)
  fastify.get(
    "/admin/stats",
    {
      preHandler: [authenticateToken, requireAdmin],
    },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      try {
        const stats = await ProPlayer.aggregate([
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
              totalBoosts: { $sum: "$totalBoosts" },
              successfulBoosts: { $sum: "$successfulBoosts" },
              avgRating: { $avg: "$rating" },
            },
          },
        ]);

        const totalApplications = await ProPlayer.countDocuments();
        const pendingApplications = await ProPlayer.countDocuments({
          status: ProPlayerStatus.PENDING,
        });

        reply.send({
          stats,
          totalApplications,
          pendingApplications,
        });
      } catch (error: any) {
        reply
          .status(500)
          .send({ message: "Server error", error: error.message });
      }
    }
  );
}
