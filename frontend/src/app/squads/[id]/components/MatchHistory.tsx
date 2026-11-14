import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, XCircle, Minus, Calendar, Coins, Users } from "lucide-react";
import { API_ENDPOINTS } from "../../../../config/api";
import Image from "next/image";

interface MatchHistoryProps {
  squadId: string;
}

export default function MatchHistory({ squadId }: MatchHistoryProps) {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    wins: 0,
    losses: 0,
    draws: 0,
    total: 0,
    winRate: 0,
    totalEarned: 0,
  });

  useEffect(() => {
    fetchMatchHistory();
    fetchSquadStats();
  }, [squadId]);

  const fetchMatchHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_ENDPOINTS.BASE_URL}/api/matches/history/all?squadId=${squadId}&limit=10`,
        { credentials: "include" }
      );
      const data = await response.json();
      if (data.success) {
        setMatches(data.data);
        // Calculate winrate from actual match history
        calculateWinrateFromMatches(data.data);
      }
    } catch (error) {
      console.error("Error fetching match history:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateWinrateFromMatches = (matches: any[]) => {
    let wins = 0;
    let losses = 0;
    let draws = 0;

    matches.forEach((match) => {
      // Skip cancelled matches - they don't count in statistics
      if (match.status === 'cancelled') {
        return;
      }

      if (match.isWinner) {
        wins++;
      } else if (match.winnerId || match.winner) {
        losses++;
      } else {
        draws++;
      }
    });

    const totalMatches = wins + losses + draws;
    const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

    setStats(prevStats => ({
      ...prevStats,
      wins,
      losses,
      draws,
      total: totalMatches,
      winRate,
    }));
  };

  const fetchSquadStats = async () => {
    try {
      const response = await fetch(
        `${API_ENDPOINTS.BASE_URL}/api/squads/${squadId}`,
        { credentials: "include" }
      );
      const data = await response.json();
      if (data.success && data.squad) {
        const squad = data.squad;
        const matchStats = squad.matchStats || {
          wins: 0,
          losses: 0,
          draws: 0,
          totalMatches: 0,
          winRate: 0,
          totalEarned: 0,
        };

        // Calculate winrate dynamically
        const totalMatches = matchStats.wins + matchStats.losses + matchStats.draws;
        const calculatedWinRate = totalMatches > 0 ? Math.round((matchStats.wins / totalMatches) * 100) : 0;

        setStats({
          wins: matchStats.wins || 0,
          losses: matchStats.losses || 0,
          draws: matchStats.draws || 0,
          total: totalMatches,
          winRate: calculatedWinRate,
          totalEarned: matchStats.totalEarned || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching squad stats:", error);
    }
  };

  const getMatchResult = (match: any) => {
    // Handle cancelled matches
    if (match.status === 'cancelled') {
      return { text: "ЦУЦЛАГДСАН", color: "text-gray-500", icon: XCircle };
    }
    
    if (match.isWinner) {
      return { text: "ЯЛАЛТ", color: "text-green-500", icon: Trophy };
    } else if (match.winnerId || match.winner) {
      return { text: "ХОЖИГДОЛ", color: "text-red-500", icon: XCircle };
    } else {
      return { text: "ТЭНЦСЭН", color: "text-gray-400", icon: Minus };
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <Trophy className="w-6 h-6 text-yellow-500" />
        Match түүх
      </h3>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-700 rounded-lg p-4 text-center">
          <p className="text-gray-400 text-sm">Ялалт</p>
          <p className="text-2xl font-bold text-green-500">{stats.wins}</p>
        </div>
        <div className="bg-gray-700 rounded-lg p-4 text-center">
          <p className="text-gray-400 text-sm">Хожигдол</p>
          <p className="text-2xl font-bold text-red-500">{stats.losses}</p>
        </div>
        <div className="bg-gray-700 rounded-lg p-4 text-center">
          <p className="text-gray-400 text-sm">Win Rate</p>
          <p className="text-2xl font-bold text-purple-500">
            {stats.winRate.toFixed(1)}%
          </p>
        </div>
        <div className="bg-gray-700 rounded-lg p-4 text-center">
          <p className="text-gray-400 text-sm">Нийт орлого</p>
          <p
            className={`text-2xl font-bold ${
              stats.totalEarned >= 0 ? "text-green-500" : "text-red-500"
            }`}
          >
            {stats.totalEarned >= 0 ? "+" : ""}
            {stats.totalEarned}
          </p>
        </div>
      </div>

      {/* Match List */}
      {loading ? (
        <p className="text-gray-400 text-center py-8">Уншиж байна...</p>
      ) : matches.length === 0 ? (
        <p className="text-gray-400 text-center py-8">
          Match түүх байхгүй байна
        </p>
      ) : (
        <div className="space-y-3">
          {matches.map((match) => {
            const result = getMatchResult(match);
            const ResultIcon = result.icon;
            const opponentSquad = match.opponentSquad;

            return (
              <motion.div
                key={match._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <ResultIcon className={`w-6 h-6 ${result.color}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className={`font-bold ${result.color}`}>
                          {result.text}
                        </p>
                        <span className="text-gray-400 text-sm">vs</span>
                        <p className="text-white font-semibold">
                          {opponentSquad?.name || "N/A"}
                        </p>
                        {match.matchType === 'tournament' && match.tournament && (
                          <span className="text-xs text-blue-400 ml-2">
                            [{match.tournament.name}]
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Coins className="w-3 h-3" />
                          {match.bountyAmount} coins
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(match.completedAt).toLocaleDateString(
                            "mn-MN"
                          )}
                        </span>
                        {match.matchType === 'tournament' && (
                          <span className="text-xs text-purple-400">
                            Tournament
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
