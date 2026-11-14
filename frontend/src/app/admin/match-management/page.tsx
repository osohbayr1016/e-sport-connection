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
} from "lucide-react";
import Link from "next/link";
import Navigation from "../../components/Navigation";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/navigation";
import TournamentMatchManager from "../../../components/TournamentMatchManager";
import { API_ENDPOINTS } from "../../../config/api";

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
  description?: string;
}

export default function MatchManagementPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] =
    useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);

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

  // Fetch tournaments
  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(API_ENDPOINTS.TOURNAMENTS.ALL, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        const data = await response.json();

        if (data.success) {
          setTournaments(data.tournaments || []);
        } else {
          setError(data.message || "Failed to fetch tournaments");
        }
      } catch (error) {
        console.error("Error fetching tournaments:", error);
        setError("Failed to fetch tournaments. Please check your connection.");
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && user) {
      fetchTournaments();
    }
  }, [user, authLoading]);

  // Filter tournaments
  const filteredTournaments = tournaments.filter((tournament) => {
    const matchesSearch = tournament.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || tournament.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "text-blue-400 bg-blue-500/20";
      case "ongoing":
        return "text-green-400 bg-green-500/20";
      case "completed":
        return "text-gray-400 bg-gray-500/20";
      case "cancelled":
        return "text-red-400 bg-red-500/20";
      default:
        return "text-gray-400 bg-gray-500/20";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "upcoming":
        return <Clock className="w-4 h-4" />;
      case "ongoing":
        return <Play className="w-4 h-4" />;
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "cancelled":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
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
              <p className="mt-4 text-gray-300">Loading tournaments...</p>
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
                  Match Management
                </h1>
                <p className="text-gray-300">
                  Create, edit, and manage tournament matches
                </p>
              </div>
              <Link href="/admin/tournaments">
                <button className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200 flex items-center space-x-2">
                  <Trophy className="w-5 h-5" />
                  <span>Manage Tournaments</span>
                </button>
              </Link>
            </div>
          </motion.div>

          {selectedTournament ? (
            // Match Management Interface
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Tournament Header */}
              <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-cyan-500/20 p-3 rounded-full">
                      <Trophy className="text-cyan-400 text-2xl" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        {selectedTournament.name}
                      </h2>
                      <div className="flex items-center space-x-4 mt-2">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${getStatusColor(
                            selectedTournament.status
                          )}`}
                        >
                          {getStatusIcon(selectedTournament.status)}
                          <span className="capitalize">
                            {selectedTournament.status}
                          </span>
                        </span>
                        <span className="text-gray-400 text-sm">
                          {selectedTournament.currentSquads}/
                          {selectedTournament.maxSquads} squads
                        </span>
                        <span className="text-gray-400 text-sm">
                          {selectedTournament.format}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedTournament(null)}
                    className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Back to Tournaments</span>
                  </button>
                </div>
              </div>

              {/* Tournament Match Manager */}
              <TournamentMatchManager
                tournamentId={selectedTournament._id}
                onMatchUpdate={() => {
                  // Refresh tournaments if needed
                }}
              />
            </motion.div>
          ) : (
            // Tournament Selection Interface
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
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

              {/* Search and Filter */}
              <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Search tournaments..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="md:w-48">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    >
                      <option value="all">All Status</option>
                      <option value="upcoming">Upcoming</option>
                      <option value="ongoing">Ongoing</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Tournaments List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTournaments.map((tournament, index) => (
                  <motion.div
                    key={tournament._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="group"
                  >
                    <div
                      onClick={() => setSelectedTournament(tournament)}
                      className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6 hover:border-cyan-500/50 transition-all duration-300 h-full group-hover:scale-105 cursor-pointer"
                    >
                      <div className="flex items-start space-x-4">
                        <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300">
                          <Trophy className="w-8 h-8" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-cyan-400 transition-colors duration-200">
                            {tournament.name}
                          </h3>
                          <p className="text-gray-400 text-sm mb-4">
                            {tournament.description || "Tournament description"}
                          </p>
                          <div className="flex items-center justify-between text-sm">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(
                                tournament.status
                              )}`}
                            >
                              {getStatusIcon(tournament.status)}
                              <span className="capitalize">
                                {tournament.status}
                              </span>
                            </span>
                            <span className="text-gray-500">
                              {tournament.currentSquads}/{tournament.maxSquads}
                            </span>
                          </div>
                          <div className="mt-3 text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>
                                {new Date(
                                  tournament.startDate
                                ).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1 mt-1">
                              <Users className="w-3 h-3" />
                              <span>{tournament.format}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {filteredTournaments.length === 0 && !loading && !error && (
                <div className="text-center py-12">
                  <Gamepad2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    No tournaments found
                  </h3>
                  <p className="text-gray-400 mb-6">
                    {searchTerm || statusFilter !== "all"
                      ? "Try adjusting your search or filter criteria"
                      : "Create your first tournament to get started"}
                  </p>
                  <Link href="/admin/tournaments">
                    <button className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200 flex items-center space-x-2 mx-auto">
                      <Plus className="w-5 h-5" />
                      <span>Create Tournament</span>
                    </button>
                  </Link>
                </div>
              )}

              {/* Debug Information (Development Only) */}
              {process.env.NODE_ENV === "development" && (
                <div className="bg-gray-800/50 rounded-lg p-4 mt-6">
                  <h4 className="text-white font-medium mb-2">Debug Info:</h4>
                  <div className="text-sm text-gray-300 space-y-1">
                    <div>Loading: {loading ? "Yes" : "No"}</div>
                    <div>Error: {error || "None"}</div>
                    <div>Total tournaments: {tournaments.length}</div>
                    <div>
                      Filtered tournaments: {filteredTournaments.length}
                    </div>
                    <div>Search term: &quot;{searchTerm}&quot;</div>
                    <div>Status filter: &quot;{statusFilter}&quot;</div>
                    <div>API endpoint: {API_ENDPOINTS.TOURNAMENTS.ALL}</div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
