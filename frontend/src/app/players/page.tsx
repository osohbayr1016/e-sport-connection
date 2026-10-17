"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Monitor, Smartphone } from "lucide-react";
import ServiceState from "../components/ServiceState";
import ChatModal from "../components/ChatModal";
import PlayerCard from "../components/PlayerCard";
import { useAuth } from "../contexts/AuthContext";
import { API_ENDPOINTS } from "@/config/api";

interface Player {
  id: string;
  name: string;
  avatar?: string;
  avatarPublicId?: string;
  category: "PC" | "Mobile";
  game: string;
  roles: string[];
  inGameName?: string;
  mlbbId?: string; // MLBB Game ID (optional)
  rank: string;
  rankStars?: number;
  experience: string;
  bio?: string;
  description?: string;
  isLookingForTeam: boolean;
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    youtube?: string;
    twitch?: string;
    discord?: string;
    website?: string;
  };
  highlightVideo?: string;
}

// Flexible interface for incoming API data that might have different field names
interface FlexiblePlayerData {
  id?: string;
  _id?: string;
  playerId?: string;
  name?: string;
  username?: string;
  displayName?: string;
  playerName?: string;
  avatar?: string;
  avatarUrl?: string;
  profilePicture?: string;
  avatarPublicId?: string;
  avatarId?: string;
  category?: string;
  platform?: string;
  game?: string;
  gameType?: string;
  gameName?: string;
  roles?: string[];
  role?: string | string[];
  inGameName?: string;
  ign?: string;
  gameUsername?: string;
  rank?: string;
  rankLevel?: string;
  rankStars?: number;
  stars?: number;
  experience?: string;
  exp?: string;
  level?: string;
  bio?: string;
  description?: string;
  about?: string;
  isLookingForTeam?: boolean;
  lookingForTeam?: boolean;
  teamStatus?: boolean;
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    youtube?: string;
    twitch?: string;
    discord?: string;
    website?: string;
  };
  social?: {
    twitter?: string;
    instagram?: string;
    youtube?: string;
    twitch?: string;
    discord?: string;
    website?: string;
  };
  highlightVideo?: string;
  video?: string;
  clip?: string;
  mlbbId?: string; // MLBB Game ID (optional)
}

// Game information (MLBB only)
const gameInfo = {
  name: "Mobile Legends",
  category: "Mobile" as const,
  description: "Mobile MOBA game",
  roles: ["Roamer", "Exp Laner", "Core", "Mid Laner", "Gold Laner", "Support", "Fill"],
  ranks: [
    "Warrior",
    "Elite",
    "Master",
    "Grandmaster",
    "Epic",
    "Legend",
    "Mythic",
    "Mythical Glory",
    "+Mythical Immortal",
  ],
};

