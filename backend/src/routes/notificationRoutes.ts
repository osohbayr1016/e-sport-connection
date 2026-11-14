import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { authenticateToken, AuthenticatedRequest } from "../middleware/auth";
import Notification from "../models/Notification";
import mongoose from "mongoose";

const notificationRoutes: FastifyPluginAsync = async (
  fastify: FastifyInstance
) => {
  // Health check
  fastify.get("/notifications/health", async (request, reply) => {
    return {
      success: true,
      message: "Notification routes available",
      timestamp: new Date().toISOString(),
    };
  });

  // Get all notifications for the current user
  fastify.get(
    "/notifications",
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

        // Fetch notifications from database
        const notifications = await Notification.find({
          userId: currentUserId,
          status: { $ne: "DELETED" },
        })
          .populate("senderId", "name avatar")
          .sort({ createdAt: -1 })
          .limit(50)
          .lean();

        // Count unread notifications
        const unreadCount = await Notification.countDocuments({
          userId: currentUserId,
          status: "PENDING",
        });

        // Format notifications for frontend
        const formattedNotifications = notifications.map((notif: any) => ({
          _id: notif._id.toString(),
          title: notif.title,
          content: notif.content,
          type: notif.type,
          status: notif.status,
          senderId: notif.senderId
            ? {
                _id: notif.senderId._id.toString(),
                name: notif.senderId.name || "Unknown",
                avatar: notif.senderId.avatar,
              }
            : undefined,
          relatedMessageId: notif.relatedMessageId?.toString(),
          relatedClanId: notif.relatedClanId?.toString(),
          createdAt: notif.createdAt,
        }));

        return reply.send({
          success: true,
          notifications: formattedNotifications,
          count: formattedNotifications.length,
          unreadCount,
        });
      } catch (error) {
        console.error("Error fetching notifications:", error);
        return reply.status(500).send({
          success: false,
          message: "Failed to fetch notifications",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );

  // Get unread notifications count
  fastify.get(
    "/notifications/unread/count",
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

        // Count unread notifications
        const count = await Notification.countDocuments({
          userId: currentUserId,
          status: "PENDING",
        });

        return reply.send({
          success: true,
          count,
        });
      } catch (error) {
        console.error("Error fetching unread notification count:", error);
        return reply.status(500).send({
          success: false,
          message: "Failed to fetch unread notification count",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );

  // Mark notification as read
  fastify.patch(
    "/notifications/:notificationId/read",
    {
      preHandler: authenticateToken,
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { notificationId } = request.params as { notificationId: string };
        const currentUserId = request.user?.id;

        if (!currentUserId) {
          return reply.status(401).send({
            success: false,
            message: "Authentication required",
          });
        }

        if (!notificationId) {
          return reply.status(400).send({
            success: false,
            message: "Notification ID is required",
          });
        }

        // Validate notificationId
        if (!mongoose.Types.ObjectId.isValid(notificationId)) {
          return reply.status(400).send({
            success: false,
            message: "Invalid notification ID",
          });
        }

        // Update notification status
        const notification = await Notification.findOneAndUpdate(
          {
            _id: notificationId,
            userId: currentUserId,
          },
          {
            status: "SEEN",
          },
          { new: true }
        );

        if (!notification) {
          return reply.status(404).send({
            success: false,
            message: "Notification not found",
          });
        }

        return reply.send({
          success: true,
          message: "Notification marked as read",
        });
      } catch (error) {
        console.error("Error marking notification as read:", error);
        return reply.status(500).send({
          success: false,
          message: "Failed to mark notification as read",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );

  // Mark all notifications as read
  fastify.patch(
    "/notifications/read-all",
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

        // Update all pending notifications to seen
        const result = await Notification.updateMany(
          {
            userId: currentUserId,
            status: "PENDING",
          },
          {
            status: "SEEN",
          }
        );

        return reply.send({
          success: true,
          message: "All notifications marked as read",
          count: result.modifiedCount,
        });
      } catch (error) {
        console.error("Error marking all notifications as read:", error);
        return reply.status(500).send({
          success: false,
          message: "Failed to mark all notifications as read",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );

  // Delete a notification
  fastify.delete(
    "/notifications/:notificationId",
    {
      preHandler: authenticateToken,
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { notificationId } = request.params as { notificationId: string };
        const currentUserId = request.user?.id;

        if (!currentUserId) {
          return reply.status(401).send({
            success: false,
            message: "Authentication required",
          });
        }

        if (!notificationId) {
          return reply.status(400).send({
            success: false,
            message: "Notification ID is required",
          });
        }

        // Validate notificationId
        if (!mongoose.Types.ObjectId.isValid(notificationId)) {
          return reply.status(400).send({
            success: false,
            message: "Invalid notification ID",
          });
        }

        // Soft delete - just mark as deleted
        const notification = await Notification.findOneAndUpdate(
          {
            _id: notificationId,
            userId: currentUserId,
          },
          {
            status: "DELETED",
          },
          { new: true }
        );

        if (!notification) {
          return reply.status(404).send({
            success: false,
            message: "Notification not found",
          });
        }

        return reply.send({
          success: true,
          message: "Notification deleted successfully",
        });
      } catch (error) {
        console.error("Error deleting notification:", error);
        return reply.status(500).send({
          success: false,
          message: "Failed to delete notification",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );
};

export default notificationRoutes;
