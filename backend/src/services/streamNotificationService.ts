import Notification from "../models/Notification";
import User from "../models/User";
import StreamSession from "../models/StreamSession";
import mongoose from "mongoose";

export class StreamNotificationService {
  // Send notification when stream starts
  static async notifyStreamStarted(streamSession: any): Promise<void> {
    try {
      // Get followers/subscribers of the organizer
      // For now, we'll notify all users (in a real app, you'd have a followers system)
      const users = await User.find({}).limit(100); // Limit to prevent spam
      
      const notifications = users.map(user => ({
        userId: user._id,
        senderId: streamSession.organizerId,
        title: `🎥 Live Stream Started: ${streamSession.title}`,
        content: `Watch ${streamSession.organizerId.name}'s live stream now!`,
        type: "STREAM_STARTED",
        status: "PENDING",
        relatedStreamId: streamSession._id,
      }));

      await Notification.insertMany(notifications);
      console.log(`Sent ${notifications.length} stream start notifications`);
    } catch (error) {
      console.error("Error sending stream start notifications:", error);
    }
  }

  // Send notification when stream is ending soon
  static async notifyStreamEndingSoon(streamSession: any): Promise<void> {
    try {
      // Get current viewers
      const viewers = await User.find({
        _id: { $in: streamSession.viewers || [] }
      });

      const notifications = viewers.map(viewer => ({
        userId: viewer._id,
        senderId: streamSession.organizerId,
        title: `⏰ Stream Ending Soon: ${streamSession.title}`,
        content: `The stream "${streamSession.title}" will end in 5 minutes!`,
        type: "STREAM_ENDING",
        status: "PENDING",
        relatedStreamId: streamSession._id,
      }));

      await Notification.insertMany(notifications);
      console.log(`Sent ${notifications.length} stream ending notifications`);
    } catch (error) {
      console.error("Error sending stream ending notifications:", error);
    }
  }

  // Send notification for scheduled streams
  static async notifyScheduledStream(streamSession: any): Promise<void> {
    try {
      // Get users interested in the game/tournament
      let targetUsers = [];
      
      if (streamSession.tournamentId) {
        // Get tournament participants
        const tournament = await mongoose.model("Tournament").findById(streamSession.tournamentId);
        if (tournament) {
          const registrations = await mongoose.model("TournamentRegistration").find({
            tournamentId: streamSession.tournamentId
          });
          targetUsers = await User.find({
            _id: { $in: registrations.map(r => r.userId) }
          });
        }
      } else {
        // Get users interested in the game
        const gameTag = streamSession.tags.find(tag => 
          ["mobile legends", "mlbb", "valorant", "cs2", "dota2", "lol"].includes(tag.toLowerCase())
        );
        
        if (gameTag) {
          // In a real app, you'd have user preferences for games
          targetUsers = await User.find({}).limit(50);
        }
      }

      const notifications = targetUsers.map(user => ({
        userId: user._id,
        senderId: streamSession.organizerId,
        title: `📅 Upcoming Stream: ${streamSession.title}`,
        content: `A new stream "${streamSession.title}" is scheduled for ${new Date(streamSession.scheduledStartTime).toLocaleString()}`,
        type: "STREAM_INVITE",
        status: "PENDING",
        relatedStreamId: streamSession._id,
      }));

      await Notification.insertMany(notifications);
      console.log(`Sent ${notifications.length} scheduled stream notifications`);
    } catch (error) {
      console.error("Error sending scheduled stream notifications:", error);
    }
  }

  // Send notification to specific users
  static async notifySpecificUsers(
    userIds: string[],
    streamSession: any,
    notificationType: "STREAM_STARTED" | "STREAM_ENDING" | "STREAM_INVITE",
    customMessage?: string
  ): Promise<void> {
    try {
      const users = await User.find({ _id: { $in: userIds } });
      
      const notifications = users.map(user => ({
        userId: user._id,
        senderId: streamSession.organizerId,
        title: customMessage || `Stream Update: ${streamSession.title}`,
        content: customMessage || `Update about stream "${streamSession.title}"`,
        type: notificationType,
        status: "PENDING",
        relatedStreamId: streamSession._id,
      }));

      await Notification.insertMany(notifications);
      console.log(`Sent ${notifications.length} specific user notifications`);
    } catch (error) {
      console.error("Error sending specific user notifications:", error);
    }
  }

  // Send notification when stream reaches milestone viewers
  static async notifyViewerMilestone(
    streamSession: any,
    milestone: number
  ): Promise<void> {
    try {
      const organizer = await User.findById(streamSession.organizerId);
      if (!organizer) return;

      const notification = new Notification({
        userId: streamSession.organizerId,
        senderId: streamSession.organizerId,
        title: `🎉 Milestone Reached!`,
        content: `Your stream "${streamSession.title}" has reached ${milestone} viewers!`,
        type: "SYSTEM",
        status: "PENDING",
        relatedStreamId: streamSession._id,
      });

      await notification.save();
      console.log(`Sent viewer milestone notification for ${milestone} viewers`);
    } catch (error) {
      console.error("Error sending viewer milestone notification:", error);
    }
  }

  // Send notification when stream ends
  static async notifyStreamEnded(streamSession: any): Promise<void> {
    try {
      const organizer = await User.findById(streamSession.organizerId);
      if (!organizer) return;

      const notification = new Notification({
        userId: streamSession.organizerId,
        senderId: streamSession.organizerId,
        title: `📊 Stream Ended: ${streamSession.title}`,
        content: `Your stream ended with ${streamSession.totalViewers} total viewers and ${streamSession.peakViewers} peak viewers.`,
        type: "SYSTEM",
        status: "PENDING",
        relatedStreamId: streamSession._id,
      });

      await notification.save();
      console.log("Sent stream ended notification");
    } catch (error) {
      console.error("Error sending stream ended notification:", error);
    }
  }

  // Send notification for stream highlights
  static async notifyStreamHighlights(
    streamSession: any,
    highlights: {
      peakViewers: number;
      totalMessages: number;
      duration: number;
    }
  ): Promise<void> {
    try {
      const organizer = await User.findById(streamSession.organizerId);
      if (!organizer) return;

      const notification = new Notification({
        userId: streamSession.organizerId,
        senderId: streamSession.organizerId,
        title: `📈 Stream Highlights: ${streamSession.title}`,
        content: `Stream highlights: ${highlights.peakViewers} peak viewers, ${highlights.totalMessages} messages, ${Math.floor(highlights.duration / 60)} minutes duration.`,
        type: "SYSTEM",
        status: "PENDING",
        relatedStreamId: streamSession._id,
      });

      await notification.save();
      console.log("Sent stream highlights notification");
    } catch (error) {
      console.error("Error sending stream highlights notification:", error);
    }
  }

  // Clean up old stream notifications
  static async cleanupOldNotifications(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await Notification.deleteMany({
        type: { $in: ["STREAM_STARTED", "STREAM_ENDING", "STREAM_INVITE"] },
        createdAt: { $lt: thirtyDaysAgo },
      });

      console.log(`Cleaned up ${result.deletedCount} old stream notifications`);
    } catch (error) {
      console.error("Error cleaning up old notifications:", error);
    }
  }
}

export default StreamNotificationService;