export default function PlayersPage() {
  const { user } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("Бүх Үүргүүд");
  const [selectedRank, setSelectedRank] = useState("Бүх Ранкууд");
  const [minStars, setMinStars] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"stars" | "name" | "rank">("name");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  // Handle opening chat modal
  const handleOpenChat = (player: Player) => {
    if (!user) {
      alert("Та чатлахын тулд нэвтэрх хэрэгтэй");
      return;
    }
    setSelectedPlayer(player);
    setIsChatModalOpen(true);
  };

  // Handle closing chat modal
  const handleCloseChat = () => {
    setIsChatModalOpen(false);
    setSelectedPlayer(null);
  };

  // Fetch players from API
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setLoading(true);
        setLoadError(false);
        const response = await fetch(API_ENDPOINTS.PLAYER_PROFILES.ALL, { signal: AbortSignal.timeout(8000) });

        if (!response.ok) {
          throw new Error("Failed to fetch players");
        }

        const data = await response.json();
        const allPlayers = Array.isArray(data.profiles) ? data.profiles : [];

        // Accept ANY player object and try to extract useful information
        const gamePlayers = allPlayers
          .filter((player: FlexiblePlayerData) => {
            // Accept any player object
            if (!player || typeof player !== "object") {
              return false;
            }

            // Try to find a name field (could be 'name', 'username', 'displayName', etc.)
            const playerName =
              player.name ||
              player.username ||
              player.displayName ||
              player.playerName ||
              "Unknown Player";

            // Check if player matches this game (very flexible matching)
            const playerGame =
              player.game ||
              player.gameType ||
              player.gameName ||
              player.category ||
              "";
            const gameName = gameInfo.name || "";

            // Very flexible game matching
            const matchesGame =
              !playerGame || // If no game specified, include them
              playerGame.toLowerCase().includes("mobile") ||
              playerGame.toLowerCase().includes("legends") ||
              playerGame.toLowerCase().includes("moba") ||
              gameName.toLowerCase().includes(playerGame.toLowerCase());

            return Boolean((player.id || player._id || player.playerId) && playerName && matchesGame);
          })
          .map(
            (player: FlexiblePlayerData): Player => ({
              id: player.id || player._id || player.playerId || "",
              name:
                player.name ||
                player.username ||
                player.displayName ||
                player.playerName ||
                "Unknown Player",
              avatar:
                player.avatar || player.avatarUrl || player.profilePicture,
              avatarPublicId: player.avatarPublicId || player.avatarId,
              category:
                player.category === "PC" || player.platform === "PC"
                  ? "PC"
                  : "Mobile",
              game:
                player.game ||
                player.gameType ||
                player.gameName ||
                gameInfo.name,
              roles: Array.isArray(player.roles)
                ? player.roles
                : Array.isArray(player.role)
                ? player.role
                : player.role
                ? [player.role]
                : [],
              inGameName:
                player.inGameName || player.ign || player.gameUsername,
              mlbbId: player.mlbbId, // Add mlbbId
              rank: player.rank || player.rankLevel || "Unknown",
              rankStars: player.rankStars || player.stars || 0,
              experience:
                player.experience || player.exp || player.level || "Unknown",
              bio: player.bio || player.description || player.about,
              description: player.description || player.bio || player.about,
              isLookingForTeam: Boolean(
                player.isLookingForTeam ||
                  player.lookingForTeam ||
                  player.teamStatus
              ),
              socialLinks: player.socialLinks || player.social || {},
              highlightVideo:
                player.highlightVideo || player.video || player.clip,
            })
          );

        setPlayers(gamePlayers);
      } catch (error) {
        console.error("Error fetching players:", error);
        setPlayers([]);
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, []);

  // Filter and sort players
  useEffect(() => {
    let filtered = [...players];

    // Filter by search term (improved search logic)
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((player) => {
        const playerName = (player.name || "").toLowerCase();
        const playerBio = (
          player.bio ||
          player.description ||
          ""
        ).toLowerCase();
        const playerInGameName = (player.inGameName || "").toLowerCase();
        const playerMlbbId = (player.mlbbId || "").toLowerCase();

        return (
          playerName.includes(searchLower) ||
          playerBio.includes(searchLower) ||
          playerInGameName.includes(searchLower) ||
          playerMlbbId.includes(searchLower)
        );
      });
    }

    // Filter by role
    if (selectedRole !== "Бүх Үүргүүд") {
      filtered = filtered.filter((player) => {
        const playerRoles = player.roles || [];
        return Array.isArray(playerRoles) && playerRoles.includes(selectedRole);
      });
    }

    // Filter by rank
    if (selectedRank !== "Бүх Ранкууд") {
      filtered = filtered.filter((player) => {
        const playerRank = player.rank || "";
        return playerRank === selectedRank;
      });
    }

    // Filter by minimum stars (works for all players with stars, not just Mythical Glory)
    if (minStars !== null && minStars > 0) {
      filtered = filtered.filter((player) => {
        const playerStars = player.rankStars || 0;
        return playerStars >= minStars;
      });
    }

    // Sort players with improved logic
    try {
      filtered.sort((a, b) => {
        switch (sortBy) {
          case "stars":
            // Sort by stars (highest first), then by rank
            const aStars = a.rankStars || 0;
            const bStars = b.rankStars || 0;
            if (aStars !== bStars) {
              return bStars - aStars; // Higher stars first
            }
            // If same stars, sort by rank
            const aRank = a.rank || "";
            const bRank = b.rank || "";
            return getRankValue(bRank) - getRankValue(aRank);

          case "rank":
            // Sort by rank (highest first)
            const aRankForSort = a.rank || "";
            const bRankForSort = b.rank || "";
            return getRankValue(bRankForSort) - getRankValue(aRankForSort);

          case "name":
          default:
            // Sort by name alphabetically with null safety
            const aName = a.name || "";
            const bName = b.name || "";
            return aName.localeCompare(bName);
        }
      });
    } catch (error) {
      console.error("Error sorting players:", error);
      // If sorting fails, keep original order
      }

    setFilteredPlayers(filtered);
  }, [players, searchTerm, selectedRole, selectedRank, minStars, sortBy]);

  // Helper function to get rank value for sorting
  const getRankValue = (rank: string): number => {
    const rankValues: { [key: string]: number } = {
      Warrior: 1,
      Elite: 2,
      Master: 3,
      Grandmaster: 4,
      Epic: 5,
      Legend: 6,
      Mythic: 7,
      "Mythical Glory": 8,
      "+Mythical Immortal": 9,
    };
    return rankValues[rank] || 0;
  };

  const getCategoryIcon = (category: "PC" | "Mobile") => {
    return category === "PC" ? (
      <Monitor className="w-4 h-4 text-blue-400" />
    ) : (
      <Smartphone className="w-4 h-4 text-blue-400" />
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080d19]">
          <main className="py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
              <p className="mt-4 text-gray-300">
                Loading {gameInfo.name} players...
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080d19]">

      <main className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent mb-4">
                {gameInfo.name}
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-4">
                {gameInfo.description}
              </p>
              <div className="flex items-center justify-center space-x-4 text-sm text-gray-400">
                <div className="flex items-center space-x-1">
                  {getCategoryIcon(gameInfo.category)}
                  <span>{gameInfo.category}</span>
                </div>
                <span>•</span>
                <span>{players.length} тоглогч</span>
              </div>
            </div>
          </motion.div>

          {/* Search and Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-6 mb-8 border border-gray-700"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Тоглогчдыг хайх..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
                />
              </div>

              {/* Role Filter */}
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="px-4 py-3 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
              >
                <option value="Бүх Үүргүүд">Бүх Үүргүүд</option>
                {gameInfo.roles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>

              {/* Rank Filter */}
              <select
                value={selectedRank}
                onChange={(e) => setSelectedRank(e.target.value)}
                className="px-4 py-3 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
              >
                <option value="Бүх Ранкууд">Бүх Ранкууд</option>
                {gameInfo.ranks.map((rank) => (
                  <option key={rank} value={rank}>
                    {rank}
                  </option>
                ))}
              </select>

              {/* Star Counter Filter (works for all players with stars) */}
              <div className="relative">
                <input
                  type="number"
                  placeholder="Мин. Од"
                  min="1"
                  max="999"
                  value={minStars || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                      setMinStars(value ? parseInt(value) : null);
                    }}
                    className="w-full px-4 py-3 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                    ⭐
                  </div>
                </div>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as "stars" | "name" | "rank")
                }
                className="px-4 py-3 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
              >
                <option value="name">Нэрээр эрэмбэлэх</option>
                <option value="rank">Ранкаар эрэмбэлэх</option>
                <option value="stars">Одоор эрэмбэлэх</option>
              </select>
            </div>

            {/* Clear Filters Button */}
            {(searchTerm ||
              selectedRole !== "Бүх Үүргүүд" ||
              selectedRank !== "Бүх Ранкууд" ||
              minStars !== null) && (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedRole("Бүх Үүргүүд");
                    setSelectedRank("Бүх Ранкууд");
                    setMinStars(null);
                    setSortBy("name");
                  }}
                  className="px-4 py-2 text-sm text-gray-300 hover:text-purple-400 transition-colors duration-200"
                >
                  Шүүлтүүрүүдийг цэвэрлэх
                </button>
              </div>
            )}
          </motion.div>

          {/* Results Count */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <p className="text-gray-300">
                Олдсон{" "}
                <span className="font-semibold text-blue-400">
                  {filteredPlayers.length}
                </span>{" "}
                тоглогч
              </p>

              {/* Active Filters Display */}
              <div className="flex flex-wrap gap-2 text-sm">
                {selectedRank === "Mythical Glory" && minStars !== null && (
                  <span className="px-2 py-1 bg-purple-900/50 text-purple-300 rounded-full border border-purple-700">
                    ⭐ {minStars}+ одтой Mythical Glory
                  </span>
                )}
                {sortBy === "stars" && (
                  <span className="px-2 py-1 bg-blue-900/50 text-blue-300 rounded-full border border-blue-700">
                    Одоор эрэмбэлэгдсэн
                  </span>
                )}
                {sortBy === "rank" && (
                  <span className="px-2 py-1 bg-green-900/50 text-green-300 rounded-full border border-green-700">
                    Ранкаар эрэмбэлэгдсэн
                  </span>
                )}
              </div>
            </div>
          </motion.div>

          {/* Players Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
          >
            {filteredPlayers.map((player, index) => (
              <PlayerCard
                key={player.id}
                player={player}
                index={index}
                onOpenChat={handleOpenChat}
              />
            ))}
          </motion.div>

          {loadError ? (
            <ServiceState mode="offline" title="Тоглогчдын мэдээлэл түр боломжгүй" description="Хуучин үйлчилгээтэй холбогдож чадсангүй. Тоглогчдын мэдээллийг одоогоор баталгаатай харуулах боломжгүй байна." />
          ) : !loading && filteredPlayers.length === 0 ? (
            <ServiceState mode="empty"
              title={players.length === 0 ? "Тоглогчдын жагсаалт одоогоор хоосон" : "Шүүлтүүрт тохирох тоглогч алга"}
              description={players.length === 0 ? "Бодит профайлууд нэмэгдэхэд энд харагдана." : "Хайлтын нөхцөлөө өөрчлөөд дахин оролдоорой."}
            />
          ) : null}
        </div>
      </main>

      {/* Chat Modal */}
      {selectedPlayer && (
        <ChatModal
          isOpen={isChatModalOpen}
          onClose={handleCloseChat}
          playerId={selectedPlayer.id}
          playerName={selectedPlayer.name}
          playerAvatar={selectedPlayer.avatar}
        />
      )}
    </div>
  );
}
