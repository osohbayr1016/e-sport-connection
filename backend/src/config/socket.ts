import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";
import jwt from "jsonwebtoken";
import { JWTPayload } from "../middleware/auth";
import Message from "../models/Message";
import User from "../models/User";
import Notification from "../models/Notification";
import StreamSession from "../models/StreamSession";
import StreamChat from "../models/StreamChat";
import StreamViewer from "../models/StreamViewer";
import { StreamService } from "../services/streamService";

/**
 * Keep every live device for a user. The last disconnect alone makes the
 * user offline, so one tab closing cannot hide all their other sessions.
 */
export class UserConnectionRegistry {
  private readonly users = new Map<string, Set<string>>();

  connect(userId: string, socketId: string): boolean {
    const existing = this.users.get(userId) || new Set<string>();
    const wasOffline = existing.size === 0;
    existing.add(socketId);
    this.users.set(userId, existing);
    return wasOffline;
  }

  disconnect(userId: string, socketId: string): boolean {
    const sockets = this.users.get(userId);
    if (!sockets || !sockets.delete(socketId)) return false;
    if (sockets.size > 0) return false;
    this.users.delete(userId);
    return true;
  }

  socketsFor(userId: string): string[] {
    return [...(this.users.get(userId) || [])];
  }

  isOnline(userId: string): boolean {
    return (this.users.get(userId)?.size || 0) > 0;
  }

  get connectedUserCount(): number { return this.users.size; }
  get onlineUsers(): string[] { return [...this.users.keys()]; }
}

export class SocketManager {
  private io: SocketIOServer | null = null;
  private connectedUsers = new UserConnectionRegistry();

