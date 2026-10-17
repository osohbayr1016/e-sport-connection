import { authenticateToken, requireAdmin } from "../middleware/auth";
import { FastifyInstance, FastifyPluginAsync } from "fastify";
import Achievement from "../models/Achievement";
import UserAchievement from "../models/UserAchievement";
import UserBadge from "../models/UserBadge";
import Badge from "../models/Badge";
import LeaderboardEntry, { LeaderboardType, LeaderboardPeriod } from "../models/LeaderboardEntry";
import { AchievementService } from "../services/achievementService";
import mongoose from "mongoose";

const achievementRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Health check
  fastify.get("/achievements/health", async (request, reply) => {
    return reply.send({
      success: true,
      message: "Achievement routes available",
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * @route GET /api/achievements
   * @desc Get all available achievements
   * @access Public
   */
  fastify.get("/achievements", async (request, reply) => {
    try {
      const { category, rarity, type, game } = request.query as any;
      
      const query: any = { isActive: true };
      
      if (category) query.category = category;
      if (rarity) query.rarity = rarity;
      if (type) query.type = type;
      if (game) query["requirements.game"] = game;

      const achievements = await Achievement.find(query)
        .populate("rewards.badge")
        .sort({ points: -1 });

      return reply.send({
        success: true,
        data: achievements,
      });
    } catch (error) {
      console.error("Error fetching achievements:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to fetch achievements",
      });
    }
  });

  /**
   * @route GET /api/achievements/my-achievements
   * @desc Get current user's achievements
   * @access Private
   */
  fastify.get("/achievements/my-achievements", { preHandler: [authenticateToken] }, async (request, reply) => {
    try {
      const { status } = request.query as any;
      const userId = (request as any).user?.id;

      if (!userId) {
        return reply.status(401).send({
          success: false,
          message: "Authentication required",
        });
      }

      const query: any = { userId: new mongoose.Types.ObjectId(userId) };
      if (status) query.status = status;

      const userAchievements = await UserAchievement.find(query)
        .populate("achievementId")
        .sort({ createdAt: -1 });

      return reply.send({
        success: true,
        data: userAchievements,
      });
    } catch (error) {
      console.error("Error fetching user achievements:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to fetch user achievements",
      });
    }
  });

  /**
   * @route POST /api/achievements/claim/:achievementId
   * @desc Claim achievement rewards
   * @access Private
   */
  fastify.post("/achievements/claim/:achievementId", { preHandler: [authenticateToken] }, async (request, reply) => {
    try {
      const { achievementId } = request.params as { achievementId: string };
      const userId = (request as any).user?.id;

      if (!userId) {
        return reply.status(401).send({
          success: false,
          message: "Authentication required",
        });
      }

      const userAchievement = await UserAchievement.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        achievementId: new mongoose.Types.ObjectId(achievementId),
        status: "COMPLETED",
      }).populate("achievementId");

      if (!userAchievement) {
        return reply.status(404).send({
          success: false,
          message: "Achievement not found or not completed",
        });
      }

      if (userAchievement.claimedAt) {
        return reply.status(400).send({
          success: false,
          message: "Rewards already claimed",
        });
      }

      // Mark rewards as claimed
      userAchievement.claimedAt = new Date();
      userAchievement.rewardsClaimed = {
        bountyCoins: true,
        experience: true,
        badge: true,
        title: true,
      };

      await userAchievement.save();

      return reply.send({
        success: true,
        message: "Rewards claimed successfully",
        data: userAchievement,
      });
    } catch (error) {
      console.error("Error claiming achievement rewards:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to claim rewards",
      });
    }
  });

  /**
   * @route GET /api/achievements/badges
   * @desc Get all available badges
   * @access Public
   */
  fastify.get("/achievements/badges", async (request, reply) => {
    try {
      const { type, rarity } = request.query as any;
      
      const query: any = { isActive: true };
      
      if (type) query.type = type;
      if (rarity) query.rarity = rarity;

      const badges = await Badge.find(query)
        .sort({ displayOrder: 1, rarity: 1 });

      return reply.send({
        success: true,
        data: badges,
      });
    } catch (error) {
      console.error("Error fetching badges:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to fetch badges",
      });
    }
  });

  /**
   * @route GET /api/achievements/my-badges
   * @desc Get current user's badges
   * @access Private
   */
  fastify.get("/achievements/my-badges", { preHandler: [authenticateToken] }, async (request, reply) => {
    try {
      const { equipped } = request.query as any;
      const userId = (request as any).user?.id;

      if (!userId) {
        return reply.status(401).send({
          success: false,
          message: "Authentication required",
        });
      }

      const query: any = { userId: new mongoose.Types.ObjectId(userId) };
      if (equipped !== undefined) query.isEquipped = equipped === "true";

      const userBadges = await UserBadge.find(query)
        .populate("badgeId")
        .sort({ earnedAt: -1 });

      return reply.send({
        success: true,
        data: userBadges,
      });
    } catch (error) {
      console.error("Error fetching user badges:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to fetch user badges",
      });
    }
  });

  /**
   * @route POST /api/achievements/badges/equip/:badgeId
   * @desc Equip a badge
   * @access Private
   */
  fastify.post("/achievements/badges/equip/:badgeId", { preHandler: [authenticateToken] }, async (request, reply) => {
    try {
      const { badgeId } = request.params as { badgeId: string };
      const userId = (request as any).user?.id;

      if (!userId) {
        return reply.status(401).send({
          success: false,
          message: "Authentication required",
        });
      }

      const userBadge = await UserBadge.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        badgeId: new mongoose.Types.ObjectId(badgeId),
      });

      if (!userBadge) {
        return reply.status(404).send({
          success: false,
          message: "Badge not found",
        });
      }

      // Unequip all other badges first
      await UserBadge.updateMany(
        { userId: new mongoose.Types.ObjectId(userId) },
        { isEquipped: false }
      );

      // Equip the selected badge
      userBadge.isEquipped = true;
      userBadge.equippedAt = new Date();
      await userBadge.save();

      return reply.send({
        success: true,
        message: "Badge equipped successfully",
        data: userBadge,
      });
    } catch (error) {
      console.error("Error equipping badge:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to equip badge",
      });
    }
  });

  /**
   * @route POST /api/achievements/badges/unequip/:badgeId
   * @desc Unequip a badge
   * @access Private
   */
  fastify.post("/achievements/badges/unequip/:badgeId", { preHandler: [authenticateToken] }, async (request, reply) => {
    try {
      const { badgeId } = request.params as { badgeId: string };
      const userId = (request as any).user?.id;

      if (!userId) {
        return reply.status(401).send({
          success: false,
          message: "Authentication required",
        });
      }

      const userBadge = await UserBadge.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        badgeId: new mongoose.Types.ObjectId(badgeId),
      });

      if (!userBadge) {
        return reply.status(404).send({
          success: false,
          message: "Badge not found",
        });
      }

      userBadge.isEquipped = false;
      userBadge.equippedAt = undefined;
      await userBadge.save();

      return reply.send({
        success: true,
        message: "Badge unequipped successfully",
        data: userBadge,
      });
    } catch (error) {
      console.error("Error unequipping badge:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to unequip badge",
      });
    }
  });

  /**
   * @route GET /api/achievements/leaderboard
   * @desc Get leaderboard
   * @access Public
   */
  fastify.get("/achievements/leaderboard", async (request, reply) => {
    try {
      const { type = "ACHIEVEMENT_POINTS", period = "ALL_TIME", limit = 50 } = request.query as any;

      const leaderboard = await LeaderboardEntry.find({
        leaderboardType: type as LeaderboardType,
        period: period as LeaderboardPeriod,
      })
        .populate("userId", "name avatar")
        .sort({ rank: 1 })
        .limit(parseInt(limit as string));

      return reply.send({
        success: true,
        data: leaderboard,
      });
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to fetch leaderboard",
      });
    }
  });

  /**
   * @route POST /api/achievements/trigger
   * @desc Trigger achievement check (for testing)
   * @access Private (Admin only)
   */
  fastify.post("/achievements/trigger", { preHandler: [authenticateToken, requireAdmin] }, async (request, reply) => {
    try {
      const { type, data } = request.body as any;
      const userId = (request as any).user?.id;

      if (!userId) {
        return reply.status(401).send({
          success: false,
          message: "Authentication required",
        });
      }

      if (!type || !data) {
        return reply.status(400).send({
          success: false,
          message: "Type and data are required",
        });
      }

      await AchievementService.processAchievementTrigger({
        userId: new mongoose.Types.ObjectId(userId),
        type,
        data,
      });

      return reply.send({
        success: true,
        message: "Achievement trigger processed",
      });
    } catch (error) {
      console.error("Error processing achievement trigger:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to process achievement trigger",
      });
    }
  });

  /**
   * @route POST /api/achievements/create-sample
   * @desc Create sample achievements (for testing)
   * @access Private (Admin only)
   */
  fastify.post("/achievements/create-sample", { preHandler: [authenticateToken, requireAdmin] }, async (request, reply) => {
    try {
      await AchievementService.createSampleAchievements();

      return reply.send({
        success: true,
        message: "Sample achievements created",
      });
    } catch (error) {
      console.error("Error creating sample achievements:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to create sample achievements",
      });
    }
  });
};

export default achievementRoutes;