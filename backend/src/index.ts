import Fastify from "fastify";
import compress from "@fastify/compress";
import etag from "@fastify/etag";
import cors from "@fastify/cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { createServer } from "http";
import SocketManager from "./config/socket";
import { MatchDeadlineChecker } from "./services/matchDeadlineChecker";

// Load environment variables
dotenv.config();

const fastify = Fastify({
  logger: true,
});

const PORT = process.env.PORT || 8000;

// Initialize Socket.IO (will be initialized after Fastify starts)
const socketManager = new SocketManager();

// Connect to MongoDB
const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      throw new Error("MONGODB_URI environment variable is required");
    }

    await mongoose.connect(mongoURI);
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  }
};

// CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:3000",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3001",
  "https://e-sport-connection.vercel.app",
];

// Register CORS
fastify.register(cors, {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"), false);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
});

// Enable response compression (gzip/brotli) and ETag for caching
fastify.register(compress, {
  global: true,
  encodings: ["gzip", "deflate", "br"],
});
fastify.register(etag);

// Register rate limiting will be done in registerRoutes function

// Session removed for debug-free simplicity

// Health check endpoint
fastify.get("/health", async (request, reply) => {
  return {
    status: "OK",
    message: "E-Sport Connection API is running",
    timestamp: new Date().toISOString(),
    websocket: {
      connectedUsers: socketManager.getConnectedUsersCount(),
      onlineUsers: socketManager.getOnlineUsers(),
    },
  };
});

// CORS test endpoint
fastify.get("/api/test-cors", async (request, reply) => {
  return {
    success: true,
    message: "CORS is working!",
    timestamp: new Date().toISOString(),
  };
});

// Test upload endpoint
fastify.get("/api/upload-test", async (request, reply) => {
  return {
    success: true,
    message: "Upload test endpoint working",
    timestamp: new Date().toISOString(),
  };
});

// API v1 endpoint
fastify.get("/api/v1", async (request, reply) => {
  return { message: "E-Sport Connection API v1" };
});

