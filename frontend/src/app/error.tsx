"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-purple-900 flex items-center justify-center px-4">
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <AlertTriangle className="w-24 h-24 text-red-500 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white mb-4">Алдаа гарлаа</h1>
          <p className="text-lg text-gray-300 mb-4 max-w-md mx-auto">
            Уучлаарай, алдаа гарлаа. Дахин оролдоно уу.
          </p>
          {process.env.NODE_ENV === "development" && (
            <details className="text-left bg-black bg-opacity-50 p-4 rounded-lg mt-4">
              <summary className="text-red-400 cursor-pointer mb-2">
                Алдааны дэлгэрэнгүй мэдээлэл
              </summary>
              <pre className="text-red-300 text-sm overflow-auto">
                {error.message}
              </pre>
            </details>
          )}
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          onClick={reset}
          className="inline-flex items-center justify-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
        >
          <RefreshCw className="w-5 h-5 mr-2" />
          Дахин оролдох
        </motion.button>
      </div>
    </div>
  );
}
