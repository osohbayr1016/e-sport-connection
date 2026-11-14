"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Award, Star, Crown, Zap, Target, CheckCircle } from "lucide-react";
import AchievementCard, { AchievementGrid } from "../components/AchievementCard";
import BadgeCard, { BadgeGrid } from "../components/BadgeCard";
import Leaderboard from "../components/Leaderboard";
import ProtectedRoute from "../components/ProtectedRoute";
import { useAuth } from "../contexts/AuthContext";
import { API_ENDPOINTS } from "@/config/api";

interface Achievement {
  _id: string;
  name: string;
  description: string;
  category: string;
  rarity: string;
  type: string;
  icon: string;
  points: number;
  requirements: {
    counter?: number;
    condition?: string;
    milestone?: string;
    timeFrame?: number;
    game?: string;
    rank?: string;
  };
  rewards: {
    bountyCoins?: number;
    experience?: number;
    badge?: any;
    title?: string;
  };
  isActive: boolean;
  isSeasonal: boolean;
}

interface UserAchievement {
  _id: string;
  userId: string;
  achievementId: Achievement;
  status: "IN_PROGRESS" | "COMPLETED" | "CLAIMED";
  progress: {
    current: number;
    target: number;
    percentage: number;
  };
  completedAt?: string;
  claimedAt?: string;
  rewardsClaimed: {
    bountyCoins: boolean;
    experience: boolean;
    badge: boolean;
    title: boolean;
  };
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
  borderColor?: string;
  glowEffect?: boolean;
  animation?: string;
  requirements: {
    achievementId?: string;
    rank?: string;
    level?: number;
    tournamentWins?: number;
    specialCondition?: string;
  };
  isActive: boolean;
  isSeasonal: boolean;
  displayOrder: number;
}

interface UserBadge {
  _id: string;
  userId: string;
  badgeId: Badge;
  earnedAt: string;
  isEquipped: boolean;
  equippedAt?: string;
  metadata?: {
    achievementId?: string;
    tournamentId?: string;
    rank?: string;
    game?: string;
  };
}

