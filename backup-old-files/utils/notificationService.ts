import Notification, {
  NotificationType,
  NotificationStatus,
} from "../models/Notification";

import User from "../models/User";

export class NotificationService {
  /**
   * Create a notification for an offline user
   */
  static async createMessageNotification(
    senderId: string,
    receiverId: string,
    messageId: string,
    content: string
  ) {
    try {
      // Get sender details
      const sender = await User.findById(senderId).select("name");
      if (!sender) {
        throw new Error("Sender not found");
      }

      // Create notification with new format
      const notification = await Notification.create({
        recipientId: receiverId,
        senderId,
        type: NotificationType.MESSAGE,
        title: `${sender.name} чам руу чат бичсэн байна`,
        content:
          content.length > 50 ? content.substring(0, 50) + "..." : content,
        relatedMessageId: messageId,
        status: NotificationStatus.PENDING,
      });

      return notification;
    } catch (error) {
      console.error("Error creating message notification:", error);
      throw error;
    }
  }

  /**
   * Mark notifications as seen when user reads messages
   */
  static async markNotificationsAsSeen(recipientId: string, senderId: string) {
    try {
      const result = await Notification.updateMany(
        {
          recipientId,
          senderId,
          status: NotificationStatus.PENDING,
        },
        { status: NotificationStatus.SEEN }
      );

      return result.modifiedCount;
    } catch (error) {
      console.error("Error marking notifications as seen:", error);
      throw error;
    }
  }

  /**
   * Get pending notifications for a user
   */
  static async getPendingNotifications(userId: string, limit: number = 10) {
    try {
      const notifications = await Notification.find({
        recipientId: userId,
        status: NotificationStatus.PENDING,
      })
        .populate("senderId", "id name avatar")
        .populate("relatedMessageId")
        .sort({ createdAt: 1 })
        .limit(limit);

      return notifications;
    } catch (error) {
      console.error("Error getting pending notifications:", error);
      throw error;
    }
  }

  /**
   * Clean up old seen notifications (older than 7 days)
   */
  static async cleanupOldNotifications() {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const result = await Notification.updateMany(
        {
          status: NotificationStatus.SEEN,
          updatedAt: { $lt: sevenDaysAgo },
        },
        { status: NotificationStatus.DELETED }
      );

      return result.modifiedCount;
    } catch (error) {
      console.error("Error cleaning up old notifications:", error);
      throw error;
    }
  }

  /**
   * Get notification statistics for a user
   */
  static async getNotificationStats(userId: string) {
    try {
      const [pending, seen, total] = await Promise.all([
        Notification.countDocuments({
          recipientId: userId,
          status: NotificationStatus.PENDING,
        }),
        Notification.countDocuments({
          recipientId: userId,
          status: NotificationStatus.SEEN,
        }),
        Notification.countDocuments({
          recipientId: userId,
          status: { $ne: NotificationStatus.DELETED },
        }),
      ]);

      return {
        pending,
        seen,
        total,
      };
    } catch (error) {
      console.error("Error getting notification stats:", error);
      throw error;
    }
  }
}
