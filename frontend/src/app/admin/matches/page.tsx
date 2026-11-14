"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Gamepad2,
  Plus,
  Search,
  Filter,
  Calendar,
  Trophy,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  Edit,
  Trash2,
  Eye,
  ArrowRight,
  RefreshCw,
  Settings,
} from "lucide-react";
import Link from "next/link";
import Navigation from "../../components/Navigation";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/navigation";
import { API_ENDPOINTS } from "../../../config/api";
import DivisionCoinImage from "../../../components/DivisionCoinImage";
import { SquadDivision } from "../../../types/division";

interface Squad {
  _id: string;
  name: string;
  tag: string;
  logo?: string;
  division: SquadDivision;
  currentBountyCoins: number;
  level: number;
}

interface Match {
  _id: string;
  tournament: string;
  tournamentName?: string;
  matchNumber: number;
  round: number;
  squad1: Squad;
  squad2: Squad;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  winner?: string;
  loser?: string;
  score?: {
    squad1Score: number;
    squad2Score: number;
  };
  scheduledTime?: string;
  startTime?: string;
  endTime?: string;
  bountyCoinsDistributed: boolean;
  matchType: "normal" | "auto_win" | "walkover";
  adminNotes?: string;
  bountyCoinAmount?: number;
  applyLoserDeduction?: boolean;
  squad1Division: SquadDivision;
  squad2Division: SquadDivision;
  squad1BountyChange: number;
  squad2BountyChange: number;
}

interface Tournament {
  _id: string;
  name: string;
  status: string;
  game: string;
  startDate: string;
  endDate: string;
  format: string;
  maxSquads: number;
  currentSquads: number;
}

