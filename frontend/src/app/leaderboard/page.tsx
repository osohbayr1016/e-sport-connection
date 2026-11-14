"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  Medal,
  Crown,
  Star,
  TrendingUp,
  Users,
  Target,
  Coins,
  Award,
  Filter,
  RefreshCw,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { API_ENDPOINTS } from "../../config/api";

interface LeaderboardSquad {
  _id: string;
  name: string;
  tag: string;
  logo?: string;
  division: string;
  level: number;
  leader: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  members: Array<{
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  }>;
  matchStats: {
    wins: number;
    losses: number;
    draws: number;
    totalMatches: number;
    winRate: number;
    totalEarned: number;
  };
  currentBountyCoins: number;
  totalBountyCoinsEarned: number;
  score: number;
  createdAt: string;
}

export default function LeaderboardPage() {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardSquad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"score" | "totalEarned" | "winRate" | "totalMatches">("score");

  useEffect(() => {
    fetchLeaderboard();
  }, [sortBy]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_ENDPOINTS.SQUADS.LEADERBOARD}?limit=100&sortBy=${sortBy}`,
        { credentials: "include" }
      );
      const data = await response.json();
      
      if (data.success) {
        // Calculate dynamic winrate for each squad
        const leaderboardWithCalculatedWinrate = data.data.map((squad: LeaderboardSquad) => {
          const totalMatches = squad.matchStats.wins + squad.matchStats.losses + squad.matchStats.draws;
          const calculatedWinRate = totalMatches > 0 ? Math.round((squad.matchStats.wins / totalMatches) * 100) : 0;
          
          return {
            ...squad,
            matchStats: {
              ...squad.matchStats,
              winRate: calculatedWinRate
            }
          };
        });
        
        setLeaderboardData(leaderboardWithCalculatedWinrate);
      } else {
        setError("Failed to fetch leaderboard data");
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      setError("Failed to fetch leaderboard data");
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (index === 1) return <Medal className="w-6 h-6 text-gray-400" />;
    if (index === 2) return <Medal className="w-6 h-6 text-amber-600" />;
    return <span className="text-lg font-bold text-gray-400">#{index + 1}</span>;
  };

  const getDivisionColor = (division: string) => {
    switch (division) {
      case "BRONZE":
        return "text-amber-600 bg-amber-100";
      case "SILVER":
        return "text-gray-600 bg-gray-100";
      case "GOLD":
        return "text-yellow-600 bg-yellow-100";
      case "PLATINUM":
        return "text-blue-600 bg-blue-100";
      case "DIAMOND":
        return "text-purple-600 bg-purple-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getDivisionIcon = (division: string) => {
    switch (division) {
      case "BRONZE":
        return "🥉";
      case "SILVER":
        return "🥈";
      case "GOLD":
        return "🥇";
      case "PLATINUM":
        return "💎";
      case "DIAMOND":
        return "💠";
      default:
        return "🏆";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={fetchLeaderboard}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-purple-900 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
              <h1 className="text-3xl font-bold text-white mb-2">
                Squad Leaderboard
              </h1>
              <p className="text-gray-300 mb-6">
                Top performing squads ranked by performance
              </p>
            </motion.div>

            {/* Sort Controls */}
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={() => setSortBy("score")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  sortBy === "score"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                <Star className="w-3 h-3 inline mr-1" />
                Score
              </button>
              <button
                onClick={() => setSortBy("totalEarned")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  sortBy === "totalEarned"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                <Coins className="w-3 h-3 inline mr-1" />
                Coins
              </button>
              <button
                onClick={() => setSortBy("winRate")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  sortBy === "winRate"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                <TrendingUp className="w-3 h-3 inline mr-1" />
                Win Rate
              </button>
              <button
                onClick={() => setSortBy("totalMatches")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  sortBy === "totalMatches"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                <Target className="w-3 h-3 inline mr-1" />
                Matches
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-3">
          {leaderboardData.map((squad, index) => (
            <motion.div
              key={squad._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className={`bg-gray-800 rounded-lg p-4 border transition-all hover:shadow-md ${
                index < 3
                  ? "border-yellow-500 shadow-yellow-500/10"
                  : "border-gray-700 hover:border-gray-600"
              }`}
            >
              <div className="flex items-center justify-between">
                {/* Rank and Squad Info */}
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-8 h-8">
                    {getRankIcon(index)}
                  </div>

                  <div className="flex items-center space-x-3">
                    {squad.logo ? (
                      <Image
                        src={squad.logo}
                        alt={squad.name}
                        width={40}
                        height={40}
                        className="rounded-lg"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-gray-400" />
                      </div>
                    )}

                    <div>
                      <h3 className="text-lg font-bold text-white">
                        {squad.name}
                      </h3>
                      <div className="flex items-center space-x-3 text-sm">
                        <span className="text-gray-400">[{squad.tag}]</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${getDivisionColor(
                            squad.division
                          )}`}
                        >
                          {getDivisionIcon(squad.division)} {squad.division}
                        </span>
                        <span className="text-gray-400">
                          Lv.{squad.level}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-lg font-bold text-white">
                      {squad.matchStats.totalMatches}
                    </div>
                    <div className="text-xs text-gray-400">Matches</div>
                  </div>

                  <div className="text-center">
                    <div className="text-lg font-bold text-green-500">
                      {squad.matchStats.winRate.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-400">Win Rate</div>
                  </div>

                  <div className="text-center">
                    <div className="text-lg font-bold text-yellow-500">
                      {squad.matchStats.totalEarned}
                    </div>
                    <div className="text-xs text-gray-400">Coins</div>
                  </div>

                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-500">
                      {squad.score.toFixed(0)}
                    </div>
                    <div className="text-xs text-gray-400">Score</div>
                  </div>

                  <div className="text-right">
                    <Link
                      href={`/squads/${squad._id}`}
                      className="text-blue-500 hover:text-blue-400 text-sm font-medium"
                    >
                      View →
                    </Link>
                  </div>
                </div>
              </div>

              {/* Compact Stats Bar */}
              <div className="mt-3 pt-3 border-t border-gray-700">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center space-x-4">
                    <span className="text-green-500">● {squad.matchStats.wins}W</span>
                    <span className="text-red-500">● {squad.matchStats.losses}L</span>
                    <span className="text-gray-500">● {squad.matchStats.draws}D</span>
                  </div>
                  <div>
                    Balance: {squad.currentBountyCoins} coins
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {leaderboardData.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-400 mb-2">
              No squads found
            </h3>
            <p className="text-gray-500">
              There are no active squads to display on the leaderboard.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
