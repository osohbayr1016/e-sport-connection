"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  Users,
  Trophy,
  Newspaper,
  Shield,
  Calendar,
  DollarSign,
  Activity,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navigation from "../../components/Navigation";
import { useAuth } from "../../contexts/AuthContext";
import { API_ENDPOINTS } from "../../../config/api";

interface AnalyticsData {
  totalUsers: number;
  totalProfiles: number;
  totalNews: number;
  totalTournaments: number;
  activeUsers: number;
  newUsersThisWeek: number;
  newProfilesThisWeek: number;
  newNewsThisWeek: number;
  userGrowth: number;
  profileGrowth: number;
  newsGrowth: number;
  topGames: Array<{
    game: string;
    count: number;
  }>;
  userActivity: Array<{
    date: string;
    users: number;
    profiles: number;
    news: number;
  }>;
}

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Check admin access (wait for auth load)
  useEffect(() => {
    if (authLoading) return;
    const isAdmin =
      user?.role === "ADMIN" || user?.email === "admin@esport-connection.com";
    if (!user || !isAdmin) {
      router.push("/");
      return;
    }
  }, [user, authLoading, router]);

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);

        const response = await fetch("/api/analytics");
        const data = await response.json();

        if (data.success && data.analytics) {
          const analyticsData: AnalyticsData = {
            totalUsers: data.analytics.totalUsers || 0,
            totalProfiles: data.analytics.totalProfiles || 0,
            totalNews: data.analytics.totalNews || 0,
            totalTournaments: data.analytics.totalTournaments || 0,
            activeUsers: data.analytics.activeUsers || 0,
            newUsersThisWeek: data.analytics.newUsersThisWeek || 0,
            newProfilesThisWeek: data.analytics.newProfilesThisWeek || 0,
            newNewsThisWeek: data.analytics.newNewsThisWeek || 0,
            userGrowth: data.analytics.userGrowth || 0,
            profileGrowth: data.analytics.profileGrowth || 0,
            newsGrowth: data.analytics.newsGrowth || 0,
            topGames: data.analytics.topGames || [],
            userActivity: data.analytics.userActivity || [],
          };
          setAnalytics(analyticsData);
        }
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    const isAdmin =
      user?.role === "ADMIN" || user?.email === "admin@esport-connection.com";
    if (!authLoading && user && isAdmin) {
      fetchAnalytics();
    }
  }, [user, authLoading]);

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
    user?.role === "ADMIN" || user?.email === "admin@esport-connection.com";
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
              <p className="text-gray-400 mb-6">
                You don&apos;t have permission to access the admin panel.
              </p>
              <Link
                href="/"
                className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors duration-200"
              >
                <span>Return to Home</span>
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (loading || !analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <Navigation />
        <main className="pt-20 pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
              <p className="mt-4 text-gray-300">Loading analytics...</p>
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
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
                  Analytics & Reports
                </h1>
                <p className="text-gray-300">
                  View platform statistics and generate reports
                </p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 flex items-center space-x-2"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Refresh Data</span>
              </button>
            </div>
          </motion.div>

          {/* Key Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6 hover:border-blue-500/50 transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">
                    Total Users
                  </p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {analytics.totalUsers.toLocaleString()}
                  </p>
                  <p className="text-green-400 text-sm mt-1">
                    +{analytics.userGrowth}% this month
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6 hover:border-green-500/50 transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">
                    Active Users
                  </p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {analytics.activeUsers.toLocaleString()}
                  </p>
                  <p className="text-blue-400 text-sm mt-1">Currently online</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6 hover:border-orange-500/50 transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">
                    Total Profiles
                  </p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {analytics.totalProfiles.toLocaleString()}
                  </p>
                  <p className="text-green-400 text-sm mt-1">
                    +{analytics.profileGrowth}% this month
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-orange-400" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6 hover:border-purple-500/50 transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">
                    Total News
                  </p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {analytics.totalNews.toLocaleString()}
                  </p>
                  <p className="text-green-400 text-sm mt-1">
                    +{analytics.newsGrowth}% this month
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center">
                  <Newspaper className="w-6 h-6 text-purple-400" />
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Weekly Activity Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6 mb-8"
          >
            <h2 className="text-2xl font-bold text-white mb-6">
              Weekly Activity
            </h2>
            <div className="grid grid-cols-7 gap-4">
              {analytics.userActivity.map((day, index) => (
                <div key={day.date} className="text-center">
                  <p className="text-gray-400 text-sm mb-2">{day.date}</p>
                  <div className="space-y-2">
                    <div className="bg-blue-500/20 rounded-lg p-2">
                      <p className="text-blue-400 text-xs">Users</p>
                      <p className="text-white font-semibold">{day.users}</p>
                    </div>
                    <div className="bg-green-500/20 rounded-lg p-2">
                      <p className="text-green-400 text-xs">Profiles</p>
                      <p className="text-white font-semibold">{day.profiles}</p>
                    </div>
                    <div className="bg-purple-500/20 rounded-lg p-2">
                      <p className="text-purple-400 text-xs">News</p>
                      <p className="text-white font-semibold">{day.news}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Top Games */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6 mb-8"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Top Games</h2>
            <div className="space-y-4">
              {analytics.topGames.map((game, index) => (
                <div
                  key={game.game}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg flex items-center justify-center">
                      <span className="text-blue-400 font-bold text-sm">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="text-white font-medium">{game.game}</p>
                      <p className="text-gray-400 text-sm">
                        {game.count} players
                      </p>
                    </div>
                  </div>
                  <div className="w-32 bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full"
                      style={{
                        width: `${
                          (game.count / analytics.topGames[0].count) * 100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Recent Growth */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-semibold">New Users</p>
                  <p className="text-gray-400 text-sm">This week</p>
                </div>
              </div>
              <p className="text-3xl font-bold text-white">
                +{analytics.newUsersThisWeek}
              </p>
              <p className="text-green-400 text-sm mt-1">
                {analytics.userGrowth}% growth
              </p>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-white font-semibold">New Profiles</p>
                  <p className="text-gray-400 text-sm">This week</p>
                </div>
              </div>
              <p className="text-3xl font-bold text-white">
                +{analytics.newProfilesThisWeek}
              </p>
              <p className="text-green-400 text-sm mt-1">
                {analytics.profileGrowth}% growth
              </p>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center">
                  <Newspaper className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-white font-semibold">New Articles</p>
                  <p className="text-gray-400 text-sm">This week</p>
                </div>
              </div>
              <p className="text-3xl font-bold text-white">
                +{analytics.newNewsThisWeek}
              </p>
              <p className="text-green-400 text-sm mt-1">
                {analytics.newsGrowth}% growth
              </p>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
