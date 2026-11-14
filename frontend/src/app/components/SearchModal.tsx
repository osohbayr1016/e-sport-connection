"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Trophy, User, Gamepad2, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { API_ENDPOINTS } from "../../config/api";
import { safeFetch, parseJsonSafe } from "../../lib/safeFetch";
import { handleImageError, getImageUrl } from "../../utils/imageUtils";

interface SearchResult {
  id: string;
  type: "tournament" | "player";
  title: string;
  description: string;
  image?: string;
  url: string;
  game?: string;
  playerId?: string;
  category?: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // Enhanced search matching function
  const isMatch = (text: string, query: string): boolean => {
    if (!text || !query) return false;

    const textLower = text.toLowerCase();
    const queryLower = query.toLowerCase();

    // Exact match (highest priority)
    if (textLower === queryLower) return true;

    // Starts with query (high priority)
    if (textLower.startsWith(queryLower)) return true;

    // Contains query (medium priority)
    if (textLower.includes(queryLower)) return true;

    // Word boundary match (low priority)
    const words = textLower.split(/\s+/);
    return words.some((word) => word.startsWith(queryLower));
  };

  const searchContent = async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      const searchResults: SearchResult[] = [];

      // Search Tournaments
      try {
        const tournamentsResponse = await safeFetch(
          `${API_ENDPOINTS.TOURNAMENTS.ALL}?search=${encodeURIComponent(
            query
          )}&limit=5`,
          { retries: 1, retryDelayMs: 300, timeoutMs: 5000 }
        );

        if (tournamentsResponse.ok) {
          const tournamentsData = await parseJsonSafe(tournamentsResponse);
          if (tournamentsData?.success && tournamentsData.tournaments) {
            tournamentsData.tournaments.forEach((item: any) => {
              if (isMatch(item.name, query)) {
                searchResults.push({
                  id: item._id || item.id,
                  type: "tournament",
                  title: item.name,
                  description: item.description,
                  image: item.bannerImage,
                  url: `/tournaments/${item._id || item.id}`,
                  game: item.game,
                });
              }
            });
          }
        }
      } catch (error) {
        console.error("Error searching tournaments:", error);
      }

      // Search Players
      try {
        console.log("=== PLAYER SEARCH DEBUG ===");
        console.log("Searching players for query:", query);
        console.log("API endpoint:", `${API_ENDPOINTS.PLAYER_PROFILES.ALL}`);

        const playerUrl = `${
          API_ENDPOINTS.PLAYER_PROFILES.ALL
        }?search=${encodeURIComponent(query)}&limit=10`;
        console.log("Full URL:", playerUrl);

        // Use same approach as tournaments - add search parameter to force fresh request
        const playersResponse = await safeFetch(playerUrl, {
          retries: 1,
          retryDelayMs: 300,
          timeoutMs: 5000,
        });

        console.log("Players response status:", playersResponse.status);
        console.log("Players response ok:", playersResponse.ok);

        if (playersResponse.ok) {
          const playersData = await parseJsonSafe(playersResponse);
          console.log("Players API response:", playersData);

          // Handle different possible response structures
          let profiles = [];
          if (playersData?.success && playersData.profiles) {
            profiles = playersData.profiles;
          } else if (playersData?.success && playersData.players) {
            profiles = playersData.players;
          } else if (Array.isArray(playersData)) {
            profiles = playersData;
          } else if (playersData?.data && Array.isArray(playersData.data)) {
            profiles = playersData.data;
          }

          console.log("Total players found:", profiles.length);

          profiles.forEach((item: any, index: number) => {
            console.log(`Player ${index}:`, {
              inGameName: item.inGameName,
              gameName: item.gameName,
              userName: item.user?.name,
              playerId: item.playerId,
              name: item.name,
              fullItem: item,
            });

            // Check what fields actually contain the search term
            // Focus on inGameName (the correct field) and playerId
            const inGameNameMatch = isMatch(item.inGameName, query);
            const playerIdMatch = isMatch(item.playerId, query);

            // Also check other possible fields as fallback
            const gameNameMatch = isMatch(item.gameName, query);
            const userNameMatch = isMatch(item.user?.name, query);
            const nameMatch = isMatch(item.name, query);

            console.log(`Searching for "${query}":`, {
              inGameNameMatch,
              playerIdMatch,
              gameNameMatch,
              userNameMatch,
              nameMatch,
              inGameNameValue: item.inGameName,
              playerIdValue: item.playerId,
              gameNameValue: item.gameName,
              userNameValue: item.user?.name,
              nameValue: item.name,
            });

            // Focus only on player name (inGameName) and ID like tournaments
            if (
              inGameNameMatch ||
              playerIdMatch ||
              gameNameMatch ||
              userNameMatch ||
              nameMatch
            ) {
              console.log(
                "MATCH FOUND for player:",
                item.inGameName || item.gameName || item.user?.name || item.name
              );
              searchResults.push({
                id: item._id || item.id,
                type: "player",
                title:
                  item.inGameName ||
                  item.gameName ||
                  item.user?.name ||
                  item.name,
                description: item.bio || "Professional gamer",
                image: item.avatar,
                url: `/players/${item._id || item.id}`,
                game: item.mainGame,
                playerId: item.playerId,
              });
            }
          });
        } else {
          console.log(
            "Players API response not ok:",
            playersResponse.status,
            playersResponse.statusText
          );
          console.log("Response headers:", playersResponse.headers);
        }
      } catch (error) {
        console.error("Error searching players:", error);
        console.error(
          "Error details:",
          error instanceof Error ? error.message : String(error)
        );
      }

