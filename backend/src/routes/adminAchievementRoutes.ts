import { authenticateToken, requireAdmin } from "../middleware/auth";
import { FastifyInstance, FastifyPluginAsync } from "fastify";
import mongoose from "mongoose";
import Achievement from "../models/Achievement";
import Badge from "../models/Badge";
import UserAchievement from "../models/UserAchievement";
import UserBadge from "../models/UserBadge";
import User from "../models/User";
import { AchievementCategory, AchievementRarity, AchievementType } from "../models/Achievement";
import { BadgeType, BadgeRarity } from "../models/Badge";

const adminAchievementRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // All routes in this plugin, including GET, require a DB-verified ADMIN.
  fastify.addHook("preHandler", authenticateToken);
  fastify.addHook("preHandler", requireAdmin);

  // Get all achievements (admin view)
  fastify.get("/admin/achievements", async (request, reply) => {
    try {
      const achievements = await Achievement.find({})
        .populate("rewards.badge")
        .sort({ createdAt: -1 });

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

  // Create new achievement
  fastify.post("/admin/achievements", async (request, reply) => {
    try {
      const achievementData = request.body as any;

      // Validate required fields
      if (!achievementData.name || !achievementData.description || !achievementData.category) {
        return reply.status(400).send({
          success: false,
          message: "Name, description, and category are required",
        });
      }

      const achievement = new Achievement({
        name: achievementData.name,
        description: achievementData.description,
        category: achievementData.category,
        rarity: achievementData.rarity || AchievementRarity.COMMON,
        type: achievementData.type || AchievementType.COUNTER,
        icon: achievementData.icon || "star",
        points: achievementData.points || 10,
        requirements: achievementData.requirements || {},
        rewards: achievementData.rewards || {},
        isActive: achievementData.isActive !== false,
        isSeasonal: achievementData.isSeasonal || false,
        seasonStart: achievementData.seasonStart,
        seasonEnd: achievementData.seasonEnd,
        prerequisites: achievementData.prerequisites || [],
      });

      await achievement.save();

      return reply.send({
        success: true,
        data: achievement,
        message: "Achievement created successfully",
      });
    } catch (error) {
      console.error("Error creating achievement:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to create achievement",
      });
    }
  });

  // Update achievement
  fastify.put("/admin/achievements/:id", async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const updateData = request.body as any;

      const achievement = await Achievement.findByIdAndUpdate(
        id,
        { ...updateData, updatedAt: new Date() },
        { new: true }
      );

      if (!achievement) {
        return reply.status(404).send({
          success: false,
          message: "Achievement not found",
        });
      }

      return reply.send({
        success: true,
        data: achievement,
        message: "Achievement updated successfully",
      });
    } catch (error) {
      console.error("Error updating achievement:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to update achievement",
      });
    }
  });

  // Delete achievement
  fastify.delete("/admin/achievements/:id", async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      // Check if any users have this achievement
      const userAchievements = await UserAchievement.find({ achievementId: id });
      if (userAchievements.length > 0) {
        return reply.status(400).send({
          success: false,
          message: "Cannot delete achievement that users have earned",
        });
      }

      await Achievement.findByIdAndDelete(id);

      return reply.send({
        success: true,
        message: "Achievement deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting achievement:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to delete achievement",
      });
    }
  });

  // Get all badges (admin view)
  fastify.get("/admin/badges", async (request, reply) => {
    try {
      const badges = await Badge.find({})
        .populate("requirements.achievementId")
        .sort({ displayOrder: 1 });

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

  // Create new badge
  fastify.post("/admin/badges", async (request, reply) => {
    try {
      const badgeData = request.body as any;

      // Validate required fields
      if (!badgeData.name || !badgeData.description || !badgeData.type) {
        return reply.status(400).send({
          success: false,
          message: "Name, description, and type are required",
        });
      }

      const badge = new Badge({
        name: badgeData.name,
        description: badgeData.description,
        type: badgeData.type,
        rarity: badgeData.rarity || BadgeRarity.COMMON,
        icon: badgeData.icon || "star",
        color: badgeData.color || "#3B82F6",
        borderColor: badgeData.borderColor,
        glowEffect: badgeData.glowEffect || false,
        animation: badgeData.animation,
        requirements: badgeData.requirements || {},
        isActive: badgeData.isActive !== false,
        isSeasonal: badgeData.isSeasonal || false,
        seasonStart: badgeData.seasonStart,
        seasonEnd: badgeData.seasonEnd,
        displayOrder: badgeData.displayOrder || 0,
      });

      await badge.save();

      return reply.send({
        success: true,
        data: badge,
        message: "Badge created successfully",
      });
    } catch (error) {
      console.error("Error creating badge:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to create badge",
      });
    }
  });

  // Update badge
  fastify.put("/admin/badges/:id", async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const updateData = request.body as any;

      const badge = await Badge.findByIdAndUpdate(
        id,
        { ...updateData, updatedAt: new Date() },
        { new: true }
      );

      if (!badge) {
        return reply.status(404).send({
          success: false,
          message: "Badge not found",
        });
      }

      return reply.send({
        success: true,
        data: badge,
        message: "Badge updated successfully",
      });
    } catch (error) {
      console.error("Error updating badge:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to update badge",
      });
    }
  });

  // Delete badge
  fastify.delete("/admin/badges/:id", async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      // Check if any users have this badge
      const userBadges = await UserBadge.find({ badgeId: id });
      if (userBadges.length > 0) {
        return reply.status(400).send({
          success: false,
          message: "Cannot delete badge that users have earned",
        });
      }

      await Badge.findByIdAndDelete(id);

      return reply.send({
        success: true,
        message: "Badge deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting badge:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to delete badge",
      });
    }
  });

  // Get user progress for all achievements
  fastify.get("/admin/user-progress/:userId", async (request, reply) => {
    try {
      const { userId } = request.params as { userId: string };

      const userAchievements = await UserAchievement.find({ userId })
        .populate("achievementId")
        .sort({ createdAt: -1 });

      const userBadges = await UserBadge.find({ userId })
        .populate("badgeId")
        .sort({ earnedAt: -1 });

      return reply.send({
        success: true,
        data: {
          achievements: userAchievements,
          badges: userBadges,
        },
      });
    } catch (error) {
      console.error("Error fetching user progress:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to fetch user progress",
      });
    }
  });

  // Get all users with their achievement progress
  fastify.get("/admin/users-progress", async (request, reply) => {
    try {
      const { page = 1, limit = 20, search = "" } = request.query as any;

      const query = search ? { name: { $regex: search, $options: "i" } } : {};
      
      const users = await User.find(query)
        .select("name email avatar createdAt")
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 });

      const usersWithProgress = await Promise.all(
        users.map(async (user) => {
          const achievementsCount = await UserAchievement.countDocuments({
            userId: user._id,
            status: "COMPLETED",
          });

          const badgesCount = await UserBadge.countDocuments({
            userId: user._id,
          });

          const totalPoints = await UserAchievement.aggregate([
            { $match: { userId: user._id, status: "COMPLETED" } },
            {
              $lookup: {
                from: "achievements",
                localField: "achievementId",
                foreignField: "_id",
                as: "achievement",
              },
            },
            {
              $group: {
                _id: null,
                totalPoints: { $sum: { $arrayElemAt: ["$achievement.points", 0] } },
              },
            },
          ]);

          return {
            _id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            createdAt: user.createdAt,
            achievementsCount,
            badgesCount,
            totalPoints: totalPoints[0]?.totalPoints || 0,
          };
        })
      );

      const totalUsers = await User.countDocuments(query);

      return reply.send({
        success: true,
        data: {
          users: usersWithProgress,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalUsers,
            pages: Math.ceil(totalUsers / limit),
          },
        },
      });
    } catch (error) {
      console.error("Error fetching users progress:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to fetch users progress",
      });
    }
  });

  // Manually award achievement to user
  fastify.post("/admin/award-achievement", async (request, reply) => {
    try {
      const { userId, achievementId } = request.body as any;

      if (!userId || !achievementId) {
        return reply.status(400).send({
          success: false,
          message: "User ID and Achievement ID are required",
        });
      }

      const achievement = await Achievement.findById(achievementId);
      if (!achievement) {
        return reply.status(404).send({
          success: false,
          message: "Achievement not found",
        });
      }

      const userAchievement = await UserAchievement.findOne({
        userId,
        achievementId,
      });

      if (userAchievement) {
        return reply.status(400).send({
          success: false,
          message: "User already has this achievement",
        });
      }

      const newUserAchievement = new UserAchievement({
        userId,
        achievementId,
        status: "COMPLETED",
        progress: {
          current: achievement.requirements.counter || 1,
          target: achievement.requirements.counter || 1,
          percentage: 100,
        },
        completedAt: new Date(),
        rewardsClaimed: {
          bountyCoins: false,
          experience: false,
          badge: false,
          title: false,
        },
      });

      await newUserAchievement.save();

      return reply.send({
        success: true,
        data: newUserAchievement,
        message: "Achievement awarded successfully",
      });
    } catch (error) {
      console.error("Error awarding achievement:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to award achievement",
      });
    }
  });

  // Manually award badge to user
  fastify.post("/admin/award-badge", async (request, reply) => {
    try {
      const { userId, badgeId } = request.body as any;

      if (!userId || !badgeId) {
        return reply.status(400).send({
          success: false,
          message: "User ID and Badge ID are required",
        });
      }

      const badge = await Badge.findById(badgeId);
      if (!badge) {
        return reply.status(404).send({
          success: false,
          message: "Badge not found",
        });
      }

      const userBadge = await UserBadge.findOne({
        userId,
        badgeId,
      });

      if (userBadge) {
        return reply.status(400).send({
          success: false,
          message: "User already has this badge",
        });
      }

      const newUserBadge = new UserBadge({
        userId,
        badgeId,
        earnedAt: new Date(),
        metadata: {
          awardedBy: "admin",
        },
      });

      await newUserBadge.save();

      return reply.send({
        success: true,
        data: newUserBadge,
        message: "Badge awarded successfully",
      });
    } catch (error) {
      console.error("Error awarding badge:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to award badge",
      });
    }
  });

  // Get achievement statistics
  fastify.get("/admin/achievement-stats", async (request, reply) => {
    try {
      const totalAchievements = await Achievement.countDocuments();
      const totalBadges = await Badge.countDocuments();
      const activeAchievements = await Achievement.countDocuments({ isActive: true });
      const activeBadges = await Badge.countDocuments({ isActive: true });

      const achievementsByCategory = await Achievement.aggregate([
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
          },
        },
      ]);

      const badgesByRarity = await Badge.aggregate([
        {
          $group: {
            _id: "$rarity",
            count: { $sum: 1 },
          },
        },
      ]);

      const totalUserAchievements = await UserAchievement.countDocuments({
        status: "COMPLETED",
      });

      const totalUserBadges = await UserBadge.countDocuments();

      return reply.send({
        success: true,
        data: {
          totalAchievements,
          totalBadges,
          activeAchievements,
          activeBadges,
          achievementsByCategory,
          badgesByRarity,
          totalUserAchievements,
          totalUserBadges,
        },
      });
    } catch (error) {
      console.error("Error fetching achievement stats:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to fetch achievement statistics",
      });
    }
  });
};

export default adminAchievementRoutes;

