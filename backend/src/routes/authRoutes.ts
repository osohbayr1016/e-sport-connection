import { FastifyInstance, FastifyPluginAsync } from "fastify";
import {
  login,
  register,
  getCurrentUser,
  logout,
  refreshToken,
} from "../controllers/authController";
import { authenticateToken } from "../middleware/auth";
import { rateLimitConfig } from "../config/rateLimit";

const authRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Health check for auth
  fastify.get("/health", async (request, reply) => {
    return {
      success: true,
      message: "Auth routes available",
      timestamp: new Date().toISOString(),
    };
  });

  // Login endpoint
  fastify.post("/login", { config: { rateLimit: rateLimitConfig.auth } }, login);

  // Register endpoint
  fastify.post("/register", { config: { rateLimit: rateLimitConfig.auth } }, register);

  // Get current user (protected)
  fastify.get("/me", { preHandler: authenticateToken }, getCurrentUser);

  // Logout endpoint (protected)
  fastify.post("/logout", { preHandler: authenticateToken }, logout);

  // Refresh token endpoint (protected)
  fastify.post("/refresh", { preHandler: authenticateToken }, refreshToken);
};

export default authRoutes;
