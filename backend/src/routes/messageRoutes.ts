import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { authenticateToken, AuthenticatedRequest } from "../middleware/auth";
import Message from "../models/Message";
import User from "../models/User";
import mongoose from "mongoose";

const messageRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Health check
  fastify.get("/messages/health", async (request, reply) => {
    return {
      success: true,
      message: "Message routes available",
      timestamp: new Date().toISOString(),
    };
  });

  // Get messages between two users
  fastify.get(
    "/messages/:userId",
    {
      preHandler: authenticateToken,
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { userId } = request.params as { userId: string };
        const currentUserId = request.user?.id;

        if (!currentUserId) {
          return reply.status(401).send({
            success: false,
            message: "Authentication required",
          });
        }

        // Validate userId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
          return reply.status(400).send({
            success: false,
            message: "Invalid user ID",
          });
        }

        // Fetch messages between current user and target user
        const messages = await Message.find({
          $or: [
            { senderId: currentUserId, receiverId: userId },
            { senderId: userId, receiverId: currentUserId },
          ],
        })
          .sort({ createdAt: 1 }) // Sort oldest to newest
          .populate("senderId", "name avatar")
          .populate("receiverId", "name avatar")
          .populate({
            path: "replyToId",
            select: "content senderId",
            populate: {
              path: "senderId",
              select: "name",
            },
          })
          .lean();

        // Format messages for frontend
        const formattedMessages = messages.map((msg: any) => ({
          id: msg._id.toString(),
          content: msg.content,
          senderId: msg.senderId._id.toString(),
          receiverId: msg.receiverId._id.toString(),
          status: msg.status,
          isRead: msg.isRead,
          createdAt: msg.createdAt,
          replyToId: msg.replyToId?._id?.toString(),
          replyTo: msg.replyToId
            ? {
                id: msg.replyToId._id.toString(),
                content: msg.replyToId.content,
                sender: {
                  name: msg.replyToId.senderId?.name || "Unknown",
                },
              }
            : undefined,
          sender: {
            id: msg.senderId._id.toString(),
            name: msg.senderId.name || "Unknown",
            avatar: msg.senderId.avatar,
          },
          receiver: {
            id: msg.receiverId._id.toString(),
            name: msg.receiverId.name || "Unknown",
            avatar: msg.receiverId.avatar,
          },
        }));

        // Mark messages as delivered
        await Message.updateMany(
          {
            senderId: userId,
            receiverId: currentUserId,
            status: "SENT",
          },
          { status: "DELIVERED" }
        );

        return reply.send({
          success: true,
          messages: formattedMessages,
          count: formattedMessages.length,
        });
      } catch (error) {
        console.error("Error fetching messages:", error);
        return reply.status(500).send({
          success: false,
          message: "Failed to fetch messages",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );

  // Send a message
  fastify.post(
    "/messages",
    {
      preHandler: authenticateToken,
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { receiverId, content, replyToId } = request.body as {
          receiverId: string;
          content: string;
          replyToId?: string;
        };
        const currentUserId = request.user?.id;

        if (!currentUserId) {
          return reply.status(401).send({
            success: false,
            message: "Authentication required",
          });
        }

        if (!receiverId || !content) {
          return reply.status(400).send({
            success: false,
            message: "Receiver ID and content are required",
          });
        }

        if (content.trim().length === 0) {
          return reply.status(400).send({
            success: false,
            message: "Message content cannot be empty",
          });
        }

        // Validate receiverId
        if (!mongoose.Types.ObjectId.isValid(receiverId)) {
          return reply.status(400).send({
            success: false,
            message: "Invalid receiver ID",
          });
        }

        // Validate replyToId if provided
        if (replyToId && !mongoose.Types.ObjectId.isValid(replyToId)) {
          return reply.status(400).send({
            success: false,
            message: "Invalid reply message ID",
          });
        }

        // Check if receiver exists
        const receiver = await User.findById(receiverId).select("name avatar");
        if (!receiver) {
          return reply.status(404).send({
            success: false,
            message: "Receiver not found",
          });
        }

        // Create and save message to database
        const newMessage = new Message({
          senderId: currentUserId,
          receiverId,
          content: content.trim(),
          status: "SENT",
          isRead: false,
          ...(replyToId && { replyToId }),
        });

        await newMessage.save();

        // Populate sender and receiver info
        await newMessage.populate("senderId", "name avatar");
        await newMessage.populate("receiverId", "name avatar");
        await newMessage.populate({
          path: "replyToId",
          select: "content senderId",
          populate: {
            path: "senderId",
            select: "name",
          },
        });

        // Format response
        const formattedMessage = {
          id: newMessage._id.toString(),
          content: newMessage.content,
          senderId: currentUserId,
          receiverId,
          status: newMessage.status,
          isRead: newMessage.isRead,
          createdAt: newMessage.createdAt,
          replyToId: (newMessage as any).replyToId?._id?.toString(),
          replyTo: (newMessage as any).replyToId
            ? {
                id: (newMessage as any).replyToId._id.toString(),
                content: (newMessage as any).replyToId.content,
                sender: {
                  name:
                    (newMessage as any).replyToId.senderId?.name || "Unknown",
                },
              }
            : undefined,
          sender: {
            id: currentUserId,
            name: request.user?.name || "Unknown",
            avatar: request.user?.avatar,
          },
          receiver: {
            id: receiverId,
            name: receiver.name || "Unknown",
            avatar: receiver.avatar,
          },
        };

        return reply.status(201).send({
          success: true,
          message: "Message sent successfully",
          data: formattedMessage,
        });
      } catch (error) {
        console.error("Error sending message:", error);
        return reply.status(500).send({
          success: false,
          message: "Failed to send message",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );

  // Mark messages as read
  fastify.post(
    "/messages/read",
    {
      preHandler: authenticateToken,
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { senderId } = request.body as { senderId: string };
        const currentUserId = request.user?.id;

        if (!currentUserId) {
          return reply.status(401).send({
            success: false,
            message: "Authentication required",
          });
        }

        if (!senderId) {
          return reply.status(400).send({
            success: false,
            message: "Sender ID is required",
          });
        }

        // Validate senderId
        if (!mongoose.Types.ObjectId.isValid(senderId)) {
          return reply.status(400).send({
            success: false,
            message: "Invalid sender ID",
          });
        }

        // Mark all unread messages from sender as read
        const result = await Message.updateMany(
          {
            senderId,
            receiverId: currentUserId,
            isRead: false,
          },
          {
            isRead: true,
            status: "READ",
            readAt: new Date(),
          }
        );

        return reply.send({
          success: true,
          message: "Messages marked as read",
          count: result.modifiedCount,
        });
      } catch (error) {
        console.error("Error marking messages as read:", error);
        return reply.status(500).send({
          success: false,
          message: "Failed to mark messages as read",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );

  // Get unread message count
  fastify.get(
    "/messages/unread/count",
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

        // Count unread messages for current user
        const count = await Message.countDocuments({
          receiverId: currentUserId,
          isRead: false,
        });

        return reply.send({
          success: true,
          count,
        });
      } catch (error) {
        console.error("Error fetching unread count:", error);
        return reply.status(500).send({
          success: false,
          message: "Failed to fetch unread count",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );

  // Get all conversations (list of users the current user has chatted with)
  fastify.get(
    "/messages/conversations",
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

        // Get all unique user IDs that the current user has chatted with
        const sentMessages = await Message.find({ senderId: currentUserId })
          .distinct("receiverId")
          .lean();

        const receivedMessages = await Message.find({
          receiverId: currentUserId,
        })
          .distinct("senderId")
          .lean();

        // Combine and get unique user IDs
        const uniqueUserIds = [
          ...new Set([...sentMessages, ...receivedMessages]),
        ];

        // Fetch user details and last message for each conversation
        const conversations = await Promise.all(
          uniqueUserIds.map(async (userId) => {
            const user = await User.findById(userId).select("name avatar");

            // Get last message in conversation
            const lastMessage = await Message.findOne({
              $or: [
                { senderId: currentUserId, receiverId: userId },
                { senderId: userId, receiverId: currentUserId },
              ],
            })
              .sort({ createdAt: -1 })
              .lean();

            // Count unread messages from this user
            const unreadCount = await Message.countDocuments({
              senderId: userId,
              receiverId: currentUserId,
              isRead: false,
            });

            return {
              userId: userId.toString(),
              userName: user?.name || "Unknown",
              userAvatar: user?.avatar,
              lastMessage: lastMessage
                ? {
                    content: lastMessage.content,
                    createdAt: lastMessage.createdAt,
                    isOwnMessage:
                      lastMessage.senderId.toString() === currentUserId,
                  }
                : null,
              unreadCount,
            };
          })
        );

        // Sort by last message time (most recent first)
        conversations.sort((a, b) => {
          const aTime = a.lastMessage?.createdAt || new Date(0);
          const bTime = b.lastMessage?.createdAt || new Date(0);
          return new Date(bTime).getTime() - new Date(aTime).getTime();
        });

        return reply.send({
          success: true,
          conversations,
          count: conversations.length,
        });
      } catch (error) {
        console.error("Error fetching conversations:", error);
        return reply.status(500).send({
          success: false,
          message: "Failed to fetch conversations",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );
};

export default messageRoutes;
