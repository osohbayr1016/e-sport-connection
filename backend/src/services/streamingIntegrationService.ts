import axios from "axios";

export interface TwitchStreamInfo {
  id: string;
  user_id: string;
  user_login: string;
  user_name: string;
  game_id: string;
  game_name: string;
  type: string;
  title: string;
  viewer_count: number;
  started_at: string;
  language: string;
  thumbnail_url: string;
  tag_ids: string[];
  is_mature: boolean;
}

export interface YouTubeStreamInfo {
  id: string;
  snippet: {
    title: string;
    description: string;
    channelId: string;
    channelTitle: string;
    publishedAt: string;
    thumbnails: {
      default: { url: string };
      medium: { url: string };
      high: { url: string };
    };
  };
  liveStreamingDetails?: {
    actualStartTime: string;
    scheduledStartTime: string;
    concurrentViewers: string;
    activeLiveChatId: string;
  };
  statistics?: {
    viewCount: string;
    likeCount: string;
    dislikeCount: string;
    commentCount: string;
  };
}

export class StreamingIntegrationService {
  private twitchClientId: string;
  private twitchClientSecret: string;
  private youtubeApiKey: string;

  constructor() {
    this.twitchClientId = process.env.TWITCH_CLIENT_ID || "";
    this.twitchClientSecret = process.env.TWITCH_CLIENT_SECRET || "";
    this.youtubeApiKey = process.env.YOUTUBE_API_KEY || "";
  }

  // Twitch Integration
  async getTwitchAccessToken(): Promise<string> {
    try {
      const response = await axios.post("https://id.twitch.tv/oauth2/token", {
        client_id: this.twitchClientId,
        client_secret: this.twitchClientSecret,
        grant_type: "client_credentials",
      });

      return response.data.access_token;
    } catch (error) {
      console.error("Error getting Twitch access token:", error);
      throw new Error("Failed to get Twitch access token");
    }
  }

  async getTwitchStreamInfo(channelId: string): Promise<TwitchStreamInfo | null> {
    try {
      const accessToken = await this.getTwitchAccessToken();
      
      const response = await axios.get(
        `https://api.twitch.tv/helix/streams?user_id=${channelId}`,
        {
          headers: {
            "Client-ID": this.twitchClientId,
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const streams = response.data.data;
      return streams.length > 0 ? streams[0] : null;
    } catch (error) {
      console.error("Error getting Twitch stream info:", error);
      return null;
    }
  }

  async getTwitchChannelInfo(channelName: string): Promise<any> {
    try {
      const accessToken = await this.getTwitchAccessToken();
      
      const response = await axios.get(
        `https://api.twitch.tv/helix/users?login=${channelName}`,
        {
          headers: {
            "Client-ID": this.twitchClientId,
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const users = response.data.data;
      return users.length > 0 ? users[0] : null;
    } catch (error) {
      console.error("Error getting Twitch channel info:", error);
      return null;
    }
  }

  // YouTube Integration
  async getYouTubeStreamInfo(videoId: string): Promise<YouTubeStreamInfo | null> {
    try {
      const response = await axios.get(
        `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,liveStreamingDetails,statistics&key=${this.youtubeApiKey}`
      );

      const videos = response.data.items;
      return videos.length > 0 ? videos[0] : null;
    } catch (error) {
      console.error("Error getting YouTube stream info:", error);
      return null;
    }
  }

  async searchYouTubeLiveStreams(query: string, maxResults: number = 10): Promise<YouTubeStreamInfo[]> {
    try {
      const response = await axios.get(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&eventType=live&type=video&q=${encodeURIComponent(query)}&maxResults=${maxResults}&key=${this.youtubeApiKey}`
      );

      const videoIds = response.data.items.map((item: any) => item.id.videoId).join(",");
      
      if (videoIds) {
        const detailsResponse = await axios.get(
          `https://www.googleapis.com/youtube/v3/videos?id=${videoIds}&part=snippet,liveStreamingDetails,statistics&key=${this.youtubeApiKey}`
        );
        
        return detailsResponse.data.items;
      }

      return [];
    } catch (error) {
      console.error("Error searching YouTube live streams:", error);
      return [];
    }
  }

  // Generate embed URLs
  generateTwitchEmbedUrl(channelId: string): string {
    return `https://player.twitch.tv/?channel=${channelId}&parent=${process.env.FRONTEND_DOMAIN || "localhost"}`;
  }

  generateYouTubeEmbedUrl(videoId: string): string {
    return `https://www.youtube.com/embed/${videoId}`;
  }

  // Validate stream URLs
  validateStreamUrl(url: string): { isValid: boolean; platform?: string; id?: string } {
    try {
      const urlObj = new URL(url);
      
      // Twitch URL validation
      if (urlObj.hostname.includes("twitch.tv")) {
        const pathParts = urlObj.pathname.split("/").filter(part => part);
        if (pathParts.length >= 1) {
          return {
            isValid: true,
            platform: "twitch",
            id: pathParts[0],
          };
        }
      }
      
      // YouTube URL validation
      if (urlObj.hostname.includes("youtube.com") || urlObj.hostname.includes("youtu.be")) {
        let videoId: string | undefined;
        
        if (urlObj.hostname.includes("youtu.be")) {
          videoId = urlObj.pathname.slice(1);
        } else if (urlObj.pathname.includes("/watch")) {
          videoId = urlObj.searchParams.get("v") || undefined;
        } else if (urlObj.pathname.includes("/embed/")) {
          videoId = urlObj.pathname.split("/embed/")[1];
        }
        
        if (videoId) {
          return {
            isValid: true,
            platform: "youtube",
            id: videoId,
          };
        }
      }
      
      // Custom RTMP URL validation
      if (urlObj.protocol === "rtmp:" || urlObj.protocol === "rtmps:") {
        return {
          isValid: true,
          platform: "custom",
          id: url,
        };
      }
      
      return { isValid: false };
    } catch (error) {
      return { isValid: false };
    }
  }

  // Get stream status
  async getStreamStatus(platform: string, streamId: string): Promise<{
    isLive: boolean;
    viewerCount?: number;
    title?: string;
    thumbnail?: string;
  }> {
    try {
      switch (platform) {
        case "twitch":
          const twitchInfo = await this.getTwitchStreamInfo(streamId);
          return {
            isLive: !!twitchInfo,
            viewerCount: twitchInfo?.viewer_count,
            title: twitchInfo?.title,
            thumbnail: twitchInfo?.thumbnail_url,
          };
          
        case "youtube":
          const youtubeInfo = await this.getYouTubeStreamInfo(streamId);
          return {
            isLive: !!youtubeInfo?.liveStreamingDetails,
            viewerCount: youtubeInfo?.liveStreamingDetails?.concurrentViewers 
              ? parseInt(youtubeInfo.liveStreamingDetails.concurrentViewers) 
              : undefined,
            title: youtubeInfo?.snippet?.title,
            thumbnail: youtubeInfo?.snippet?.thumbnails?.high?.url,
          };
          
        default:
          return { isLive: false };
      }
    } catch (error) {
      console.error("Error getting stream status:", error);
      return { isLive: false };
    }
  }

  // Create stream key for RTMP
  generateStreamKey(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Get RTMP server info
  getRTMPServerInfo(): { url: string; streamKey: string } {
    return {
      url: process.env.RTMP_SERVER_URL || "rtmp://localhost:1935/live",
      streamKey: this.generateStreamKey(),
    };
  }
}

export default StreamingIntegrationService;