// Import and register route handlers
async function registerRoutes() {
  try {
    // Register rate limiting first
    const { setupRateLimiting } = await import("./config/rateLimit");
    await setupRateLimiting(fastify);
    // Auth routes
    const authRoutes = await import("./routes/authRoutes");
    fastify.register(authRoutes.default, { prefix: "/api/auth" });
    // User routes
    const userRoutes = await import("./routes/userRoutes");
    fastify.register(userRoutes.default, { prefix: "/api/users" });
    // Player profile routes
    const playerProfileRoutes = await import("./routes/playerProfileRoutes");
    fastify.register(playerProfileRoutes.default, {
      prefix: "/api/player-profiles",
    });
    // Organization profile routes
    const organizationProfileRoutes = await import(
      "./routes/organizationProfileRoutes"
    );
    fastify.register(organizationProfileRoutes.default, {
      prefix: "/api/organization-profiles",
    });
    // Notification routes
    const notificationRoutes = await import("./routes/notificationRoutes");
    fastify.register(notificationRoutes.default, { prefix: "/api" });
    // Stats routes
    const statsRoutes = await import("./routes/statsRoutes");
    fastify.register(statsRoutes.default, { prefix: "/api" });
    // Test routes
    const testRoutes = await import("./routes/testRoutes");
    fastify.register(testRoutes.default, { prefix: "/api/test" });
    // Upload routes - Direct registration to avoid import issues
    try {
      const uploadRoutes = await import("./routes/uploadRoutes");
      if (uploadRoutes.default) {
        await fastify.register(uploadRoutes.default, { prefix: "/api/upload" });
      } else {
        console.error("❌ Upload routes default export is undefined");
      }
    } catch (error) {
      console.error("❌ Error registering upload routes:", error);
      // Continue without upload routes
    }

    // Message routes
    const messageRoutes = await import("./routes/messageRoutes");
    fastify.register(messageRoutes.default, { prefix: "/api" });
    // News routes
    const newsRoutes = await import("./routes/newsRoutes");
    fastify.register(newsRoutes.default, { prefix: "/api/news" });
    // Tournament routes
    const tournamentRoutes = await import("./routes/tournamentRoutes");
    fastify.register(tournamentRoutes.default, { prefix: "/api/tournaments" });
    // Tournament match routes
    const tournamentMatchRoutes = await import(
      "./routes/tournamentMatchRoutes"
    );
    fastify.register(tournamentMatchRoutes.default, {
      prefix: "/api/tournament-matches",
    });
    // Bounty coin routes
    const bountyCoinRoutes = await import("./routes/bountyCoinRoutes");
    fastify.register(bountyCoinRoutes.default, {
      prefix: "/api/bounty-coins",
    });
    // Squad routes
    const squadRoutes = await import("./routes/squadRoutes");
    fastify.register(squadRoutes.default, { prefix: "/api/squads" });
    // Division routes
    const divisionRoutes = await import("./routes/divisionRoutes");
    fastify.register(divisionRoutes.default, { prefix: "/api/divisions" });
    // Tournament registration routes
    const tournamentRegistrationRoutes = await import(
      "./routes/tournamentRegistrationRoutes"
    );
    fastify.register(tournamentRegistrationRoutes.default, {
      prefix: "/api/tournament-registrations",
    });
    // Dashboard routes
    const dashboardRoutes = await import("./routes/dashboardRoutes");
    fastify.register(dashboardRoutes.default, { prefix: "/api/dashboard" });
    // Pro player routes
    const proPlayerRoutes = await import("./routes/proPlayerRoutes");
    fastify.register(proPlayerRoutes.default, { prefix: "/api/pro-players" });
    // Settings routes
    const settingsRoutes = await import("./routes/settingsRoutes");
    fastify.register(settingsRoutes.default, { prefix: "/api/settings" });
    // Match routes
    const matchRoutes = await import("./routes/matchRoutes");
    fastify.register(matchRoutes.default, { prefix: "/api/matches" });
    // Match action routes
    const matchActionRoutes = await import("./routes/matchActionRoutes");
    fastify.register(matchActionRoutes.default, { prefix: "/api/match-actions" });
    // Admin match routes
    const adminMatchRoutes = await import("./routes/adminMatchRoutes");
    fastify.register(adminMatchRoutes.default, {
      prefix: "/api/admin/matches",
    });
    // Stream routes
    const streamRoutes = await import("./routes/streamRoutes");
    fastify.register(streamRoutes.default, { prefix: "/api" });
    // Achievement routes
    const achievementRoutes = await import("./routes/achievementRoutes");
    fastify.register(achievementRoutes.default, {
      prefix: "/api",
    });
    
    // Admin Achievement routes
    const adminAchievementRoutes = await import("./routes/adminAchievementRoutes");
    fastify.register(adminAchievementRoutes.default, {
      prefix: "/api",
    });
    // Admin routes
    const adminRoutes = await import("./routes/adminRoutes");
    fastify.register(adminRoutes.default, { prefix: "/api/admin" });
  } catch (error) {
    console.error("❌ Error registering routes:", error);
    // Continue without routes for basic health check
  }
}

// Error handling
fastify.setErrorHandler((error, request, reply) => {
  console.error("Error:", error);
  reply.status(500).send({
    error: "Internal Server Error",
    message:
      process.env.NODE_ENV === "production"
        ? "Something went wrong"
        : error.message,
  });
});

// 404 handler
fastify.setNotFoundHandler((request, reply) => {
  reply.status(404).send({
    error: "Not Found",
    message: `Route ${request.method} ${request.url} not found`,
  });
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  await fastify.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  await fastify.close();
  process.exit(0);
});

// Start server
const startServer = async () => {
  try {
    // Connect to database first
    await connectDB();
    // Register routes
    await registerRoutes();

    // Listen on the specified port
    await fastify.listen({
      port: Number(PORT),
      host: "0.0.0.0", // Important for Render deployment
    });

    // Initialize Socket.IO after Fastify starts
    socketManager.initialize(fastify.server);

    // Start Match Deadline Checker
    MatchDeadlineChecker.start();
    console.log("✅ Match deadline checker started");
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    console.error("Stack trace:", error.stack);
    process.exit(1);
    await mongoose.disconnect();
  }
};

startServer();
