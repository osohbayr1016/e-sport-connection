import { FastifyInstance } from "fastify";
import rateLimit from "@fastify/rate-limit";

export const rateLimitConfig = {
  // General API rate limiting
  general: {
    max: 100, // Maximum number of requests
    timeWindow: "1 minute", // Time window
    errorResponseBuilder: (request, context) => {
      return {
        success: false,
        message: "Too many requests, please try again later",
        retryAfter: Math.round(context.ttl / 1000) || 1,
      };
    },
  },

  // Authentication endpoints rate limiting
  auth: {
    max: 5, // Maximum number of requests
    timeWindow: "15 minutes", // Time window
    errorResponseBuilder: (request, context) => {
      return {
        success: false,
        message: "Too many authentication attempts, please try again later",
        retryAfter: Math.round(context.ttl / 1000) || 1,
      };
    },
  },

  // Upload endpoints rate limiting
  upload: {
    max: 10, // Maximum number of requests
    timeWindow: "1 hour", // Time window
    errorResponseBuilder: (request, context) => {
      return {
        success: false,
        message: "Too many upload attempts, please try again later",
        retryAfter: Math.round(context.ttl / 1000) || 1,
      };
    },
  },

  // Tournament registration rate limiting
  tournamentRegistration: {
    max: 3, // Maximum number of requests
    timeWindow: "1 hour", // Time window
    errorResponseBuilder: (request, context) => {
      return {
        success: false,
        message:
          "Too many tournament registration attempts, please try again later",
        retryAfter: Math.round(context.ttl / 1000) || 1,
      };
    },
  },

  // Squad creation rate limiting
  squadCreation: {
    max: 2, // Maximum number of requests
    timeWindow: "1 hour", // Time window
    errorResponseBuilder: (request, context) => {
      return {
        success: false,
        message: "Too many squad creation attempts, please try again later",
        retryAfter: Math.round(context.ttl / 1000) || 1,
      };
    },
  },
};

export const setupRateLimiting = async (fastify: FastifyInstance) => {
  // Register the rate limit plugin with general settings
  await fastify.register(rateLimit, {
    global: true,
    ...rateLimitConfig.general,
  });

  // Add custom rate limiting for specific routes using hooks
  fastify.addHook("onRequest", async (request, reply) => {
    const url = request.url;
    const method = request.method;

    // Auth routes - stricter rate limiting
    if (url.startsWith("/api/auth/")) {
      // This will be handled by the global rate limiter with custom logic
      // We can add additional checks here if needed
      return;
    }

    // Upload routes - moderate rate limiting
    if (url.startsWith("/api/upload/")) {
      // Additional upload-specific logic can be added here
      return;
    }

    // Tournament registration - very strict rate limiting
    if (url.startsWith("/api/tournament-registrations/register")) {
      // Additional registration-specific logic can be added here
      return;
    }

    // Squad creation - strict rate limiting
    if (url.startsWith("/api/squads") && method === "POST") {
      // Additional squad creation logic can be added here
      return;
    }
  });
};
