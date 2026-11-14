"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { API_ENDPOINTS } from "../../config/api";

export default function StatsRow() {
  const [stats, setStats] = useState({
    activePlayers: 0,
    newsCount: 0,
    ongoingTournaments: 0,
  });

  useEffect(() => {
    let cancelled = false;
    const fetchStats = async () => {
      try {
        const res = await fetch(API_ENDPOINTS.STATS.OVERVIEW);
        if (!res.ok) throw new Error("Failed to load stats");
        const data = await res.json();
        if (!cancelled) setStats(data);
      } catch (e) {
        console.error("Failed to fetch stats:", e);
      }
    };
    fetchStats();
    const id = setInterval(fetchStats, 30000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const Stat = ({ value, label }: { value: number; label: string }) => (
    <div className="rounded-xl bg-black/40 border border-white/10 p-5 text-center text-white">
      <div className="text-3xl font-extrabold">{value.toLocaleString()}</div>
      <div className="text-xs text-white/70 mt-1">{label}</div>
    </div>
  );

  return (
    <motion.div
      className="mt-10 grid grid-cols-3 gap-4 max-w-xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.35 }}
    >
      <Stat value={stats.activePlayers} label="ACTIVE PLAYERS" />
      <Stat value={stats.newsCount} label="NEWS" />
      <Stat value={stats.ongoingTournaments} label="ONGOING TOURNAMENTS" />
    </motion.div>
  );
}
