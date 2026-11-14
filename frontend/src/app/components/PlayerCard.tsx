"use client";

import { motion } from "framer-motion";
import {
  Gamepad2,
  Shield,
  Sword,
  Zap,
  Monitor,
  Smartphone,
  Crown,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface Player {
  id: string;
  name: string;
  realName?: string;
  inGameName?: string;
  avatar?: string;
  category: "PC" | "Mobile";
  game: string;
  roles: string[];
  rank: string;
  rankStars?: number;
  experience: string;
  isLookingForTeam: boolean;
  clan?: {
    name: string;
    tag: string;
  };
  mlbbId?: string;
}

interface PlayerCardProps {
  player: Player;
  index: number;
  onOpenChat: (player: Player) => void;
}

export default function PlayerCard({
  player,
  index,
  onOpenChat,
}: PlayerCardProps) {
  const getRoleIcon = (role: string) => {
    switch (role) {
      case "Carry":
      case "Duelist":
      case "Assault":
      case "Fighter":
      case "Exp Laner":
        return <Sword className="w-4 h-4" />;
      case "Support":
      case "Hard Support":
      case "Sentinel":
        return <Shield className="w-4 h-4" />;
      case "Mid":
      case "Mage":
      case "Initiator":
      case "Mid Laner":
        return <Zap className="w-4 h-4" />;
      case "Core":
      case "Gold Laner":
        return <Sword className="w-4 h-4" />;
      case "Roamer":
        return <Shield className="w-4 h-4" />;
      case "Fill":
        return <Gamepad2 className="w-4 h-4" />;
      default:
        return <Gamepad2 className="w-4 h-4" />;
    }
  };

  const getCategoryIcon = (category: "PC" | "Mobile") => {
    return category === "PC" ? (
      <Monitor className="w-4 h-4" />
    ) : (
      <Smartphone className="w-4 h-4" />
    );
  };

  const isMythicRank = /mythic|immortal/i.test(player.rank);

  return (
    <motion.div
      key={player.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 * index }}
      className="bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group border border-gray-700"
    >
      {/* Player Header */}
      <div className="relative p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="relative flex-shrink-0">
            {player.avatar ? (
              <Image
                src={player.avatar}
                alt={player.inGameName || player.name}
                width={64}
                height={64}
                className="rounded-full object-cover border-4 border-gray-700 shadow-lg"
                onError={(e) => {
                  console.error(
                    "Image load error for player:",
                    player.name,
                    "Avatar URL:",
                    player.avatar
                  );
                  // Fallback to default avatar
                  e.currentTarget.src = "/default-avatar.png";
                }}
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xl border-4 border-gray-700 shadow-lg">
                {(player.inGameName || player.name).charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-lg sm:text-xl font-bold text-white flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              {player.clan && (
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                  [{player.clan.tag}]
                </span>
              )}
              <span>{player.inGameName || player.name}</span>
            </h3>
            <div className="flex items-center justify-center sm:justify-start space-x-2 mt-1 flex-wrap gap-1">
              <div className="flex items-center space-x-1">
                {getCategoryIcon(player.category)}
                <span className="text-sm text-gray-400">
                  {player.category}
                </span>
              </div>
              <span className="text-gray-500 hidden sm:inline">•</span>
              <div className="flex items-center space-x-1">
                {getRoleIcon(player.roles[0])}
                <span className="text-sm text-gray-400">
                  {player.roles.join(", ")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-4">
          <span
            className={`px-3 py-1 text-xs font-medium rounded-full flex items-center gap-1 border ${
              isMythicRank
                ? "bg-blue-900/50 text-blue-200 border-blue-700"
                : "bg-purple-900/50 text-purple-200 border-purple-700"
            }`}
          >
            {player.rank}
            {/immortal/i.test(player.rank) && player.rankStars && (
              <span className="text-yellow-500">⭐ {player.rankStars}</span>
            )}
          </span>
          {player.isLookingForTeam && (
            <span className="px-3 py-1 text-xs font-medium bg-blue-900/50 text-blue-200 rounded-full border border-blue-700">
              Баг Хайж Байна
            </span>
          )}
        </div>

        {/* Player Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
            <h4 className="text-xs font-medium text-gray-400 mb-1">
              Тоглоом
            </h4>
            <p className="text-sm font-semibold text-white">
              {player.game}
            </p>
          </div>
          <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
            <h4 className="text-xs font-medium text-gray-400 mb-1">
              Туршлага
            </h4>
            <p className="text-sm font-semibold text-white">
              {player.experience}
            </p>
          </div>
          {/* MLBB ID Display */}
          {player.mlbbId && (
            <div className="bg-gray-700 rounded-lg p-3 sm:col-span-2 border border-gray-600">
              <h4 className="text-xs font-medium text-gray-400 mb-1">
                MLBB Game ID
              </h4>
              <p className="text-sm font-semibold text-blue-400">
                {player.mlbbId}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-gray-700/50 px-4 sm:px-6 py-4 border-t border-gray-700">
        <div className="flex flex-col gap-2">
          {/* First Row - Profile and Chat */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Link href={`/players/${player.id}`} className="flex-1">
              <button className="w-full bg-gradient-to-r from-slate-600 to-slate-700 text-white py-2 px-4 rounded-lg font-medium hover:from-slate-500 hover:to-slate-600 transition-all duration-200 transform hover:scale-105 text-sm shadow-md ring-1 ring-slate-400/30">
                Профайл Харах
              </button>
            </Link>

            <button
              onClick={() => onOpenChat(player)}
              className="px-4 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 transition-all duration-200 text-sm flex-shrink-0"
            >
              Зурвас
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
