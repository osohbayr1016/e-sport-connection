"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { API_ENDPOINTS } from "../../../config/api";
import {
  Edit,
  Save,
  X,
  Trash2,
  Calendar,
  Users,
  Trophy,
  Gamepad2,
  Plus,
} from "lucide-react";

interface Tournament {
  _id: string;
  name: string;
  game: string;
  description?: string;
  status: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  currentSquads: number;
  maxSquads: number;
  format: string;
  prizePool: number;
  currency: string;
  entryFee: number;
  location: string;
  requirements: string[];
  rules: string[];
}

interface Match {
  _id: string;
  matchNumber: number;
  round: number;
  squad1: { _id: string; name: string; tag: string };
  squad2: { _id: string; name: string; tag: string };
  status: string;
  winner?: { _id: string; name: string; tag: string };
  loser?: { _id: string; name: string; tag: string };
  score?: { squad1Score: number; squad2Score: number };
  scheduledTime: string;
}

export default function AdminTournamentsPage() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"tournaments">("tournaments");
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] =
    useState<Tournament | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(
    null
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTournament, setNewTournament] = useState({
    name: "",
    game: "Mobile Legends: Bang Bang",
    description: "",
    startDate: "",
    endDate: "",
    registrationDeadline: "",
    prizePool: 0,
    currency: "₮",
    maxSquads: 16,
    format: "Single Elimination",
    entryFee: 0,
    tournamentType: "tax" as "tax" | "free",
    location: "Online",
    requirements: [] as string[],
    rules: [] as string[],
  });

  useEffect(() => {
    if (!authLoading && user?.role === "ADMIN") {
      fetchTournaments();
    }
  }, [user, authLoading]);

  const fetchTournaments = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.TOURNAMENTS.ALL);
      const data = await response.json();
      if (data.success) {
        setTournaments(data.tournaments);
      }
    } catch (error) {
      console.error("Error fetching tournaments:", error);
    }
  };

  const fetchMatches = async (tournamentId: string) => {
    try {
      const response = await fetch(
        `/api/tournament-matches/tournament/${tournamentId}`
      );
      const data = await response.json();
      if (data.success) {
        setMatches(data.matches);
      }
    } catch (error) {
      console.error("Error fetching matches:", error);
    }
  };

  const startTournament = async (tournamentId: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        API_ENDPOINTS.TOURNAMENTS.START(tournamentId),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setMessage("Tournament started successfully! Matches generated.");
        fetchTournaments();
        if (selectedTournament?._id === tournamentId) {
          fetchMatches(tournamentId);
        }
      } else {
        setMessage(`Error: ${data.message}`);
      }
    } catch (error) {
      setMessage("Error starting tournament");
    } finally {
      setLoading(false);
    }
  };

  const updateMatchResult = async (
    matchId: string,
    winnerId: string,
    loserId: string
  ) => {
    try {
      const response = await fetch(
        `/api/tournament-matches/${matchId}/result`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            winnerId,
            loserId,
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        setMessage("Match result updated successfully!");
        if (selectedTournament) {
          fetchMatches(selectedTournament._id);
        }
      } else {
        setMessage(`Error: ${data.message}`);
      }
    } catch (error) {
      setMessage("Error updating match result");
    }
  };

  const startEditing = (tournament: Tournament | null) => {
    if (tournament) {
      setEditingTournament({ ...tournament });
    }
  };

  const cancelEditing = () => {
    setEditingTournament(null);
  };

  const saveTournament = async () => {
    if (!editingTournament) return;

    try {
      const response = await fetch(
        API_ENDPOINTS.TOURNAMENTS.UPDATE(editingTournament._id),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editingTournament),
        }
      );

      const data = await response.json();
      if (data.success) {
        setMessage("Tournament updated successfully!");
        fetchTournaments();
        setEditingTournament(null);
      } else {
        setMessage(`Error: ${data.message}`);
      }
    } catch (error) {
      setMessage("Error updating tournament");
    }
  };

  const deleteTournament = async (tournamentId: string) => {
    if (!confirm("Are you sure you want to delete this tournament?")) return;

    try {
      const response = await fetch(
        API_ENDPOINTS.TOURNAMENTS.DELETE(tournamentId),
        {
          method: "DELETE",
        }
      );

      const data = await response.json();
      if (data.success) {
        setMessage("Tournament deleted successfully!");
        fetchTournaments();
        if (selectedTournament?._id === tournamentId) {
          setSelectedTournament(null);
          setMatches([]);
        }
      } else {
        setMessage(`Error: ${data.message}`);
      }
    } catch (error) {
      setMessage("Error deleting tournament");
    }
  };

  const createTournament = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.TOURNAMENTS.CREATE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newTournament),
      });

      const data = await response.json();
      if (data.success) {
        setMessage("Tournament created successfully!");
        fetchTournaments();
        setShowCreateModal(false);
        resetNewTournament();
      } else {
        setMessage(`Error: ${data.message}`);
      }
    } catch (error) {
      setMessage("Error creating tournament");
    }
  };

  const resetNewTournament = () => {
    setNewTournament({
      name: "",
      game: "Mobile Legends: Bang Bang",
      description: "",
      startDate: "",
      endDate: "",
      registrationDeadline: "",
      prizePool: 0,
      currency: "₮",
      maxSquads: 16,
      format: "Single Elimination",
      entryFee: 0,
      tournamentType: "tax",
      location: "Online",
      requirements: [],
      rules: [],
    });
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Loading...
            </h1>
          </div>
        </div>
      </div>
    );
  }
  if (user?.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Access Denied
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              You need admin privileges to access this page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Admin Tournament Management
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage tournaments and match results
          </p>
        </div>

        {message && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
            <p className="text-blue-800 dark:text-blue-200">{message}</p>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <span
                className={`py-2 px-1 border-b-2 font-medium text-sm border-purple-500 text-purple-600 dark:text-purple-400`}
              >
                Tournament Management
              </span>
            </nav>
          </div>
        </div>

        {/* Tournament Management Tab */}
        {activeTab === "tournaments" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Tournament Management
              </h2>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create Tournament</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tournaments
                .filter((tournament) => tournament && tournament._id)
                .map((tournament) => (
                  <a
                    href={`/admin/tournaments/${tournament._id}`}
                    key={tournament._id}
                    className="block bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow"
                  >
                    {editingTournament?._id === tournament._id ? (
                      <div className="space-y-4">
                        <input
                          type="text"
                          value={editingTournament?.name || ""}
                          onChange={(e) =>
                            editingTournament &&
                            setEditingTournament({
                              ...editingTournament,
                              name: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        <input
                          type="text"
                          value={editingTournament?.game || ""}
                          onChange={(e) =>
                            editingTournament &&
                            setEditingTournament({
                              ...editingTournament,
                              game: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        <textarea
                          value={editingTournament?.description || ""}
                          onChange={(e) =>
                            editingTournament &&
                            setEditingTournament({
                              ...editingTournament,
                              description: e.target.value,
                            })
                          }
                          placeholder="Description"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          rows={3}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="date"
                            value={
                              editingTournament?.startDate?.split("T")[0] || ""
                            }
                            onChange={(e) =>
                              editingTournament &&
                              setEditingTournament({
                                ...editingTournament,
                                startDate: e.target.value,
                              })
                            }
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                          <input
                            type="date"
                            value={
                              editingTournament?.endDate?.split("T")[0] || ""
                            }
                            onChange={(e) =>
                              editingTournament &&
                              setEditingTournament({
                                ...editingTournament,
                                endDate: e.target.value,
                              })
                            }
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            value={editingTournament?.maxSquads || 0}
                            onChange={(e) =>
                              editingTournament &&
                              setEditingTournament({
                                ...editingTournament,
                                maxSquads: parseInt(e.target.value),
                              })
                            }
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                          <input
                            type="number"
                            value={editingTournament?.prizePool || 0}
                            onChange={(e) =>
                              editingTournament &&
                              setEditingTournament({
                                ...editingTournament,
                                prizePool: parseInt(e.target.value),
                              })
                            }
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={saveTournament}
                            className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2"
                          >
                            <Save className="w-4 h-4" />
                            <span>Save</span>
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="flex-1 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center justify-center space-x-2"
                          >
                            <X className="w-4 h-4" />
                            <span>Cancel</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-2">
                              {tournament?.name || "Unnamed Tournament"}
                            </h3>
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                                <Gamepad2 className="w-4 h-4" />
                                <span>
                                  {tournament?.game || "Unknown Game"}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                                <Trophy className="w-4 h-4" />
                                <span>
                                  {tournament?.format || "Unknown Format"}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                                <Users className="w-4 h-4" />
                                <span>
                                  {tournament?.currentSquads || 0}/
                                  {tournament?.maxSquads || 0} squads
                                </span>
                              </div>
                              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  {tournament?.startDate
                                    ? new Date(
                                        tournament.startDate
                                      ).toLocaleDateString()
                                    : "No date set"}
                                </span>
                              </div>
                            </div>
                            {tournament?.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                                {tournament.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span
                            className={`inline-block px-2 py-1 text-xs rounded-full ${
                              tournament?.status === "ongoing"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : tournament?.status === "registration_closed"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                            }`}
                          >
                            {tournament?.status || "Unknown"}
                          </span>
                          <div className="flex space-x-2">
                            <button
                              onClick={() =>
                                tournament && startEditing(tournament)
                              }
                              className="p-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                tournament?._id &&
                                deleteTournament(tournament._id)
                              }
                              className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {tournament &&
                          tournament.status !== "ongoing" &&
                          tournament.status !== "completed" && (
                            <button
                              onClick={() =>
                                tournament?._id &&
                                startTournament(tournament._id)
                              }
                              disabled={loading}
                              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                              {loading ? "Starting..." : "Start Tournament"}
                            </button>
                          )}
                      </div>
                    )}
                  </a>
                ))}
            </div>
          </div>
        )}

        {/* Match Management Tab removed as requested */}

        {/* Create Tournament Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Create New Tournament
                </h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetNewTournament();
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tournament Name *
                    </label>
                    <input
                      type="text"
                      value={newTournament.name}
                      onChange={(e) =>
                        setNewTournament({
                          ...newTournament,
                          name: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Enter tournament name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Game *
                    </label>
                    <select
                      value={newTournament.game}
                      onChange={(e) =>
                        setNewTournament({
                          ...newTournament,
                          game: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="Mobile Legends: Bang Bang">
                        Mobile Legends: Bang Bang
                      </option>
                      <option value="Valorant">Valorant</option>
                      <option value="Counter-Strike: Global Offensive">
                        Counter-Strike: Global Offensive
                      </option>
                      <option value="League of Legends">
                        League of Legends
                      </option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newTournament.description}
                    onChange={(e) =>
                      setNewTournament({
                        ...newTournament,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter tournament description"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={newTournament.startDate}
                      onChange={(e) =>
                        setNewTournament({
                          ...newTournament,
                          startDate: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      End Date *
                    </label>
                    <input
                      type="date"
                      value={newTournament.endDate}
                      onChange={(e) =>
                        setNewTournament({
                          ...newTournament,
                          endDate: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Registration Deadline *
                    </label>
                    <input
                      type="date"
                      value={newTournament.registrationDeadline}
                      onChange={(e) =>
                        setNewTournament({
                          ...newTournament,
                          registrationDeadline: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Prize Pool
                    </label>
                    <input
                      type="number"
                      value={newTournament.prizePool}
                      onChange={(e) =>
                        setNewTournament({
                          ...newTournament,
                          prizePool: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Entry Fee
                    </label>
                    <input
                      type="number"
                      value={newTournament.entryFee}
                      onChange={(e) =>
                        setNewTournament({
                          ...newTournament,
                          entryFee: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tournament Type *
                    </label>
                    <select
                      value={newTournament.tournamentType}
                      onChange={(e) =>
                        setNewTournament({
                          ...newTournament,
                          tournamentType: e.target.value as "tax" | "free",
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="tax">
                        Tax (Requires Payment & Approval)
                      </option>
                      <option value="free">Free (Direct Registration)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Max Squads *
                    </label>
                    <input
                      type="number"
                      value={newTournament.maxSquads}
                      onChange={(e) =>
                        setNewTournament({
                          ...newTournament,
                          maxSquads: parseInt(e.target.value) || 16,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="16"
                      min="2"
                      max="128"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Format *
                    </label>
                    <select
                      value={newTournament.format}
                      onChange={(e) =>
                        setNewTournament({
                          ...newTournament,
                          format: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="Single Elimination">
                        Single Elimination
                      </option>
                      <option value="Double Elimination">
                        Double Elimination
                      </option>
                      <option value="Round Robin">Round Robin</option>
                      <option value="Swiss System">Swiss System</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      value={newTournament.location}
                      onChange={(e) =>
                        setNewTournament({
                          ...newTournament,
                          location: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Online"
                    />
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      resetNewTournament();
                    }}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createTournament}
                    disabled={
                      !newTournament.name ||
                      !newTournament.startDate ||
                      !newTournament.endDate ||
                      !newTournament.registrationDeadline
                    }
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Tournament</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
