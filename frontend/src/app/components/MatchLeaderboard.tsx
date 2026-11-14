import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, TrendingUp, Award, Users } from "lucide-react";
import { API_ENDPOINTS } from "../../config/api";
import Link from "next/link";

export default function MatchLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_ENDPOINTS.SQUADS}?limit=100`, {
        credentials: "include",
      });
      const data = await response.json();

      if (data.success) {
        // Calculate dynamic winrate and sort by match stats (wins desc)
        const sorted = data.data
          .filter((s: any) => s.matchStats && s.matchStats.totalMatches > 0)
          .map((squad: any) => {
            const totalMatches = squad.matchStats.wins + squad.matchStats.losses + squad.matchStats.draws;
            const calculatedWinRate = totalMatches > 0 ? Math.round((squad.matchStats.wins / totalMatches) * 100) : 0;
            
            return {
              ...squad,
              matchStats: {
                ...squad.matchStats,
                winRate: calculatedWinRate
              }
            };
          })
          .sort((a: any, b: any) => {
            // Sort by wins first, then win rate
            if (b.matchStats.wins !== a.matchStats.wins) {
              return b.matchStats.wins - a.matchStats.wins;
            }
            return b.matchStats.winRate - a.matchStats.winRate;
          })
          .slice(0, 10);

        setLeaderboard(sorted);
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 mt-8">
        <h3 className="text-2xl font-bold text-white mb-4">
          Match Leaderboard
        </h3>
        <p className="text-gray-400 text-center py-8">Уншиж байна...</p>
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
      className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 mt-8"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-white flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-400" />
          Match Leaderboard
        </h3>
        <Link
          href="/squads"
          className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
        >
          Бүгдийг харах →
        </Link>
      </div>

      <div className="space-y-2">
        {leaderboard.map((squad, index) => (
          <Link key={squad._id} href={`/squads/${squad._id}`} className="block">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="bg-gray-700/50 hover:bg-gray-700 rounded-lg p-4 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className="flex items-center justify-center w-8 h-8">
                    {index === 0 && (
                      <Trophy className="w-6 h-6 text-yellow-400" />
                    )}
                    {index === 1 && <Award className="w-6 h-6 text-gray-300" />}
                    {index === 2 && (
                      <Award className="w-6 h-6 text-amber-600" />
                    )}
                    {index > 2 && (
                      <span className="text-lg font-bold text-gray-400">
                        {index + 1}
                      </span>
                    )}
                  </div>

                  {/* Squad Info */}
                  <div>
                    <p className="text-white font-semibold group-hover:text-purple-400 transition-colors">
                      {squad.name}
                    </p>
                    <p className="text-gray-400 text-sm">[{squad.tag}]</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-right">
                    <p className="text-green-500 font-semibold">
                      {squad.matchStats.wins}W
                    </p>
                    <p className="text-red-500 text-xs">
                      {squad.matchStats.losses}L
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-purple-400 font-semibold">
                      {squad.matchStats.winRate.toFixed(1)}%
                    </p>
                    <p className="text-gray-400 text-xs">
                      {squad.matchStats.totalMatches} тоглолт
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-700">
        <p className="text-gray-400 text-sm text-center">
          <TrendingUp className="w-4 h-4 inline mr-1" />
          Тоглолтод ялсан тоо болон win rate-аар эрэмбэлэгдсэн
        </p>
      </div>
    </motion.div>
  );
}
