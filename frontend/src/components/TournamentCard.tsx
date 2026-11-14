"use client";

import { motion } from "framer-motion";
import {
  Calendar,
  Trophy,
  Users,
  MapPin,
  DollarSign,
  Star,
  Clock,
  Gamepad2,
  Target,
  Award,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export interface Tournament {
  _id: string;
  name: string;
  game: string;
  description: string;
  organizer: {
    _id: string;
    name: string;
    logo?: string;
    isVerified?: boolean;
  };
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  prizePool: number;
  currency: string;
  maxParticipants: number;
  currentParticipants: number;
  format: string;
  entryFee: number;
  tournamentType: "tax" | "free"; // Tournament type: tax (requires payment) or free
  location: string;
  status:
    | "upcoming"
    | "registration_open"
    | "registration_closed"
    | "ongoing"
    | "completed";
  requirements: string[];
  rules: string[];
  createdAt: string;
  updatedAt: string;
}

interface TournamentCardProps {
  tournament: Tournament;
  index: number;
}

import { memo } from "react";

function TournamentCardComponent({ tournament, index }: TournamentCardProps) {
  const getStatusColor = (status: Tournament["status"]) => {
    switch (status) {
      case "registration_open":
        return "bg-green-500";
      case "upcoming":
        return "bg-blue-500";
      case "registration_closed":
        return "bg-yellow-500";
      case "ongoing":
        return "bg-purple-500";
      case "completed":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: Tournament["status"]) => {
    switch (status) {
      case "registration_open":
        return "Бүртгэл нээлттэй";
      case "upcoming":
        return "Удахгүй";
      case "registration_closed":
        return "Бүртгэл хаагдсан";
      case "ongoing":
        return "Явагдаж байна";
      case "completed":
        return "Дууссан";
      default:
        return status;
    }
  };

  const formatPrizePool = (amount: number, currency: string) => {
    return `${amount.toLocaleString()} ${currency}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("mn-MN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getGameIcon = (game: string) => {
    // Game-specific icons
    if (game.toLowerCase().includes("mobile legends")) {
      return "/images/game-icons/mlbb-icon.svg";
    } else if (game.toLowerCase().includes("valorant")) {
      return "/images/game-icons/valorant-icon.svg";
    } else if (
      game.toLowerCase().includes("csgo") ||
      game.toLowerCase().includes("counter-strike")
    ) {
      return "/images/game-icons/csgo-icon.svg";
    } else {
      return "/images/game-icons/mlbb-icon.svg"; // Default fallback
    }
  };

  const getGameBackground = (game: string) => {
    // Dynamic background based on game type
    if (game.toLowerCase().includes("mobile legends")) {
      return "from-blue-600 to-indigo-600";
    } else if (game.toLowerCase().includes("valorant")) {
      return "from-red-600 to-orange-600";
    } else if (game.toLowerCase().includes("csgo")) {
      return "from-yellow-600 to-orange-600";
    } else {
      return "from-blue-600 to-indigo-600";
    }
  };

  const getParticipantPercentage = () => {
    return Math.min(
      (tournament.currentParticipants / tournament.maxParticipants) * 100,
      100
    );
  };

  const isRegistrationOpen = tournament.status === "registration_open";
  const isUpcoming = tournament.status === "upcoming";
  const isOngoing = tournament.status === "ongoing";
  const isCompleted = tournament.status === "completed";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group border border-gray-700"
    >
      {/* Tournament Header */}
      <div
        className={`relative h-48 bg-gradient-to-br ${getGameBackground(
          tournament.game
        )}`}
      >
        <div className="absolute inset-0 bg-black bg-opacity-30"></div>

        {/* Game Info */}
        <div className="absolute top-4 left-4 flex items-center space-x-2">
          <div className="w-10 h-10 relative bg-white/20 rounded-lg p-2 backdrop-blur-sm">
            <Image
              src={getGameIcon(tournament.game)}
              alt={tournament.game}
              width={24}
              height={24}
              sizes="40px"
              className="w-6 h-6"
            />
          </div>
          <span className="text-white font-semibold text-sm bg-black/20 px-2 py-1 rounded">
            {tournament.game}
          </span>
        </div>

        {/* Status Badge */}
        <div className="absolute top-4 right-4 flex flex-col space-y-2">
          <span
            className={`px-3 py-1 rounded-full text-white text-xs font-medium ${getStatusColor(
              tournament.status
            )} shadow-lg`}
          >
            {getStatusText(tournament.status)}
          </span>

          {/* Tournament Type Badge */}
          <span
            className={`px-3 py-1 rounded-full text-white text-xs font-medium ${
              tournament.tournamentType === "free"
                ? "bg-green-500"
                : "bg-orange-500"
            } shadow-lg`}
          >
            {tournament.tournamentType === "free" ? "Үнэгүй" : "Төлбөртэй"}
          </span>
        </div>

        {/* Tournament Name */}
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-white text-xl font-bold mb-2 line-clamp-2 drop-shadow-lg">
            {tournament.name}
          </h3>
        </div>

        {/* Format Badge */}
        <div className="absolute bottom-4 right-4">
          <span className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded text-white text-xs font-medium">
            {tournament.format}
          </span>
        </div>
      </div>

      {/* Tournament Content */}
      <div className="p-6">
        {/* Organizer */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 relative">
            {tournament.organizer.logo ? (
              <Image
                src={tournament.organizer.logo}
                alt={tournament.organizer.name}
                fill
                sizes="40px"
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {tournament.organizer.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-sm font-medium text-white">
              {tournament.organizer.name}
            </span>
            {tournament.organizer.isVerified && (
              <Star className="w-4 h-4 text-blue-500 fill-current" />
            )}
          </div>
        </div>

        {/* Tournament Info */}
        <div className="space-y-3 mb-4">
          {/* Date */}
          <div className="flex items-center space-x-2 text-gray-300">
            <Calendar className="w-4 h-4 text-blue-500" />
            <span className="text-sm">
              {formatDate(tournament.startDate)} -{" "}
              {formatDate(tournament.endDate)}
            </span>
          </div>

          {/* Prize Pool */}
          <div className="flex items-center space-x-2 text-gray-300">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <div className="text-sm">
              <span className="font-semibold text-green-400">
                {formatPrizePool(tournament.prizePool, tournament.currency)}
              </span>
            </div>
          </div>

          {/* Entry Fee */}
          {tournament.entryFee > 0 && (
            <div className="flex items-center space-x-2 text-gray-300">
              <DollarSign className="w-4 h-4 text-green-500" />
              <span className="text-sm">
                Оролтын хураамж:{" "}
                <span className="font-semibold text-green-400">
                  {formatPrizePool(tournament.entryFee, tournament.currency)}
                </span>
              </span>
            </div>
          )}

          {/* Participants */}
          <div className="flex items-center space-x-2 text-gray-300">
            <Users className="w-4 h-4 text-purple-500" />
            <span className="text-sm">
              {tournament.currentParticipants}/{tournament.maxParticipants}{" "}
              оролцогч
            </span>
          </div>

          {/* Location */}
          <div className="flex items-center space-x-2 text-gray-300">
            <MapPin className="w-4 h-4 text-red-500" />
            <span className="text-sm">{tournament.location}</span>
          </div>

          {/* Registration Deadline */}
          <div className="flex items-center space-x-2 text-gray-300">
            <Clock className="w-4 h-4 text-orange-500" />
            <span className="text-sm">
              Бүртгэлийн хугацаа: {formatDate(tournament.registrationDeadline)}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
          <div
            className={`h-3 rounded-full transition-all duration-300 ${
              getParticipantPercentage() >= 80
                ? "bg-red-500"
                : getParticipantPercentage() >= 60
                ? "bg-yellow-500"
                : "bg-gradient-to-r from-green-500 to-blue-500"
            }`}
            style={{
              width: `${getParticipantPercentage()}%`,
            }}
          ></div>
        </div>

        {/* Progress Info */}
        <div className="flex justify-between text-xs text-gray-400 mb-4">
          <span>Оролцогчдын тоо</span>
          <span>{getParticipantPercentage().toFixed(1)}%</span>
        </div>

        {/* Description */}
        <p className="text-gray-300 text-sm mb-4 line-clamp-3">
          {tournament.description}
        </p>

        {/* Action Button */}
        <Link
          href={`/tournaments/${tournament._id || "unknown"}`}
          className="block"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
              isRegistrationOpen
                ? "bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
                : isUpcoming
                ? "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                : isOngoing
                ? "bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
                : isCompleted
                ? "bg-gray-500 hover:bg-gray-600 text-white"
                : "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
            }`}
          >
            {isRegistrationOpen
              ? "Бүртгүүлэх"
              : isUpcoming
              ? "Дэлгэрэнгүй үзэх"
              : isOngoing
              ? "Тэмцээний мэдээ"
              : isCompleted
              ? "Үр дүнг харах"
              : "Дэлгэрэнгүй үзэх"}
          </motion.button>
        </Link>
      </div>
    </motion.div>
  );
}

function arePropsEqual(prev: TournamentCardProps, next: TournamentCardProps) {
  return (
    prev.tournament._id === next.tournament._id && prev.index === next.index
  );
}

const TournamentCard = memo(TournamentCardComponent, arePropsEqual);

export default TournamentCard;