export default function MatchesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tournamentFilter, setTournamentFilter] = useState("all");
  const [roundFilter, setRoundFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Check admin access
  useEffect(() => {
    if (authLoading) return;
    const isAdmin =
      user?.role === "ADMIN" || user?.email === "admin@esport-connection.com";
    if (!user || !isAdmin) {
      router.push("/");
      return;
    }
  }, [user, authLoading, router]);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch tournaments first
        const tournamentsResponse = await fetch(API_ENDPOINTS.TOURNAMENTS.ALL, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const tournamentsData = await tournamentsResponse.json();

        if (tournamentsData.success) {
          setTournaments(tournamentsData.tournaments || []);
        }

        // Fetch all matches from all tournaments
        const allMatches: Match[] = [];
        for (const tournament of tournamentsData.tournaments || []) {
          try {
            const matchesResponse = await fetch(
              `${API_ENDPOINTS.TOURNAMENTS.ALL}/${tournament._id}/matches`,
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
              }
            );
            const matchesData = await matchesResponse.json();
            if (matchesData.success && matchesData.matches) {
              const matchesWithTournament = matchesData.matches.map(
                (match: Match) => ({
                  ...match,
                  tournamentName: tournament.name,
                })
              );
              allMatches.push(...matchesWithTournament);
            }
          } catch (err) {
            console.error(
              `Error fetching matches for tournament ${tournament._id}:`,
              err
            );
          }
        }

        setMatches(allMatches);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to fetch matches. Please check your connection.");
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && user) {
      fetchData();
    }
  }, [user, authLoading]);

  // Filter matches
  const filteredMatches = matches.filter((match) => {
    const matchesSearch =
      match.squad1.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.squad2.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.squad1.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.squad2.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (match.tournamentName || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || match.status === statusFilter;
    const matchesTournament =
      tournamentFilter === "all" || match.tournament === tournamentFilter;
    const matchesRound =
      roundFilter === "all" || match.round.toString() === roundFilter;

    return matchesSearch && matchesStatus && matchesTournament && matchesRound;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-400 bg-green-500/20";
      case "in_progress":
        return "text-yellow-400 bg-yellow-500/20";
      case "scheduled":
        return "text-blue-400 bg-blue-500/20";
      case "cancelled":
        return "text-red-400 bg-red-500/20";
      default:
        return "text-gray-400 bg-gray-500/20";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "in_progress":
        return <Play className="w-4 h-4" />;
      case "scheduled":
        return <Clock className="w-4 h-4" />;
      case "cancelled":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getMatchTypeColor = (matchType: string) => {
    switch (matchType) {
      case "normal":
        return "text-green-400 bg-green-500/20";
      case "auto_win":
        return "text-yellow-400 bg-yellow-500/20";
      case "walkover":
        return "text-red-400 bg-red-500/20";
      default:
        return "text-gray-400 bg-gray-500/20";
    }
  };

  const updateMatchStatus = async (
    matchId: string,
    status: Match["status"]
  ) => {
    try {
      const response = await fetch(
        `${API_ENDPOINTS.TOURNAMENTS.ALL.replace(
          "/api/tournaments",
          "/api/tournament-matches"
        )}/${matchId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();
      if (data.success) {
        setMatches((prev) =>
          prev.map((match) =>
            match._id === matchId ? { ...match, status } : match
          )
        );
      } else {
        alert("Error: " + data.message);
      }
    } catch (error) {
      console.error("Error updating match status:", error);
      alert("Failed to update match status");
    }
  };

  const deleteMatch = async (matchId: string) => {
    if (!confirm("Are you sure you want to delete this match?")) return;

    try {
      const response = await fetch(
        `${API_ENDPOINTS.TOURNAMENTS.ALL.replace(
          "/api/tournaments",
          "/api/tournament-matches"
        )}/${matchId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setMatches((prev) => prev.filter((match) => match._id !== matchId));
        alert("Match deleted successfully");
      } else {
        alert("Error: " + data.message);
      }
    } catch (error) {
      console.error("Error deleting match:", error);
      alert("Failed to delete match");
    }
  };

  // Show loading while auth is initializing
  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <Navigation />
        <main className="pt-20 pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
              <p className="mt-4 text-gray-300">Loading...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const isAdmin =
    user?.role === "ADMIN" || user?.email === "admin@esport-connection.com";
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <Navigation />
        <main className="pt-20 pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold text-white mb-4">
                Access Denied
              </h1>
              <p className="text-gray-400 mb-6">
                You don&apos;t have permission to access the admin panel.
              </p>
              <Link
                href="/"
                className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors duration-200"
              >
                <span>Return to Home</span>
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <Navigation />
        <main className="pt-20 pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
              <p className="mt-4 text-gray-300">Loading matches...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <Navigation />

      <main className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2">
                  All Matches
                </h1>
                <p className="text-gray-300">
                  View and manage all tournament matches across all tournaments
                </p>
              </div>
              <div className="flex space-x-3">
                <Link href="/admin/match-management">
                  <button className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200 flex items-center space-x-2">
                    <Settings className="w-5 h-5" />
                    <span>Manage by Tournament</span>
                  </button>
                </Link>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 transition-all duration-200 flex items-center space-x-2"
                >
                  <RefreshCw className="w-5 h-5" />
                  <span>Refresh</span>
                </button>
              </div>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          >
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">
                    Total Matches
                  </p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {matches.length}
                  </p>
                </div>
                <Gamepad2 className="w-8 h-8 text-blue-400" />
              </div>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Completed</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {matches.filter((m) => m.status === "completed").length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">
                    In Progress
                  </p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {matches.filter((m) => m.status === "in_progress").length}
                  </p>
                </div>
                <Play className="w-8 h-8 text-yellow-400" />
              </div>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Scheduled</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {matches.filter((m) => m.status === "scheduled").length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-blue-400" />
              </div>
            </div>
          </motion.div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2 text-red-400 mb-2">
                <XCircle className="w-5 h-5" />
                <span className="font-medium">Error</span>
              </div>
              <p className="text-red-300 text-sm">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 p-6 mb-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search matches..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <select
                  value={tournamentFilter}
                  onChange={(e) => setTournamentFilter(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                >
                  <option value="all">All Tournaments</option>
                  {tournaments.map((tournament) => (
                    <option key={tournament._id} value={tournament._id}>
                      {tournament.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <select
                  value={roundFilter}
                  onChange={(e) => setRoundFilter(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                >
                  <option value="all">All Rounds</option>
                  {Array.from(new Set(matches.map((m) => m.round)))
                    .sort((a, b) => a - b)
                    .map((round) => (
                      <option key={round} value={round.toString()}>
                        Round {round}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </motion.div>

          {/* Matches List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            {filteredMatches.length === 0 ? (
              <div className="text-center py-12">
                <Gamepad2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  No matches found
                </h3>
                <p className="text-gray-400 mb-6">
                  {searchTerm ||
                  statusFilter !== "all" ||
                  tournamentFilter !== "all" ||
                  roundFilter !== "all"
                    ? "Try adjusting your search or filter criteria"
                    : "No matches have been created yet"}
                </p>
                <Link href="/admin/match-management">
                  <button className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200 flex items-center space-x-2 mx-auto">
                    <Plus className="w-5 h-5" />
                    <span>Create Matches</span>
                  </button>
                </Link>
              </div>
            ) : (
              filteredMatches.map((match, index) => (
                <motion.div
                  key={match._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="bg-white/5 rounded-lg border border-white/10 p-6 hover:bg-white/10 transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {/* Match Header */}
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(match.status)}
                          <span className="text-gray-400 text-sm">
                            {match.tournamentName} - Round {match.round} - Match{" "}
                            {match.matchNumber}
                          </span>
                        </div>
                        <span
                          className={`text-sm font-medium px-2 py-1 rounded-full flex items-center space-x-1 ${getStatusColor(
                            match.status
                          )}`}
                        >
                          {getStatusIcon(match.status)}
                          <span className="capitalize">
                            {match.status.replace("_", " ")}
                          </span>
                        </span>
                        <span
                          className={`text-sm font-medium px-2 py-1 rounded-full ${getMatchTypeColor(
                            match.matchType
                          )}`}
                        >
                          {match.matchType.replace("_", " ").toUpperCase()}
                        </span>
                      </div>

                      {/* Teams */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        {/* Squad 1 */}
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            {match.squad1.logo && (
                              <img
                                src={match.squad1.logo}
                                alt={match.squad1.name}
                                className="w-10 h-10 rounded-full"
                              />
                            )}
                            <div>
                              <span className="text-white font-medium">
                                {match.squad1.name}
                              </span>
                              <div className="flex items-center space-x-2 text-sm">
                                <span className="text-gray-400">
                                  [{match.squad1.tag}]
                                </span>
                                <DivisionCoinImage
                                  division={match.squad1.division}
                                  size={16}
                                />
                                <span className="text-yellow-400">
                                  {match.squad1.currentBountyCoins} BC
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* VS */}
                        <div className="flex items-center justify-center">
                          <div className="text-2xl font-bold text-gray-400">
                            VS
                          </div>
                        </div>

                        {/* Squad 2 */}
                        <div className="flex items-center space-x-3 justify-end">
                          <div className="flex items-center space-x-2">
                            <div className="text-right">
                              <span className="text-white font-medium">
                                {match.squad2.name}
                              </span>
                              <div className="flex items-center space-x-2 text-sm justify-end">
                                <span className="text-yellow-400">
                                  {match.squad2.currentBountyCoins} BC
                                </span>
                                <DivisionCoinImage
                                  division={match.squad2.division}
                                  size={16}
                                />
                                <span className="text-gray-400">
                                  [{match.squad2.tag}]
                                </span>
                              </div>
                            </div>
                            {match.squad2.logo && (
                              <img
                                src={match.squad2.logo}
                                alt={match.squad2.name}
                                className="w-10 h-10 rounded-full"
                              />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Score and Results */}
                      {match.score && (
                        <div className="bg-white/5 rounded-lg p-4 mb-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-white mb-2">
                              {match.squad1.name} {match.score.squad1Score} -{" "}
                              {match.score.squad2Score} {match.squad2.name}
                            </div>
                            {match.winner && (
                              <div className="text-green-400 font-medium">
                                🏆 Winner:{" "}
                                {match.winner === match.squad1._id
                                  ? match.squad1.name
                                  : match.squad2.name}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Bounty Coin Status */}
                      {match.bountyCoinsDistributed && (
                        <div className="flex items-center space-x-2 text-sm text-yellow-400 bg-yellow-500/10 rounded-lg p-2">
                          <DivisionCoinImage
                            division={SquadDivision.GOLD}
                            size={20}
                          />
                          <span>Bounty Coins Distributed</span>
                          {match.squad1BountyChange !== 0 && (
                            <span className="text-sm">
                              {match.squad1.name}:{" "}
                              {match.squad1BountyChange > 0 ? "+" : ""}
                              {match.squad1BountyChange} BC
                            </span>
                          )}
                          {match.squad2BountyChange !== 0 && (
                            <span className="text-sm">
                              {match.squad2.name}:{" "}
                              {match.squad2BountyChange > 0 ? "+" : ""}
                              {match.squad2BountyChange} BC
                            </span>
                          )}
                        </div>
                      )}

                      {/* Admin Notes */}
                      {match.adminNotes && (
                        <div className="mt-3 text-sm text-gray-300 bg-gray-800/50 rounded-lg p-3">
                          <span className="font-medium">Admin Notes:</span>{" "}
                          {match.adminNotes}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col space-y-2 ml-4">
                      {match.status === "completed" ? (
                        <div className="flex items-center space-x-2 text-green-400">
                          <CheckCircle />
                          <span className="text-sm">Completed</span>
                        </div>
                      ) : (
                        <>
                          {match.status === "scheduled" && (
                            <button
                              onClick={() =>
                                updateMatchStatus(match._id, "in_progress")
                              }
                              className="bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded-lg transition-colors text-sm flex items-center space-x-2"
                            >
                              <Play />
                              <span>Start</span>
                            </button>
                          )}

                          {match.status === "in_progress" && (
                            <button
                              onClick={() =>
                                updateMatchStatus(match._id, "completed")
                              }
                              className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg transition-colors text-sm flex items-center space-x-2"
                            >
                              <CheckCircle />
                              <span>Complete</span>
                            </button>
                          )}
                        </>
                      )}

                      <button
                        onClick={() => {
                          setEditingMatch(match);
                          setShowEditModal(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors text-sm flex items-center space-x-2"
                      >
                        <Edit />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => deleteMatch(match._id)}
                        className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg transition-colors text-sm flex items-center space-x-2"
                      >
                        <Trash2 />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
