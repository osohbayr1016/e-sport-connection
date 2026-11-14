"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, User, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { API_ENDPOINTS } from "../../config/api";
import { safeFetch, parseJsonSafe } from "../../lib/safeFetch";
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

export default function LatestNews() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLatestNews();
  }, []);

  const fetchLatestNews = async () => {
    try {
      setIsLoading(true);
      const response = await safeFetch(`${API_ENDPOINTS.NEWS.ALL}?limit=2`, {
        retries: 2,
        retryDelayMs: 300,
        timeoutMs: 7000,
      });

      if (response.ok) {
        const data = (await parseJsonSafe(response)) || {};
        if (data.success && data.news) {
          const transformedNews = data.news
            .filter((item: any) => item && (item._id || item.id))
            .map((item: any) => ({
              _id:
                item._id ||
                item.id ||
                `fallback-${Date.now()}-${Math.random()}`,
              id: item._id || item.id,
              type: item.type || "update",
              title: item.title || "Untitled News",
              description: item.description || "No description available",
              image:
                item.image ||
                "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop",
              publishedAt: item.publishedAt || item.createdAt,
              date: item.date || item.publishedAt || item.createdAt,
              author: item.author || "E-Sport Connection",
              featured: item.featured || false,
              category: item.category || "General",
              readTime: item.readTime || "2 min read",
            }));

          setNews(transformedNews);
        }
      }
    } catch (error) {
      console.error("Error fetching latest news:", error);
      setNews([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {[1, 2].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-[16/9] rounded-2xl bg-gray-800"></div>
          </div>
        ))}
      </div>
    );
  }

  if (news.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {news.map((item, index) => (
        <motion.div
          key={item._id || item.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="aspect-[16/9] rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-purple-600/20 to-blue-600/20 shadow-xl relative group cursor-pointer"
        >
          <Link href={`/news/${item._id || item.id}`} className="block h-full">
            {/* Background Image */}
            <div className="absolute inset-0">
              <Image
                src={getImageUrl(item.image)}
                alt={item.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                onError={handleImageError}
              />
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-blue-900/30 to-black/60"></div>
            </div>

            {/* Content */}
            <div className="absolute inset-0 flex flex-col justify-end p-6">
              <div className="text-white">
                {/* Category Badge */}
                <div className="inline-flex items-center space-x-2 mb-3">
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium border border-white/30">
                    {item.category}
                  </span>
                  <span className="text-white/70 text-xs">{item.readTime}</span>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold mb-2 line-clamp-2 group-hover:text-blue-300 transition-colors">
                  {item.title}
                </h3>

                {/* Description */}
                <p className="text-white/80 text-sm mb-4 line-clamp-2">
                  {item.description}
                </p>

                {/* Meta Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-xs text-white/70">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {new Date(
                          item.date || item.publishedAt || ""
                        ).toLocaleDateString()}
                      </span>
                    </div>
                    {item.author && (
                      <div className="flex items-center space-x-1">
                        <User className="w-3 h-3" />
                        <span>{item.author}</span>
                      </div>
                    )}
                  </div>

                  <ArrowRight className="w-4 h-4 text-white/70 group-hover:text-blue-300 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
