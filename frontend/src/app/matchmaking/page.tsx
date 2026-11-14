"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Swords, Clock, History, Plus } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { API_ENDPOINTS } from "../../config/api";
import CreateMatchModal from "./components/CreateMatchModal";
import MatchCard from "./components/MatchCard";
import MatchDetailsModal from "./components/MatchDetailsModal";

interface Match {
  _id: string;
  type: "PUBLIC" | "PRIVATE";
  challengerSquadId: {
    _id: string;
    name: string;
    tag: string;
    logo?: string;
  };
  opponentSquadId?: {
    _id: string;
    name: string;
    tag: string;
    logo?: string;
  };
  bountyAmount: number;
  deadline: string;
  status: string;
  winnerId?: string;
  createdAt: string;
}

export default function MatchmakingPage() {
  const { user, getToken } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "create" | "active" | "my" | "history"
  >("active");
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [userSquad, setUserSquad] = useState<any>(null);

  const tabs = [
    { id: "create" as const, name: "Тоглолт үүсгэх", icon: Plus },
    { id: "active" as const, name: "Идэвхтэй тоглолтууд", icon: Swords },
    { id: "my" as const, name: "Миний тоглолтууд", icon: Trophy },
    { id: "history" as const, name: "Түүх", icon: History },
  ];

  useEffect(() => {
    fetchUserSquad();
  }, [user]);

  useEffect(() => {
    if (activeTab !== "create") {
      fetchMatches();
    }
  }, [activeTab]);

  const fetchUserSquad = async () => {
    if (!user) return;
    try {
      const token = getToken();
      const response = await fetch(API_ENDPOINTS.SQUADS.USER_SQUADS(user.id), {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: "include",
      });
      const data = await response.json();
      if (data.success && data.squads.length > 0) {
        setUserSquad(data.squads[0]);
      }
    } catch (error) {
      console.error("Error fetching squad:", error);
    }
  };

  const fetchMatches = async () => {
    setLoading(true);
    try {
      let endpoint = "";
      if (activeTab === "active") {
        endpoint = `${API_ENDPOINTS.BASE_URL}/api/matches`;
      } else if (activeTab === "my") {
        endpoint = `${API_ENDPOINTS.BASE_URL}/api/matches/my-squad`;
      } else if (activeTab === "history") {
        endpoint = `${API_ENDPOINTS.BASE_URL}/api/matches/history`;
      }

      console.log(`🔍 Fetching matches from: ${endpoint}`);
      const token = getToken();
      console.log(`🔑 Token available: ${!!token}`);
      
      const response = await fetch(endpoint, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: "include",
      });
      
      console.log(`📡 Response status: ${response.status}`);
      const data = await response.json();
      console.log(`📊 Response data:`, data);
      
      if (data.success) {
        console.log(`✅ Found ${data.data.length} matches`);
        setMatches(data.data);
      } else {
        console.error(`❌ API error: ${data.message}`);
      }
    } catch (error) {
      console.error("❌ Error fetching matches:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-gray-900 to-gray-900 flex items-center justify-center">
        <p className="text-white text-xl">Нэвтэрч орно уу</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-gray-900 to-gray-900 p-6 pt-24">
      <div className="max-w-7xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-white mb-8 flex items-center gap-3"
        >
          <Swords className="w-10 h-10" />
          Matchmaking
        </motion.h1>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === "create") {
                  setShowCreateModal(true);
                } else {
                  setActiveTab(tab.id);
                }
              }}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.name}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === "create" ? (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-300 mb-4">Шинэ тоглолт үүсгэх</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
            >
              Үүсгэх
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <p className="text-white col-span-full text-center">
                Уншиж байна...
              </p>
            ) : matches.length === 0 ? (
              <p className="text-gray-400 col-span-full text-center">
                Тоглолт байхгүй байна
              </p>
            ) : (
              matches.map((match) => (
                <MatchCard
                  key={match._id}
                  match={match}
                  onClick={() => setSelectedMatch(match)}
                  userSquad={userSquad}
                />
              ))
            )}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateMatchModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            setActiveTab("active");
            fetchMatches();
          }}
          userSquad={userSquad}
        />
      )}

      {selectedMatch && (
        <MatchDetailsModal
          match={selectedMatch}
          onClose={() => setSelectedMatch(null)}
          onUpdate={fetchMatches}
          userSquad={userSquad}
        />
      )}
    </div>
  );
}
