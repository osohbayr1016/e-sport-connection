"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Trophy,
  Users,
  Calendar,
  MapPin,
  Gamepad2,
  DollarSign,
  Clock,
  Shield,
  Eye,
  User,
  Crown,
} from "lucide-react";
import Link from "next/link";
import Navigation from "../../../components/Navigation";
import { useAuth } from "../../../contexts/AuthContext";

interface Tournament {
  id: string;
  name: string;
  game: string;
  description: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  prizePool: number;
  entryFee: number;
  maxSquads: number;
  currentSquads: number;
  status: string;
  location: string;
  organizer: string;
  createdAt: string;
  updatedAt: string;
}

interface TournamentRegistration {
  id: string;
  tournament: string;
  squad: {
    id: string;
    name: string;
    tag: string;
    logo?: string;
  };
  squadLeader: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  squadMembers: Array<{
    id: string;
    name: string;
    email: string;
    avatar?: string;
  }>;
  registrationFee: number;
  paymentStatus: string;
  registrationDate: string;
  status: string;
}

export default function AdminTournamentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [registrations, setRegistrations] = useState<TournamentRegistration[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [registrationsLoading, setRegistrationsLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const tournamentId = params.id as string;

  // Check admin access (wait for auth to load to avoid false redirect)
  useEffect(() => {
    if (authLoading) return;
    const isAdmin =
      user?.role === "ADMIN" || user?.email === "admin@esport-connection.com";
    if (!user || !isAdmin) {
      router.push("/");
      return;
    }
  }, [user, authLoading, router]);

  // Fetch tournament details
  useEffect(() => {
    const fetchTournament = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/tournaments/${tournamentId}`);

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setTournament(data.tournament);
          } else {
            setError(data.message || "Failed to load tournament");
          }
        } else {
          setError("Failed to load tournament");
        }
      } catch (error) {
        console.error("Error fetching tournament:", error);
        setError("Failed to load tournament");
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && user && tournamentId) {
      fetchTournament();
    }
  }, [user, authLoading, tournamentId]);

  // Fetch tournament registrations
  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        setRegistrationsLoading(true);
        const response = await fetch(
          `/api/tournaments/${tournamentId}/registrations`
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            const normalized = (data.registrations || []).map((r: any) => ({
              id: r?._id || r?.id,
              tournament:
                r?.tournament?._id || r?.tournament?.id || r?.tournament,
              squad: {
                id: r?.squad?._id || r?.squad?.id || r?.squad,
                name: r?.squad?.name || "Unknown Squad",
                tag: r?.squad?.tag || "",
                logo: r?.squad?.logo,
              },
              squadLeader: {
                id: r?.squadLeader?._id || r?.squadLeader?.id || r?.squadLeader,
                name: r?.squadLeader?.name || "Unknown",
                email: r?.squadLeader?.email || "",
                avatar: r?.squadLeader?.avatar,
              },
              squadMembers: (r?.squadMembers || []).map((m: any) => ({
                id: m?._id || m?.id || m,
                name: m?.name || "Unknown",
                email: m?.email || "",
                avatar: m?.avatar,
              })),
              registrationFee: r?.registrationFee ?? 0,
              paymentStatus: r?.paymentStatus || "pending",
              registrationDate: r?.registrationDate || r?.createdAt,
              status: r?.status || (r?.isApproved ? "registered" : "pending"),
            }));
            setRegistrations(normalized);
          } else {
            setError(data.message || "Failed to load registrations");
          }
        } else {
          setError("Failed to load registrations");
        }
      } catch (error) {
        console.error("Error fetching registrations:", error);
        setError("Failed to load registrations");
      } finally {
        setRegistrationsLoading(false);
      }
    };

    if (!authLoading && user && tournamentId) {
      fetchRegistrations();
    }
  }, [user, authLoading, tournamentId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("mn-MN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrizePool = (amount: number) => {
    return `${amount.toLocaleString()} MNT`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "registration_open":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "registration_closed":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "ongoing":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "completed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <Navigation />
        <div className="pt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-1/4 mb-4"></div>
              <div className="h-64 bg-gray-300 dark:bg-gray-600 rounded-lg mb-8"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <Navigation />
        <div className="pt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
            <Trophy className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Tournament not found
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              The tournament you&apos;re looking for doesn&apos;t exist or has
              been deleted.
            </p>
            <Link href="/admin/tournaments">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-300"
              >
                Back to Tournaments
              </motion.button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Navigation />
      <div className="pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <div className="mb-6">
            <Link href="/admin/tournaments">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Tournaments
              </motion.button>
            </Link>
          </div>

          {/* Tournament Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {tournament.name}
                </h1>
                <div className="flex items-center gap-4 text-gray-600 dark:text-gray-300">
                  <div className="flex items-center gap-2">
                    <Gamepad2 className="w-5 h-5" />
                    <span>{tournament.game}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    <span>{tournament.location}</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 lg:mt-0">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    tournament.status
                  )}`}
                >
                  {tournament.status.replace("_", " ").toUpperCase()}
                </span>
              </div>
            </div>

            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {tournament.description}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {formatPrizePool(tournament.prizePool)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Prize Pool
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {(tournament.entryFee || 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Entry Fee (MNT)
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {tournament.currentSquads || 0}/{tournament.maxSquads || 0}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Teams Registered
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {(tournament.maxSquads || 0) -
                    (tournament.currentSquads || 0)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Slots Available
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Start Date
                  </div>
                  <div className="font-medium">
                    {formatDate(tournament.startDate)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    End Date
                  </div>
                  <div className="font-medium">
                    {formatDate(tournament.endDate)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Registration Deadline
                  </div>
                  <div className="font-medium">
                    {formatDate(tournament.registrationDeadline)}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Tournament Statistics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Tournament Statistics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {registrations.length}
                </div>
                <div className="text-sm text-blue-600 dark:text-blue-400">
                  Teams Registered
                </div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {registrations.reduce(
                    (total, reg) => total + reg.squadMembers.length,
                    0
                  )}
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">
                  Total Players
                </div>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {
                    registrations.filter((reg) => reg.paymentStatus === "paid")
                      .length
                  }
                </div>
                <div className="text-sm text-purple-600 dark:text-purple-400">
                  Paid Teams
                </div>
              </div>
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {(tournament.maxSquads || 0) - registrations.length}
                </div>
                <div className="text-sm text-orange-600 dark:text-orange-400">
                  Slots Available
                </div>
              </div>
            </div>
          </motion.div>

          {/* Registered Teams */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Registered Teams ({registrations.length})
              </h2>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <Users className="w-5 h-5" />
                <span>Total Teams</span>
              </div>
            </div>

            {registrationsLoading ? (
              <div className="animate-pulse space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"
                  ></div>
                ))}
              </div>
            ) : registrations.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No teams registered yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Teams will appear here once they register for the tournament.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {registrations.map((registration, index) => (
                  <motion.div
                    key={registration.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-lg transition-shadow duration-200"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
                      <div className="flex items-center gap-4 mb-4 lg:mb-0">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                          {registration.squad.tag}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {registration.squad.name}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                            <span className="flex items-center gap-1">
                              <Crown className="w-4 h-4 text-yellow-500" />
                              {registration.squadLeader.name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {registration.squadMembers.length} members
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(
                            registration.paymentStatus
                          )}`}
                        >
                          {registration.paymentStatus.toUpperCase()}
                        </span>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                          {registration.status.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Team Members */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Team Members ({registration.squadMembers.length}):
                        </h4>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Team Size: {registration.squadMembers.length}/7
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {registration.squadMembers.map((member) => (
                          <div
                            key={member.id}
                            className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                              member.id === registration.squadLeader.id
                                ? "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700"
                                : "bg-gray-50 dark:bg-gray-700"
                            }`}
                          >
                            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                              {member.avatar ? (
                                <img
                                  src={member.avatar}
                                  alt={member.name}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                member.name.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 dark:text-white truncate flex items-center gap-2">
                                {member.name}
                                {member.id === registration.squadLeader.id && (
                                  <Crown className="w-4 h-4 text-yellow-500" />
                                )}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {member.email}
                              </div>
                              {member.id === registration.squadLeader.id && (
                                <div className="text-xs text-yellow-600 dark:text-yellow-400 font-medium mt-1">
                                  Team Leader
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Registration Details */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                        <span>
                          Registration Fee:{" "}
                          {(registration.registrationFee || 0).toLocaleString()}{" "}
                          MNT
                        </span>
                        <span>
                          Registered:{" "}
                          {registration.registrationDate
                            ? formatDate(registration.registrationDate)
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* All Players List */}
          {registrations.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mt-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  All Players (
                  {registrations.reduce(
                    (total, reg) => total + reg.squadMembers.length,
                    0
                  )}
                  )
                </h2>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <User className="w-5 h-5" />
                  <span>Complete Player List</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3">Player</th>
                      <th className="px-4 py-3">Team</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Registration Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.flatMap((registration) =>
                      registration.squadMembers.map((member) => (
                        <tr
                          key={`${registration.id}-${member.id}`}
                          className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                {member.avatar ? (
                                  <img
                                    src={member.avatar}
                                    alt={member.name}
                                    className="w-8 h-8 rounded-full object-cover"
                                  />
                                ) : (
                                  member.name.charAt(0).toUpperCase()
                                )}
                              </div>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {member.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 text-xs rounded-full">
                                {registration.squad.tag}
                              </span>
                              <span className="text-gray-600 dark:text-gray-300">
                                {registration.squad.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {member.id === registration.squadLeader.id ? (
                              <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                                <Crown className="w-4 h-5" />
                                Leader
                              </span>
                            ) : (
                              <span className="text-gray-600 dark:text-gray-300">
                                Member
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                            {member.email}
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                            {formatDate(registration.registrationDate)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
