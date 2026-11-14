"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Calendar,
  Shield,
  User,
  Gamepad2,
  Star,
  Award,
} from "lucide-react";
import Link from "next/link";
import Navigation from "../../components/Navigation";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/navigation";

interface PlayerProfile {
  _id: string;
  playerName: string;
  game: string;
  rank: string;
  role: string;
  experience: string;
  achievements: string[];
  bio: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminProfilesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [profiles, setProfiles] = useState<PlayerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGame, setSelectedGame] = useState("");
  const [selectedRank, setSelectedRank] = useState("");
  const [selectedVerification, setSelectedVerification] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<PlayerProfile | null>(
    null
  );

  // Check admin access (wait for auth load)
  useEffect(() => {
    if (authLoading) return;
    const isAdmin =
      user?.role === "ADMIN" || user?.email === "admin@esport-connection.com";
    if (!user || !isAdmin) {
      router.push("/");
      return;
    }
  }, [user, authLoading, router]);

  // Fetch profiles data
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/player-profiles/profiles");
        const data = await response.json();

        if (data.success) {
          setProfiles(data.profiles || []);
        }
      } catch (error) {
        console.error("Error fetching profiles:", error);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && user) {
      fetchProfiles();
    }
  }, [user, authLoading]);

  // Filter profiles based on search and filters
  const filteredProfiles = profiles.filter((profile) => {
    const matchesSearch =
      profile.playerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.bio.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGame = !selectedGame || profile.game === selectedGame;
    const matchesRank = !selectedRank || profile.rank === selectedRank;
    const matchesVerification =
      selectedVerification === "" ||
      (selectedVerification === "verified" && profile.isVerified) ||
      (selectedVerification === "unverified" && !profile.isVerified);

    return matchesSearch && matchesGame && matchesRank && matchesVerification;
  });

  const games = [
    "Mobile Legends: Bang Bang",
    "PUBG Mobile",
    "Free Fire",
    "Call of Duty Mobile",
  ];
  const ranks = ["Epic", "Legend", "Mythic", "Grandmaster", "Master"];
  const verificationOptions = ["verified", "unverified"];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this profile?")) {
      try {
        const response = await fetch(`/api/player-profiles/profiles/${id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          setProfiles(profiles.filter((profile) => profile._id !== id));
        }
      } catch (error) {
        console.error("Error deleting profile:", error);
      }
    }
  };

  const handleToggleVerification = async (
    id: string,
    currentStatus: boolean
  ) => {
    try {
      const response = await fetch(`/api/player-profiles/profiles/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isVerified: !currentStatus }),
      });

      if (response.ok) {
        setProfiles(
          profiles.map((profile) =>
            profile._id === id
              ? { ...profile, isVerified: !currentStatus }
              : profile
          )
        );
      }
    } catch (error) {
      console.error("Error updating profile verification:", error);
    }
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <Navigation />
      <main className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  Profile Management
                </h1>
                <p className="text-gray-400">
                  Manage player profiles, verification status, and achievements
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Profile
              </button>
            </div>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 mb-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search profiles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Game
                </label>
                <select
                  value={selectedGame}
                  onChange={(e) => setSelectedGame(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Games</option>
                  {games.map((game) => (
                    <option key={game} value={game}>
                      {game}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Rank
                </label>
                <select
                  value={selectedRank}
                  onChange={(e) => setSelectedRank(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Ranks</option>
                  {ranks.map((rank) => (
                    <option key={rank} value={rank}>
                      {rank}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Verification
                </label>
                <select
                  value={selectedVerification}
                  onChange={(e) => setSelectedVerification(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Profiles</option>
                  {verificationOptions.map((option) => (
                    <option key={option} value={option}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedGame("");
                    setSelectedRank("");
                    setSelectedVerification("");
                  }}
                  className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors duration-200"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </motion.div>

          {/* Profiles List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
                <p className="mt-4 text-gray-300">Loading profiles...</p>
              </div>
            ) : filteredProfiles.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-300 mb-2">
                  No profiles found
                </h3>
                <p className="text-gray-400 mb-6">
                  {searchTerm ||
                  selectedGame ||
                  selectedRank ||
                  selectedVerification
                    ? "Try adjusting your filters"
                    : "Get started by creating your first profile"}
                </p>
                {!searchTerm &&
                  !selectedGame &&
                  !selectedRank &&
                  !selectedVerification && (
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Profile
                    </button>
                  )}
              </div>
            ) : (
              <div className="grid gap-6">
                {filteredProfiles.map((profile) => (
                  <motion.div
                    key={profile._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden hover:border-blue-500/50 transition-all duration-300"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {profile.playerName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-white">
                              {profile.playerName}
                            </h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-400">
                              <div className="flex items-center space-x-1">
                                <Gamepad2 className="w-4 h-4" />
                                <span>{profile.game}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Star className="w-4 h-4" />
                                <span>{profile.rank}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <User className="w-4 h-4" />
                                <span>{profile.role}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-4 h-4" />
                                <span>{formatDate(profile.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {profile.isVerified ? (
                            <span className="flex items-center space-x-1 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                              <Shield className="w-3 h-3" />
                              <span>Verified</span>
                            </span>
                          ) : (
                            <span className="flex items-center space-x-1 px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">
                              <Shield className="w-3 h-3" />
                              <span>Unverified</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-gray-300 text-sm line-clamp-2">
                          {profile.bio}
                        </p>
                      </div>

                      {profile.achievements.length > 0 && (
                        <div className="mb-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <Award className="w-4 h-4 text-yellow-400" />
                            <span className="text-sm font-medium text-gray-300">
                              Achievements
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {profile.achievements
                              .slice(0, 3)
                              .map((achievement, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full"
                                >
                                  {achievement}
                                </span>
                              ))}
                            {profile.achievements.length > 3 && (
                              <span className="px-2 py-1 bg-gray-600/20 text-gray-400 text-xs rounded-full">
                                +{profile.achievements.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setEditingProfile(profile)}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-lg transition-colors duration-200"
                          >
                            <Edit className="w-4 h-4" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() =>
                              handleToggleVerification(
                                profile._id,
                                profile.isVerified
                              )
                            }
                            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-colors duration-200 ${
                              profile.isVerified
                                ? "bg-red-600/20 text-red-400 hover:bg-red-600/30"
                                : "bg-green-600/20 text-green-400 hover:bg-green-600/30"
                            }`}
                          >
                            {profile.isVerified ? (
                              <>
                                <Shield className="w-4 h-4" />
                                <span>Unverify</span>
                              </>
                            ) : (
                              <>
                                <Shield className="w-4 h-4" />
                                <span>Verify</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(profile._id)}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg transition-colors duration-200"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                          </button>
                        </div>
                        <Link
                          href={`/players/${profile._id}`}
                          className="flex items-center space-x-1 px-3 py-1.5 bg-gray-600/20 text-gray-400 hover:bg-gray-600/30 rounded-lg transition-colors duration-200"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View</span>
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </main>

      {/* Create/Edit Modal would go here */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-2xl mx-4">
            <h2 className="text-2xl font-bold text-white mb-4">
              Add New Profile
            </h2>
            <p className="text-gray-400 mb-6">
              This feature will be implemented in the next update.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {editingProfile && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-2xl mx-4">
            <h2 className="text-2xl font-bold text-white mb-4">Edit Profile</h2>
            <p className="text-gray-400 mb-6">
              This feature will be implemented in the next update.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setEditingProfile(null)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
