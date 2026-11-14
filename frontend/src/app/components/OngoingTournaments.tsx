"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Trophy, ArrowRight } from "lucide-react";
import TournamentCard, { Tournament } from "../../components/TournamentCard";
import { API_ENDPOINTS } from "../../config/api";
import { safeFetch, parseJsonSafe } from "../../lib/safeFetch";

export default function OngoingTournaments() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOngoingTournaments();
  }, []);

  const fetchOngoingTournaments = async () => {
    try {
      setIsLoading(true);
      const response = await safeFetch(
        `${API_ENDPOINTS.TOURNAMENTS.ALL}?status=ongoing&limit=3`,
        { retries: 2, retryDelayMs: 300, timeoutMs: 7000 }
      );

      if (response.ok) {
        const data = (await parseJsonSafe(response)) || {};
        if (data.success && data.tournaments) {
          const transformedTournaments = data.tournaments
            .filter((tournament: any) => tournament && tournament._id)
            .map((tournament: any) => ({
              _id:
                tournament._id ||
                tournament.id ||
                `fallback-${Date.now()}-${Math.random()}`,
              name: tournament.name || "Unnamed Tournament",
              game: tournament.game || "Mobile Legends: Bang Bang",
              description: tournament.description || "Тэмцээний тайлбар",
              organizer: {
                _id:
                  tournament.organizer?._id ||
                  tournament.organizerId ||
                  "unknown",
                name: tournament.organizer?.name || "Unknown Organizer",
                logo: tournament.organizer?.logo,
                isVerified: tournament.organizer?.isVerified || false,
              },
              startDate: tournament.startDate,
              endDate: tournament.endDate,
              registrationDeadline:
                tournament.registrationDeadline || tournament.startDate,
              prizePool: tournament.prizePool || 0,
              currency: tournament.currency || "₮",
              maxParticipants: tournament.maxParticipants || 16,
              currentParticipants: tournament.currentParticipants || 0,
              format: tournament.format || "Single Elimination",
              entryFee: tournament.entryFee || 0,
              tournamentType: tournament.tournamentType || "tax",
              location: tournament.location || "Online",
              status: tournament.status || "ongoing",
              requirements: Array.isArray(tournament.requirements)
                ? tournament.requirements
                : tournament.requirements
                ? [tournament.requirements]
                : [],
              rules: Array.isArray(tournament.rules)
                ? tournament.rules
                : tournament.rules
                ? [tournament.rules]
                : [],
              createdAt: tournament.createdAt,
              updatedAt: tournament.updatedAt,
            }));

          setTournaments(transformedTournaments);
        }
      }
    } catch (error) {
      console.error("Error fetching ongoing tournaments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-10"
      >
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-64 bg-gray-800 rounded-xl"
              ></div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  if (tournaments.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-10"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-white">
          Явагдаж буй тэмцээнүүд
        </h3>
        <Link
          href="/tournaments"
          className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
        >
          <span className="text-sm font-medium">Бүгдийг харах</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Tournaments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tournaments.map((tournament, index) => (
          <TournamentCard
            key={tournament._id}
            tournament={tournament}
            index={index}
          />
        ))}
      </div>
    </motion.div>
  );
}
