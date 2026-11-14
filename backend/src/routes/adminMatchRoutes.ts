import { FastifyInstance, FastifyPluginAsync } from "fastify";
import Match, { MatchStatus, AdminResolution } from "../models/Match";
import { MatchService3 } from "../services/matchService3";
import User, { UserRole } from "../models/User";
import { AuthenticatedRequest } from "../middleware/auth";

const adminMatchRoutes: FastifyPluginAsync = async (
  fastify: FastifyInstance
) => {
  // Admin эрх шалгах middleware
  const checkAdmin = async (request: any, reply: any) => {
    if (!request.user?.id) {
      return reply
        .status(401)
        .send({ success: false, message: "Нэвтрэх шаардлагатай" });
    }

    const user = await User.findById(request.user.id);
    if (!user || user.role !== UserRole.ADMIN) {
      return reply
        .status(403)
        .send({ success: false, message: "Admin эрх шаардлагатай" });
    }
  };

  // Бүх matches харах
  fastify.get("/", { preHandler: checkAdmin }, async (request: AuthenticatedRequest, reply) => {
    try {
      const { status, limit = 50, page = 1 } = request.query as any;

      const query: any = {};
      if (status) {
        query.status = status;
      }

      const skip = (page - 1) * limit;

      const matches = await Match.find(query)
        .populate("challengerSquadId", "name tag logo")
        .populate("opponentSquadId", "name tag logo")
        .populate("winnerId", "name tag logo")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Match.countDocuments(query);

      return reply.send({
        success: true,
        data: matches,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error: any) {
      return reply.status(500).send({ success: false, message: error.message });
    }
  });

  // Disputed matches
  fastify.get(
    "/disputes",
    { preHandler: checkAdmin },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { limit = 50, page = 1 } = request.query as any;

        const query = { status: MatchStatus.DISPUTED };
        const skip = (page - 1) * limit;

        const matches = await Match.find(query)
          .populate("challengerSquadId")
          .populate("opponentSquadId")
          .sort({ updatedAt: -1 })
          .skip(skip)
          .limit(limit);

        const total = await Match.countDocuments(query);

        return reply.send({
          success: true,
          data: matches,
          pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(total / limit),
          },
        });
      } catch (error: any) {
        return reply
          .status(500)
          .send({ success: false, message: error.message });
      }
    }
  );

  // Dispute шийдвэрлэх
  fastify.post(
    "/:id/resolve",
    { preHandler: checkAdmin },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { id } = request.params as any;
        const { resolution } = request.body as any;

        if (
          !resolution ||
          !Object.values(AdminResolution).includes(resolution)
        ) {
          return reply
            .status(400)
            .send({ success: false, message: "Буруу resolution" });
        }

        const match = await MatchService3.resolveDispute(
          id,
          request.user.id,
          resolution
        );

        return reply.send({ success: true, data: match });
      } catch (error: any) {
        return reply
          .status(400)
          .send({ success: false, message: error.message });
      }
    }
  );

  // Match statistics
  fastify.get("/stats", { preHandler: checkAdmin }, async (request: AuthenticatedRequest, reply) => {
    try {
      const totalMatches = await Match.countDocuments();
      const activeMatches = await Match.countDocuments({
        status: {
          $in: [MatchStatus.PENDING, MatchStatus.ACCEPTED, MatchStatus.PLAYING],
        },
      });
      const completedMatches = await Match.countDocuments({
        status: MatchStatus.COMPLETED,
      });
      const disputedMatches = await Match.countDocuments({
        status: MatchStatus.DISPUTED,
      });
      const cancelledMatches = await Match.countDocuments({
        status: MatchStatus.CANCELLED,
      });

      return reply.send({
        success: true,
        data: {
          total: totalMatches,
          active: activeMatches,
          completed: completedMatches,
          disputed: disputedMatches,
          cancelled: cancelledMatches,
        },
      });
    } catch (error: any) {
      return reply.status(500).send({ success: false, message: error.message });
    }
  });
};

export default adminMatchRoutes;
