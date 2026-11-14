import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { authenticateToken, AuthenticatedRequest } from "../middleware/auth";
import { StreamService } from "../services/streamService";
import StreamSession from "../models/StreamSession";
import StreamChat from "../models/StreamChat";
import StreamViewer from "../models/StreamViewer";
import mongoose from "mongoose";

const streamRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Health check
  fastify.get("/streams/health", async (request, reply) => {
    return {
      success: true,
      message: "Stream routes available",
      timestamp: new Date().toISOString(),
    };
  });

  // Check external stream status
  fastify.post(
    "/streams/check-external",
    {
      preHandler: authenticateToken,
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const currentUserId = request.user?.id;
        if (!currentUserId) {
          return reply.status(401).send({
            success: false,
            message: "Authentication required",
          });
        }

        const { streamUrl, platform } = request.body as {
          streamUrl: string;
          platform: "youtube" | "facebook" | "kick" | "twitch";
        };

        if (!streamUrl || !platform) {
          return reply.status(400).send({
            success: false,
            message: "Stream URL and platform are required",
          });
        }

        const status = await StreamService.checkExternalStreamStatus(streamUrl, platform);
        
        return reply.send({
          success: true,
          data: status,
        });
      } catch (error: any) {
        console.error("Error checking external stream:", error);
        return reply.status(500).send({
          success: false,
          message: "Failed to check external stream",
          error: error.message,
        });
      }
    }
  );

  // Create a new stream (for external platforms)
  fastify.post(
    "/streams/create",
    {
      preHandler: authenticateToken,
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const currentUserId = request.user?.id;
        if (!currentUserId) {
          return reply.status(401).send({
            success: false,
            message: "Authentication required",
          });
        }

        const { title, description, externalStreamUrl, externalPlatform, externalThumbnail, isLiveStatus, tags } = request.body as any;

        // Validate required fields
        if (!title || !externalStreamUrl || !externalPlatform) {
          return reply.status(400).send({
            success: false,
            message: "Title, external URL, and platform are required",
          });
        }

        // Validate platform
        const validPlatforms = ["youtube", "facebook", "kick", "twitch"];
        if (!validPlatforms.includes(externalPlatform)) {
          return reply.status(400).send({
            success: false,
            message: "Invalid platform. Must be youtube, facebook, kick, or twitch",
          });
        }

        // Create stream session
        const streamSession = new StreamSession({
          title,
          description,
          organizerId: currentUserId,
          status: "live",
          isPublic: true,
          allowChat: true,
          allowReactions: true,
          quality: "1080p",
          platforms: [],
          externalStreamUrl,
          externalPlatform,
          externalThumbnail,
          isLiveStatus: isLiveStatus || "live",
          tags: tags || ["Gaming"],
          streamKey: `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          currentViewers: 0,
          peakViewers: 0,
          totalViewers: 0,
        });

        await streamSession.save();

        // Populate the stream session for response
        const populatedStream = await StreamSession.findById(streamSession._id)
          .populate("organizerId", "name avatar");

        return reply.send({
          success: true,
          data: populatedStream,
          message: "Stream created successfully",
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          message: error.message,
        });
      }
    }
  );

  // Get live streams
  fastify.get("/streams/live", async (request, reply) => {
    try {
      const { limit = 20, skip = 0 } = request.query as any;
      const streams = await StreamService.getLiveStreams(limit, skip);

      return reply.send({
        success: true,
        data: streams,
        count: streams.length,
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        message: "Failed to fetch live streams",
        error: error.message,
      });
    }
  });

  // Get scheduled streams
  fastify.get("/streams/scheduled", async (request, reply) => {
    try {
      const { limit = 20, skip = 0 } = request.query as any;
      const streams = await StreamService.getScheduledStreams(limit, skip);

      return reply.send({
        success: true,
        data: streams,
        count: streams.length,
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        message: "Failed to fetch scheduled streams",
        error: error.message,
      });
    }
  });

  // Get specific stream session
  fastify.get("/streams/:streamId", async (request, reply) => {
    try {
      const { streamId } = request.params as { streamId: string };

      if (!mongoose.Types.ObjectId.isValid(streamId)) {
        return reply.status(400).send({
          success: false,
          message: "Invalid stream ID",
        });
      }

      const streamSession = await StreamService.getStreamSession(streamId);
      if (!streamSession) {
        return reply.status(404).send({
          success: false,
          message: "Stream not found",
        });
      }

      return reply.send({
        success: true,
        data: streamSession,
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        message: "Failed to fetch stream",
        error: error.message,
      });
    }
  });

  // Join stream as viewer
  fastify.post(
    "/streams/:streamId/join",
    {
      preHandler: authenticateToken,
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { streamId } = request.params as { streamId: string };
        const currentUserId = request.user?.id;

        if (!currentUserId) {
          return reply.status(401).send({
            success: false,
            message: "Authentication required",
          });
        }

        if (!mongoose.Types.ObjectId.isValid(streamId)) {
          return reply.status(400).send({
            success: false,
            message: "Invalid stream ID",
          });
        }

        const viewer = await StreamService.addViewer(streamId, currentUserId);

        return reply.send({
          success: true,
          data: viewer,
          message: "Joined stream successfully",
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          message: error.message,
        });
      }
    }
  );

  // Leave stream
  fastify.post(
    "/streams/:streamId/leave",
    {
      preHandler: authenticateToken,
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { streamId } = request.params as { streamId: string };
        const currentUserId = request.user?.id;

        if (!currentUserId) {
          return reply.status(401).send({
            success: false,
            message: "Authentication required",
          });
        }

        if (!mongoose.Types.ObjectId.isValid(streamId)) {
          return reply.status(400).send({
            success: false,
            message: "Invalid stream ID",
          });
        }

        await StreamService.removeViewer(streamId, currentUserId);

        return reply.send({
          success: true,
          message: "Left stream successfully",
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          message: error.message,
        });
      }
    }
  );

  // Send chat message
  fastify.post(
    "/streams/:streamId/chat",
    {
      preHandler: authenticateToken,
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { streamId } = request.params as { streamId: string };
        const currentUserId = request.user?.id;
        const { message, replyToId } = request.body as any;

        if (!currentUserId) {
          return reply.status(401).send({
            success: false,
            message: "Authentication required",
          });
        }

        if (!message || !message.trim()) {
          return reply.status(400).send({
            success: false,
            message: "Message is required",
          });
        }

        if (!mongoose.Types.ObjectId.isValid(streamId)) {
          return reply.status(400).send({
            success: false,
            message: "Invalid stream ID",
          });
        }

        const chatMessage = await StreamService.sendChatMessage(
          streamId,
          currentUserId,
          message,
          replyToId
        );

        const populatedMessage = await StreamChat.findById(chatMessage._id)
          .populate("userId", "name avatar")
          .populate("replyToId", "message userId");

        return reply.send({
          success: true,
          data: populatedMessage,
          message: "Message sent successfully",
        });
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          message: error.message,
        });
      }
    }
  );

  // Get chat messages
  fastify.get("/streams/:streamId/chat", async (request, reply) => {
    try {
      const { streamId } = request.params as { streamId: string };
      const { limit = 50, skip = 0 } = request.query as any;

      if (!mongoose.Types.ObjectId.isValid(streamId)) {
        return reply.status(400).send({
          success: false,
          message: "Invalid stream ID",
        });
      }

      const messages = await StreamService.getChatMessages(streamId, limit, skip);

      return reply.send({
        success: true,
        data: messages,
        count: messages.length,
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        message: "Failed to fetch chat messages",
        error: error.message,
      });
    }
  });

  // Get stream analytics
  fastify.get(
    "/streams/:streamId/analytics",
    {
      preHandler: authenticateToken,
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { streamId } = request.params as { streamId: string };
        const currentUserId = request.user?.id;

        if (!currentUserId) {
          return reply.status(401).send({
            success: false,
            message: "Authentication required",
          });
        }

        if (!mongoose.Types.ObjectId.isValid(streamId)) {
          return reply.status(400).send({
            success: false,
            message: "Invalid stream ID",
          });
        }

        // Check if user is the organizer or a moderator
        const streamSession = await StreamSession.findById(streamId);
        if (!streamSession) {
          return reply.status(404).send({
            success: false,
            message: "Stream not found",
          });
        }

        const isAuthorized = 
          streamSession.organizerId.toString() === currentUserId ||
          streamSession.moderators.some(modId => modId.toString() === currentUserId);

        if (!isAuthorized) {
          return reply.status(403).send({
            success: false,
            message: "Not authorized to view analytics",
          });
        }

        const analytics = await StreamService.getStreamAnalytics(streamId);

        return reply.send({
          success: true,
          data: analytics,
        });
      } catch (error: any) {
        return reply.status(500).send({
          success: false,
          message: "Failed to fetch analytics",
          error: error.message,
        });
      }
    }
  );

};

export default streamRoutes;