      console.log("=== END PLAYER SEARCH DEBUG ===");
      console.log("Final search results:", searchResults);

      setResults(searchResults);
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Debounce search
    const timeoutId = setTimeout(() => {
      searchContent(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case "tournament":
        return <Trophy className="w-4 h-4" />;
      case "player":
        return <User className="w-4 h-4" />;
      default:
        return <Search className="w-4 h-4" />;
    }
  };

  const getResultColor = (type: string) => {
    switch (type) {
      case "tournament":
        return "text-purple-500";
      case "player":
        return "text-green-500";
      default:
        return "text-gray-500";
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("mn-MN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 w-full max-w-2xl mx-4 bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 z-50"
          >
            {/* Search Input */}
            <div className="p-6 border-b border-gray-700">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Хайх..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full pl-12 pr-12 py-4 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
                <button
                  onClick={onClose}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
                  <p className="mt-2 text-gray-400">
                    Хайж байна...
                  </p>
                </div>
              ) : hasSearched && results.length === 0 ? (
                <div className="p-6 text-center">
                  <Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-400">
                    &quot;{searchQuery}&quot; гэсэн үр дүн олдсонгүй
                  </p>
                </div>
              ) : results.length > 0 ? (
                <div className="p-2">
                  {results.map((result, index) => (
                    <motion.div
                      key={result.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link
                        href={result.url}
                        onClick={onClose}
                        className="block p-4 hover:bg-gray-700 transition-colors rounded-lg group"
                      >
                        <div className="flex items-start space-x-4">
                          {/* Image */}
                          <div className="w-12 h-12 relative flex-shrink-0">
                            {result.image ? (
                              <Image
                                src={getImageUrl(result.image)}
                                alt={result.title}
                                fill
                                className="rounded-lg object-cover"
                                onError={handleImageError}
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center">
                                {getResultIcon(result.type)}
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <div className={`${getResultColor(result.type)}`}>
                                {getResultIcon(result.type)}
                              </div>
                              <span className="text-sm font-medium text-gray-400 capitalize">
                                {result.type}
                              </span>
                              {result.category && (
                                <span className="text-xs text-gray-300 bg-gray-600 px-2 py-1 rounded">
                                  {result.category}
                                </span>
                              )}
                            </div>

                            <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                              {result.title}
                            </h3>

                            <p className="text-sm text-gray-300 line-clamp-2 mt-1">
                              {result.description}
                            </p>

                            {/* Meta info */}
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                              {result.game && (
                                <span className="flex items-center space-x-1">
                                  <Gamepad2 className="w-3 h-3" />
                                  <span>{result.game}</span>
                                </span>
                              )}
                              {result.playerId && (
                                <span className="bg-gray-600 px-2 py-1 rounded">
                                  ID: {result.playerId}
                                </span>
                              )}
                            </div>
                          </div>

                          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors flex-shrink-0" />
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-400">
                    Хайх зүйлээ оруулна уу
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
