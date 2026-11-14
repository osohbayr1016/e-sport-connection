"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Navigation from "../../../components/Navigation";
import { useAuth } from "../../../contexts/AuthContext";
import { API_ENDPOINTS } from "../../../../config/api";
import Link from "next/link";
import { RefreshCw, Filter, ArrowLeft } from "lucide-react";

interface WithdrawRequest {
  _id: string;
  squadId: { _id: string; name: string; tag: string } | string;
  requestedBy: { _id: string; name: string; email: string } | string;
  amountCoins: number;
  amountMNT: number;
  bankName: string;
  iban: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "PAID";
  adminNotes?: string;
  processedBy?: { _id: string; name: string; email: string } | string;
  processedAt?: string;
  paidBy?: { _id: string; name: string; email: string } | string;
  paidAt?: string;
  createdAt: string;
}

export default function WithdrawTransactionsPage() {
  const { user, loading: authLoading } = useAuth();
  const [all, setAll] = useState<WithdrawRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "APPROVED" | "REJECTED" | "PAID" | "ALL"
  >("ALL");

  useEffect(() => {
    if (!authLoading && user) fetchData();
  }, [authLoading, user]);

  const fetchData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      // Fetch all (admin can optionally filter via query, but we'll filter client-side too)
      const res = await fetch(API_ENDPOINTS.BOUNTY_COINS.WITHDRAW_LIST(""), {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      const data = await res.json();
      if (res.ok && data.success) setAll(data.data);
      else setAll([]);
    } catch (e) {
      setAll([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all
      .filter((r) => r.status !== "PENDING")
      .filter((r) =>
        statusFilter === "ALL" ? true : r.status === statusFilter
      )
      .filter((r) => {
        if (!q) return true;
        const squadName = (
          typeof r.squadId === "string" ? r.squadId : r.squadId?.name || ""
        ).toLowerCase();
        const squadTag = (
          typeof r.squadId === "string" ? "" : r.squadId?.tag || ""
        ).toLowerCase();
        const requester = (
          typeof r.requestedBy === "string"
            ? r.requestedBy
            : r.requestedBy?.name || ""
        ).toLowerCase();
        const email = (
          typeof r.requestedBy === "string" ? "" : r.requestedBy?.email || ""
        ).toLowerCase();
        return (
          squadName.includes(q) ||
          squadTag.includes(q) ||
          requester.includes(q) ||
          email.includes(q)
        );
      })
      .sort((a, b) => {
        const at = new Date(a.processedAt || a.createdAt).getTime();
        const bt = new Date(b.processedAt || b.createdAt).getTime();
        return bt - at;
      });
  }, [all, search, statusFilter]);

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
              <Link
                href="/admin/withdraw-requests"
                className="text-gray-300 hover:text-white inline-flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Link>
              <h1 className="text-3xl font-bold text-white">
                Withdraw Transaction History
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search squad, tag, user, email..."
                className="px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 w-64"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-700"
              >
                <option value="ALL">All</option>
                <option value="APPROVED">Approved</option>
                <option value="PAID">Paid</option>
                <option value="REJECTED">Rejected</option>
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
            ) : filtered.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                No transactions
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((r) => (
                  <motion.div
                    key={r._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-gray-900/50 rounded-lg border border-gray-700"
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="text-white font-medium">
                          {(typeof r.squadId === "string"
                            ? r.squadId
                            : r.squadId.name) || "Squad"}
                          <span className="text-gray-400 ml-2">
                            #
                            {typeof r.squadId === "string" ? "" : r.squadId.tag}
                          </span>
                        </div>
                        <div className="text-gray-300 text-sm">
                          {r.amountCoins.toLocaleString()} BC ≈{" "}
                          {r.amountMNT.toLocaleString()}₮
                        </div>
                        <div className="text-gray-400 text-xs">
                          Requested by:{" "}
                          {typeof r.requestedBy === "string"
                            ? r.requestedBy
                            : r.requestedBy?.name}{" "}
                          • Bank: {r.bankName}
                        </div>
                        <div className="text-gray-500 text-xs">
                          <span
                            className={`font-medium ${
                              r.status === "PAID"
                                ? "text-green-400"
                                : r.status === "APPROVED"
                                ? "text-blue-400"
                                : r.status === "REJECTED"
                                ? "text-red-400"
                                : ""
                            }`}
                          >
                            Status: {r.status}
                          </span>{" "}
                          {r.adminNotes ? `• Notes: ${r.adminNotes}` : ""}
                        </div>
                      </div>
                      <div className="text-right text-xs text-gray-500">
                        <div>
                          Requested: {new Date(r.createdAt).toLocaleString()}
                        </div>
                        {r.processedAt && (
                          <div>
                            Processed:{" "}
                            {new Date(r.processedAt).toLocaleString()}
                          </div>
                        )}
                        {r.paidAt && (
                          <div className="text-green-400 font-medium">
                            Paid: {new Date(r.paidAt).toLocaleString()}
                          </div>
                        )}
                      </div>
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