  public initialize(server: HTTPServer): void {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: ["websocket", "polling"],
    });

    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          // Allow connection without authentication for connection status
          socket.data.userId = null;
          socket.data.userEmail = null;
          return next();
        }

        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET!
        ) as JWTPayload;
        const user = await User.findById(decoded.id).select("_id").lean();
        if (!user) return next(new Error("Invalid authentication session"));
        socket.data.userId = user._id.toString();
        socket.data.userEmail = decoded.email;
        next();
      } catch (error) {
        next(new Error("Invalid or expired authentication token"));
      }
    });

    this.io.on("connection", async (socket) => {
      // Only handle authenticated users
      if (socket.data.userId) {
        const firstConnection = this.connectedUsers.connect(socket.data.userId, socket.id);
        if (firstConnection) {
          await User.findByIdAndUpdate(socket.data.userId, {
            isOnline: true,
            lastSeen: new Date(),
          });
          this.broadcastUserStatus(socket.data.userId, "online");
        }
      }

      // Send pending notifications when user comes online (only for authenticated users)
      if (socket.data.userId) {
        try {
          const pendingNotifications = await Notification.find({
            userId: socket.data.userId,
            status: "PENDING",
          })
            .populate("senderId", "name avatar")
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

          if (pendingNotifications.length > 0) {
            const formattedNotifications = pendingNotifications.map(
              (notif: any) => ({
                _id: notif._id.toString(),
                title: notif.title,
                content: notif.content,
                type: notif.type,
                senderId: notif.senderId
                  ? {
                      _id: notif.senderId._id.toString(),
                      name: notif.senderId.name || "Unknown",
                      avatar: notif.senderId.avatar,
                    }
                  : undefined,
                createdAt: notif.createdAt,
              })
            );

            socket.emit("pending_notifications", {
              notifications: formattedNotifications,
              count: formattedNotifications.length,
            });
          }
        } catch (error) {
          console.error("Error fetching pending notifications:", error);
        }
      }

      // Handle message sending
      socket.on("send_message", async (data) => {
        try {
          const { receiverId, content, replyToId } = data;
          const senderId = socket.data.userId;
          if (!senderId) { socket.emit("message_error", { error: "Authentication required" }); return; }
          if (!receiverId || typeof content !== "string" || !content.trim() || content.length > 4000) {
            socket.emit("message_error", {
              error: "Invalid message data",
            });
            return;
          }

          // Get sender info
          const sender = await User.findById(senderId).select("name avatar");
          if (!sender) {
            socket.emit("message_error", {
              error: "Sender not found",
            });
            return;
          }

          // Get receiver info
          const receiver = await User.findById(receiverId).select(
            "name avatar"
          );
          if (!receiver) {
            socket.emit("message_error", {
              error: "Receiver not found",
            });
            return;
          }

          // Save message to database
          const newMessage = new Message({
            senderId,
            receiverId,
            content: content.trim(),
            status: "SENT",
            isRead: false,
            ...(replyToId && { replyToId }),
          });

          await newMessage.save();

          // Populate replyTo if exists
          if (replyToId) {
            await newMessage.populate({
              path: "replyToId",
              select: "content senderId",
              populate: {
                path: "senderId",
                select: "name",
              },
            });
          }

          // Create notification for the receiver
          const notification = new Notification({
            userId: receiverId,
            senderId: senderId,
            title: `New message from ${sender.name}`,
            content: content.trim().substring(0, 100),
            type: "MESSAGE",
            status: "PENDING",
            relatedMessageId: newMessage._id,
          });

          await notification.save();

          // Prepare message data for real-time delivery
          const messageData = {
            id: newMessage._id.toString(),
            senderId,
            receiverId,
            content: newMessage.content,
            status: newMessage.status,
            isRead: newMessage.isRead,
            timestamp: newMessage.createdAt.toISOString(),
            senderName: sender.name,
            senderAvatar: sender.avatar,
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
              id: senderId,
              name: sender.name,
              avatar: sender.avatar,
            },
            receiver: {
              id: receiverId,
              name: receiver.name,
              avatar: receiver.avatar,
            },
          };

          // Check if receiver is online
          if (this.connectedUsers.isOnline(receiverId)) {
            // Deliver to every connected device, not just the latest tab.
            this.sendToUser(receiverId, "new_message", messageData);
            this.sendToUser(receiverId, "new_notification", {
              _id: notification._id.toString(),
              title: notification.title,
              content: notification.content,
              type: notification.type,
              senderId: {
                _id: senderId,
                name: sender.name,
                avatar: sender.avatar,
              },
              relatedMessageId: newMessage._id.toString(),
              createdAt: notification.createdAt,
            });

            // Update message status to DELIVERED
            await Message.findByIdAndUpdate(newMessage._id, {
              status: "DELIVERED",
            });

            // Send delivery confirmation to sender
            socket.emit("message_delivered", {
              messageId: newMessage._id.toString(),
              receiverId,
              timestamp: new Date().toISOString(),
            });
          } else {
            // User is offline - message saved but not delivered
            socket.emit("message_sent_offline", {
              messageId: newMessage._id.toString(),
              receiverId,
              timestamp: new Date().toISOString(),
            });
          }

          // Also emit to sender for confirmation
          socket.emit("message_sent", messageData);
        } catch (error) {
          console.error("Error sending message:", error);
          socket.emit("message_error", {
            error: "Failed to send message",
          });
        }
      });

      // Handle typing indicators
      socket.on("typing_start", (data) => {
        if (!socket.data.userId) return;
        const { receiverId } = data || {};
        if (receiverId && this.connectedUsers.isOnline(receiverId)) {
          this.sendToUser(receiverId, "user_typing", {
            userId: socket.data.userId,
          });
        }
      });

      socket.on("typing_stop", (data) => {
        if (!socket.data.userId) return;
        const { receiverId } = data || {};
        if (receiverId && this.connectedUsers.isOnline(receiverId)) {
          this.sendToUser(receiverId, "user_stopped_typing", {
            userId: socket.data.userId,
          });
        }
      });

      // Handle read receipts
      socket.on("mark_read", async (data) => {
        try {
          const { senderId } = data;
          const receiverId = socket.data.userId;
          if (!receiverId) return;

          // Update messages as read in database
          await Message.updateMany(
            {
              senderId,
              receiverId,
              isRead: false,
            },
            {
              isRead: true,
              status: "READ",
              readAt: new Date(),
            }
          );

          // Notify sender that messages were read
          if (senderId && this.connectedUsers.isOnline(senderId)) {
            this.sendToUser(senderId, "message_read", {
              readerId: receiverId,
              timestamp: new Date().toISOString(),
            });
          }
        } catch (error) {
          console.error("Error marking messages as read:", error);
        }
      });

      // Handle stream chat messages
      socket.on("stream_chat_message", async (data) => {
        try {
          const { streamId, message, replyToId } = data || {};
          const senderId = socket.data.userId;

          if (!senderId) {
            socket.emit("stream_chat_error", {
              error: "Authentication required",
            });
            return;
          }

          if (typeof streamId !== "string" || !/^[a-fA-F0-9]{24}$/.test(streamId) ||
            typeof message !== "string" || !message.trim() || message.length > 1000) {
            socket.emit("stream_chat_error", {
              error: "Stream ID and message are required",
            });
            return;
          }
          if (!socket.rooms.has(`stream_${streamId}`)) {
            socket.emit("stream_chat_error", { error: "Join the stream before chatting" });
            return;
          }

          // Send message using StreamService
          const chatMessage = await StreamService.sendChatMessage(
            streamId,
            senderId,
            message.trim(),
            replyToId
          );

          // Populate the message with user data
          const populatedMessage = await StreamChat.findById(chatMessage._id)
            .populate("userId", "name avatar")
            .populate("replyToId", "message userId");

          // Broadcast to all viewers of the stream
          this.io!.to(`stream_${streamId}`).emit("stream_chat_message", {
            streamId,
            message: populatedMessage,
          });

          // Send confirmation to sender
          socket.emit("stream_chat_sent", {
            messageId: chatMessage._id,
            streamId,
          });
        } catch (error: any) {
          console.error("Error sending stream chat message:", error);
          socket.emit("stream_chat_error", {
            error: error.message || "Failed to send message",
          });
        }
      });

      // Handle joining a stream
      socket.on("join_stream", async (data) => {
        try {
          const { streamId } = data || {};
          const userId = socket.data.userId;

          if (!streamId) {
            socket.emit("stream_error", {
              error: "Stream ID is required",
            });
            return;
          }

          // Add viewer to stream
          const sessionId = `socket_${socket.id}`;
          const viewer = await StreamService.addViewer(
            streamId,
            userId,
            sessionId
          );

          // Join socket room for the stream
          socket.join(`stream_${streamId}`);

          // Send confirmation
          socket.emit("stream_joined", {
            streamId,
            viewerId: viewer._id,
          });

          // Broadcast viewer count update
          this.io!.to(`stream_${streamId}`).emit("stream_viewer_count", {
            streamId,
            viewerCount: await StreamViewer.countDocuments({
              streamSessionId: streamId,
              isActive: true,
            }),
          });
        } catch (error: any) {
          console.error("Error joining stream:", error);
          socket.emit("stream_error", {
            error: error.message || "Failed to join stream",
          });
        }
      });

      // Handle leaving a stream
      socket.on("leave_stream", async (data) => {
        try {
          const { streamId } = data || {};
          const userId = socket.data.userId;

          if (!streamId) {
            return;
          }

          // Remove viewer from stream
          const sessionId = `socket_${socket.id}`;
          await StreamService.removeViewer(streamId, userId, sessionId);

          // Leave socket room
          socket.leave(`stream_${streamId}`);

          // Broadcast viewer count update
          this.io!.to(`stream_${streamId}`).emit("stream_viewer_count", {
            streamId,
            viewerCount: await StreamViewer.countDocuments({
              streamSessionId: streamId,
              isActive: true,
            }),
          });
        } catch (error: any) {
          console.error("Error leaving stream:", error);
        }
      });

      // Handle stream reactions
      socket.on("stream_reaction", async (data) => {
        try {
          const { streamId, emoji } = data || {};
          const userId = socket.data.userId;

          if (!userId) {
            socket.emit("stream_error", {
              error: "Authentication required",
            });
            return;
          }

          if (typeof streamId !== "string" || !/^[a-fA-F0-9]{24}$/.test(streamId) ||
              typeof emoji !== "string" || !["🔥", "❤️", "👏", "🎉", "👍", "💯"].includes(emoji)) {
            socket.emit("stream_error", {
              error: "Stream ID and emoji are required",
            });
            return;
          }

          if (!socket.rooms.has(`stream_${streamId}`)) {
            socket.emit("stream_error", { error: "Join the stream before reacting" });
            return;
          }
          // Broadcast reaction to all stream viewers
          this.io!.to(`stream_${streamId}`).emit("stream_reaction", {
            streamId,
            emoji,
            userId,
            timestamp: new Date().toISOString(),
          });
        } catch (error: any) {
          console.error("Error handling stream reaction:", error);
          socket.emit("stream_error", {
            error: "Failed to send reaction",
          });
        }
      });

      // Handle status updates
      socket.on("update_status", (data) => {
        const userId = socket.data.userId;
        if (!userId || !this.connectedUsers.isOnline(userId)) return;
        const status = data?.status;
        if (status !== "online" && status !== "away") return;
        this.broadcastUserStatus(userId, status);
      });

      // The socket may disappear without an explicit leave event. Snapshot its
      // joined streams before Socket.IO clears the room membership.
      socket.on("disconnecting", () => {
        const streamIds = Array.from(socket.rooms)
          .filter(room => room.startsWith("stream_"))
          .map(room => room.slice("stream_".length));
        const userId = socket.data.userId;
        const sessionId = `socket_${socket.id}`;
        void Promise.all(streamIds.map(async streamId => {
          try {
            await StreamService.removeViewer(streamId, userId, sessionId);
            this.io!.to(`stream_${streamId}`).emit("stream_viewer_count", {
              streamId,
              viewerCount: await StreamViewer.countDocuments({
                streamSessionId: streamId,
                isActive: true,
              }),
            });
          } catch (error) {
            console.error("Error cleaning up disconnected stream viewer:", error);
          }
        }));
      });

      // Handle disconnection
      socket.on("disconnect", async () => {
        const userId = socket.data.userId;
        if (!userId) return;
        // A separate tab/device can still have an active connection.
        if (!this.connectedUsers.disconnect(userId, socket.id)) return;
        await User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastSeen: new Date(),
        });
        this.broadcastUserStatus(userId, "offline");
      });
    });
  }

  private broadcastUserStatus(userId: string, status: string): void {
    if (this.io) {
      this.io.emit("user_status_changed", {
        userId,
        status,
        timestamp: new Date().toISOString(),
      });
    }
  }

  public broadcast(event: string, data: any): void {
    if (this.io) {
      this.io.emit(event, data);
    }
  }

  public getConnectedUsersCount(): number {
    return this.connectedUsers.connectedUserCount;
  }

  public isUserOnline(userId: string): boolean {
    return this.connectedUsers.isOnline(userId);
  }

  public getOnlineUsers(): string[] {
    return this.connectedUsers.onlineUsers;
  }

  public sendToUser(userId: string, event: string, data: any): void {
    if (!this.io) return;
    for (const socketId of this.connectedUsers.socketsFor(userId)) {
      this.io.to(socketId).emit(event, data);
    }
  }

  // Stream-specific methods
  public broadcastStreamEvent(streamId: string, event: string, data: any): void {
    if (this.io) {
      this.io.to(`stream_${streamId}`).emit(event, data);
    }
  }

  public broadcastStreamStarted(streamSession: any): void {
    if (this.io) {
      this.io.emit("stream_started", {
        streamId: streamSession._id,
        title: streamSession.title,
        organizer: streamSession.organizerId,
        platforms: streamSession.platforms,
        timestamp: new Date().toISOString(),
      });
    }
  }

  public broadcastStreamEnded(streamSession: any): void {
    if (this.io) {
      this.io.emit("stream_ended", {
        streamId: streamSession._id,
        title: streamSession.title,
        duration: streamSession.duration,
        timestamp: new Date().toISOString(),
      });
    }
  }

  public updateStreamViewerCount(streamId: string, count: number): void {
    if (this.io) {
      this.io.to(`stream_${streamId}`).emit("stream_viewer_count", {
        streamId,
        viewerCount: count,
        timestamp: new Date().toISOString(),
      });
    }
  }
}

export default SocketManager;
