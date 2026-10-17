"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  Filter,
  Search,
  Calendar,
  Users,
  Gamepad2,
} from "lucide-react";
import ServiceState from "../components/ServiceState";
import TournamentCard, { Tournament } from "../../components/TournamentCard";
import { API_ENDPOINTS } from "../../config/api";
import { safeFetch, parseJsonSafe } from "../../lib/safeFetch";

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [searchInput, setSearchInput] = useState<string>("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>("");
  const [selectedGame, setSelectedGame] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await safeFetch(
        `${API_ENDPOINTS.TOURNAMENTS.ALL}?limit=18`,
        { retries: 2, retryDelayMs: 300, timeoutMs: 7000 }
      );
      if (response.ok) {
        const data = (await parseJsonSafe(response)) || {};
        if (data.success && data.tournaments) {
          // Transform the data to match our Tournament interface
          const transformedTournaments = data.tournaments
            .filter((tournament: any) => tournament && tournament._id) // Only include tournaments with valid IDs
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
              tournamentType: tournament.tournamentType || "tax", // Default to tax if not specified
              location: tournament.location || "Online",
              status: tournament.status || "upcoming",
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
        } else {
          setTournaments([]);
        }
      } else {
        throw new Error("Tournament service unavailable");
      }
    } catch (error) {
      console.error("Error fetching tournaments:", error);
      setTournaments([]);
      setError("Тэмцээний мэдээлэл ачаалж чадсангүй. Үйлчилгээ түр боломжгүй байна.");
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce search input
  useEffect(() => {
    const id = setTimeout(
      () => setDebouncedSearchQuery(searchInput.trim()),
      250
    );
    return () => clearTimeout(id);
  }, [searchInput]);

  const filteredTournaments = useMemo(() => {
    let filtered = tournaments;

    if (selectedGame !== "all") {
      filtered = filtered.filter(
        (tournament) => tournament.game === selectedGame
      );
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter(
        (tournament) => tournament.status === selectedStatus
      );
    }

    if (debouncedSearchQuery) {
      const q = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (tournament) =>
          tournament.name.toLowerCase().includes(q) ||
          tournament.description.toLowerCase().includes(q) ||
          tournament.organizer.name.toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [tournaments, selectedGame, selectedStatus, debouncedSearchQuery]);

  const getStatusText = (status: string) => {
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

  const statusOptions = useMemo(() => {
    const statuses = Array.from(new Set(tournaments.map((t) => t.status)));
    return statuses.map((status) => ({
      value: status,
      label: getStatusText(status),
    }));
  }, [tournaments]);

  const gameOptions = useMemo(() => {
    const games = Array.from(new Set(tournaments.map((t) => t.game)));
    return games.map((game) => ({
      value: game,
      label: game,
    }));
  }, [tournaments]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080d19] pt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse">
            <div className="h-12 bg-gray-700 rounded w-1/3 mb-8 mx-auto"></div>
            <div className="h-6 bg-gray-700 rounded w-1/2 mb-12 mx-auto"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-96 bg-gray-800 rounded-xl"
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080d19] pt-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            Удахгүй болох тэмцээнүүд
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Хамгийн том e-sports тэмцээнүүдэд оролцож, өөрийн чадварыг
            харуулаарай
          </p>
        </motion.div>

        {error ? (
          <ServiceState mode="offline" title="Тэмцээний мэдээлэл түр боломжгүй" description={error} />
        ) : tournaments.length === 0 && !isLoading ? (
          <ServiceState mode="empty" title="Одоогоор идэвхтэй тэмцээн алга"
            description="Шинэ тэмцээн нээгдэхэд энд харуулна. Тэмцээн зохион байгуулах саналаа илгээгээрэй." />
        ) : null}
        {/* Tournaments Grid - Only show if tournaments exist */}
        {tournaments.length > 0 && (
          <>
            {/* Search and Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8 space-y-4"
            >
              {/* Search Bar */}
              <div className="relative max-w-md mx-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Тэмцээн хайх..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-4 justify-center">
                <div className="flex items-center space-x-2">
                  <Gamepad2 className="w-5 h-5 text-gray-400" />
                  <select
                    value={selectedGame}
                    onChange={(e) => setSelectedGame(e.target.value)}
                    className="px-4 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white focus:ring-2 focus:ring-purple-400"
                  >
                    <option value="all">Бүх тоглоом</option>
                    {gameOptions.map((game) => (
                      <option key={game.value} value={game.value}>
                        {game.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="px-4 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white focus:ring-2 focus:ring-purple-400"
                  >
                    <option value="all">Бүх төлөв</option>
                    {statusOptions.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-300">
                    {filteredTournaments.length} тэмцээн олдлоо
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Tournaments Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTournaments.map((tournament, index) => (
                <TournamentCard
                  key={tournament._id}
                  tournament={tournament}
                  index={index}
                />
              ))}
            </div>

            {/* No Results */}
            {filteredTournaments.length === 0 && tournaments.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <Filter className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-white mb-2">
                  Тэмцээн олдсонгүй
                </h3>
                <p className="text-gray-300">
                  Одоогоор таны хайсан тэмцээн байхгүй байна. Дахин хайж үзнэ
                  үү.
                </p>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
