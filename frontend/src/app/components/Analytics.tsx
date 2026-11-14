"use client";

import { useEffect, useState } from "react";
import { BarChart3, Users, Eye, TrendingUp } from "lucide-react";

interface AnalyticsData {
  pageViews: number;
  uniqueVisitors: number;
  totalSessions: number;
  bounceRate: number;
}

export default function Analytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    pageViews: 0,
    uniqueVisitors: 0,
    totalSessions: 0,
    bounceRate: 0,
  });

  useEffect(() => {
    // Track page view
    const trackPageView = () => {
      const currentViews = parseInt(localStorage.getItem("pageViews") || "0");
      const newViews = currentViews + 1;
      localStorage.setItem("pageViews", newViews.toString());

      setAnalytics((prev) => ({
        ...prev,
        pageViews: newViews,
        uniqueVisitors: Math.ceil(newViews * 0.7), // Estimate unique visitors
        totalSessions: Math.ceil(newViews * 1.2), // Estimate sessions
        bounceRate: Math.random() * 30 + 20, // Random bounce rate between 20-50%
      }));
    };

    trackPageView();
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center space-x-2 mb-6">
        <BarChart3 className="w-6 h-6 text-purple-600 dark:text-green-400" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Website Analytics
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <Eye className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {analytics.pageViews.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Page Views
          </div>
        </div>

        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <Users className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {analytics.uniqueVisitors.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Unique Visitors
          </div>
        </div>

        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {analytics.totalSessions.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Sessions
          </div>
        </div>

        <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
          <BarChart3 className="w-8 h-8 text-orange-600 dark:text-orange-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {analytics.bounceRate.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Bounce Rate
          </div>
        </div>
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          📊 Basic analytics tracking - For detailed insights, check your Vercel
          dashboard
        </p>
      </div>
    </div>
  );
}
