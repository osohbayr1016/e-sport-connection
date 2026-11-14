"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaTrophy,
  FaCoins,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaUsers,
  FaGamepad,
  FaShieldAlt,
  FaChartLine,
  FaEdit,
  FaTrash,
  FaEye,
  FaPlay,
  FaPause,
  FaStop,
} from "react-icons/fa";
import Image from "next/image";
import DivisionCoinImage from "./DivisionCoinImage";
import { SquadDivision } from "../types/division";

interface Tournament {
  _id: string;
  name: string;
  status: string;
  game: string;
  startDate: string;
  endDate: string;
  format: string;
  maxSquads: number;
  currentSquads: number;
}

interface Squad {
  _id: string;
  name: string;
  tag: string;
  logo?: string;
  division: SquadDivision;
  currentBountyCoins: number;
  level: number;
}

interface Match {
  _id: string;
  tournament: string;
  matchNumber: number;
  round: number;
  squad1: Squad;
  squad2: Squad;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  winner?: string;
  loser?: string;
  score?: {
    squad1Score: number;
    squad2Score: number;
  };
  scheduledTime?: string;
  startTime?: string;
  endTime?: string;
  bountyCoinsDistributed: boolean;
  matchType: "normal" | "auto_win" | "walkover";
  adminNotes?: string;
  bountyCoinAmount?: number;
  applyLoserDeduction?: boolean;
  squad1Division: SquadDivision;
  squad2Division: SquadDivision;
  squad1BountyChange: number;
  squad2BountyChange: number;
}

interface TournamentMatchManagerProps {
  tournamentId: string;
  onMatchUpdate?: () => void;
}

