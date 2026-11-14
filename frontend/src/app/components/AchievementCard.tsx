"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  Star,
  Crown,
  Target,
  CheckCircle,
  Clock,
  Award,
  Zap,
  Flame,
  Shield,
  Sword,
  Gamepad2,
} from "lucide-react";
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

interface AchievementCardProps {
  achievement: Achievement;
  userAchievement?: UserAchievement;
  onClaim?: (achievementId: string) => void;
}

const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case "COMMON":
      return "border-gray-500 bg-gray-700";
    case "RARE":
      return "border-blue-500 bg-blue-900/30";
    case "EPIC":
      return "border-purple-500 bg-purple-900/30";
    case "LEGENDARY":
      return "border-yellow-500 bg-yellow-900/30";
    default:
      return "border-gray-500 bg-gray-700";
  }
};

const getRarityIcon = (rarity: string) => {
  switch (rarity) {
    case "COMMON":
      return <Shield className="w-4 h-4 text-gray-400" />;
    case "RARE":
      return <Star className="w-4 h-4 text-blue-400" />;
    case "EPIC":
      return <Crown className="w-4 h-4 text-purple-400" />;
    case "LEGENDARY":
      return <Trophy className="w-4 h-4 text-yellow-400" />;
    default:
      return <Award className="w-4 h-4 text-gray-400" />;
  }
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "TOURNAMENT":
      return <Trophy className="w-5 h-5" />;
    case "MATCH":
      return <Sword className="w-5 h-5" />;
    case "SOCIAL":
      return <Star className="w-5 h-5" />;
    case "PROGRESS":
      return <Target className="w-5 h-5" />;
    case "SPECIAL":
      return <Crown className="w-5 h-5" />;
    case "SEASONAL":
      return <Flame className="w-5 h-5" />;
    default:
      return <Award className="w-5 h-5" />;
  }
};

export default function AchievementCard({
  achievement,
  userAchievement,
  onClaim,
}: AchievementCardProps) {
  const isCompleted = userAchievement?.status === "COMPLETED";
  const isClaimed = userAchievement?.status === "CLAIMED";
  const canClaim = isCompleted && !isClaimed;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative p-6 rounded-xl border-2 transition-all duration-300 hover:shadow-lg ${getRarityColor(
        achievement.rarity
      )} ${isCompleted ? "ring-2 ring-green-400" : ""}`}
    >
      {/* Rarity Badge */}
      <div className="absolute -top-2 -right-2 bg-gray-800 rounded-full p-1 shadow-md">
        {getRarityIcon(achievement.rarity)}
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gray-600 rounded-lg shadow-sm">
            {getCategoryIcon(achievement.category)}
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">{achievement.name}</h3>
            <p className="text-sm text-gray-300">{achievement.description}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center space-x-1 text-yellow-400">
            <Zap className="w-4 h-4" />
            <span className="font-semibold">{achievement.points}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {userAchievement && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-300 mb-1">
            <span>Progress</span>
            <span>{userAchievement.progress.percentage.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-600 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${userAchievement.progress.percentage}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{userAchievement.progress.current}</span>
            <span>{userAchievement.progress.target}</span>
          </div>
        </div>
      )}

      {/* Requirements */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-300 mb-2">Requirements:</h4>
        <div className="text-sm text-gray-400">
          {achievement.requirements.counter && (
            <p>• Complete {achievement.requirements.counter} times</p>
          )}
          {achievement.requirements.rank && (
            <p>• Reach {achievement.requirements.rank} rank</p>
          )}
          {achievement.requirements.game && (
            <p>• In {achievement.requirements.game}</p>
          )}
          {achievement.requirements.condition && (
            <p>• {achievement.requirements.condition}</p>
          )}
        </div>
      </div>

      {/* Rewards */}
      {achievement.rewards && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-300 mb-2">Rewards:</h4>
          <div className="flex flex-wrap gap-2">
            {achievement.rewards.bountyCoins && (
              <span className="px-2 py-1 bg-yellow-900/50 text-yellow-300 rounded-full text-xs">
                {achievement.rewards.bountyCoins} Coins
              </span>
            )}
            {achievement.rewards.experience && (
              <span className="px-2 py-1 bg-blue-900/50 text-blue-300 rounded-full text-xs">
                {achievement.rewards.experience} XP
              </span>
            )}
            {achievement.rewards.title && (
              <span className="px-2 py-1 bg-purple-900/50 text-purple-300 rounded-full text-xs">
                {achievement.rewards.title}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {isCompleted && (
            <CheckCircle className="w-5 h-5 text-green-500" />
          )}
          {isClaimed && (
            <Clock className="w-5 h-5 text-gray-500" />
          )}
          <span className="text-sm font-medium text-gray-300">
            {isClaimed
              ? "Claimed"
              : isCompleted
              ? "Completed"
              : userAchievement
              ? "In Progress"
              : "Not Started"}
          </span>
        </div>

        {canClaim && onClaim && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onClaim(achievement._id)}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
          >
            Claim Rewards
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

interface AchievementGridProps {
  achievements: Achievement[];
  userAchievements: UserAchievement[];
  onClaim: (achievementId: string) => void;
}

export function AchievementGrid({
  achievements,
  userAchievements,
  onClaim,
}: AchievementGridProps) {
  const [filter, setFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("points");

  const filteredAchievements = achievements.filter((achievement) => {
    if (filter === "ALL") return true;
    return achievement.category === filter;
  });

  const sortedAchievements = [...filteredAchievements].sort((a, b) => {
    switch (sortBy) {
      case "points":
        return b.points - a.points;
      case "rarity":
        const rarityOrder = { LEGENDARY: 4, EPIC: 3, RARE: 2, COMMON: 1 };
        return rarityOrder[b.rarity as keyof typeof rarityOrder] - rarityOrder[a.rarity as keyof typeof rarityOrder];
      case "name":
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2">
          {["ALL", "TOURNAMENT", "MATCH", "SOCIAL", "PROGRESS", "SPECIAL", "SEASONAL"].map((category) => (
            <button
              key={category}
              onClick={() => setFilter(category)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filter === category
                  ? "bg-blue-500 text-white"
                  : "bg-gray-600 text-gray-300 hover:bg-gray-500"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="points">Sort by Points</option>
          <option value="rarity">Sort by Rarity</option>
          <option value="name">Sort by Name</option>
        </select>
      </div>

      {/* Achievement Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedAchievements.map((achievement) => {
          const userAchievement = userAchievements.find(
            (ua) => ua.achievementId._id === achievement._id
          );

          return (
            <AchievementCard
              key={achievement._id}
              achievement={achievement}
              userAchievement={userAchievement}
              onClaim={onClaim}
            />
          );
        })}
      </div>
    </div>
  );
}
