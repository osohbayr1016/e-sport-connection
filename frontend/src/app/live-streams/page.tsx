"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { useSocket } from "@/app/contexts/SocketContext";
import { API_ENDPOINTS } from "@/config/api";
import { motion } from "framer-motion";
import { 
  Play, 
  Users, 
  ExternalLink, 
  Globe,
  Clock,
  Tag,
  Loader2,
  Search,
  Filter
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface StreamSession {
  _id: string;
  title: string;
  description?: string;
  status: "scheduled" | "live" | "ended" | "cancelled";
  organizerId: {
    _id: string;
    name: string;
    avatar?: string;
  };
  scheduledStartTime?: string;
  actualStartTime?: string;
  endTime?: string;
  currentViewers: number;
  peakViewers: number;
  allowChat: boolean;
  allowReactions: boolean;
  tags: string[];
  thumbnail?: string;
  externalStreamUrl?: string;
  externalPlatform?: "youtube" | "facebook" | "kick" | "twitch";
  externalThumbnail?: string;
  isLiveStatus?: "live" | "offline";
  createdAt: string;
}

export default function LiveStreamsPage() {
  const { user, getToken } = useAuth();
  const { socket } = useSocket();
  const [streams, setStreams] = useState<StreamSession[]>([]);
  const [filteredStreams, setFilteredStreams] = useState<StreamSession[]>([]);
  const [selectedStream, setSelectedStream] = useState<StreamSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPlatform, setFilterPlatform] = useState<string>("all");

  useEffect(() => {
    fetchLiveStreams();
  }, []);

  useEffect(() => {
    filterStreams();
  }, [searchTerm, filterPlatform, streams]);

  const fetchLiveStreams = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.STREAMS.LIVE);
      const data = await response.json();
      
      if (data.success) {
        setStreams(data.data);
      } else {
        setError(data.message);
      }
    } catch (error) {
      console.error("Error fetching live streams:", error);
      setError("Failed to fetch live streams");
    } finally {
      setLoading(false);
    }
  };

  const filterStreams = () => {
    let filtered = streams;

    if (searchTerm) {
      filtered = filtered.filter(
        (stream) =>
          stream.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          stream.organizerId.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterPlatform !== "all") {
      filtered = filtered.filter(
        (stream) => stream.externalPlatform === filterPlatform
      );
    }

    setFilteredStreams(filtered);
  };

  const getPlatformIcon = (platform?: string) => {
    switch (platform) {
      case "youtube":
        return "🎥";
      case "facebook":
        return "📘";
      case "kick":
        return "🔥";
      case "twitch":
        return "💜";
      default:
        return "📺";
    }
  };

  const getPlatformName = (platform?: string) => {
    switch (platform) {
      case "youtube":
        return "YouTube";
      case "facebook":
        return "Facebook";
      case "kick":
        return "Kick";
      case "twitch":
        return "Twitch";
      default:
        return "Stream";
    }
  };

  const getStreamEmbedUrl = (stream: StreamSession) => {
    if (stream.externalStreamUrl && stream.externalPlatform) {
      switch (stream.externalPlatform) {
        case "youtube": {
          const url = new URL(stream.externalStreamUrl);
          const videoId = url.searchParams.get("v") || url.pathname.split("/").pop();
          return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : null;
        }
        case "facebook": {
          return stream.externalStreamUrl.replace("/videos/", "/plugins/video.php?href=") + "&width=500&show_text=false&appId";
        }
        case "kick": {
          return stream.externalStreamUrl;
        }
        case "twitch": {
          const urlParts = stream.externalStreamUrl.split("/");
          const channelName = urlParts[urlParts.length - 1];
          return channelName ? `https://player.twitch.tv/?channel=${channelName}&parent=${window.location.hostname}` : null;
        }
      }
    }
    return stream.thumbnail || null;
  };

  const formatViewerCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-pink-600/20 backdrop-blur-sm border-b border-purple-500/30">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="relative container mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-block mb-4">
              <span className="text-6xl">🎮</span>
            </div>
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Live Streams
            </h1>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Watch the best esports streams from top players across YouTube, Twitch, Kick, and Facebook
            </p>
          </motion.div>

          {/* Search and Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-8 max-w-4xl mx-auto"
          >
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search streams..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={filterPlatform}
                  onChange={(e) => setFilterPlatform(e.target.value)}
                  className="pl-10 pr-10 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                >
                  <option value="all">All Platforms</option>
                  <option value="youtube">YouTube</option>
                  <option value="twitch">Twitch</option>
                  <option value="kick">Kick</option>
                  <option value="facebook">Facebook</option>
                </select>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        {error && (
          <div className="bg-red-600/20 border border-red-500/50 text-white p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-purple-500" />
          </div>
        ) : selectedStream ? (
          /* Stream View */
          <div className="max-w-7xl mx-auto">
            <button
              onClick={() => setSelectedStream(null)}
              className="mb-6 flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
            >
              <span>← Back to Streams</span>
            </button>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl overflow-hidden shadow-2xl"
            >
              <div className="aspect-video bg-black">
                {getStreamEmbedUrl(selectedStream) ? (
                  <iframe
                    src={getStreamEmbedUrl(selectedStream)!}
                    className="w-full h-full"
                    allowFullScreen
                    allow="autoplay; encrypted-media"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="text-6xl mb-4">📺</div>
                      <p className="text-gray-400">Stream player not available</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-2">{selectedStream.title}</h2>
                    <p className="text-gray-400 mb-4">{selectedStream.description}</p>
                    
                    <div className="flex items-center space-x-4 flex-wrap gap-2">
                      <div className="flex items-center space-x-2">
                        <Users className="w-5 h-5 text-purple-400" />
                        <span>{formatViewerCount(selectedStream.currentViewers)} viewers</span>
                      </div>
                      {selectedStream.externalPlatform && (
                        <div className="flex items-center space-x-2 px-3 py-1 bg-purple-500/20 rounded-full">
                          <span>{getPlatformIcon(selectedStream.externalPlatform)}</span>
                          <span>{getPlatformName(selectedStream.externalPlatform)}</span>
                        </div>
                      )}
                      {selectedStream.isLiveStatus === "live" ? (
                        <span className="px-3 py-1 bg-red-600 rounded-full text-sm font-semibold flex items-center">
                          <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
                          LIVE
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-gray-600 rounded-full text-sm">OFFLINE</span>
                      )}
                    </div>
                  </div>
                </div>

                {selectedStream.externalStreamUrl && (
                  <a
                    href={selectedStream.externalStreamUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                  >
                    <span>Watch on {getPlatformName(selectedStream.externalPlatform)}</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </motion.div>
          </div>
        ) : filteredStreams.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📺</div>
            <p className="text-gray-400 text-lg">No streams available</p>
          </div>
        ) : (
          /* Stream Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredStreams.map((stream, index) => (
              <motion.div
                key={stream._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                onClick={() => setSelectedStream(stream)}
                className="group bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl overflow-hidden hover:border-purple-500 transition-all cursor-pointer hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-gradient-to-br from-purple-600 to-blue-600">
                  {stream.externalThumbnail || stream.thumbnail ? (
                    <img
                      src={stream.externalThumbnail || stream.thumbnail!}
                      alt={stream.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <span className="text-6xl">{getPlatformIcon(stream.externalPlatform)}</span>
                    </div>
                  )}
                  
                  {/* Live Badge */}
                  {stream.isLiveStatus === "live" && (
                    <div className="absolute top-3 left-3 bg-red-600 rounded-full px-3 py-1 flex items-center space-x-2">
                      <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                      <span className="text-xs font-semibold">LIVE</span>
                    </div>
                  )}
                  
                  {/* Platform Badge */}
                  {stream.externalPlatform && (
                    <div className="absolute top-3 right-3 bg-black/70 rounded-full px-3 py-1 flex items-center space-x-2 backdrop-blur-sm">
                      <span>{getPlatformIcon(stream.externalPlatform)}</span>
                      <span className="text-xs font-medium">{getPlatformName(stream.externalPlatform)}</span>
                    </div>
                  )}
                  
                  {/* Play Button */}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
                      <Play className="w-12 h-12 text-white fill-white" />
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold mb-2 line-clamp-2 group-hover:text-purple-400 transition-colors">
                    {stream.title}
                  </h3>
                  
                  <div className="flex items-center space-x-2 text-sm text-gray-400 mb-3">
                    <span>{stream.organizerId.name}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-sm">
                      <Users className="w-4 h-4 text-purple-400" />
                      <span>{formatViewerCount(stream.currentViewers)}</span>
                    </div>
                    
                    {stream.externalStreamUrl && (
                      <div className="text-purple-400">
                        <ExternalLink className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
