"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  User,
  Clock,
  Tag,
  Share2,
  Edit,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";
import { API_ENDPOINTS } from "../../../config/api";
import { handleImageError, getImageUrl } from "../../../utils/imageUtils";

interface NewsItem {
  _id: string;
  title: string;
  description: string;
  content: string;
  image: string;
  type: "update" | "player" | "tournament" | "winner" | "feature";
  category: string;
  author: string;
  featured: boolean;
  readTime: string;
  tags: string[];
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

export default function NewsDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [news, setNews] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin] = useState(true); // This should be replaced with actual admin check

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          API_ENDPOINTS.NEWS.GET(params.id as string)
        );
        const data = await response.json();

        if (data.success) {
          setNews(data.news);
        } else {
          setError("News article not found");
        }
      } catch (error) {
        console.error("Error fetching news:", error);
        setError("Failed to load news article");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchNews();
    }
  }, [params.id]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this news article?")) {
      return;
    }

    try {
      const response = await fetch(
        API_ENDPOINTS.NEWS.GET(params.id as string),
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        router.push("/news");
      } else {
        alert("Failed to delete news article");
      }
    } catch (error) {
      console.error("Error deleting news:", error);
      alert("Error deleting news article");
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "update":
        return "🎮";
      case "tournament":
        return "🏆";
      case "player":
        return "👤";
      case "winner":
        return "⭐";
      case "feature":
        return "🚀";
      default:
        return "📰";
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
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
              <p className="mt-4 text-gray-300">Loading news article...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !news) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <Navigation />
        <main className="pt-20 pb-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold text-white mb-4">
                {error || "News article not found"}
              </h1>
              <p className="text-gray-400 mb-6">
                The news article you&apos;re looking for doesn&apos;t exist or
                has been removed.
              </p>
              <Link
                href="/news"
                className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors duration-200"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to News</span>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <Navigation />

      <main className="pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6"
          >
            <Link
              href="/news"
              className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to News</span>
            </Link>
          </motion.div>

          {/* Article Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="flex items-center space-x-2 mb-4">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium border ${getTypeColor(
                  news.type
                )}`}
              >
                {getTypeIcon(news.type)} {news.category}
              </span>
              {news.featured && (
                <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-full text-sm font-medium">
                  Featured
                </span>
              )}
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              {news.title}
            </h1>

            <p className="text-xl text-gray-300 mb-6 leading-relaxed">
              {news.description}
            </p>

            <div className="flex items-center space-x-6 text-gray-400 mb-6">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>{news.author}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>{new Date(news.publishedAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>{news.readTime}</span>
              </div>
            </div>

            {/* Admin Actions */}
            {isAdmin && (
              <div className="flex items-center space-x-4 mb-6">
                <Link
                  href={`/admin/news?edit=${news._id}`}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-colors duration-200"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </Link>
                <button
                  onClick={handleDelete}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors duration-200"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </motion.div>

          {/* Featured Image */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="relative w-full h-96 rounded-2xl overflow-hidden">
              <Image
                src={getImageUrl(news.image)}
                alt={news.title}
                fill
                className="object-cover"
                onError={handleImageError}
              />
            </div>
          </motion.div>

          {/* Article Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="prose prose-lg prose-invert max-w-none"
          >
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-8">
              <div
                className="text-gray-300 leading-relaxed space-y-6"
                dangerouslySetInnerHTML={{
                  __html: news.content.replace(/\n/g, "<br>"),
                }}
              />
            </div>
          </motion.div>

          {/* Tags */}
          {news.tags && news.tags.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-8"
            >
              <div className="flex items-center space-x-2 mb-4">
                <Tag className="w-5 h-5 text-gray-400" />
                <h3 className="text-lg font-semibold text-white">Tags</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {news.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-700/50 text-gray-300 border border-gray-600/50 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          {/* Share Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12 pt-8 border-t border-gray-700/50"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Share this article
                </h3>
                <p className="text-gray-400 text-sm">
                  Help spread the word about this news
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <button className="p-3 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-colors duration-200">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
