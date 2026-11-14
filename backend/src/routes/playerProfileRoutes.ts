import { authenticateToken } from "../middleware/auth";
import { FastifyInstance, FastifyPluginAsync } from "fastify";
import jwt from "jsonwebtoken";
import PlayerProfile from "../models/PlayerProfile";

const playerProfileRoutes: FastifyPluginAsync = async (
  fastify: FastifyInstance
) => {
  // Health check
  fastify.get("/health", async (request, reply) => {
    return reply.send({
      success: true,
      message: "Player profile routes available",
      timestamp: new Date().toISOString(),
    });
  });

  // Test endpoint to verify routing
  fastify.get("/test", async (request, reply) => {
    return reply.send({
      success: true,
      message: "Player profile routes are working",
      timestamp: new Date().toISOString(),
    });
  });

  // Create player profile
  fastify.post("/create-profile", { preHandler: authenticateToken }, async (request, reply) => {
    try {
      const token = request.headers.authorization?.replace("Bearer ", "");

      if (!token) {
        return reply.status(401).send({
          success: false,
          message: "Authentication required",
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      if (!decoded) {
        return reply.status(401).send({
          success: false,
          message: "Invalid token",
        });
      }

      const profileData = request.body as any;

      // Debug logging
      // Validate required fields
      const requiredFields = [
        "category",
        "game",
        "roles",
        "inGameName",
        "rank",
        "experience",
        "bio",
      ];
      const missingFields = requiredFields.filter(
        (field) => !profileData[field]
      );

      if (missingFields.length > 0) {
        return reply.status(400).send({
          success: false,
          message: `Missing required fields: ${missingFields.join(", ")}`,
          missingFields,
        });
      }

      // Check if profile already exists
      const existingProfile = await PlayerProfile.findOne({
        userId: decoded.id,
      });
      if (existingProfile) {
        return reply.status(400).send({
          success: false,
          message: "Profile already exists",
        });
      }

      // Create new profile
      // Never allow a payload to override the verified account owner.
      const permitted = ["category","game","roles","realName","inGameName","mlbbId","rank","rankStars","experience","bio","avatar","avatarPublicId","socialLinks","highlightVideo","isLookingForTeam","availability","languages"];
      const data: Record<string, unknown> = {};
      for (const field of permitted) {
        if (Object.prototype.hasOwnProperty.call(profileData, field)) data[field] = profileData[field];
      }
      const newProfile = new PlayerProfile({
        ...data,
        userId: (request as any).user.id,
      });

      await newProfile.save();

      // Trigger achievement check for profile creation
      try {
        const { AchievementService } = await import("../services/achievementService");
        
        await AchievementService.processAchievementTrigger({
          userId: decoded.id,
          type: "profile_update",
          data: {
            game: profileData.game,
            rank: profileData.rank,
            category: profileData.category,
          },
        });
      } catch (achievementError) {
        console.error("Error processing achievement triggers:", achievementError);
        // Don't fail the profile creation if achievement processing fails
      }

      return reply.status(201).send({
        success: true,
        message: "Profile created successfully",
        profile: newProfile,
      });
    } catch (error) {
      console.error("Create profile error:", error);

      // Check if it's a Mongoose validation error
      if (error.name === "ValidationError") {
        const validationErrors = Object.values(error.errors).map(
          (err: any) => err.message
        );
        return reply.status(400).send({
          success: false,
          message: "Validation failed",
          errors: validationErrors,
        });
      }

      return reply.status(500).send({
        success: false,
        message: "Failed to create profile",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  });

  // Get my profile
  fastify.get("/my-profile", async (request, reply) => {
    try {
      const token = request.headers.authorization?.replace("Bearer ", "");

      if (!token) {
        return reply.status(401).send({
          success: false,
          message: "Authentication required",
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      if (!decoded) {
        return reply.status(401).send({
          success: false,
          message: "Invalid token",
        });
      }

      const profile = await PlayerProfile.findOne({ userId: decoded.id });

      if (!profile) {
        return reply.status(404).send({
          success: false,
          message: "Profile not found",
        });
      }

      return reply.status(200).send({
        success: true,
        profile,
      });
    } catch (error) {
      console.error("Get profile error:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to get profile",
      });
    }
  });

  // Update profile
  fastify.put("/update-profile", { preHandler: authenticateToken }, async (request, reply) => {
    try {
      const token = request.headers.authorization?.replace("Bearer ", "");

      if (!token) {
        return reply.status(401).send({
          success: false,
          message: "Authentication required",
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      if (!decoded) {
        return reply.status(401).send({
          success: false,
          message: "Invalid token",
        });
      }

      const payload = request.body as Record<string, unknown>;
      const permitted = ["category","game","roles","realName","inGameName","mlbbId","rank","rankStars","experience","bio","avatar","avatarPublicId","socialLinks","highlightVideo","isLookingForTeam","availability","languages"];
      const updateData: Record<string, unknown> = {};
      for (const field of permitted) {
        if (Object.prototype.hasOwnProperty.call(payload, field)) updateData[field] = payload[field];
      }
      if (Object.keys(updateData).length === 0) {
        return reply.status(400).send({ success: false, message: "No editable fields supplied" });
      }

      const profile = await PlayerProfile.findOneAndUpdate(
        { userId: decoded.id },
        updateData,
        { new: true, runValidators: true }
      );

      if (!profile) {
        return reply.status(404).send({
          success: false,
          message: "Profile not found",
        });
      }

      return reply.status(200).send({
        success: true,
        message: "Profile updated successfully",
        profile,
      });
    } catch (error) {
      console.error("Update profile error:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to update profile",
      });
    }
  });

  // Check if user has profile
  fastify.get("/has-profile", async (request, reply) => {
    try {
      const token = request.headers.authorization?.replace("Bearer ", "");

      if (!token) {
        return reply.status(401).send({
          success: false,
          message: "Authentication required",
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      if (!decoded) {
        return reply.status(401).send({
          success: false,
          message: "Invalid token",
        });
      }

      const profile = await PlayerProfile.findOne({ userId: decoded.id });

      return reply.status(200).send({
        success: true,
        hasProfile: !!profile,
      });
    } catch (error) {
      console.error("Check profile error:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to check profile",
      });
    }
  });

  // Get all profiles (for browsing)
  fastify.get("/profiles", async (request, reply) => {
    try {
      const profiles = await PlayerProfile.find({}).populate(
        "userId",
        "name email"
      );

      return reply.status(200).send({
        success: true,
        profiles,
      });
    } catch (error) {
      console.error("Get profiles error:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to get profiles",
      });
    }
  });

  // Get profile by ID
  fastify.get("/profiles/:id", async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      // Validate MongoDB ObjectId format
      if (!id || id.length !== 24) {
        return reply.status(400).send({
          success: false,
          message: "Invalid profile ID format",
        });
      }

      const profile = await PlayerProfile.findById(id).populate(
        "userId",
        "name email"
      );

      if (!profile) {
        return reply.status(404).send({
          success: false,
          message: "Profile not found",
        });
      }

      return reply.status(200).send({
        success: true,
        profile,
      });
    } catch (error) {
      console.error("Get profile by ID error:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to get profile",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  });
};

export default playerProfileRoutes;
