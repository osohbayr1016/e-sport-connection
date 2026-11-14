import { FastifyInstance, FastifyPluginAsync } from "fastify";
import User from "../models/User";
import News from "../models/News";
import Tournament from "../models/Tournament";

const statsRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Health check
  fastify.get("/stats/health", async (request, reply) => {
    return {
      success: true,
      message: "Stats routes available",
      timestamp: new Date().toISOString(),
    };
  });

  // Overview stats endpoint
  fastify.get("/stats/overview", async (request, reply) => {
    try {
      // Get active players (users who are online or were online in the last 24 hours)
      const activePlayers = await User.countDocuments({
        $or: [
          { isOnline: true },
          { lastSeen: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
        ],
      });

      // Get total news count
      const newsCount = await News.countDocuments();

      // Get ongoing tournaments count
      const ongoingTournaments = await Tournament.countDocuments({
        status: "ongoing",
      });

      return {
        activePlayers,
        newsCount,
        ongoingTournaments,
      };
    } catch (error) {
      console.error("Error fetching stats overview:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to fetch stats overview",
      });
    }
  });
};

export default statsRoutes;
