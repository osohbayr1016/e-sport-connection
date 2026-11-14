"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Newspaper,
  Users,
  Trophy,
  Settings,
  BarChart3,
  Shield,
  Plus,
  Calendar,
  Award,
  Gamepad2,
  AlertTriangle,
  Store,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Navigation from "../components/Navigation";
import { useAuth } from "../contexts/AuthContext";
import { API_ENDPOINTS } from "../../config/api";

interface AdminCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: string;
  stats?: {
    total: number;
    new: number;
  };
}

interface RecentActivity {
  id: string;
  type: string;
  title: string;
  timestamp: string;
  icon: React.ReactNode;
  color: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({
    news: { total: 0, new: 0 },
    users: { total: 0, new: 0 },
    tournaments: { total: 0, new: 0 },
    profiles: { total: 0, new: 0 },
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  // Check admin access (wait for auth to load)
  useEffect(() => {
    if (authLoading) return;
    const isAdmin =
      user?.role === "ADMIN" || user?.email === "admin@esport-connection.com";
    if (!user || !isAdmin) {
      router.push("/");
      return;
    }
  }, [user, authLoading, router]);

  // Fetch real data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch dashboard statistics
        const statsResponse = await fetch(API_ENDPOINTS.DASHBOARD.STATS);
        const statsData = await statsResponse.json();

        if (statsData.success) {
          setStats(statsData.stats);
        }

        // Fetch recent activity
        const activityResponse = await fetch(API_ENDPOINTS.DASHBOARD.ACTIVITY);
        const activityData = await activityResponse.json();

        if (activityData.success) {
          const activities: RecentActivity[] = activityData.activities.map(
            (item: Record<string, unknown>) => ({
              id: item.id as string,
              type: item.type as string,
              title: item.title as string,
              timestamp: new Date(
                item.timestamp as string
              ).toLocaleDateString(),
              icon:
                item.icon === "newspaper" ? (
                  <Plus className="w-4 h-4" />
                ) : item.icon === "user" ? (
                  <Users className="w-4 h-4" />
                ) : item.icon === "shield" ? (
                  <Shield className="w-4 h-4" />
                ) : item.icon === "trophy" ? (
                  <Trophy className="w-4 h-4" />
                ) : (
                  <Calendar className="w-4 h-4" />
                ),
              color:
                item.icon === "newspaper"
                  ? "bg-blue-500/20 text-blue-400"
                  : item.icon === "user"
                  ? "bg-green-500/20 text-green-400"
                  : item.icon === "shield"
                  ? "bg-orange-500/20 text-orange-400"
                  : item.icon === "trophy"
                  ? "bg-purple-500/20 text-purple-400"
                  : "bg-gray-500/20 text-gray-400",
            })
          );

          setRecentActivity(activities);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        // Fallback to basic data if API fails
        setStats({
          news: { total: 0, new: 0 },
          users: { total: 0, new: 0 },
          tournaments: { total: 0, new: 0 },
          profiles: { total: 0, new: 0 },
        });
        setRecentActivity([]);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch data if user is admin and auth loaded
    const isAdmin =
      user?.role === "ADMIN" || user?.email === "admin@esport-connection.com";
    if (!authLoading && user && isAdmin) {
      fetchDashboardData();
    }
  }, [user, authLoading]);

  // Show loading while auth is initializing
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

  const adminCards: AdminCard[] = [
    {
      id: "news",
      title: "News Management",
      description: "Create, edit, and manage news articles and announcements",
      icon: <Newspaper className="w-8 h-8" />,
      href: "/admin/news",
      color: "from-blue-500 to-cyan-500",
      stats: stats.news,
    },
    {
      id: "users",
      title: "User Management",
      description: "Manage user accounts, roles, and permissions",
      icon: <Users className="w-8 h-8" />,
      href: "/admin/users",
      color: "from-green-500 to-emerald-500",
      stats: stats.users,
    },
    {
      id: "tournaments",
      title: "Tournament Management",
      description: "Create and manage tournaments and competitions",
      icon: <Trophy className="w-8 h-8" />,
      href: "/admin/tournaments",
      color: "from-purple-500 to-pink-500",
      stats: stats.tournaments,
    },
    {
      id: "profiles",
      title: "Profile Management",
      description: "Manage player and organization profiles",
      icon: <Shield className="w-8 h-8" />,
      href: "/admin/profiles",
      color: "from-orange-500 to-red-500",
      stats: stats.profiles,
    },
    {
      id: "pro-players",
      title: "Pro Player Applications",
      description:
        "Review and approve professional player applications for account boosting",
      icon: <Trophy className="w-8 h-8" />,
      href: "/admin/pro-players",
      color: "from-yellow-500 to-orange-500",
    },
    {
      id: "match-results",
      title: "Match Results",
      description:
        "Update tournament match results and manage Bounty Coin distribution",
      icon: (
        <div className="relative">
          <Image
            src="https://res.cloudinary.com/djvjsyzgw/image/upload/v1756557908/coin_masl_nzwekq.png"
            alt="Bounty Coin"
            width={32}
            height={32}
            className="rounded-full"
          />
          <Award className="absolute -top-1 -right-1 text-yellow-400 text-sm" />
        </div>
      ),
      href: "/admin/match-results",
      color: "from-pink-500 to-rose-500",
    },
    {
      id: "match-management",
      title: "Match Management",
      description:
        "Create, edit, and manage tournament matches and player assignments",
      icon: <Gamepad2 className="w-8 h-8" />,
      href: "/admin/match-management",
      color: "from-cyan-500 to-blue-500",
    },
    {
      id: "matches",
      title: "All Matches",
      description:
        "View and manage all matches across all tournaments with team matchups",
      icon: <Trophy className="w-8 h-8" />,
      href: "/admin/matches",
      color: "from-indigo-500 to-purple-500",
    },
    {
      id: "withdraw-requests",
      title: "Withdraw Requests",
      description: "Review squad withdrawal requests and mark as paid",
      icon: <Award className="w-8 h-8" />,
      href: "/admin/withdraw-requests",
      color: "from-yellow-500 to-orange-500",
    },
    {
      id: "recharge-requests",
      title: "Recharge Requests",
      description: "Review and approve bounty coin purchase requests",
      icon: (
        <div className="relative">
          <Image
            src="https://res.cloudinary.com/djvjsyzgw/image/upload/v1756557908/coin_masl_nzwekq.png"
            alt="Bounty Coin"
            width={32}
            height={32}
            className="rounded-full"
          />
          <Plus className="absolute -top-1 -right-1 text-green-400 text-sm" />
        </div>
      ),
      href: "/admin/recharge-requests",
      color: "from-green-500 to-emerald-500",
    },
    {
      id: "analytics",
      title: "Analytics & Reports",
      description: "View platform statistics and generate reports",
      icon: <BarChart3 className="w-8 h-8" />,
      href: "/admin/analytics",
      color: "from-indigo-500 to-purple-500",
    },
    {
      id: "match-disputes",
      title: "Match Disputes",
      description: "Review and resolve match disputes between squads",
      icon: <AlertTriangle className="w-8 h-8" />,
      href: "/admin/match-disputes",
      color: "from-red-500 to-orange-500",
    },
    {
      id: "settings",
      title: "System Settings",
      description: "Configure platform settings and preferences",
      icon: <Settings className="w-8 h-8" />,
      href: "/admin/settings",
      color: "from-gray-500 to-gray-700",
    },
    {
      id: "vendor-approval",
      title: "Vendor Approval",
      description: "Review and approve vendor store registration applications",
      icon: <Store className="w-8 h-8" />,
      href: "/admin/vendor-approval",
      color: "from-emerald-500 to-teal-500",
    },
    {
      id: "achievements",
      title: "Achievement Management",
      description: "Create, edit, and manage achievements, badges, and user progress",
      icon: <Award className="w-8 h-8" />,
      href: "/admin/achievements",
      color: "from-purple-500 to-indigo-500",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <Navigation />
        <main className="pt-20 pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
              <p className="mt-4 text-gray-300">Loading admin dashboard...</p>
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
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                  Admin Dashboard
                </h1>
                <p className="text-gray-300">
                  Manage your E-Sport Connection platform
                </p>
              </div>
              <Link href="/admin/news">
                <button className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 transition-all duration-200 flex items-center space-x-2">
                  <Plus className="w-5 h-5" />
                  <span>Add News</span>
                </button>
              </Link>
            </div>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
          >
            {Object.entries(stats).map(([key, value], index) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6 hover:border-blue-500/50 transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm font-medium capitalize">
                      {key}
                    </p>
                    <p className="text-2xl font-bold text-white mt-1">
                      {value.total}
                    </p>
                    <p className="text-green-400 text-sm mt-1">
                      +{value.new} new
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg flex items-center justify-center">
                    {key === "news" && (
                      <Newspaper className="w-6 h-6 text-blue-400" />
                    )}
                    {key === "users" && (
                      <Users className="w-6 h-6 text-green-400" />
                    )}
                    {key === "tournaments" && (
                      <Trophy className="w-6 h-6 text-purple-400" />
                    )}
                    {key === "profiles" && (
                      <Shield className="w-6 h-6 text-orange-400" />
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Admin Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {adminCards.map((card, index) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="group"
              >
                <Link href={card.href}>
                  <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6 hover:border-blue-500/50 transition-all duration-300 h-full group-hover:scale-105">
                    <div className="flex items-start space-x-4">
                      <div
                        className={`w-16 h-16 bg-gradient-to-r ${card.color} rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300`}
                      >
                        {card.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors duration-200">
                          {card.title}
                        </h3>
                        <p className="text-gray-400 text-sm mb-4">
                          {card.description}
                        </p>
                        {card.stats && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">
                              Total: {card.stats.total}
                            </span>
                            <span className="text-green-400">
                              +{card.stats.new} new
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-12"
          >
            <h2 className="text-2xl font-bold text-white mb-6">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Link href="/admin/news">
                <button className="w-full p-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 flex items-center justify-center space-x-2">
                  <Plus className="w-5 h-5" />
                  <span>Create News Article</span>
                </button>
              </Link>
              <Link href="/admin/tournaments">
                <button className="w-full p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200 flex items-center justify-center space-x-2">
                  <Trophy className="w-5 h-5" />
                  <span>Create Tournament</span>
                </button>
              </Link>
              <Link href="/admin/users">
                <button className="w-full p-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 transition-all duration-200 flex items-center justify-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Manage Users</span>
                </button>
              </Link>
              <Link href="/admin/vendor-approval">
                <button className="w-full p-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 flex items-center justify-center space-x-2">
                  <Store className="w-5 h-5" />
                  <span>Review Vendors</span>
                </button>
              </Link>
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12"
          >
            <h2 className="text-2xl font-bold text-white mb-6">
              Recent Activity
            </h2>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center space-x-4 p-3 bg-gray-700/30 rounded-lg"
                    >
                      <div
                        className={`w-8 h-8 ${activity.color} rounded-full flex items-center justify-center`}
                      >
                        {activity.icon}
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-sm">{activity.title}</p>
                        <p className="text-gray-400 text-xs">
                          {activity.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">No recent activity</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
