import { FastifyInstance, FastifyPluginAsync } from "fastify";
import User from "../models/User";
import bcrypt from "bcryptjs";
import { authenticateToken } from "../middleware/auth";

const userRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Get all users (admin only)
  fastify.get(
    "/",
    { preHandler: [authenticateToken] },
    async (request: any, reply) => {
      try {
        const user = request.user;

        if (user?.role !== "ADMIN") {
          return reply.status(403).send({
            success: false,
            message: "Admin only",
          });
        }

        const users = await User.find({})
          .select("-password")
          .sort({ createdAt: -1 })
          .lean();

        return reply.send({
          success: true,
          users: users.map((u) => ({
            _id: u._id,
            name: u.name,
            email: u.email,
            role: u.role,
            avatar: u.avatar,
            isVerified: u.isVerified || false,
            createdAt: u.createdAt,
            updatedAt: u.updatedAt,
          })),
        });
      } catch (error) {
        console.error("Error fetching users:", error);
        return reply.status(500).send({
          success: false,
          message: "Internal server error",
        });
      }
    }
  );

  // Create new user (admin only)
  fastify.post(
    "/",
    { preHandler: [authenticateToken] },
    async (request: any, reply) => {
      try {
        const user = request.user;

        if (user?.role !== "ADMIN") {
          return reply.status(403).send({
            success: false,
            message: "Admin only",
          });
        }

        const { name, email, password, role, isVerified } = request.body as any;

        if (!name || !email || !password || !role) {
          return reply.status(400).send({
            success: false,
            message: "Name, email, password, and role are required",
          });
        }

        const validRoles = ["PLAYER", "COACH", "ORGANIZATION", "ADMIN"];
        if (!validRoles.includes(role)) {
          return reply.status(400).send({
            success: false,
            message:
              "Invalid role. Must be one of: PLAYER, COACH, ORGANIZATION, ADMIN",
          });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
          return reply.status(400).send({
            success: false,
            message: "User with this email already exists",
          });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = new User({
          name,
          email: email.toLowerCase(),
          password: hashedPassword,
          role,
          isVerified: isVerified || false,
        });

        await newUser.save();

        return reply.status(201).send({
          success: true,
          message: "User created successfully",
          user: {
            _id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            isVerified: newUser.isVerified,
          },
        });
      } catch (error) {
        console.error("Error creating user:", error);
        return reply.status(500).send({
          success: false,
          message: "Internal server error",
        });
      }
    }
  );

  // Update user (admin only)
  fastify.patch(
    "/:id",
    { preHandler: [authenticateToken] },
    async (request: any, reply) => {
      try {
        const user = request.user;

        if (user?.role !== "ADMIN") {
          return reply.status(403).send({
            success: false,
            message: "Admin only",
          });
        }

        const { id } = request.params as any;
        const { name, email, password, role, isVerified } = request.body as any;

        const existingUser = await User.findById(id);
        if (!existingUser) {
          return reply.status(404).send({
            success: false,
            message: "User not found",
          });
        }

        // Update fields
        if (name) existingUser.name = name;
        if (email) existingUser.email = email.toLowerCase();
        if (role) {
          const validRoles = ["PLAYER", "COACH", "ORGANIZATION", "ADMIN"];
          if (!validRoles.includes(role)) {
            return reply.status(400).send({
              success: false,
              message: "Invalid role",
            });
          }
          existingUser.role = role;
        }
        if (typeof isVerified === "boolean")
          existingUser.isVerified = isVerified;
        if (password) {
          existingUser.password = await bcrypt.hash(password, 10);
        }

        await existingUser.save();

        return reply.send({
          success: true,
          message: "User updated successfully",
          user: {
            _id: existingUser._id,
            name: existingUser.name,
            email: existingUser.email,
            role: existingUser.role,
            isVerified: existingUser.isVerified,
          },
        });
      } catch (error) {
        console.error("Error updating user:", error);
        return reply.status(500).send({
          success: false,
          message: "Internal server error",
        });
      }
    }
  );

  // Delete user (admin only)
  fastify.delete(
    "/:id",
    { preHandler: [authenticateToken] },
    async (request: any, reply) => {
      try {
        const user = request.user;

        if (user?.role !== "ADMIN") {
          return reply.status(403).send({
            success: false,
            message: "Admin only",
          });
        }

        const { id } = request.params as any;

        const deletedUser = await User.findByIdAndDelete(id);
        if (!deletedUser) {
          return reply.status(404).send({
            success: false,
            message: "User not found",
          });
        }

        return reply.send({
          success: true,
          message: "User deleted successfully",
        });
      } catch (error) {
        console.error("Error deleting user:", error);
        return reply.status(500).send({
          success: false,
          message: "Internal server error",
        });
      }
    }
  );

  // The former unauthenticated /update-role endpoint has been removed.
  // Admin role changes must use the authenticated admin-only PATCH /:id route.

  // Get all players (public endpoint)
  fastify.get("/players", async (request, reply) => {
    try {
      const players = await User.find({ role: "PLAYER" }).limit(50);

      const transformedPlayers = players.map((player) => ({
        id: player._id.toString(),
        name: player.name || "Unknown Player",
        avatar: player.avatar || "/default-avatar.png",
        game: "Mobile Legends: Bang Bang", // Default game
        role: "Player",
        rank: "Unranked",
        experience: "New Player",
        description: "Player looking for opportunities",
        isOnline: false,
        isLookingForTeam: true,
      }));

      return {
        success: true,
        players: transformedPlayers,
        count: transformedPlayers.length,
      };
    } catch (error) {
      console.error("Error fetching players:", error);
      reply.status(500).send({
        success: false,
        message: "Error fetching players",
        error:
          process.env.NODE_ENV === "production" ? undefined : error.message,
      });
    }
  });

  // Get all organizations (public endpoint)
  fastify.get("/organizations", async (request, reply) => {
    try {
      const organizations = await User.find({ role: "ORGANIZATION" }).limit(50);

      const transformedOrganizations = organizations.map((org) => ({
        id: org._id.toString(),
        name: org.name || "Unknown Organization",
        avatar: org.avatar || "/default-avatar.png",
        games: ["Mobile Legends: Bang Bang"], // Default game
        description: `${
          org.name || "Unknown Organization"
        } is a professional esports organization.`,
        founded: 2024,
        achievements: 0,
        isVerified: false,
      }));

      return {
        success: true,
        organizations: transformedOrganizations,
        count: transformedOrganizations.length,
      };
    } catch (error) {
      console.error("Error fetching organizations:", error);
      reply.status(500).send({
        success: false,
        message: "Error fetching organizations",
        error:
          process.env.NODE_ENV === "production" ? undefined : error.message,
      });
    }
  });

  // Get user profile by ID (public endpoint)
  fastify.get("/profile/:userId", async (request, reply) => {
    try {
      const { userId } = request.params as { userId: string };

      const user = await User.findById(userId);
      if (!user) {
        return reply.status(404).send({
          success: false,
          message: "User not found",
        });
      }

      // Transform data based on role
      const profile = {
        id: user._id.toString(),
        name: user.name || "Unknown User",
        avatar: user.avatar || "/default-avatar.png",
        role: user.role,
        isVerified: false, // Default to false for now
        joinedDate: user.createdAt,
        isOnline: user.isOnline || false,
        lastSeen: user.lastSeen,
        ...(user.role === "PLAYER" && {
          game: "Mobile Legends: Bang Bang", // Default game
          playerRole: "Player",
          rank: "Unranked",
          experience: "New Player",
          description: `${
            user.name || "Player"
          } is looking for competitive opportunities.`,
        }),
        ...(user.role === "ORGANIZATION" && {
          games: ["Mobile Legends: Bang Bang"], // Default game
          founded: 2024,
          achievements: 0,
          description: `${
            user.name || "Organization"
          } is a professional esports organization.`,
        }),
      };

      return {
        success: true,
        user: profile, // Changed from 'profile' to 'user' to match frontend expectation
        profile, // Keep both for backward compatibility
      };
    } catch (error) {
      console.error("Error fetching user profile:", error);
      reply.status(500).send({
        success: false,
        message: "Error fetching user profile",
        error:
          process.env.NODE_ENV === "production" ? undefined : error.message,
      });
    }
  });
};

export default userRoutes;
