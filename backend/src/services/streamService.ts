import StreamSession, { IStreamSession, StreamStatus } from "../models/StreamSession";
import StreamChat, { IStreamChat } from "../models/StreamChat";
import StreamViewer, { IStreamViewer } from "../models/StreamViewer";
import Notification from "../models/Notification";
import User from "../models/User";
import Tournament from "../models/Tournament";
import Match from "../models/Match";
import mongoose from "mongoose";
import crypto from "crypto";
import StreamingIntegrationService from "./streamingIntegrationService";
import StreamNotificationService from "./streamNotificationService";

export class StreamService {
  // Generate unique stream key
  static generateStreamKey(): string {
    return `stream_${crypto.randomBytes(16).toString('hex')}`;
  }

  // Create a new stream session
  static async createStreamSession(
    organizerId: string,
    streamData: {
      title: string;
      description?: string;
      tournamentId?: string;
      matchId?: string;
      scheduledStartTime?: Date;
      platforms: Array<{
        platform: "twitch" | "youtube" | "custom" | "multi";
        streamUrl?: string;
        embedUrl?: string;
        channelId?: string;
      }>;
      isPublic?: boolean;
      allowChat?: boolean;
      allowReactions?: boolean;
      quality?: "720p" | "1080p" | "4k";
      tags?: string[];
      thumbnail?: string;
      moderators?: string[];
    }
  ): Promise<IStreamSession> {
    const streamKey = this.generateStreamKey();
    
    const streamSession = new StreamSession({
      ...streamData,
      organizerId,
      streamKey,
      platforms: streamData.platforms.map(p => ({
        ...p,
        isActive: true,
      })),
    });

    await streamSession.save();
    return streamSession;
  }

  // Start a stream session
  static async startStream(streamId: string, organizerId: string): Promise<IStreamSession> {
    const streamSession = await StreamSession.findOne({
      _id: streamId,
      organizerId,
      status: "scheduled",
    });

    if (!streamSession) {
      throw new Error("Stream session not found or not authorized");
    }

    streamSession.status = "live";
    streamSession.actualStartTime = new Date();
    await streamSession.save();

    // Send notifications to followers/subscribers
    await StreamNotificationService.notifyStreamStarted(streamSession);

    return streamSession;
  }

  // End a stream session
  static async endStream(streamId: string, organizerId: string): Promise<IStreamSession> {
    const streamSession = await StreamSession.findOne({
      _id: streamId,
      organizerId,
      status: "live",
    });

    if (!streamSession) {
      throw new Error("Stream session not found or not authorized");
    }

    streamSession.status = "ended";
    streamSession.endTime = new Date();
    
    if (streamSession.actualStartTime) {
      streamSession.duration = Math.floor(
        (streamSession.endTime.getTime() - streamSession.actualStartTime.getTime()) / 1000
      );
    }

    await streamSession.save();

    // Update all active viewers
    await StreamViewer.updateMany(
      { streamSessionId: streamId, isActive: true },
      { 
        isActive: false, 
        leaveTime: new Date(),
        duration: new Date().getTime() - new Date().getTime() // This will be calculated properly
      }
    );

    // Send stream ended notification
    await StreamNotificationService.notifyStreamEnded(streamSession);

    return streamSession;
  }

  // Get stream session by ID
  static async getStreamSession(streamId: string): Promise<IStreamSession | null> {
    return await StreamSession.findById(streamId)
      .populate("organizerId", "name avatar")
      .populate("tournamentId", "name game")
      .populate("matchId", "challengerSquadId opponentSquadId")
      .populate("moderators", "name avatar");
  }

  // Get live streams
  static async getLiveStreams(limit: number = 20, skip: number = 0): Promise<IStreamSession[]> {
    return await StreamSession.find({
      status: "live",
      isPublic: true,
    })
      .populate("organizerId", "name avatar")
      .populate("tournamentId", "name game")
      .populate("matchId", "challengerSquadId opponentSquadId")
      .sort({ actualStartTime: -1 })
      .limit(limit)
      .skip(skip);
  }

