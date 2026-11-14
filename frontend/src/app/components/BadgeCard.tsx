"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Award,
  Star,
  Crown,
  Shield,
  Zap,
  CheckCircle,
  Clock,
  Trophy,
  Flame,
  Gamepad2,
} from "lucide-react";
import { API_ENDPOINTS } from "@/config/api";

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

interface BadgeCardProps {
  badge: Badge;
  userBadge?: UserBadge;
  onEquip?: (badgeId: string) => void;
  onUnequip?: (badgeId: string) => void;
  showEquipButton?: boolean;
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
    case "MYTHIC":
      return "border-red-500 bg-red-900/30";
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
    case "MYTHIC":
      return <Flame className="w-4 h-4 text-red-400" />;
    default:
      return <Award className="w-4 h-4 text-gray-400" />;
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case "ACHIEVEMENT":
      return <Trophy className="w-4 h-4" />;
    case "RANK":
      return <Star className="w-4 h-4" />;
    case "SPECIAL":
      return <Crown className="w-4 h-4" />;
    case "SEASONAL":
      return <Flame className="w-4 h-4" />;
    case "TOURNAMENT":
      return <Gamepad2 className="w-4 h-4" />;
    default:
      return <Award className="w-4 h-4" />;
  }
};

export default function BadgeCard({
  badge,
  userBadge,
  onEquip,
  onUnequip,
  showEquipButton = true,
}: BadgeCardProps) {
  const isEarned = !!userBadge;
  const isEquipped = userBadge?.isEquipped || false;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-lg ${
        isEarned ? getRarityColor(badge.rarity) : "border-gray-600 bg-gray-800 opacity-60"
      } ${isEquipped ? "ring-2 ring-green-400" : ""}`}
    >
      {/* Rarity Badge */}
      <div className="absolute -top-2 -right-2 bg-gray-800 rounded-full p-1 shadow-md">
        {getRarityIcon(badge.rarity)}
      </div>

      {/* Badge Icon */}
      <div className="flex justify-center mb-4">
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl ${
            isEarned ? "" : "grayscale"
          } ${badge.glowEffect ? "shadow-lg" : ""}`}
          style={{
            backgroundColor: badge.color,
            borderColor: badge.borderColor || badge.color,
            borderWidth: "2px",
            boxShadow: badge.glowEffect ? `0 0 20px ${badge.color}40` : "none",
          }}
        >
          {getTypeIcon(badge.type)}
        </div>
      </div>

      {/* Badge Info */}
      <div className="text-center">
        <h3 className={`font-bold text-lg mb-1 ${isEarned ? "text-white" : "text-gray-500"}`}>
          {badge.name}
        </h3>
        <p className={`text-sm mb-3 ${isEarned ? "text-gray-300" : "text-gray-400"}`}>
          {badge.description}
        </p>

        {/* Requirements */}
        <div className="text-xs text-gray-400 mb-3">
          {badge.requirements.rank && <p>• Reach {badge.requirements.rank} rank</p>}
          {badge.requirements.level && <p>• Level {badge.requirements.level}</p>}
          {badge.requirements.tournamentWins && (
            <p>• Win {badge.requirements.tournamentWins} tournaments</p>
          )}
          {badge.requirements.specialCondition && (
            <p>• {badge.requirements.specialCondition}</p>
          )}
        </div>

        {/* Status */}
        <div className="flex items-center justify-center space-x-2 mb-3">
          {isEarned ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <Clock className="w-4 h-4 text-gray-400" />
          )}
          <span className={`text-xs font-medium ${isEarned ? "text-green-400" : "text-gray-400"}`}>
            {isEarned ? "Earned" : "Not Earned"}
          </span>
        </div>

        {/* Equip/Unequip Button */}
        {showEquipButton && isEarned && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => (isEquipped ? onUnequip?.(badge._id) : onEquip?.(badge._id))}
            className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isEquipped
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
          >
            {isEquipped ? "Unequip" : "Equip"}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

interface BadgeGridProps {
  badges: Badge[];
  userBadges: UserBadge[];
  onEquip: (badgeId: string) => void;
  onUnequip: (badgeId: string) => void;
}

export function BadgeGrid({ badges, userBadges, onEquip, onUnequip }: BadgeGridProps) {
  const [filter, setFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("displayOrder");

  const filteredBadges = badges.filter((badge) => {
    if (filter === "ALL") return true;
    return badge.type === filter;
  });

  const sortedBadges = [...filteredBadges].sort((a, b) => {
    switch (sortBy) {
      case "displayOrder":
        return a.displayOrder - b.displayOrder;
      case "rarity":
        const rarityOrder = { MYTHIC: 5, LEGENDARY: 4, EPIC: 3, RARE: 2, COMMON: 1 };
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
          {["ALL", "ACHIEVEMENT", "RANK", "SPECIAL", "SEASONAL", "TOURNAMENT"].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filter === type
                  ? "bg-blue-500 text-white"
                  : "bg-gray-600 text-gray-300 hover:bg-gray-500"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="displayOrder">Sort by Order</option>
          <option value="rarity">Sort by Rarity</option>
          <option value="name">Sort by Name</option>
        </select>
      </div>

      {/* Badge Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {sortedBadges.map((badge) => {
          const userBadge = userBadges.find((ub) => ub.badgeId._id === badge._id);

          return (
            <BadgeCard
              key={badge._id}
              badge={badge}
              userBadge={userBadge}
              onEquip={onEquip}
              onUnequip={onUnequip}
            />
          );
        })}
      </div>
    </div>
  );
}
