"use client";

import React, { useState, useEffect } from "react";
import { API_ENDPOINTS } from "../../../config/api";
import { 
  Trophy, 
  Award, 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Star, 
  Crown, 
  Shield, 
  Zap,
  TrendingUp,
  BarChart3,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Target,
  Gift
} from "lucide-react";

interface Achievement {
  _id: string;
  name: string;
  description: string;
  category: string;
  rarity: string;
  type: string;
  icon: string;
  points: number;
  requirements: any;
  rewards: any;
  isActive: boolean;
  isSeasonal: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Badge {
  _id: string;
  name: string;
  description: string;
  type: string;
  rarity: string;
  icon: string;
  color: string;
  glowEffect: boolean;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UserProgress {
  _id: string;
  name: string;
  email: string;
  avatar: string;
  achievementsCount: number;
  badgesCount: number;
  totalPoints: number;
  createdAt: string;
}

interface AchievementStats {
  totalAchievements: number;
  totalBadges: number;
  activeAchievements: number;
  activeBadges: number;
  achievementsByCategory: Array<{ _id: string; count: number }>;
  badgesByRarity: Array<{ _id: string; count: number }>;
  totalUserAchievements: number;
  totalUserBadges: number;
}

const rarityColors = {
  COMMON: "from-gray-400 to-gray-600",
  RARE: "from-green-400 to-green-600", 
  EPIC: "from-blue-400 to-blue-600",
  LEGENDARY: "from-purple-400 to-purple-600",
  MYTHIC: "from-red-400 to-red-600"
};

const rarityIcons = {
  COMMON: <Star className="w-4 h-4" />,
  RARE: <Shield className="w-4 h-4" />,
  EPIC: <Zap className="w-4 h-4" />,
  LEGENDARY: <Crown className="w-4 h-4" />,
  MYTHIC: <Trophy className="w-4 h-4" />
};

export default function AdminAchievementsPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [usersProgress, setUsersProgress] = useState<UserProgress[]>([]);
  const [stats, setStats] = useState<AchievementStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [showAchievementForm, setShowAchievementForm] = useState(false);
  const [showBadgeForm, setShowBadgeForm] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null);
  const [editingBadge, setEditingBadge] = useState<Badge | null>(null);

  // Achievement form data
  const [achievementForm, setAchievementForm] = useState({
    name: "",
    description: "",
    category: "TOURNAMENT",
    rarity: "COMMON",
    type: "COUNTER",
    icon: "star",
    points: 10,
    requirements: { counter: 1 },
    rewards: { bountyCoins: 0, experience: 0 },
    isActive: true,
    isSeasonal: false,
  });

