"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  Medal,
  Award,
  Star,
  Crown,
  Zap,
  Calendar,
  Clock,
  Users,
} from "lucide-react";
import { API_ENDPOINTS } from "@/config/api";

interface LeaderboardEntry {
  _id: string;
  userId: {
    _id: string;
    name: string;
    avatar?: string;
  };
  leaderboardType: string;
  period: string;
  score: number;
  rank: number;
  metadata?: {
    game?: string;
    category?: string;
    season?: string;
  };
  lastUpdated: string;
}

interface LeaderboardProps {
  type?: string;
  period?: string;
  limit?: number;
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Trophy className="w-6 h-6 text-yellow-500" />;
    case 2:
      return <Medal className="w-6 h-6 text-gray-400" />;
    case 3:
      return <Medal className="w-6 h-6 text-amber-600" />;
    default:
      return <Award className="w-5 h-5 text-gray-500" />;
  }
};

const getRankColor = (rank: number) => {
  switch (rank) {
    case 1:
      return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white";
    case 2:
      return "bg-gradient-to-r from-gray-300 to-gray-500 text-white";
    case 3:
      return "bg-gradient-to-r from-amber-400 to-amber-600 text-white";
    default:
      return "bg-gray-700 text-white";
  }
};

export default function Leaderboard({ type = "ACHIEVEMENT_POINTS", period = "ALL_TIME", limit = 50 }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, [type, period, limit]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_ENDPOINTS.ACHIEVEMENTS.LEADERBOARD}?type=${type}&period=${period}&limit=${limit}`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch leaderboard");
      }

      const data = await response.json();
      setLeaderboard(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getLeaderboardTitle = () => {
    const typeMap: { [key: string]: string } = {
      ACHIEVEMENT_POINTS: "Achievement Points",
      TOURNAMENT_WINS: "Tournament Wins",
      MATCH_WINS: "Match Wins",
      BOUNTY_COINS: "Bounty Coins",
      LEVEL: "Level",
      SEASONAL: "Seasonal",
    };

    const periodMap: { [key: string]: string } = {
      DAILY: "Daily",
      WEEKLY: "Weekly",
      MONTHLY: "Monthly",
      SEASONAL: "Seasonal",
      ALL_TIME: "All Time",
    };

    return `${periodMap[period]} ${typeMap[type]} Leaderboard`;
  };

  const getScoreLabel = () => {
    const labelMap: { [key: string]: string } = {
      ACHIEVEMENT_POINTS: "Points",
      TOURNAMENT_WINS: "Wins",
      MATCH_WINS: "Wins",
      BOUNTY_COINS: "Coins",
      LEVEL: "Level",
      SEASONAL: "Score",
    };
    return labelMap[type] || "Score";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={fetchLeaderboard}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">{getLeaderboardTitle()}</h2>
        <p className="text-gray-300">Top performers in the community</p>
      </div>

      {/* Leaderboard */}
      <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Player
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  {getScoreLabel()}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Last Updated
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {leaderboard.map((entry, index) => (
                <motion.tr
                  key={entry._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`hover:bg-gray-700 transition-colors ${
                    entry.rank <= 3 ? "font-semibold" : ""
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getRankIcon(entry.rank)}
                      <span className={`text-lg font-bold ${
                        entry.rank <= 3 ? "text-white" : "text-gray-300"
                      }`}>
                        #{entry.rank}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {entry.userId.avatar ? (
                          <img
                            className="h-10 w-10 rounded-full object-cover"
                            src={entry.userId.avatar}
                            alt={entry.userId.name}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <Users className="h-5 w-5 text-gray-600" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">
                          {entry.userId.name}
                        </div>
                        {entry.metadata?.game && (
                          <div className="text-sm text-gray-400">
                            {entry.metadata.game}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm font-medium text-white">
                        {entry.score.toLocaleString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>
                        {new Date(entry.lastUpdated).toLocaleDateString()}
                      </span>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Podium for top 3 */}
      {leaderboard.length >= 3 && (
        <div className="bg-gradient-to-br from-yellow-900/30 to-amber-900/30 rounded-xl p-6">
          <h3 className="text-lg font-bold text-center mb-6 text-white">Podium</h3>
          <div className="flex justify-center items-end space-x-4">
            {/* 2nd Place */}
            {leaderboard[1] && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center"
              >
                <div className="bg-gray-300 rounded-t-lg p-4 mb-2 h-20 flex items-center justify-center">
                  <Medal className="w-8 h-8 text-gray-600" />
                </div>
                <div className="bg-gray-600 rounded-lg p-3 shadow-md">
                  <div className="font-bold text-white">#{leaderboard[1].rank}</div>
                  <div className="text-sm text-gray-300">{leaderboard[1].userId.name}</div>
                  <div className="text-xs text-gray-400">{leaderboard[1].score}</div>
                </div>
              </motion.div>
            )}

            {/* 1st Place */}
            {leaderboard[0] && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-center"
              >
                <div className="bg-yellow-400 rounded-t-lg p-4 mb-2 h-24 flex items-center justify-center">
                  <Crown className="w-10 h-10 text-yellow-800" />
                </div>
                <div className="bg-gray-600 rounded-lg p-3 shadow-md">
                  <div className="font-bold text-white">#{leaderboard[0].rank}</div>
                  <div className="text-sm text-gray-300">{leaderboard[0].userId.name}</div>
                  <div className="text-xs text-gray-400">{leaderboard[0].score}</div>
                </div>
              </motion.div>
            )}

            {/* 3rd Place */}
            {leaderboard[2] && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center"
              >
                <div className="bg-amber-600 rounded-t-lg p-4 mb-2 h-16 flex items-center justify-center">
                  <Medal className="w-6 h-6 text-amber-200" />
                </div>
                <div className="bg-gray-600 rounded-lg p-3 shadow-md">
                  <div className="font-bold text-white">#{leaderboard[2].rank}</div>
                  <div className="text-sm text-gray-300">{leaderboard[2].userId.name}</div>
                  <div className="text-xs text-gray-400">{leaderboard[2].score}</div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