export default function TournamentMatchManager({
  tournamentId,
  onMatchUpdate,
}: TournamentMatchManagerProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);

  // Form state for match results
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

  // Form state for match management
  const [matchNumber, setMatchNumber] = useState<number>(1);
  const [round, setRound] = useState<number>(1);
  const [squad1Id, setSquad1Id] = useState<string>("");
  const [squad2Id, setSquad2Id] = useState<string>("");
  const [scheduledTime, setScheduledTime] = useState<string>("");
  const [matchStatus, setMatchStatus] = useState<Match["status"]>("scheduled");

  // Available squads for match creation
  const [availableSquads, setAvailableSquads] = useState<Squad[]>([]);
  const [loadingSquads, setLoadingSquads] = useState(false);

  // Validation state
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    if (tournamentId) {
      fetchMatches();
      fetchAvailableSquads();
    }
  }, [tournamentId]);

  const fetchMatches = async () => {
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
        setMatches(data.matches || data.data || []);
      }
    } catch (error) {
      console.error("Error fetching matches:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSquads = async () => {
    try {
      setLoadingSquads(true);
      const response = await fetch(
        `/api/tournament-matches/tournament/${tournamentId}/squads`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        setAvailableSquads(data.squads || []);
      }
    } catch (error) {
      console.error("Error fetching available squads:", error);
    } finally {
      setLoadingSquads(false);
    }
  };

  const validateMatchResult = (): boolean => {
    const errors: string[] = [];

    if (!winnerId) {
      errors.push("Хожигчийг сонгоно уу");
    }
    if (!loserId) {
      errors.push("Хожигдсынг сонгоно уу");
    }
    if (winnerId === loserId) {
      errors.push("Хожигч болон хожигдсон баг ижил байж болохгүй");
    }
    if (matchType === "normal") {
      if (squad1Score < 0 || squad2Score < 0) {
        errors.push("Оноо сөрөг байж болохгүй");
      }
      if (
        winnerId === selectedMatch?.squad1._id &&
        squad1Score <= squad2Score
      ) {
        errors.push("Хожигч багийн оноо их байх ёстой");
      }
      if (
        winnerId === selectedMatch?.squad2._id &&
        squad2Score <= squad1Score
      ) {
        errors.push("Хожигч багийн оноо их байх ёстой");
      }
    }

    setValidationErrors(errors);
    return errors.length === 0;
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
    setValidationErrors([]);
    setShowResultModal(true);
  };

  const openMatchModal = (match?: Match) => {
    if (match) {
      setEditingMatch(match);
      setMatchNumber(match.matchNumber);
      setRound(match.round);
      setSquad1Id(match.squad1._id);
      setSquad2Id(match.squad2._id);
      setScheduledTime(match.scheduledTime || "");
      setMatchStatus(match.status);
    } else {
      setEditingMatch(null);
      setMatchNumber(matches.length + 1);
      setRound(1);
      setSquad1Id("");
      setSquad2Id("");
      setScheduledTime("");
      setMatchStatus("scheduled");
    }
    setValidationErrors([]);
    setShowMatchModal(true);
  };

  const validateMatchForm = (): boolean => {
    const errors: string[] = [];

    if (!squad1Id) {
      errors.push("Эхний багийг сонгоно уу");
    }
    if (!squad2Id) {
      errors.push("Хоёр дахь багийг сонгоно уу");
    }
    if (squad1Id === squad2Id) {
      errors.push("Эхний баг болон хоёр дахь баг ижил байж болохгүй");
    }
    if (matchNumber < 1) {
      errors.push("Тоглолтын дугаар 1-ээс их байх ёстой");
    }
    if (round < 1) {
      errors.push("Шат 1-ээс их байх ёстой");
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const submitMatchForm = async () => {
    if (!validateMatchForm()) return;

    try {
      const matchData = {
        tournamentId,
        matchNumber,
        round,
        squad1Id,
        squad2Id,
        scheduledTime: scheduledTime || undefined,
        status: matchStatus,
        bountyCoinAmount: 50,
        matchType: "normal",
      };

      const url = editingMatch
        ? `/api/tournament-matches/${editingMatch._id}`
        : "/api/tournament-matches";
      const method = editingMatch ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(matchData),
      });

      const data = await response.json();
      if (data.success) {
        fetchMatches();
        setShowMatchModal(false);
        setEditingMatch(null);
        onMatchUpdate?.();
        alert(
          editingMatch
            ? "Тоглолт амжилттай шинэчлэгдлээ!"
            : "Тоглолт амжилттай үүсгэгдлээ!"
        );
      } else {
        alert("Алдаа: " + data.message);
      }
    } catch (error) {
      console.error("Error saving match:", error);
      alert("Тоглолт хадгалахад алдаа гарлаа");
    }
  };

  const submitMatchResult = async () => {
    if (!selectedMatch || !validateMatchResult()) return;

    try {
      // Update bounty coin settings if needed
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
        await fetch(`/api/tournament-matches/${selectedMatch._id}/bounty`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ applyLoserDeduction: false }),
        });
      }

      // Submit match result
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
        fetchMatches();
        setShowResultModal(false);
        setSelectedMatch(null);
        onMatchUpdate?.();
        alert("Тоглолтын дүн амжилттай шинэчлэгдлээ!");
      } else {
        alert("Алдаа: " + data.message);
      }
    } catch (error) {
      console.error("Error updating match result:", error);
      alert("Тоглолтын дүн шинэчлэхэд алдаа гарлаа");
    }
  };

  const updateMatchStatus = async (
    matchId: string,
    status: Match["status"]
  ) => {
    try {
      const response = await fetch(
        `/api/tournament-matches/${matchId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();
      if (data.success) {
        fetchMatches();
        onMatchUpdate?.();
      } else {
        alert("Алдаа: " + data.message);
      }
    } catch (error) {
      console.error("Error updating match status:", error);
      alert("Тоглолтын төлөв шинэчлэхэд алдаа гарлаа");
    }
  };

  const deleteMatch = async (matchId: string) => {
    if (!confirm("Энэ тоглолтыг устгахдаа итгэлтэй байна уу?")) return;

    try {
      const response = await fetch(`/api/tournament-matches/${matchId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        fetchMatches();
        onMatchUpdate?.();
        alert("Тоглолт амжилттай устгагдлаа");
      } else {
        alert("Алдаа: " + data.message);
      }
    } catch (error) {
      console.error("Error deleting match:", error);
      alert("Тоглолт устгахад алдаа гарлаа");
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
      case "cancelled":
        return "text-red-400";
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <FaCheckCircle className="text-green-400" />;
      case "in_progress":
        return <FaPlay className="text-yellow-400" />;
      case "scheduled":
        return <FaClock className="text-blue-400" />;
      case "cancelled":
        return <FaStop className="text-red-400" />;
      default:
        return <FaClock className="text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-white text-xl">Тоглолтуудыг уншиж байна...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-500/20 p-3 rounded-full">
              <FaGamepad className="text-blue-400 text-2xl" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                Тоглолтын удирдлага
              </h2>
              <p className="text-gray-300">
                Тэмцээний тоглолтыг удирдаж, дүнг шинэчлэх
              </p>
            </div>
          </div>
          <button
            onClick={() => openMatchModal()}
            className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
          >
            <FaEdit />
            <span>Шинэ тоглолт</span>
          </button>
        </div>
      </div>

      {/* Matches List */}
      {matches.length === 0 ? (
        <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 p-8 text-center">
          <div className="text-gray-400 text-lg">
            Энэ тэмцээнд тоглолт олдсонгүй
          </div>
          <button
            onClick={() => openMatchModal()}
            className="mt-4 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Эхний тоглолт үүсгэх
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((match) => (
            <motion.div
              key={match._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 rounded-lg border border-white/10 p-6 hover:bg-white/10 transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  {/* Match Header */}
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(match.status)}
                      <span className="text-gray-400 text-sm">
                        {match.round}-р шат - {match.matchNumber}-р тоглолт
                      </span>
                    </div>
                    <span
                      className={`text-sm font-medium px-2 py-1 rounded-full ${getMatchStatusColor(
                        match.status
                      )} bg-opacity-20`}
                    >
                      {match.status.replace("_", " ").toUpperCase()}
                    </span>
                    {match.matchType && (
                      <span
                        className={`text-sm font-medium px-2 py-1 rounded-full ${getMatchTypeColor(
                          match.matchType
                        )} bg-opacity-20`}
                      >
                        {match.matchType.replace("_", " ").toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Teams */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {/* Squad 1 */}
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        {match.squad1.logo && (
                          <img
                            src={match.squad1.logo}
                            alt={match.squad1.name}
                            className="w-10 h-10 rounded-full"
                          />
                        )}
                        <div>
                          <span className="text-white font-medium">
                            {match.squad1.name}
                          </span>
                          <div className="flex items-center space-x-2 text-sm">
                            <span className="text-gray-400">
                              [{match.squad1.tag}]
                            </span>
                            <DivisionCoinImage
                              division={match.squad1.division}
                              size={16}
                            />
                            <span className="text-yellow-400">
                              {match.squad1.currentBountyCoins} BC
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* VS */}
                    <div className="flex items-center justify-center">
                      <div className="text-2xl font-bold text-gray-400">VS</div>
                    </div>

                    {/* Squad 2 */}
                    <div className="flex items-center space-x-3 justify-end">
                      <div className="flex items-center space-x-2">
                        <div className="text-right">
                          <span className="text-white font-medium">
                            {match.squad2.name}
                          </span>
                          <div className="flex items-center space-x-2 text-sm justify-end">
                            <span className="text-yellow-400">
                              {match.squad2.currentBountyCoins} BC
                            </span>
                            <DivisionCoinImage
                              division={match.squad2.division}
                              size={16}
                            />
                            <span className="text-gray-400">
                              [{match.squad2.tag}]
                            </span>
                          </div>
                        </div>
                        {match.squad2.logo && (
                          <img
                            src={match.squad2.logo}
                            alt={match.squad2.name}
                            className="w-10 h-10 rounded-full"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Score and Results */}
                  {match.score && (
                    <div className="bg-white/5 rounded-lg p-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white mb-2">
                          {match.squad1.name} {match.score.squad1Score} -{" "}
                          {match.score.squad2Score} {match.squad2.name}
                        </div>
                        {match.winner && (
                          <div className="text-green-400 font-medium">
                            🏆 Хожигч:{" "}
                            {match.winner === match.squad1._id
                              ? match.squad1.name
                              : match.squad2.name}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Bounty Coin Status */}
                  {match.bountyCoinsDistributed && (
                    <div className="flex items-center space-x-2 text-sm text-yellow-400 bg-yellow-500/10 rounded-lg p-2">
                      <DivisionCoinImage
                        division={SquadDivision.GOLD}
                        size={20}
                      />
                      <span>Боунти Койн хуваарилагдсан</span>
                      {match.squad1BountyChange !== 0 && (
                        <span className="text-sm">
                          {match.squad1.name}:{" "}
                          {match.squad1BountyChange > 0 ? "+" : ""}
                          {match.squad1BountyChange} BC
                        </span>
                      )}
                      {match.squad2BountyChange !== 0 && (
                        <span className="text-sm">
                          {match.squad2.name}:{" "}
                          {match.squad2BountyChange > 0 ? "+" : ""}
                          {match.squad2BountyChange} BC
                        </span>
                      )}
                    </div>
                  )}

                  {/* Admin Notes */}
                  {match.adminNotes && (
                    <div className="mt-3 text-sm text-gray-300 bg-gray-800/50 rounded-lg p-3">
                      <span className="font-medium">Админ тэмдэглэл:</span>{" "}
                      {match.adminNotes}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col space-y-2 ml-4">
                  {match.status === "completed" ? (
                    <div className="flex items-center space-x-2 text-green-400">
                      <FaCheckCircle />
                      <span className="text-sm">Дууссан</span>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => openResultModal(match)}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors text-sm flex items-center space-x-2"
                      >
                        <FaEdit />
                        <span>Дүн</span>
                      </button>

                      {match.status === "scheduled" && (
                        <button
                          onClick={() =>
                            updateMatchStatus(match._id, "in_progress")
                          }
                          className="bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded-lg transition-colors text-sm flex items-center space-x-2"
                        >
                          <FaPlay />
                          <span>Эхлүүлэх</span>
                        </button>
                      )}

                      {match.status === "in_progress" && (
                        <button
                          onClick={() =>
                            updateMatchStatus(match._id, "completed")
                          }
                          className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg transition-colors text-sm flex items-center space-x-2"
                        >
                          <FaCheckCircle />
                          <span>Дуусгах</span>
                        </button>
                      )}
                    </>
                  )}

                  <button
                    onClick={() => openMatchModal(match)}
                    className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition-colors text-sm flex items-center space-x-2"
                  >
                    <FaEye />
                    <span>Засах</span>
                  </button>

                  <button
                    onClick={() => deleteMatch(match._id)}
                    className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg transition-colors text-sm flex items-center space-x-2"
                  >
                    <FaTrash />
                    <span>Устгах</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Result Modal */}
      <AnimatePresence>
        {showResultModal && selectedMatch && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-gray-800 rounded-xl border border-white/10 p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-xl font-semibold text-white mb-4">
                Тоглолтын дүнг шинэчлэх
              </h3>

              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-2 text-red-400 mb-2">
                    <FaExclamationTriangle />
                    <span className="font-medium">Алдаа:</span>
                  </div>
                  <ul className="text-sm text-red-300 space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

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
                      {selectedMatch.squad1.name} [{selectedMatch.squad1.tag}] -{" "}
                      {selectedMatch.squad1.division}
                    </option>
                    <option value={selectedMatch.squad2._id}>
                      {selectedMatch.squad2.name} [{selectedMatch.squad2.tag}] -{" "}
                      {selectedMatch.squad2.division}
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
                      {selectedMatch.squad1.name} [{selectedMatch.squad1.tag}] -{" "}
                      {selectedMatch.squad1.division}
                    </option>
                    <option value={selectedMatch.squad2._id}>
                      {selectedMatch.squad2.name} [{selectedMatch.squad2.tag}] -{" "}
                      {selectedMatch.squad2.division}
                    </option>
                  </select>
                </div>

                {/* Score Input */}
                {matchType === "normal" && (
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
                )}

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

                {/* Bounty Coin Configuration */}
                {matchType === "normal" && (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                    <div className="flex items-center space-x-2 text-yellow-400 mb-3">
                      <DivisionCoinImage
                        division={SquadDivision.GOLD}
                        size={24}
                      />
                      <span className="font-medium">
                        Боунти Койн хуваарилалт
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-white text-sm font-medium mb-2">
                          Хожигчийн авах BC
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
                    </div>

                    <div className="mt-3 text-sm text-yellow-300 bg-yellow-500/20 rounded-lg p-3">
                      <div className="font-medium mb-2">Дүрэм:</div>
                      <div>
                        • Хожигч багийн гишүүд: тус бүр +
                        {typeof customWinnerBC === "number" &&
                        customWinnerBC > 0
                          ? customWinnerBC
                          : 50}{" "}
                        BC
                      </div>
                      <div>
                        • Хожигдсон багийн гишүүд:{" "}
                        {applyLoserDeduction
                          ? "тус бүр -25 BC (хамгийн бага 0)"
                          : "суутгалгүй"}
                      </div>
                    </div>
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
      </AnimatePresence>

      {/* Match Management Modal */}
      <AnimatePresence>
        {showMatchModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-gray-800 rounded-xl border border-white/10 p-6 w-full max-w-2xl mx-4"
            >
              <h3 className="text-xl font-semibold text-white mb-4">
                {editingMatch ? "Тоглолт засах" : "Шинэ тоглолт үүсгэх"}
              </h3>

              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-2 text-red-400 mb-2">
                    <FaExclamationTriangle />
                    <span className="font-medium">Алдаа:</span>
                  </div>
                  <ul className="text-sm text-red-300 space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Тоглолтын дугаар
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={matchNumber}
                      onChange={(e) =>
                        setMatchNumber(parseInt(e.target.value) || 1)
                      }
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Шат
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={round}
                      onChange={(e) => setRound(parseInt(e.target.value) || 1)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Тоглолтын төлөв
                  </label>
                  <select
                    value={matchStatus}
                    onChange={(e) =>
                      setMatchStatus(e.target.value as Match["status"])
                    }
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="scheduled">Төлөвлөгдсөн</option>
                    <option value="in_progress">Явагдаж байна</option>
                    <option value="completed">Дууссан</option>
                    <option value="cancelled">Цуцлагдсан</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Төлөвлөгдсөн цаг (Сонгох)
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Squad Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Эхний баг
                    </label>
                    {loadingSquads ? (
                      <div className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-400">
                        Багуудыг уншиж байна...
                      </div>
                    ) : (
                      <select
                        value={squad1Id}
                        onChange={(e) => setSquad1Id(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Эхний багийг сонгоно уу...</option>
                        {availableSquads.map((squad) => (
                          <option key={squad._id} value={squad._id}>
                            {squad.name} [{squad.tag}] - {squad.division}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Хоёр дахь баг
                    </label>
                    {loadingSquads ? (
                      <div className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-400">
                        Багуудыг уншиж байна...
                      </div>
                    ) : (
                      <select
                        value={squad2Id}
                        onChange={(e) => setSquad2Id(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Хоёр дахь багийг сонгоно уу...</option>
                        {availableSquads.map((squad) => (
                          <option key={squad._id} value={squad._id}>
                            {squad.name} [{squad.tag}] - {squad.division}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setShowMatchModal(false)}
                    className="flex-1 bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Цуцлах
                  </button>
                  <button
                    onClick={submitMatchForm}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    {editingMatch ? "Хадгалах" : "Үүсгэх"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
