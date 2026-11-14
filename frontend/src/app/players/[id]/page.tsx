"use client";

import { useState, useEffect, use } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Gamepad2,
  Shield,
  Sword,
  Zap,
  Monitor,
  Smartphone,
  Globe,
  Twitter,
  Instagram,
  Youtube,
  Twitch,
  MessageCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";
import ChatModal from "../../components/ChatModal";
import { useAuth } from "../../contexts/AuthContext";
import { API_ENDPOINTS } from "../../../config/api";

interface Player {
  id: string;
  name: string;
  realName?: string;
  avatar?: string;
  avatarPublicId?: string;
  category: "PC" | "Mobile";
  game: string;
  roles: string[];
  inGameName: string;
  rank: string;
  rankStars?: number;
  experience: string;
  bio: string;
  socialLinks: {
    twitter?: string;
    instagram?: string;
    youtube?: string;
    twitch?: string;
    discord?: string;
    website?: string;
  };
  highlightVideo?: string;
  isLookingForTeam: boolean;
  achievements?: string[];
  availability?: {
    weekdays: boolean;
    weekends: boolean;
    timezone: string;
    preferredHours: string;
  };
  languages?: string[];
  mlbbId?: string;
}

export default function PlayerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useAuth();
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    // Fetch player from API
    const fetchPlayer = async () => {
      try {
        setLoading(true);

        // Use the specific player endpoint
        const apiUrl = API_ENDPOINTS.PLAYER_PROFILES.GET(id);
        // Try the main API endpoint first
        let response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        // If the main endpoint fails, try a fallback
        if (!response.ok && response.status !== 404) {
          const fallbackUrl = `${
            process.env.NEXT_PUBLIC_API_URL ||
            (typeof window !== "undefined" &&
            window.location.hostname !== "localhost"
              ? "https://e-sport-connection-0596.onrender.com"
              : "http://localhost:8000")
          }/api/player-profiles/profiles/${id}`;
          response = await fetch(fallbackUrl, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          });
        }

        if (response.ok) {
          const data = await response.json();
          if (data.profile) {
            setPlayer(data.profile);
          } else {
            console.error("🔍 No profile data in response");
            setPlayer(null);
          }
        } else if (response.status === 404) {
          setPlayer(null);
        } else {
          console.error("🔍 Failed to fetch player, status:", response.status);
          const errorData = await response.json().catch(() => ({}));
          console.error("🔍 Error response:", errorData);
          throw new Error(`Failed to fetch player: ${response.status}`);
        }
      } catch (error) {
        console.error("Failed to fetch player:", error);
        setPlayer(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPlayer();
    } else {
      console.error("🔍 No player ID provided");
      setLoading(false);
    }
  }, [id]);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "Carry":
      case "Duelist":
      case "Assault":
      case "Fighter":
      case "Exp Laner":
        return <Sword className="w-6 h-6" />;
      case "Support":
      case "Hard Support":
      case "Sentinel":
        return <Shield className="w-6 h-6" />;
      case "Mid":
      case "Mage":
      case "Initiator":
      case "Mid Laner":
        return <Zap className="w-6 h-6" />;
      case "Core":
      case "Gold Laner":
        return <Sword className="w-6 h-6" />;
      case "Roamer":
        return <Shield className="w-6 h-6" />;
      case "Fill":
        return <Gamepad2 className="w-6 h-6" />;
      default:
        return <Gamepad2 className="w-6 h-6" />;
    }
  };

  const getCategoryIcon = (category: "PC" | "Mobile") => {
    return category === "PC" ? (
      <Monitor className="w-6 h-6" />
    ) : (
      <Smartphone className="w-6 h-6" />
    );
  };

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case "twitter":
        return <Twitter className="w-5 h-5" />;
      case "instagram":
        return <Instagram className="w-5 h-5" />;
      case "youtube":
        return <Youtube className="w-5 h-5" />;
      case "twitch":
        return <Twitch className="w-5 h-5" />;
      case "discord":
        return <MessageCircle className="w-5 h-5" />;
      case "website":
        return <Globe className="w-5 h-5" />;
      default:
        return <Globe className="w-5 h-5" />;
    }
  };

  const getYouTubeVideoId = (url: string) => {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-gray-900 to-gray-900">
        <Navigation />
        <main className="pt-20 pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
              <p className="mt-4 text-gray-300">
                Loading player details...
              </p>
              <p className="mt-2 text-sm text-gray-400">
                Player ID: {id}
              </p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-gray-900 to-gray-900">
        <Navigation />
        <main className="pt-20 pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold text-white mb-4">
                Player not found
              </h1>
              <p className="text-gray-300 mb-4">
                The player profile you&apos;re looking for doesn&apos;t exist or
                has been removed.
              </p>
              <div className="space-y-4">
                <Link
                  href="/players"
                  className="inline-flex items-center space-x-2 text-blue-400 hover:underline"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Players</span>
                </Link>
                <br />
                <Link
                  href="/players"
                  className="inline-flex items-center space-x-2 text-blue-400 hover:underline"
                >
                  <span>Browse Mobile Legends Players</span>
                </Link>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-gray-900 to-gray-900">
      <Navigation />

      <main className="pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <Link
              href="/players"
              className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Players</span>
            </Link>
          </motion.div>

          {/* Player Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 mb-8 border border-gray-700"
          >
            <div className="flex flex-col lg:flex-row items-center lg:items-start space-y-6 lg:space-y-0 lg:space-x-8">
              {/* Player Image */}
              <div className="relative flex-shrink-0">
                <Image
                  src={player.avatar || "/default-avatar.png"}
                  alt={player.name}
                  width={200}
                  height={200}
                  className="rounded-2xl object-cover border-4 border-gray-700 shadow-lg w-32 h-32 sm:w-48 sm:h-48 lg:w-52 lg:h-52"
                />
              </div>

              {/* Player Info */}
              <div className="flex-1 text-center lg:text-left">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-2 sm:gap-3">
                  <span className="text-center lg:text-left">
                    {player.realName || player.name}
                  </span>
                </h1>

                {player.realName &&
                  player.inGameName &&
                  player.realName !== player.inGameName && (
                    <div className="mb-4">
                      <span className="inline-block px-3 py-1 bg-blue-900/50 text-blue-200 border border-blue-700 rounded-full text-sm font-medium">
                        Тоглоомын нэр: {player.inGameName}
                      </span>
                    </div>
                  )}

                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mb-6">
                  <div className="flex items-center space-x-2">
                    {getCategoryIcon(player.category)}
                    <span className="text-lg text-gray-300">
                      {player.category}
                    </span>
                  </div>
                  <span className="text-gray-300">•</span>
                  <span className="text-lg text-gray-300">
                    {player.game}
                  </span>
                  <span className="text-gray-300">•</span>
                  <div className="flex items-center space-x-2">
                    {getRoleIcon(player.roles[0])}
                    <span className="text-lg text-gray-300">
                      {player.roles.join(", ")}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
                  <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                    <h3 className="text-sm font-medium text-gray-400 mb-1">
                      In-Game Name
                    </h3>
                    <p className="text-lg font-semibold text-white">
                      {player.inGameName}
                    </p>
                  </div>
                  {/* MLBB Game ID */}
                  {player.mlbbId && (
                    <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                      <h3 className="text-sm font-medium text-gray-400 mb-1">
                        MLBB Game ID
                      </h3>
                      <p className="text-lg font-semibold text-blue-400">
                        {player.mlbbId}
                      </p>
                    </div>
                  )}
                  <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                    <h3 className="text-sm font-medium text-gray-400 mb-1">
                      Highest Rank
                    </h3>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-semibold text-blue-400">
                        {player.rank}
                      </p>
                      {player.rank === "+Mythical Immortal" &&
                        player.rankStars && (
                          <span className="text-yellow-500 text-sm">
                            ⭐ {player.rankStars}
                          </span>
                        )}
                    </div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                    <h3 className="text-sm font-medium text-gray-400 mb-1">
                      Experience
                    </h3>
                    <p className="text-lg font-semibold text-white">
                      {player.experience}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                  {player.isLookingForTeam && (
                    <div className="inline-block px-4 py-2 bg-blue-900/50 text-blue-200 border border-blue-700 rounded-full text-sm font-medium">
                      Баг Хайж Байна
                    </div>
                  )}

                  {user && user.id !== player.id && (
                    <motion.button
                      onClick={() => setIsChatOpen(true)}
                      className="inline-flex items-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span>Chat</span>
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Bio Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 mb-8 border border-gray-700"
          >
            <h2 className="text-2xl font-bold text-white mb-6">
              Bio
            </h2>
            <p className="text-gray-300 leading-relaxed text-lg">
              {player.bio}
            </p>
          </motion.div>

          {/* Social Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-gray-800 rounded-2xl shadow-xl p-8 mb-8 border border-gray-700"
          >
            <h2 className="text-2xl font-bold text-white mb-6">
              Social Links
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {player.socialLinks &&
                Object.entries(player.socialLinks)
                  .filter(([, link]) => link)
                  .map(([platform, link]) => (
                    <motion.a
                      key={platform}
                      href={
                        platform === "discord"
                          ? `https://discord.com/users/${link}`
                          : link
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center space-y-2 p-4 bg-gray-700 rounded-lg border border-gray-600 hover:bg-gray-600 transition-colors duration-200 group"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className="text-gray-400 group-hover:text-blue-400 transition-colors duration-200">
                        {getSocialIcon(platform)}
                      </div>
                      <span className="text-sm font-medium text-gray-300 capitalize">
                        {platform}
                      </span>
                    </motion.a>
                  ))}
              {(!player.socialLinks ||
                Object.keys(player.socialLinks || {}).length === 0 ||
                Object.values(player.socialLinks || {}).every(
                  (link) => !link
                )) && (
                <div className="col-span-full text-center py-8">
                  <div className="text-gray-400 mb-4">
                    <svg
                      className="w-12 h-12 mx-auto"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    No Social Links
                  </h3>
                  <p className="text-gray-300">
                    This player hasn&apos;t added any social media links yet.
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Highlight Video Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-700"
          >
            <h2 className="text-2xl font-bold text-white mb-6">
              Highlight Video
            </h2>

            {player.highlightVideo ? (
              <div className="space-y-4">
                <div
                  className="relative w-full"
                  style={{ paddingBottom: "56.25%" }}
                >
                  <iframe
                    src={`https://www.youtube.com/embed/${
                      getYouTubeVideoId(player.highlightVideo) || ""
                    }`}
                    title={`${player.name} Highlight Video`}
                    className="absolute top-0 left-0 w-full h-full rounded-lg"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-400">
                    YouTube Highlight Video
                  </p>
                  <a
                    href={player.highlightVideo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 text-blue-400 hover:underline"
                  >
                    <Youtube className="w-4 h-4" />
                    <span>Watch on YouTube</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Youtube className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  No Highlight Video
                </h3>
                <p className="text-gray-300 mb-4">
                  This player hasn&apos;t uploaded a highlight video yet.
                </p>
                <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                  <p className="text-sm text-gray-400 mb-2">
                    To add a highlight video, players can:
                  </p>
                  <ul className="text-sm text-gray-400 space-y-1">
                    <li>• Upload their best gameplay moments to YouTube</li>
                    <li>• Share the YouTube video URL in their profile</li>
                    <li>• Showcase their skills and achievements</li>
                  </ul>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </main>

      {/* Chat Modal */}
      {player && (
        <ChatModal
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          playerId={player.id}
          playerName={player.name}
          playerAvatar={player.avatar}
        />
      )}
    </div>
  );
}
