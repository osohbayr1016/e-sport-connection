"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ProPlayer } from "@/types/proPlayer";
import proPlayerApi from "@/config/proPlayerApi";
import {
  StarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  TrophyIcon,
} from "@heroicons/react/24/solid";
import { StarIcon as StarOutlineIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

const games = ["Mobile Legends: Bang Bang"];

export default function AccountBoostingPage() {
  const [proPlayers, setProPlayers] = useState<ProPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string>("");

  const fetchProPlayers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await proPlayerApi.getProPlayers({
        game: selectedGame || undefined,
        page: currentPage,
        limit: 12,
      });

      if (currentPage === 1) {
        setProPlayers(response.proPlayers);
      } else {
        setProPlayers((prev) => [...prev, ...response.proPlayers]);
      }

      setHasMore(response.pagination.hasMore);
      setError("");
    } catch (err) {
      setError("Failed to load pro players. Please try again.");
      console.error("Error fetching pro players:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedGame, currentPage]);

  useEffect(() => {
    fetchProPlayers();
  }, [selectedGame, currentPage]);

  const loadMore = () => {
    setCurrentPage((prev) => prev + 1);
  };

  const resetFilters = () => {
    setSelectedGame("");
    setCurrentPage(1);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i}>
          {i <= rating ? (
            <StarIcon className="w-4 h-4 text-yellow-400 inline" />
          ) : (
            <StarOutlineIcon className="w-4 h-4 text-gray-300 inline" />
          )}
        </span>
      );
    }
    return stars;
  };

  if (loading && currentPage === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-white mt-4 text-lg">
              Loading professional players...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative container mx-auto px-4 py-20 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            MLBB Account Boosting
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-3xl mx-auto">
            Get boosted by verified professional Mobile Legends: Bang Bang
            players. Fast, secure, and guaranteed results.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <div className="bg-blue-600/20 backdrop-blur-sm border border-blue-500/30 rounded-lg px-6 py-3">
              <TrophyIcon className="w-6 h-6 text-blue-400 inline mr-2" />
              <span className="text-blue-200 font-semibold">Verified Pros</span>
            </div>
            <div className="bg-green-600/20 backdrop-blur-sm border border-green-500/30 rounded-lg px-6 py-3">
              <ClockIcon className="w-6 h-6 text-green-400 inline mr-2" />
              <span className="text-green-200 font-semibold">
                Fast Delivery
              </span>
            </div>
            <div className="bg-purple-600/20 backdrop-blur-sm border border-purple-500/30 rounded-lg px-6 py-3">
              <StarIcon className="w-6 h-6 text-purple-400 inline mr-2" />
              <span className="text-purple-200 font-semibold">Top Rated</span>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/account-boosting/apply"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold text-lg rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <TrophyIcon className="w-6 h-6 mr-2" />
              Apply to Become a Pro MLBB Player
            </Link>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <label className="text-white font-medium">Filter by Rank:</label>
              <select
                value={selectedGame}
                onChange={(e) => {
                  setSelectedGame(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Ranks</option>
                {games.map((game) => (
                  <option key={game} value={game}>
                    {game}
                  </option>
                ))}
              </select>
            </div>

            {selectedGame && (
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Pro Players Grid */}
      <div className="container mx-auto px-4 pb-20">
        {error && (
          <div className="text-center py-8">
            <div className="bg-red-600/20 border border-red-500/30 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-red-200">{error}</p>
              <button
                onClick={fetchProPlayers}
                className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {proPlayers.length === 0 && !loading && !error && (
          <div className="text-center py-20">
            <TrophyIcon className="w-24 h-24 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-gray-300 mb-2">
              No Pro Players Found
            </h3>
            <p className="text-gray-400 mb-6">
              {selectedGame
                ? `No pro players available for ${selectedGame}`
                : "No MLBB pro players available at the moment"}
            </p>
            {selectedGame && (
              <button
                onClick={resetFilters}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
              >
                View All Games
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {proPlayers.map((player) => (
            <div
              key={player._id}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20"
            >
              {/* Player Header */}
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl mr-4">
                    {player.userId.avatar ? (
                      <Image
                        src={player.userId.avatar}
                        alt={player.userId.name}
                        width={64}
                        height={64}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span>{player.userId.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {player.userId.name}
                    </h3>
                    <div className="flex items-center">
                      {renderStars(player.rating)}
                      <span className="text-gray-400 ml-2 text-sm">
                        ({player.totalReviews})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Game Info */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-blue-400 font-medium">
                      {player.game}
                    </span>
                    <span className="text-green-400 font-semibold">
                      ${player.price}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-300">
                    <span>Current: {player.currentRank}</span>
                    <span>Target: {player.targetRank}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div className="text-center bg-gray-700/50 rounded-lg p-3">
                    <div className="text-blue-400 font-semibold">
                      {player.totalBoosts}
                    </div>
                    <div className="text-gray-400">Total Boosts</div>
                  </div>
                  <div className="text-center bg-gray-700/50 rounded-lg p-3">
                    <div className="text-green-400 font-semibold">
                      {player.successfulBoosts}
                    </div>
                    <div className="text-gray-400">Successful</div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                  {player.description}
                </p>

                {/* Time Estimate */}
                <div className="flex items-center text-gray-400 text-sm mb-4">
                  <ClockIcon className="w-4 h-4 mr-2" />
                  Estimated time: {player.estimatedTime}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Link
                    href={`/account-boosting/${player._id}`}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-center py-2 px-4 rounded-lg transition-colors font-medium"
                  >
                    View Details
                  </Link>
                  <button className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors">
                    <CurrencyDollarIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More */}
        {hasMore && (
          <div className="text-center mt-12">
            <button
              onClick={loadMore}
              disabled={loading}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
            >
              {loading ? "Loading..." : "Load More Pro Players"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
