"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Users,
  Coins,
  Calendar,
  Check,
  X,
  Shuffle,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/navigation";
import { API_ENDPOINTS } from "../../../config/api";
import Image from "next/image";

export default function AdminMatchDisputesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [disputes, setDisputes] = useState<any[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!user || user.role !== "ADMIN") {
      router.push("/");
      return;
    }
    fetchDisputes();
  }, [user]);

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      console.log('🔍 Fetching disputes from:', `${API_ENDPOINTS.BASE_URL}/api/admin/matches/disputes`);
      const response = await fetch(
        `${API_ENDPOINTS.BASE_URL}/api/admin/matches/disputes`,
        {
          credentials: "include",
        }
      );
      console.log('📡 Disputes fetch response status:', response.status);
      const data = await response.json();
      console.log('📊 Disputes data:', data);
      console.log('📊 Number of disputes:', data.data?.length || 0);
      if (data.success) {
        setDisputes(data.data);
        setError("");
      } else {
        console.error('❌ Failed to fetch disputes:', data.message);
        setError(data.message || "Алдаа гарлаа");
      }
    } catch (error: any) {
      console.error("Error fetching disputes:", error);
      setError(error.message || "Холболт амжилтгүй");
    } finally {
      setLoading(false);
    }
  };

  const resolveDispute = async (matchId: string, resolution: string) => {
    if (!window.confirm(`Та энэ шийдвэрийг баталгаажуулах уу?`)) return;

    setResolving(true);

    try {
      const response = await fetch(
        `${API_ENDPOINTS.BASE_URL}/api/admin/matches/${matchId}/resolve`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ resolution }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setSelectedDispute(null);
        fetchDisputes();
      } else {
        alert(data.message || "Алдаа гарлаа");
      }
    } catch (error) {
      alert("Алдаа гарлаа");
    } finally {
      setResolving(false);
    }
  };

  if (!user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6 pt-24">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-white flex items-center gap-3"
          >
            <AlertTriangle className="w-10 h-10 text-orange-500" />
            Match Disputes
          </motion.h1>
          <button
            onClick={fetchDisputes}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
          >
            {loading ? "Уншиж байна..." : "🔄 Шинэчлэх"}
          </button>
        </div>

        {error && (
          <div className="bg-red-900 bg-opacity-30 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {loading ? (
          <p className="text-white text-center">Уншиж байна...</p>
        ) : disputes.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-400 text-lg">Dispute байхгүй байна</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {disputes.map((match) => (
              <motion.div
                key={match._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-800 rounded-lg p-6 cursor-pointer hover:shadow-xl transition-all"
                onClick={() => setSelectedDispute(match)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    <span className="text-orange-500 font-semibold">
                      DISPUTE
                    </span>
                  </div>
                  <span className="text-yellow-400 text-sm">
                    {match.bountyAmount} coins
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-white">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">
                      {match.challengerSquadId.name}
                    </span>
                  </div>
                  <div className="text-center text-purple-400 font-bold">
                    VS
                  </div>
                  <div className="flex items-center gap-2 text-white">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">
                      {match.opponentSquadId.name}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-700 text-gray-400 text-xs">
                  <div>Challenger: {match.challengerResult || "N/A"}</div>
                  <div>Opponent: {match.opponentResult || "N/A"}</div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Dispute Detail Modal - separate component due to 160 line rule */}
      {selectedDispute && (
        <DisputeDetailModal
          dispute={selectedDispute}
          onClose={() => setSelectedDispute(null)}
          onResolve={resolveDispute}
          resolving={resolving}
        />
      )}
    </div>
  );
}

function DisputeDetailModal({
  dispute,
  onClose,
  onResolve,
  resolving,
}: {
  dispute: any;
  onClose: () => void;
  onResolve: (matchId: string, resolution: string) => void;
  resolving: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Dispute дэлгэрэнгүй</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Challenger Evidence */}
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-white font-bold mb-3">
              {dispute.challengerSquadId.name}
            </h3>
            {dispute.challengerEvidence?.images?.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mb-3">
                {dispute.challengerEvidence.images.map(
                  (img: string, i: number) => (
                    <Image
                      key={i}
                      src={img}
                      alt="Evidence"
                      width={200}
                      height={200}
                      className="rounded"
                    />
                  )
                )}
              </div>
            )}
            {dispute.challengerEvidence?.description && (
              <p className="text-gray-300 text-sm">
                {dispute.challengerEvidence.description}
              </p>
            )}
            {!dispute.challengerEvidence && (
              <p className="text-gray-400">Баримт огт оруулаагүй</p>
            )}
          </div>

          {/* Opponent Evidence */}
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-white font-bold mb-3">
              {dispute.opponentSquadId.name}
            </h3>
            {dispute.opponentEvidence?.images?.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mb-3">
                {dispute.opponentEvidence.images.map(
                  (img: string, i: number) => (
                    <Image
                      key={i}
                      src={img}
                      alt="Evidence"
                      width={200}
                      height={200}
                      className="rounded"
                    />
                  )
                )}
              </div>
            )}
            {dispute.opponentEvidence?.description && (
              <p className="text-gray-300 text-sm">
                {dispute.opponentEvidence.description}
              </p>
            )}
            {!dispute.opponentEvidence && (
              <p className="text-gray-400">Баримт огт оруулаагүй</p>
            )}
          </div>
        </div>

        {/* Resolution Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => onResolve(dispute._id, "SQUAD_A_WON")}
            disabled={resolving}
            className="bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
          >
            {dispute.challengerSquadId.name} ялсан
          </button>
          <button
            onClick={() => onResolve(dispute._id, "SQUAD_B_WON")}
            disabled={resolving}
            className="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
          >
            {dispute.opponentSquadId.name} ялсан
          </button>
          <button
            onClick={() => onResolve(dispute._id, "DRAW")}
            disabled={resolving}
            className="bg-yellow-600 hover:bg-yellow-700 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
          >
            Тэнцсэн
          </button>
          <button
            onClick={() => onResolve(dispute._id, "CANCELLED")}
            disabled={resolving}
            className="bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
          >
            Цуцлах
          </button>
        </div>
      </motion.div>
    </div>
  );
}
