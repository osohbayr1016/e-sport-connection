"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Calendar,
  User,
  Trophy,
  Gamepad2,
  ArrowRight,
  Star,
  TrendingUp,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import { API_ENDPOINTS } from "../../config/api";
import { handleImageError, getImageUrl } from "../../utils/imageUtils";

interface NewsItem {
  _id?: string;
  id?: string;
  type: "update" | "player" | "tournament" | "winner" | "feature";
  title: string;
  description: string;
  image: string;
  publishedAt?: string;
  date?: string;
  author?: string;
  featured?: boolean;
  category: string;
  readTime: string;
}

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [featuredNews, setFeaturedNews] = useState<NewsItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([
    "All",
    "Game Updates",
    "E-Sport",
    "Other",
  ]);
  const [error, setError] = useState<string | null>(null);

  // Fetch news data
  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to fetch from API first
        try {
          // Fetch all news
          const newsResponse = await fetch(API_ENDPOINTS.NEWS.ALL, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (newsResponse.ok) {
            const newsData = await newsResponse.json();
            if (newsData.success && newsData.news) {
              setNews(newsData.news);
              } else {
              throw new Error("Invalid API response format");
            }
          } else {
            throw new Error(
              `API responded with status: ${newsResponse.status}`
            );
          }

          // Fetch featured news
          try {
            const featuredResponse = await fetch(API_ENDPOINTS.NEWS.FEATURED, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            });

            if (featuredResponse.ok) {
              const featuredData = await featuredResponse.json();
              if (
                featuredData.success &&
                featuredData.news &&
                featuredData.news.length > 0
              ) {
                setFeaturedNews(featuredData.news[0]);
                }
            }
          } catch (featuredError) {
            }

          // Fetch categories
          try {
            const categoriesResponse = await fetch(
              API_ENDPOINTS.NEWS.CATEGORIES,
              {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                },
              }
            );

            if (categoriesResponse.ok) {
              const categoriesData = await categoriesResponse.json();
              if (categoriesData.success && categoriesData.categories) {
                setCategories(["All", ...categoriesData.categories]);
                }
            }
          } catch (categoriesError) {
            }
        } catch (apiError) {
          // API failed, show empty state
          setNews([]);
          setFeaturedNews(null);
          setCategories(["All", "Game Updates", "E-Sport", "Other"]);
          setError("Failed to load news. Please try again later.");
        }
      } catch (error) {
        console.error("❌ Error fetching news:", error);
        setError("Failed to load news. Please try again later.");
        // Show empty state on error
        setNews([]);
        setFeaturedNews(null);
        setCategories(["All", "Game Updates", "E-Sport", "Other"]);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  const filteredNews = news.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "update":
        return <Gamepad2 className="w-4 h-4" />;
      case "tournament":
        return <Trophy className="w-4 h-4" />;
      case "player":
        return <User className="w-4 h-4" />;
      case "winner":
        return <Star className="w-4 h-4" />;
      case "feature":
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <Gamepad2 className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "update":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "tournament":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "player":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "winner":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "feature":
        return "bg-pink-500/20 text-pink-400 border-pink-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <Navigation />
        <main className="pt-20 pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
              <p className="mt-4 text-gray-300">Loading news...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5"></div>
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>

      <Navigation />

      <main className="pt-20 pb-16 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              E-Sport Connection
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl">
              Stay updated with the latest gaming news, tournaments, and updates
            </p>
          </motion.div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
            >
              <p className="text-red-400 text-sm">{error}</p>
            </motion.div>
          )}

          {/* Search and Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-between mb-8"
          >
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 pl-10 pr-4 py-2 bg-gray-800/50 border border-blue-500/30 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-lg"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 bg-gray-800/50 border border-blue-500/30 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-lg"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </motion.div>

          {/* Featured Story */}
          {featuredNews && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-12"
            >
              <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-2xl border-2 border-blue-500/50 p-8 backdrop-blur-sm shadow-2xl shadow-blue-500/20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  {/* Image */}
                  <div className="relative">
                    <Image
                      src={getImageUrl(featuredNews.image)}
                      alt={featuredNews.title}
                      width={500}
                      height={300}
                      className="rounded-xl object-cover w-full h-64 lg:h-80 shadow-lg"
                      onError={handleImageError}
                    />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-blue-500/90 text-white text-xs font-semibold rounded-full backdrop-blur-sm border border-blue-400/50">
                        FEATURED STORY
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${getTypeColor(
                          featuredNews.type
                        )}`}
                      >
                        {getTypeIcon(featuredNews.type)}
                        <span className="ml-1">{featuredNews.category}</span>
                      </span>
                      <span className="text-gray-400 text-sm">
                        {featuredNews.readTime}
                      </span>
                    </div>

                    <h2 className="text-3xl font-bold text-white leading-tight">
                      {featuredNews.title}
                    </h2>

                    <p className="text-gray-300 leading-relaxed">
                      {featuredNews.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(
                              featuredNews.date ||
                                featuredNews.publishedAt ||
                                ""
                            ).toLocaleDateString()}
                          </span>
                        </div>
                        {featuredNews.author && (
                          <div className="flex items-center space-x-1">
                            <User className="w-4 h-4" />
                            <span>{featuredNews.author}</span>
                          </div>
                        )}
                      </div>

                      <Link
                        href={`/news/${featuredNews._id || featuredNews.id}`}
                        className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 transition-all duration-200 transform hover:scale-105 shadow-lg"
                      >
                        Read More
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* News Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredNews.map((item, index) => (
                <motion.div
                  key={item.id || item._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700/30 overflow-hidden hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300 group"
                >
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={getImageUrl(item.image)}
                      alt={item.title}
                      width={300}
                      height={200}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={handleImageError}
                    />
                    <div className="absolute top-3 left-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium border backdrop-blur-sm ${getTypeColor(
                          item.type
                        )}`}
                      >
                        {getTypeIcon(item.type)}
                        <span className="ml-1">{item.category}</span>
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-3">
                    <h3 className="text-lg font-semibold text-white line-clamp-2 group-hover:text-blue-400 transition-colors duration-200">
                      {item.title}
                    </h3>

                    <p className="text-gray-400 text-sm line-clamp-3">
                      {item.description}
                    </p>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {new Date(
                            item.date || item.publishedAt || ""
                          ).toLocaleDateString()}
                        </span>
                        <span>•</span>
                        <span>{item.readTime}</span>
                      </div>

                      <Link
                        href={`/news/${item._id || item.id}`}
                        className="text-blue-400 hover:text-blue-300 transition-colors duration-200"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* No Results */}
            {filteredNews.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Search className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  No news found
                </h3>
                <p className="text-gray-400">
                  Try adjusting your search terms or category filter
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
