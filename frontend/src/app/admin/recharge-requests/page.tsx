"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Navigation from "../../components/Navigation";
import { useAuth } from "../../contexts/AuthContext";
import { API_ENDPOINTS } from "../../../config/api";
import { Check, X, RefreshCw, Coins } from "lucide-react";

interface PurchaseRequest {
  _id: string;
  squadId: { _id: string; name: string; tag: string } | string;
  requestedBy: { _id: string; name: string; email: string } | string;
  amount: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminNotes?: string;
  processedAt?: string;
  createdAt: string;
}

export default function RechargeRequestsPage() {
  const { user, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "ALL" | "PENDING" | "APPROVED" | "REJECTED"
  >("PENDING");
  const [decisionLoadingId, setDecisionLoadingId] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (!authLoading && user) fetchData();
  }, [authLoading, user, filter]);

  const fetchData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const params = filter === "ALL" ? "" : `status=${filter}`;
      const res = await fetch(
        API_ENDPOINTS.BOUNTY_COINS.PURCHASE_LIST(params),
        {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );
      const data = await res.json();
      if (res.ok && data.success) setRequests(data.data);
      else setRequests([]);
    } catch (e) {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const decide = async (id: string, decision: "APPROVE" | "REJECT") => {
    try {
      setDecisionLoadingId(id);
      const token = localStorage.getItem("token");
      const res = await fetch(API_ENDPOINTS.BOUNTY_COINS.PURCHASE_DECIDE(id), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ decision }),
      });
      if (res.ok) await fetchData();
    } finally {
      setDecisionLoadingId(null);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <Navigation />
        <main className="pt-20 pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
              <p className="mt-4 text-gray-300">Loading...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const isAdmin =
    user.role === "ADMIN" || user.email === "admin@esport-connection.com";
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <Navigation />
        <main className="pt-20 pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold text-white mb-4">
                Access Denied
              </h1>
              <p className="text-gray-400 mb-6">Admins only.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <Navigation />
      <main className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Coins className="w-8 h-8 text-yellow-400" />
              <h1 className="text-3xl font-bold text-white">
                Recharge Requests
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-700"
              >
                {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map(
                  (f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  )
                )}
              </select>
              <button
                onClick={fetchData}
                className="px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 hover:bg-gray-700 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6">
            {loading ? (
              <div className="text-center py-10 text-gray-400">Loading...</div>
            ) : requests.length === 0 ? (
              <div className="text-center py-10 text-gray-400">No requests</div>
            ) : (
              <div className="space-y-3">
                {requests.map((r) => (
                  <motion.div
                    key={r._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-gray-900/50 rounded-lg border border-gray-700 flex items-center justify-between"
                  >
                    <div className="space-y-1">
                      <div className="text-white font-medium">
                        {(typeof r.squadId === "string"
                          ? r.squadId
                          : r.squadId.name) || "Squad"}
                        <span className="text-gray-400 ml-2">
                          #{typeof r.squadId === "string" ? "" : r.squadId.tag}
                        </span>
                      </div>
                      <div className="text-yellow-400 text-sm font-medium">
                        {r.amount.toLocaleString()} Bounty Coins
                      </div>
                      <div className="text-gray-400 text-xs">
                        Requested by:{" "}
                        {typeof r.requestedBy === "string"
                          ? r.requestedBy
                          : r.requestedBy.name}
                        {typeof r.requestedBy !== "string" && (
                          <span className="text-gray-500">
                            {" "}
                            ({r.requestedBy.email})
                          </span>
                        )}
                      </div>
                      <div className="text-gray-500 text-xs">
                        Status: {r.status} • Requested:{" "}
                        {new Date(r.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.status === "PENDING" && (
                        <>
                          <button
                            disabled={!!decisionLoadingId}
                            onClick={() => decide(r._id, "APPROVE")}
                            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                          >
                            <Check className="w-4 h-4" /> Approve
                          </button>
                          <button
                            disabled={!!decisionLoadingId}
                            onClick={() => decide(r._id, "REJECT")}
                            className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
                          >
                            <X className="w-4 h-4" /> Reject
                          </button>
                        </>
                      )}
                      {r.status !== "PENDING" && (
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            r.status === "APPROVED"
                              ? "bg-green-900/30 text-green-400 border border-green-700/30"
                              : "bg-red-900/30 text-red-400 border border-red-700/30"
                          }`}
                        >
                          {r.status}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