export default function AchievementsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("achievements");
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      // Fetch achievements
      const achievementsResponse = await fetch(API_ENDPOINTS.ACHIEVEMENTS.ALL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const achievementsData = await achievementsResponse.json();
      setAchievements(achievementsData.data || []);

      // Fetch user achievements
      const userAchievementsResponse = await fetch(API_ENDPOINTS.ACHIEVEMENTS.MY_ACHIEVEMENTS, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const userAchievementsData = await userAchievementsResponse.json();
      setUserAchievements(userAchievementsData.data || []);

      // Fetch badges
      const badgesResponse = await fetch(API_ENDPOINTS.ACHIEVEMENTS.BADGES, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const badgesData = await badgesResponse.json();
      setBadges(badgesData.data || []);

      // Fetch user badges
      const userBadgesResponse = await fetch(API_ENDPOINTS.ACHIEVEMENTS.MY_BADGES, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const userBadgesData = await userBadgesResponse.json();
      setUserBadges(userBadgesData.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleClaimAchievement = async (achievementId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        API_ENDPOINTS.ACHIEVEMENTS.CLAIM(achievementId),
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        // Refresh user achievements
        const userAchievementsResponse = await fetch(API_ENDPOINTS.ACHIEVEMENTS.MY_ACHIEVEMENTS, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const userAchievementsData = await userAchievementsResponse.json();
        setUserAchievements(userAchievementsData.data || []);

        // Refresh user badges
        const userBadgesResponse = await fetch(API_ENDPOINTS.ACHIEVEMENTS.MY_BADGES, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const userBadgesData = await userBadgesResponse.json();
        setUserBadges(userBadgesData.data || []);
      }
    } catch (err) {
      console.error("Error claiming achievement:", err);
    }
  };

  const handleEquipBadge = async (badgeId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        API_ENDPOINTS.ACHIEVEMENTS.EQUIP_BADGE(badgeId),
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        // Refresh user badges
        const userBadgesResponse = await fetch(API_ENDPOINTS.ACHIEVEMENTS.MY_BADGES, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const userBadgesData = await userBadgesResponse.json();
        setUserBadges(userBadgesData.data || []);
      }
    } catch (err) {
      console.error("Error equipping badge:", err);
    }
  };

  const handleUnequipBadge = async (badgeId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        API_ENDPOINTS.ACHIEVEMENTS.UNEQUIP_BADGE(badgeId),
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        // Refresh user badges
        const userBadgesResponse = await fetch(API_ENDPOINTS.ACHIEVEMENTS.MY_BADGES, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const userBadgesData = await userBadgesResponse.json();
        setUserBadges(userBadgesData.data || []);
      }
    } catch (err) {
      console.error("Error unequipping badge:", err);
    }
  };

  const getStats = () => {
    const totalAchievements = achievements.length;
    const completedAchievements = userAchievements.filter(ua => ua.status === "COMPLETED").length;
    const claimedAchievements = userAchievements.filter(ua => ua.status === "CLAIMED").length;
    const totalPoints = userAchievements
      .filter(ua => ua.status === "COMPLETED" || ua.status === "CLAIMED")
      .reduce((total, ua) => total + (ua.achievementId.points || 0), 0);
    const totalBadges = badges.length;
    const earnedBadges = userBadges.length;
    const equippedBadges = userBadges.filter(ub => ub.isEquipped).length;

    return {
      totalAchievements,
      completedAchievements,
      claimedAchievements,
      totalPoints,
      totalBadges,
      earnedBadges,
      equippedBadges,
    };
  };

  const stats = getStats();

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">Achievements & Badges</h1>
            <p className="text-lg text-gray-300">Track your progress and showcase your accomplishments</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800 rounded-xl p-6 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Achievement Points</p>
                  <p className="text-2xl font-bold text-white">{stats.totalPoints}</p>
                </div>
                <Zap className="w-8 h-8 text-yellow-500" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-800 rounded-xl p-6 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Achievements</p>
                  <p className="text-2xl font-bold text-white">
                    {stats.completedAchievements}/{stats.totalAchievements}
                  </p>
                </div>
                <Trophy className="w-8 h-8 text-blue-500" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-800 rounded-xl p-6 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Badges Earned</p>
                  <p className="text-2xl font-bold text-white">
                    {stats.earnedBadges}/{stats.totalBadges}
                  </p>
                </div>
                <Award className="w-8 h-8 text-purple-500" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gray-800 rounded-xl p-6 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Badges Equipped</p>
                  <p className="text-2xl font-bold text-white">{stats.equippedBadges}</p>
                </div>
                <Star className="w-8 h-8 text-green-500" />
              </div>
            </motion.div>
          </div>

          {/* Tabs */}
          <div className="bg-gray-800 rounded-xl shadow-lg mb-8">
            <div className="border-b border-gray-700">
              <nav className="flex space-x-8 px-6">
                {[
                  { id: "achievements", label: "Achievements", icon: Trophy },
                  { id: "badges", label: "Badges", icon: Award },
                  { id: "leaderboard", label: "Leaderboard", icon: Crown },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-400"
                        : "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600"
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {activeTab === "achievements" && (
                <AchievementGrid
                  achievements={achievements}
                  userAchievements={userAchievements}
                  onClaim={handleClaimAchievement}
                />
              )}

              {activeTab === "badges" && (
                <BadgeGrid
                  badges={badges}
                  userBadges={userBadges}
                  onEquip={handleEquipBadge}
                  onUnequip={handleUnequipBadge}
                />
              )}

              {activeTab === "leaderboard" && (
                <Leaderboard type="ACHIEVEMENT_POINTS" period="ALL_TIME" limit={50} />
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