  // Get scheduled streams
  static async getScheduledStreams(limit: number = 20, skip: number = 0): Promise<IStreamSession[]> {
    return await StreamSession.find({
      status: "scheduled",
      isPublic: true,
      scheduledStartTime: { $gte: new Date() },
    })
      .populate("organizerId", "name avatar")
      .populate("tournamentId", "name game")
      .populate("matchId", "challengerSquadId opponentSquadId")
      .sort({ scheduledStartTime: 1 })
      .limit(limit)
      .skip(skip);
  }

  // Add viewer to stream
  static async addViewer(
    streamId: string,
    userId?: string,
    sessionId?: string,
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
      country?: string;
      city?: string;
    }
  ): Promise<IStreamViewer> {
    if (!userId && !sessionId) {
      throw new Error("Either userId or sessionId is required");
    }

    // Check if viewer already exists
    const existingViewer = await StreamViewer.findOne({
      streamSessionId: streamId,
      $or: [
        ...(userId ? [{ userId }] : []),
        ...(sessionId ? [{ sessionId }] : []),
      ],
      isActive: true,
    });

    if (existingViewer) {
      existingViewer.lastSeen = new Date();
      await existingViewer.save();
      return existingViewer;
    }

    const viewer = new StreamViewer({
      streamSessionId: streamId,
      userId,
      sessionId: sessionId || `anon_${crypto.randomBytes(8).toString('hex')}`,
      ...metadata,
    });

    await viewer.save();

    // Update stream viewer count
    await this.updateViewerCount(streamId);

    return viewer;
  }

  // Remove viewer from stream
  static async removeViewer(streamId: string, userId?: string, sessionId?: string): Promise<void> {
    const viewer = await StreamViewer.findOne({
      streamSessionId: streamId,
      $or: [
        ...(userId ? [{ userId }] : []),
        ...(sessionId ? [{ sessionId }] : []),
      ],
      isActive: true,
    });

    if (viewer) {
      viewer.isActive = false;
      viewer.leaveTime = new Date();
      if (viewer.joinTime) {
        viewer.duration = Math.floor(
          (viewer.leaveTime.getTime() - viewer.joinTime.getTime()) / 1000
        );
      }
      await viewer.save();

      // Update stream viewer count
      await this.updateViewerCount(streamId);
    }
  }

  // Update viewer count for a stream
  static async updateViewerCount(streamId: string): Promise<void> {
    const activeViewers = await StreamViewer.countDocuments({
      streamSessionId: streamId,
      isActive: true,
    });

    const totalViewers = await StreamViewer.countDocuments({
      streamSessionId: streamId,
    });

    const streamSession = await StreamSession.findById(streamId);
    const currentPeakViewers = streamSession?.peakViewers || 0;

    await StreamSession.findByIdAndUpdate(streamId, {
      currentViewers: activeViewers,
      totalViewers,
      peakViewers: Math.max(activeViewers, currentPeakViewers),
    });
  }

  // Send chat message
  static async sendChatMessage(
    streamId: string,
    userId: string,
    message: string,
    replyToId?: string
  ): Promise<IStreamChat> {
    const streamSession = await StreamSession.findById(streamId);
    if (!streamSession) {
      throw new Error("Stream session not found");
    }

    if (streamSession.status !== "live") {
      throw new Error("Stream is not live");
    }

    if (!streamSession.allowChat) {
      throw new Error("Chat is disabled for this stream");
    }

    // Check if user is a moderator
    const isModerator = streamSession.moderators.some(
      modId => modId.toString() === userId
    );

    const chatMessage = new StreamChat({
      streamSessionId: streamId,
      userId,
      message: message.trim(),
      isModerator,
      replyToId,
    });

    await chatMessage.save();

    // Update viewer message count
    await StreamViewer.updateOne(
      { streamSessionId: streamId, userId, isActive: true },
      { $inc: { messagesSent: 1 } }
    );

    return chatMessage;
  }

  // Get chat messages for a stream
  static async getChatMessages(
    streamId: string,
    limit: number = 50,
    skip: number = 0
  ): Promise<IStreamChat[]> {
    return await StreamChat.find({
      streamSessionId: streamId,
      isDeleted: false,
    })
      .populate("userId", "name avatar")
      .populate("replyToId", "message userId")
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(skip);
  }

  // Get stream analytics
  static async getStreamAnalytics(streamId: string): Promise<{
    totalViewers: number;
    peakViewers: number;
    averageViewTime: number;
    totalMessages: number;
    topCountries: Array<{ country: string; viewers: number }>;
  }> {
    const stream = await StreamSession.findById(streamId);
    if (!stream) {
      throw new Error("Stream not found");
    }

    const viewers = await StreamViewer.find({ streamSessionId: streamId });
    const messages = await StreamChat.countDocuments({ streamSessionId: streamId });

    const totalViewTime = viewers.reduce((sum, viewer) => sum + (viewer.duration || 0), 0);
    const averageViewTime = viewers.length > 0 ? totalViewTime / viewers.length : 0;

    // Get top countries
    const countryStats = await StreamViewer.aggregate([
      { $match: { streamSessionId: new mongoose.Types.ObjectId(streamId) } },
      { $group: { _id: "$country", viewers: { $sum: 1 } } },
      { $sort: { viewers: -1 } },
      { $limit: 10 },
    ]);

    return {
      totalViewers: stream.totalViewers,
      peakViewers: stream.peakViewers,
      averageViewTime,
      totalMessages: messages,
      topCountries: countryStats.map(stat => ({
        country: stat._id || "Unknown",
        viewers: stat.viewers,
      })),
    };
  }

  // Validate and sync external stream platforms
  static async validateStreamPlatforms(streamSession: IStreamSession): Promise<{
    validPlatforms: any[];
    invalidPlatforms: any[];
  }> {
    const streamingService = new StreamingIntegrationService();
    const validPlatforms = [];
    const invalidPlatforms = [];

    for (const platform of streamSession.platforms) {
      try {
        switch (platform.platform) {
          case "twitch":
            if (platform.channelId) {
              const channelInfo = await streamingService.getTwitchChannelInfo(platform.channelId);
              if (channelInfo) {
                validPlatforms.push({
                  ...platform,
                  embedUrl: streamingService.generateTwitchEmbedUrl(channelInfo.id),
                });
              } else {
                invalidPlatforms.push(platform);
              }
            } else {
              invalidPlatforms.push(platform);
            }
            break;

          case "youtube":
            if (platform.streamUrl) {
              const validation = streamingService.validateStreamUrl(platform.streamUrl);
              if (validation.isValid && validation.id) {
                const streamInfo = await streamingService.getYouTubeStreamInfo(validation.id);
                if (streamInfo) {
                  validPlatforms.push({
                    ...platform,
                    embedUrl: streamingService.generateYouTubeEmbedUrl(validation.id),
                    streamId: validation.id,
                  });
                } else {
                  invalidPlatforms.push(platform);
                }
              } else {
                invalidPlatforms.push(platform);
              }
            } else {
              invalidPlatforms.push(platform);
            }
            break;

          case "custom":
            if (platform.streamUrl) {
              const validation = streamingService.validateStreamUrl(platform.streamUrl);
              if (validation.isValid) {
                validPlatforms.push(platform);
              } else {
                invalidPlatforms.push(platform);
              }
            } else {
              invalidPlatforms.push(platform);
            }
            break;

          default:
            validPlatforms.push(platform);
        }
      } catch (error) {
        console.error(`Error validating platform ${platform.platform}:`, error);
        invalidPlatforms.push(platform);
      }
    }

    return { validPlatforms, invalidPlatforms };
  }

  // Sync external stream status
  static async syncExternalStreamStatus(streamId: string): Promise<void> {
    const streamSession = await StreamSession.findById(streamId);
    if (!streamSession) return;

    const streamingService = new StreamingIntegrationService();
    
    for (const platform of streamSession.platforms) {
      if (platform.isActive && platform.streamId) {
        try {
          const status = await streamingService.getStreamStatus(
            platform.platform,
            platform.streamId
          );

          // Update stream status based on external platform
          if (status.isLive && streamSession.status === "scheduled") {
            streamSession.status = "live";
            streamSession.actualStartTime = new Date();
          } else if (!status.isLive && streamSession.status === "live") {
            // Check if all platforms are offline
            const allPlatformsOffline = await Promise.all(
              streamSession.platforms.map(async (p) => {
                if (p.isActive && p.streamId) {
                  const platformStatus = await streamingService.getStreamStatus(
                    p.platform,
                    p.streamId
                  );
                  return !platformStatus.isLive;
                }
                return true;
              })
            );

            if (allPlatformsOffline.every(offline => offline)) {
              streamSession.status = "ended";
              streamSession.endTime = new Date();
            }
          }

          // Update viewer count from external platform
          if (status.viewerCount && status.viewerCount > streamSession.currentViewers) {
            streamSession.currentViewers = status.viewerCount;
            if (status.viewerCount > streamSession.peakViewers) {
              streamSession.peakViewers = status.viewerCount;
            }
          }
        } catch (error) {
          console.error(`Error syncing platform ${platform.platform}:`, error);
        }
      }
    }

    await streamSession.save();
  }

  // Get RTMP server configuration
  static getRTMPServerConfig(): { url: string; streamKey: string } {
    const streamingService = new StreamingIntegrationService();
    return streamingService.getRTMPServerInfo();
  }

  // Check if external stream is live
  static async checkExternalStreamStatus(
    streamUrl: string,
    platform: "youtube" | "facebook" | "kick" | "twitch"
  ): Promise<{
    isLive: boolean;
    thumbnail?: string;
    title?: string;
    viewerCount?: number;
  }> {
    const streamingService = new StreamingIntegrationService();
    
    try {
      switch (platform) {
        case "youtube": {
          const validation = streamingService.validateStreamUrl(streamUrl);
          if (validation.isValid && validation.id) {
            const streamInfo = await streamingService.getYouTubeStreamInfo(validation.id);
            return {
              isLive: !!streamInfo?.liveStreamingDetails,
              thumbnail: streamInfo?.snippet?.thumbnails?.high?.url,
              title: streamInfo?.snippet?.title,
              viewerCount: streamInfo?.liveStreamingDetails?.concurrentViewers
                ? parseInt(streamInfo.liveStreamingDetails.concurrentViewers)
                : undefined,
            };
          }
          return { isLive: false };
        }

        case "facebook": {
          // Facebook streaming requires different approach
          // For now, we'll assume if URL is provided, it might be live
          return {
            isLive: false, // Facebook API integration needed
            title: "Facebook Stream",
          };
        }

        case "kick": {
          // Kick streaming requires their API
          // For now, we'll assume if URL is provided, it might be live
          return {
            isLive: false, // Kick API integration needed
            title: "Kick Stream",
          };
        }

        case "twitch": {
          const validation = streamingService.validateStreamUrl(streamUrl);
          if (validation.isValid && validation.id) {
            const streamInfo = await streamingService.getTwitchStreamInfo(validation.id);
            return {
              isLive: !!streamInfo,
              thumbnail: streamInfo?.thumbnail_url,
              title: streamInfo?.title,
              viewerCount: streamInfo?.viewer_count,
            };
          }
          return { isLive: false };
        }

        default:
          return { isLive: false };
      }
    } catch (error) {
      console.error("Error checking external stream status:", error);
      return { isLive: false };
    }
  }
}
