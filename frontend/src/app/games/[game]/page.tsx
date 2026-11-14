"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function GamePage() {
  const router = useRouter();
  const params = useParams();
  const gameId = params.game as string;

  useEffect(() => {
    // Redirect mobile-legends to players page
    if (gameId === "mobile-legends") {
      router.replace("/players");
    }
  }, [gameId, router]);

  // If it's mobile-legends, show redirect message while redirecting
  if (gameId === "mobile-legends") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 dark:from-green-400 dark:to-blue-400 rounded-full mx-auto mb-4 flex items-center justify-center">
              <ArrowRight className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Redirecting...
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Mobile Legends page has been moved to Players page
            </p>
          </div>

          <Link
            href="/players"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 dark:from-green-400 dark:to-blue-400 text-white font-semibold rounded-lg hover:from-purple-500 hover:to-pink-500 dark:hover:from-green-500 dark:hover:to-blue-500 transition-all duration-300 transform hover:scale-105"
          >
            <span>Go to Players Page</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </div>
    );
  }

  // For other games, show game not found
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <main className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Game not found
            </h1>
            <Link
              href="/players"
              className="text-purple-600 dark:text-green-400 hover:underline"
            >
              Back to Players
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