  // Badge form data
  const [badgeForm, setBadgeForm] = useState({
    name: "",
    description: "",
    type: "ACHIEVEMENT",
    rarity: "COMMON",
    icon: "star",
    color: "#3B82F6",
    glowEffect: false,
    displayOrder: 0,
    isActive: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const [achievementsRes, badgesRes, usersRes, statsRes] = await Promise.all([
        fetch(API_ENDPOINTS.ADMIN_ACHIEVEMENTS.ALL, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(API_ENDPOINTS.ADMIN_ACHIEVEMENTS.BADGES_ALL, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(API_ENDPOINTS.ADMIN_ACHIEVEMENTS.USERS_PROGRESS, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(API_ENDPOINTS.ADMIN_ACHIEVEMENTS.STATS, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const achievementsData = await achievementsRes.json();
      const badgesData = await badgesRes.json();
      const usersData = await usersRes.json();
      const statsData = await statsRes.json();

      if (achievementsData.success) setAchievements(achievementsData.data);
      if (badgesData.success) setBadges(badgesData.data);
      if (usersData.success) setUsersProgress(usersData.data.users);
      if (statsData.success) setStats(statsData.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAchievement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(API_ENDPOINTS.ADMIN_ACHIEVEMENTS.CREATE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(achievementForm),
      });

      if (response.ok) {
        setShowAchievementForm(false);
        setAchievementForm({
          name: "",
          description: "",
          category: "TOURNAMENT",
          rarity: "COMMON",
          type: "COUNTER",
          icon: "star",
          points: 10,
          requirements: { counter: 1 },
          rewards: { bountyCoins: 0, experience: 0 },
          isActive: true,
          isSeasonal: false,
        });
        fetchData();
      }
    } catch (err) {
      console.error("Error creating achievement:", err);
    }
  };

  const handleCreateBadge = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(API_ENDPOINTS.ADMIN_ACHIEVEMENTS.BADGES_CREATE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(badgeForm),
      });

      if (response.ok) {
        setShowBadgeForm(false);
        setBadgeForm({
          name: "",
          description: "",
          type: "ACHIEVEMENT",
          rarity: "COMMON",
          icon: "star",
          color: "#3B82F6",
          glowEffect: false,
          displayOrder: 0,
          isActive: true,
        });
        fetchData();
      }
    } catch (err) {
      console.error("Error creating badge:", err);
    }
  };

  const handleDeleteAchievement = async (id: string) => {
    if (!confirm("Are you sure you want to delete this achievement?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(API_ENDPOINTS.ADMIN_ACHIEVEMENTS.DELETE(id), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        fetchData();
      }
    } catch (err) {
      console.error("Error deleting achievement:", err);
    }
  };

  const handleDeleteBadge = async (id: string) => {
    if (!confirm("Are you sure you want to delete this badge?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(API_ENDPOINTS.ADMIN_ACHIEVEMENTS.BADGES_DELETE(id), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        fetchData();
      }
    } catch (err) {
      console.error("Error deleting badge:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-gray-400 rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="mt-6 text-white text-lg font-medium">Loading Achievement System...</p>
          <p className="mt-2 text-gray-300 text-sm">Preparing admin dashboard</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 flex items-center justify-center">
        <div className="text-center bg-red-500/10 backdrop-blur-sm rounded-2xl p-8 border border-red-500/20">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-red-400 text-2xl font-bold mb-2">Error Loading Data</h2>
          <p className="text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Achievement Management
              </h1>
              <p className="mt-2 text-gray-200 text-lg">
                Create, manage, and track achievements, badges, and user progress
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowAchievementForm(true)}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center space-x-2 transition-all duration-200 shadow-lg hover:shadow-blue-500/25"
              >
                <Plus className="w-5 h-5" />
                <span>New Achievement</span>
              </button>
              <button
                onClick={() => setShowBadgeForm(true)}
                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center space-x-2 transition-all duration-200 shadow-lg hover:shadow-purple-500/25"
              >
                <Award className="w-5 h-5" />
                <span>New Badge</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 backdrop-blur-sm rounded-2xl border border-blue-500/20 p-6 hover:border-blue-400/40 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-300 text-sm font-medium">Total Achievements</p>
                  <p className="text-white text-3xl font-bold mt-2">{stats.totalAchievements}</p>
                  <p className="text-blue-400 text-xs mt-1">{stats.activeAchievements} active</p>
                </div>
                <div className="p-3 bg-blue-500/20 rounded-xl">
                  <Trophy className="w-8 h-8 text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 backdrop-blur-sm rounded-2xl border border-green-500/20 p-6 hover:border-green-400/40 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-300 text-sm font-medium">Total Badges</p>
                  <p className="text-white text-3xl font-bold mt-2">{stats.totalBadges}</p>
                  <p className="text-green-400 text-xs mt-1">{stats.activeBadges} active</p>
                </div>
                <div className="p-3 bg-green-500/20 rounded-xl">
                  <Award className="w-8 h-8 text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 backdrop-blur-sm rounded-2xl border border-purple-500/20 p-6 hover:border-purple-400/40 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-300 text-sm font-medium">User Achievements</p>
                  <p className="text-white text-3xl font-bold mt-2">{stats.totalUserAchievements}</p>
                  <p className="text-purple-400 text-xs mt-1">earned by users</p>
                </div>
                <div className="p-3 bg-purple-500/20 rounded-xl">
                  <Users className="w-8 h-8 text-purple-400" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 backdrop-blur-sm rounded-2xl border border-yellow-500/20 p-6 hover:border-yellow-400/40 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-300 text-sm font-medium">User Badges</p>
                  <p className="text-white text-3xl font-bold mt-2">{stats.totalUserBadges}</p>
                  <p className="text-yellow-400 text-xs mt-1">earned by users</p>
                </div>
                <div className="p-3 bg-yellow-500/20 rounded-xl">
                  <Star className="w-8 h-8 text-yellow-400" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-black/20 backdrop-blur-sm rounded-2xl border border-white/10 mb-8">
          <div className="border-b border-white/10">
            <nav className="flex space-x-8 px-6">
              {[
                { id: "overview", label: "Overview", icon: BarChart3 },
                { id: "achievements", label: "Achievements", icon: Trophy, count: achievements.length },
                { id: "badges", label: "Badges", icon: Award, count: badges.length },
                { id: "users", label: "User Progress", icon: Users, count: usersProgress.length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-all duration-200 ${
                    activeTab === tab.id
                      ? "border-gray-400 text-gray-300"
                      : "border-transparent text-gray-400 hover:text-white hover:border-gray-300"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className="bg-gray-500/20 text-gray-300 px-2 py-1 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Achievements by Category */}
                  <div className="bg-gradient-to-br from-blue-500/5 to-blue-600/5 backdrop-blur-sm rounded-xl border border-blue-500/20 p-6">
                    <h3 className="text-white text-xl font-semibold mb-4 flex items-center">
                      <Trophy className="w-5 h-5 mr-2 text-blue-400" />
                      Achievements by Category
                    </h3>
                    <div className="space-y-3">
                      {stats?.achievementsByCategory.map((category) => (
                        <div key={category._id} className="flex items-center justify-between">
                          <span className="text-gray-300 capitalize">{category._id.toLowerCase()}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-24 bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${(category.count / Math.max(...stats.achievementsByCategory.map(c => c.count))) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-white font-semibold w-8 text-right">{category.count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Badges by Rarity */}
                  <div className="bg-gradient-to-br from-purple-500/5 to-purple-600/5 backdrop-blur-sm rounded-xl border border-purple-500/20 p-6">
                    <h3 className="text-white text-xl font-semibold mb-4 flex items-center">
                      <Award className="w-5 h-5 mr-2 text-purple-400" />
                      Badges by Rarity
                    </h3>
                    <div className="space-y-3">
                      {stats?.badgesByRarity.map((rarity) => (
                        <div key={rarity._id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className={`p-1 rounded ${rarityColors[rarity._id as keyof typeof rarityColors]}`}>
                              {rarityIcons[rarity._id as keyof typeof rarityIcons]}
                            </div>
                            <span className="text-gray-300 capitalize">{rarity._id.toLowerCase()}</span>
                          </div>
                          <span className="text-white font-semibold">{rarity.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-gradient-to-br from-gray-500/5 to-gray-600/5 backdrop-blur-sm rounded-xl border border-gray-500/20 p-6">
                  <h3 className="text-white text-xl font-semibold mb-4 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-gray-400" />
                    Quick Actions
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      onClick={() => setShowAchievementForm(true)}
                      className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 hover:from-blue-500/30 hover:to-blue-600/30 border border-blue-500/30 rounded-xl p-4 text-left transition-all duration-200 group"
                    >
                      <Plus className="w-6 h-6 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
                      <h4 className="text-white font-semibold">Create Achievement</h4>
                      <p className="text-blue-300 text-sm">Add a new achievement</p>
                    </button>
                    <button
                      onClick={() => setShowBadgeForm(true)}
                      className="bg-gradient-to-r from-purple-500/20 to-purple-600/20 hover:from-purple-500/30 hover:to-purple-600/30 border border-purple-500/30 rounded-xl p-4 text-left transition-all duration-200 group"
                    >
                      <Award className="w-6 h-6 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
                      <h4 className="text-white font-semibold">Create Badge</h4>
                      <p className="text-purple-300 text-sm">Add a new badge</p>
                    </button>
                    <button
                      onClick={() => setActiveTab("users")}
                      className="bg-gradient-to-r from-green-500/20 to-green-600/20 hover:from-green-500/30 hover:to-green-600/30 border border-green-500/30 rounded-xl p-4 text-left transition-all duration-200 group"
                    >
                      <Users className="w-6 h-6 text-green-400 mb-2 group-hover:scale-110 transition-transform" />
                      <h4 className="text-white font-semibold">View Users</h4>
                      <p className="text-green-300 text-sm">Check user progress</p>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Achievements Tab */}
            {activeTab === "achievements" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white">Achievements</h2>
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <CheckCircle className="w-4 h-4" />
                    <span>{achievements.filter(a => a.isActive).length} active</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {achievements.map((achievement) => (
                    <div key={achievement._id} className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6 hover:border-gray-500/50 transition-all duration-300 group">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`p-3 rounded-xl bg-gradient-to-r ${rarityColors[achievement.rarity as keyof typeof rarityColors]}`}>
                            {rarityIcons[achievement.rarity as keyof typeof rarityIcons]}
                          </div>
                          <div>
                            <h3 className="font-semibold text-white group-hover:text-gray-300 transition-colors">{achievement.name}</h3>
                            <p className="text-sm text-gray-400 capitalize">{achievement.category.toLowerCase()}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                            achievement.rarity === 'LEGENDARY' ? 'bg-purple-500/20 text-purple-300' :
                            achievement.rarity === 'EPIC' ? 'bg-blue-500/20 text-blue-300' :
                            achievement.rarity === 'RARE' ? 'bg-green-500/20 text-green-300' :
                            'bg-gray-500/20 text-gray-300'
                          }`}>
                            {achievement.rarity}
                          </span>
                          {achievement.isActive ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-400" />
                          )}
                        </div>
                      </div>
                      <p className="text-gray-300 text-sm mb-4 line-clamp-2">{achievement.description}</p>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-gray-400 flex items-center">
                            <Target className="w-4 h-4 mr-1" />
                            {achievement.points} pts
                          </span>
                          <span className="text-sm text-gray-400 flex items-center">
                            <Gift className="w-4 h-4 mr-1" />
                            {achievement.requirements.counter || 1}x
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteAchievement(achievement._id)}
                          className="text-red-400 hover:text-red-300 transition-colors p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Badges Tab */}
            {activeTab === "badges" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white">Badges</h2>
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <CheckCircle className="w-4 h-4" />
                    <span>{badges.filter(b => b.isActive).length} active</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {badges.map((badge) => (
                    <div key={badge._id} className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6 hover:border-gray-500/50 transition-all duration-300 group">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="p-3 rounded-xl relative"
                            style={{ 
                              backgroundColor: badge.color + '20',
                              border: `2px solid ${badge.color}40`
                            }}
                          >
                            <div 
                              className="w-8 h-8 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: badge.color }}
                            >
                              <Star className="w-5 h-5 text-white" />
                            </div>
                            {badge.glowEffect && (
                              <div 
                                className="absolute inset-0 rounded-xl opacity-50 animate-pulse"
                                style={{ 
                                  boxShadow: `0 0 20px ${badge.color}`,
                                  backgroundColor: badge.color + '20'
                                }}
                              ></div>
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-white group-hover:text-gray-300 transition-colors">{badge.name}</h3>
                            <p className="text-sm text-gray-400 capitalize">{badge.type.toLowerCase()}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                            badge.rarity === 'LEGENDARY' ? 'bg-purple-500/20 text-purple-300' :
                            badge.rarity === 'EPIC' ? 'bg-blue-500/20 text-blue-300' :
                            badge.rarity === 'RARE' ? 'bg-green-500/20 text-green-300' :
                            'bg-gray-500/20 text-gray-300'
                          }`}>
                            {badge.rarity}
                          </span>
                          {badge.isActive ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-400" />
                          )}
                        </div>
                      </div>
                      <p className="text-gray-300 text-sm mb-4 line-clamp-2">{badge.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">Order: {badge.displayOrder}</span>
                        <button
                          onClick={() => handleDeleteBadge(badge._id)}
                          className="text-red-400 hover:text-red-300 transition-colors p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === "users" && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">User Progress</h2>
                <div className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gradient-to-r from-gray-800/50 to-gray-900/50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            User
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Achievements
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Badges
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Total Points
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Joined
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700/50">
                        {usersProgress.map((user) => (
                          <tr key={user._id} className="hover:bg-gray-800/30 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-12 w-12 flex-shrink-0">
                                  <img
                                    className="h-12 w-12 rounded-full border-2 border-gray-600"
                                    src={user.avatar || "/default-avatar.png"}
                                    alt={user.name}
                                  />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-white">{user.name}</div>
                                  <div className="text-sm text-gray-400">{user.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <Trophy className="w-4 h-4 text-yellow-400 mr-2" />
                                <span className="text-white font-semibold">{user.achievementsCount}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <Award className="w-4 h-4 text-purple-400 mr-2" />
                                <span className="text-white font-semibold">{user.badgesCount}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <Star className="w-4 h-4 text-blue-400 mr-2" />
                                <span className="text-white font-semibold">{user.totalPoints}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 mr-2" />
                                {new Date(user.createdAt).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button className="text-gray-400 hover:text-gray-300 transition-colors">
                                <Eye className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Achievement Form Modal */}
        {showAchievementForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700 w-full max-w-md shadow-2xl">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">Create Achievement</h3>
                  <button
                    onClick={() => setShowAchievementForm(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
                <form onSubmit={handleCreateAchievement} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                    <input
                      type="text"
                      value={achievementForm.name}
                      onChange={(e) => setAchievementForm({ ...achievementForm, name: e.target.value })}
                      className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-gray-500 focus:ring-1 focus:ring-gray-500 transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                    <textarea
                      value={achievementForm.description}
                      onChange={(e) => setAchievementForm({ ...achievementForm, description: e.target.value })}
                      className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-gray-500 focus:ring-1 focus:ring-gray-500 transition-colors"
                      rows={3}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                      <select
                        value={achievementForm.category}
                        onChange={(e) => setAchievementForm({ ...achievementForm, category: e.target.value })}
                        className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-gray-500 focus:ring-1 focus:ring-gray-500 transition-colors"
                      >
                        <option value="TOURNAMENT">Tournament</option>
                        <option value="MATCH">Match</option>
                        <option value="PROGRESS">Progress</option>
                        <option value="SOCIAL">Social</option>
                        <option value="SPECIAL">Special</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Rarity</label>
                      <select
                        value={achievementForm.rarity}
                        onChange={(e) => setAchievementForm({ ...achievementForm, rarity: e.target.value })}
                        className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-gray-500 focus:ring-1 focus:ring-gray-500 transition-colors"
                      >
                        <option value="COMMON">Common</option>
                        <option value="RARE">Rare</option>
                        <option value="EPIC">Epic</option>
                        <option value="LEGENDARY">Legendary</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Points</label>
                      <input
                        type="number"
                        value={achievementForm.points}
                        onChange={(e) => setAchievementForm({ ...achievementForm, points: parseInt(e.target.value) })}
                        className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-gray-500 focus:ring-1 focus:ring-gray-500 transition-colors"
                        min="1"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Counter Target</label>
                      <input
                        type="number"
                        value={achievementForm.requirements.counter}
                        onChange={(e) => setAchievementForm({ 
                          ...achievementForm, 
                          requirements: { ...achievementForm.requirements, counter: parseInt(e.target.value) }
                        })}
                        className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-gray-500 focus:ring-1 focus:ring-gray-500 transition-colors"
                        min="1"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAchievementForm(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700/50 rounded-lg hover:bg-gray-600/50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
                    >
                      Create Achievement
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Badge Form Modal */}
        {showBadgeForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700 w-full max-w-md shadow-2xl">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">Create Badge</h3>
                  <button
                    onClick={() => setShowBadgeForm(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
                <form onSubmit={handleCreateBadge} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                    <input
                      type="text"
                      value={badgeForm.name}
                      onChange={(e) => setBadgeForm({ ...badgeForm, name: e.target.value })}
                      className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-gray-500 focus:ring-1 focus:ring-gray-500 transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                    <textarea
                      value={badgeForm.description}
                      onChange={(e) => setBadgeForm({ ...badgeForm, description: e.target.value })}
                      className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-gray-500 focus:ring-1 focus:ring-gray-500 transition-colors"
                      rows={3}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
                      <select
                        value={badgeForm.type}
                        onChange={(e) => setBadgeForm({ ...badgeForm, type: e.target.value })}
                        className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-gray-500 focus:ring-1 focus:ring-gray-500 transition-colors"
                      >
                        <option value="ACHIEVEMENT">Achievement</option>
                        <option value="RANK">Rank</option>
                        <option value="SPECIAL">Special</option>
                        <option value="TOURNAMENT">Tournament</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Rarity</label>
                      <select
                        value={badgeForm.rarity}
                        onChange={(e) => setBadgeForm({ ...badgeForm, rarity: e.target.value })}
                        className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-gray-500 focus:ring-1 focus:ring-gray-500 transition-colors"
                      >
                        <option value="COMMON">Common</option>
                        <option value="RARE">Rare</option>
                        <option value="EPIC">Epic</option>
                        <option value="LEGENDARY">Legendary</option>
                        <option value="MYTHIC">Mythic</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Color</label>
                      <input
                        type="color"
                        value={badgeForm.color}
                        onChange={(e) => setBadgeForm({ ...badgeForm, color: e.target.value })}
                        className="w-full h-10 bg-gray-700/50 border border-gray-600 rounded-lg cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Display Order</label>
                      <input
                        type="number"
                        value={badgeForm.displayOrder}
                        onChange={(e) => setBadgeForm({ ...badgeForm, displayOrder: parseInt(e.target.value) })}
                        className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-gray-500 focus:ring-1 focus:ring-gray-500 transition-colors"
                        min="0"
                      />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="glowEffect"
                      checked={badgeForm.glowEffect}
                      onChange={(e) => setBadgeForm({ ...badgeForm, glowEffect: e.target.checked })}
                      className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-600 rounded bg-gray-700"
                    />
                    <label htmlFor="glowEffect" className="ml-2 block text-sm text-gray-300">
                      Glow Effect
                    </label>
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowBadgeForm(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700/50 rounded-lg hover:bg-gray-600/50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200"
                    >
                      Create Badge
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
