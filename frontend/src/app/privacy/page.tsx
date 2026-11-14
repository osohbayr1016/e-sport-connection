"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-[#1a1d29] to-[#252836] rounded-2xl border border-orange-500/20 p-8 md:p-12"
        >
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
              <p className="text-gray-400">Last updated: December 2024</p>
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">
                1. Information We Collect
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                We collect information you provide directly:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                <li>Account information (username, email)</li>
                <li>Profile data (in-game name, rank, bio)</li>
                <li>Match history and statistics</li>
                <li>Communications with our support team</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">
                2. How We Use Your Information
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                Your information is used to:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                <li>Provide and improve our services</li>
                <li>Match you with other players</li>
                <li>Calculate and display leaderboard rankings</li>
                <li>Send important service updates</li>
                <li>Prevent fraud and ensure fair play</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">
                3. Data Security
              </h2>
              <p className="text-gray-300 leading-relaxed">
                We implement industry-standard security measures to protect your
                data. This includes encryption, secure servers, and regular
                security audits. However, no method of transmission over the
                Internet is 100% secure.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">
                4. Data Sharing
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                We do not sell your personal data. We may share data:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                <li>With your consent</li>
                <li>To comply with legal obligations</li>
                <li>To protect our rights and safety</li>
                <li>With service providers who assist our operations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">
                5. Your Rights
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                You have the right to:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Export your data</li>
                <li>Opt-out of marketing communications</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">
                6. Cookies
              </h2>
              <p className="text-gray-300 leading-relaxed">
                We use cookies to improve your experience, remember your
                preferences, and analyze site traffic. You can control cookies
                through your browser settings.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                7. Contact Us
              </h2>
              <p className="text-gray-300 leading-relaxed">
                For privacy-related questions, contact us at{" "}
                <a
                  href="mailto:privacy@standoff2hub.com"
                  className="text-orange-500 hover:underline"
                >
                  privacy@standoff2hub.com
                </a>
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

