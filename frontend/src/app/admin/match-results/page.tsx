"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import PageTransition from "../../components/PageTransition";
import { useAuth } from "../../contexts/AuthContext";
import {
  FaTrophy,
  FaCoins,
  FaExclamationTriangle,
  FaCheckCircle,
} from "react-icons/fa";
import Image from "next/image";
import DivisionCoinImage from "../../../components/DivisionCoinImage";
import { SquadDivision } from "../../../types/division";

interface Tournament {
  _id: string;
  name: string;
  status: string;
}

interface Squad {
  _id: string;
  name: string;
  tag: string;
  logo?: string;
}

interface Match {
  _id: string;
  tournament: string;
  matchNumber: number;
  round: number;
  squad1: Squad;
  squad2: Squad;
  status: string;
  winner?: string;
  loser?: string;
  score?: {
    squad1Score: number;
    squad2Score: number;
  };
  bountyCoinsDistributed: boolean;
  matchType: string;
  adminNotes?: string;
  bountyCoinAmount?: number;
  applyLoserDeduction?: boolean;
}

export default function AdminMatchResultsPage() {
  const { user, loading: authLoading } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);

  // Form state
  const [winnerId, setWinnerId] = useState<string>("");
  const [loserId, setLoserId] = useState<string>("");
  const [squad1Score, setSquad1Score] = useState<number>(0);
  const [squad2Score, setSquad2Score] = useState<number>(0);
  const [matchType, setMatchType] = useState<
    "normal" | "auto_win" | "walkover"
  >("normal");
  const [adminNotes, setAdminNotes] = useState<string>("");
  const [customWinnerBC, setCustomWinnerBC] = useState<number | "">("");
  const [applyLoserDeduction, setApplyLoserDeduction] = useState<boolean>(true);

  useEffect(() => {
    if (authLoading) return;
    const isAdmin =
      (user as any)?.role === "ADMIN" ||
      (user as any)?.email === "admin@esport-connection.com";
    if (isAdmin) {
      fetchTournaments();
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (selectedTournament) {
      fetchMatches(selectedTournament);
    }
  }, [selectedTournament]);

  const fetchTournaments = async () => {
    try {
      const response = await fetch("/api/tournaments", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        // Show all tournaments; admin can still select the relevant one
        setTournaments(data.tournaments as Tournament[]);
      }
    } catch (error) {
      console.error("Error fetching tournaments:", error);
    }
  };

  const fetchMatches = async (tournamentId: string) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/tournament-matches/tournament/${tournamentId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        // API returns { success, matches }
        setMatches(data.matches || data.data || []);
      }
    } catch (error) {
      console.error("Error fetching matches:", error);
    } finally {
      setLoading(false);
    }
  };

  const openResultModal = (match: Match) => {
    setSelectedMatch(match);
    setWinnerId("");
    setLoserId("");
    setSquad1Score(0);
    setSquad2Score(0);
    setMatchType("normal");
    setAdminNotes("");
    setCustomWinnerBC(match.bountyCoinAmount ?? "");
    setApplyLoserDeduction(match.applyLoserDeduction ?? true);
    setShowResultModal(true);
  };

  const submitMatchResult = async () => {
    if (!selectedMatch) return;

    try {
      // If admin entered a custom winner BC, persist it to the match before result
      if (matchType === "normal" && customWinnerBC !== "") {
        await fetch(`/api/tournament-matches/${selectedMatch._id}/bounty`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            bountyCoinAmount: Number(customWinnerBC) || 0,
            applyLoserDeduction,
          }),
        });
      } else if (matchType !== "normal") {
        // Ensure no deductions when not normal
        await fetch(`/api/tournament-matches/${selectedMatch._id}/bounty`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ applyLoserDeduction: false }),
        });
      }

      const response = await fetch(
        `/api/tournament-matches/${selectedMatch._id}/result`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            winnerId,
            loserId,
            score: {
              squad1Score,
              squad2Score,
            },
            matchType,
            adminNotes,
            applyLoserDeduction,
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        // Refresh matches
        fetchMatches(selectedTournament);
        setShowResultModal(false);
        setSelectedMatch(null);

        // Show success message
        alert("Match result updated successfully!");
      } else {
        alert("Error updating match result: " + data.message);
      }
    } catch (error) {
      console.error("Error updating match result:", error);
      alert("Error updating match result");
    }
  };

  const getMatchStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-400";
      case "in_progress":
        return "text-yellow-400";
      case "scheduled":
        return "text-blue-400";
      default:
        return "text-gray-400";
    }
  };

  const getMatchTypeColor = (matchType: string) => {
    switch (matchType) {
      case "normal":
        return "text-green-400";
      case "auto_win":
        return "text-yellow-400";
      case "walkover":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const isAdmin =
    (user as any)?.role === "ADMIN" ||
    (user as any)?.email === "admin@esport-connection.com";
  if (authLoading || !user) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-black flex items-center justify-center">
          <div className="text-white text-xl">Уншиж байна...</div>
        </div>
      </PageTransition>
    );
  }
  if (!isAdmin) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-black flex items-center justify-center">
          <div className="text-white text-xl">Хандах эрх байхгүй</div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-black">
        {/* Header */}
        <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-500/20 p-3 rounded-full">
                <FaTrophy className="text-blue-400 text-2xl" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  Тоглолтын дүнгийн удирдлага
                </h1>
                <p className="text-gray-300">
                  Тэмцээний тоглолтын дүнг шинэчилж, Боунти Койн-ийг удирдах
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Tournament Selection */}
          <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">
              Тэмцээн сонгох
            </h2>
            <select
              value={selectedTournament}
              onChange={(e) => setSelectedTournament(e.target.value)}
              className="w-full md:w-96 bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Тэмцээн сонгоно уу...</option>
              {tournaments.map((tournament) => (
                <option key={tournament._id} value={tournament._id}>
                  {tournament.name} ({tournament.status})
                </option>
              ))}
            </select>
          </div>

          {/* Matches List */}
          {selectedTournament && (
            <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 p-6">
              <h2 className="text-xl font-semibold text-white mb-6">
                Тэмцээний тоглолтууд
              </h2>

              {loading ? (
                <div className="text-center py-8">
                  <div className="text-white text-xl">
                    Тоглолтуудыг уншиж байна...
                  </div>
                </div>
              ) : matches.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400">
                    Энэ тэмцээнд тоглолт олдсонгүй
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {matches.map((match) => (
                    <div
                      key={match._id}
                      className="bg-white/5 rounded-lg border border-white/10 p-4 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-2">
                            <span className="text-gray-400 text-sm">
                              {match.round}-р шат - {match.matchNumber}-р
                              тоглолт
                            </span>
                            <span
                              className={`text-sm font-medium ${getMatchStatusColor(
                                match.status
                              )}`}
                            >
                              {match.status.replace("_", " ").toUpperCase()}
                            </span>
                            {match.matchType && (
                              <span
                                className={`text-sm font-medium ${getMatchTypeColor(
                                  match.matchType
                                )}`}
                              >
                                {match.matchType
                                  .replace("_", " ")
                                  .toUpperCase()}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center space-x-6">
                            <div className="flex items-center space-x-3">
                              {match.squad1.logo && (
                                <img
                                  src={match.squad1.logo}
                                  alt={match.squad1.name}
                                  className="w-8 h-8 rounded-full"
                                />
                              )}
                              <span className="text-white font-medium">
                                {match.squad1.name} [{match.squad1.tag}]
                              </span>
                            </div>

                            <span className="text-gray-400">vs</span>

                            <div className="flex items-center space-x-3">
                              <span className="text-white font-medium">
                                {match.squad2.name} [{match.squad2.tag}]
                              </span>
                              {match.squad2.logo && (
                                <img
                                  src={match.squad2.logo}
                                  alt={match.squad2.name}
                                  className="w-8 h-8 rounded-full"
                                />
                              )}
                            </div>
                          </div>

                          {match.score && (
                            <div className="mt-2 text-sm text-gray-300">
                              Оноо: {match.squad1.name}{" "}
                              {match.score.squad1Score} -{" "}
                              {match.score.squad2Score} {match.squad2.name}
                            </div>
                          )}

                          {match.bountyCoinsDistributed && (
                            <div className="mt-2 flex items-center space-x-2 text-sm">
                              <div className="relative">
                                <DivisionCoinImage
                                  division={SquadDivision.GOLD}
                                  size={20}
                                />
                                <FaCoins className="absolute -top-1 -right-1 text-yellow-400 text-xs" />
                              </div>
                              <span className="text-yellow-400">
                                Боунти Койн хуваарилагдсан
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-3">
                          {match.status === "completed" ? (
                            <div className="flex items-center space-x-2 text-green-400">
                              <FaCheckCircle />
                              <span className="text-sm">Дууссан</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => openResultModal(match)}
                              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                            >
                              Дүн шинэчлэх
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Result Modal */}
        {showResultModal && selectedMatch && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-800 rounded-xl border border-white/10 p-6 w-full max-w-2xl mx-4"
            >
              <h3 className="text-xl font-semibold text-white mb-4">
                Тоглолтын дүнг шинэчлэх
              </h3>

              <div className="space-y-4">
                {/* Match Type Selection */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Тоглолтын төрөл
                  </label>
                  <select
                    value={matchType}
                    onChange={(e) => setMatchType(e.target.value as any)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="normal">Энгийн тоглолт (Боунти Койн)</option>
                    <option value="auto_win">
                      Автомат ялалт (Боунти Койн байхгүй)
                    </option>
                    <option value="walkover">
                      Хожигдсон (Боунти Койн байхгүй)
                    </option>
                  </select>
                  <p className="text-gray-400 text-xs mt-1">
                    {matchType === "normal"
                      ? "Хожигч 50 BC авна, хожигдсон 25 BC алдана"
                      : "Боунти Койн хуваарилагдахгүй"}
                  </p>
                </div>

                {/* Winner Selection */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Хожигч
                  </label>
                  <select
                    value={winnerId}
                    onChange={(e) => setWinnerId(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Хожигчийг сонгоно уу...</option>
                    <option value={selectedMatch.squad1._id}>
                      {selectedMatch.squad1.name} [{selectedMatch.squad1.tag}]
                    </option>
                    <option value={selectedMatch.squad2._id}>
                      {selectedMatch.squad2.name} [{selectedMatch.squad2.tag}]
                    </option>
                  </select>
                </div>

                {/* Loser Selection */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Хожигдсон
                  </label>
                  <select
                    value={loserId}
                    onChange={(e) => setLoserId(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Хожигдсынг сонгоно уу...</option>
                    <option value={selectedMatch.squad1._id}>
                      {selectedMatch.squad1.name} [{selectedMatch.squad1.tag}]
                    </option>
                    <option value={selectedMatch.squad2._id}>
                      {selectedMatch.squad2.name} [{selectedMatch.squad2.tag}]
                    </option>
                  </select>
                </div>

                {/* Score */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      {selectedMatch.squad1.name} оноо
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={squad1Score}
                      onChange={(e) =>
                        setSquad1Score(parseInt(e.target.value) || 0)
                      }
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      {selectedMatch.squad2.name} оноо
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={squad2Score}
                      onChange={(e) =>
                        setSquad2Score(parseInt(e.target.value) || 0)
                      }
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Admin Notes */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Админ тэмдэглэл (Сонгох)
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Энэ тоглолтын талаар нэмэлт тэмдэглэл оруулна уу..."
                  />
                </div>

                {/* Bounty Coin Info */}
                {matchType === "normal" && (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                    <div className="flex items-center space-x-2 text-yellow-400 mb-2">
                      <DivisionCoinImage
                        division={SquadDivision.GOLD}
                        size={24}
                      />
                      <span className="font-medium">
                        Боунти Койн хуваарилалт
                      </span>
                    </div>
                    <div className="text-sm text-yellow-300">
                      <p>
                        • Хожигч багийн гишүүд: тус бүр +
                        {typeof customWinnerBC === "number" &&
                        customWinnerBC > 0
                          ? customWinnerBC
                          : 50}{" "}
                        BC
                      </p>
                      <p>
                        • Хожигдсон багийн гишүүд:{" "}
                        {applyLoserDeduction
                          ? "тус бүр -25 BC (хамгийн бага 0)"
                          : "суутгалгүй"}
                      </p>
                    </div>
                  </div>
                )}

                {/* Custom Bounty Controls */}
                {matchType === "normal" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        Хожигчийн авах BC (Option)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={customWinnerBC as any}
                        onChange={(e) =>
                          setCustomWinnerBC(
                            e.target.value === ""
                              ? ""
                              : Math.max(0, parseInt(e.target.value) || 0)
                          )
                        }
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Default 50"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Хоосон бол default 50 BC хэрэглэнэ
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 mt-6">
                      <input
                        id="applyDeduction"
                        type="checkbox"
                        checked={applyLoserDeduction}
                        onChange={(e) =>
                          setApplyLoserDeduction(e.target.checked)
                        }
                        className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <label
                        htmlFor="applyDeduction"
                        className="text-sm text-white"
                      >
                        Хожигдсонд -25 BC суутгах
                      </label>
                    </div>
                    {typeof customWinnerBC === "number" && (
                      <div className="md:col-span-2 text-xs text-gray-400">
                        Дүрэм: winner {customWinnerBC} BC, loser{" "}
                        {applyLoserDeduction ? "-25 BC" : "0 BC"}
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setShowResultModal(false)}
                    className="flex-1 bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Цуцлах
                  </button>
                  <button
                    onClick={submitMatchResult}
                    disabled={!winnerId || !loserId}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Дүн шинэчлэх
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
