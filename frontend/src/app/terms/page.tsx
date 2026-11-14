"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

export default function TermsPage() {
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
              <FileText className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                Terms of Service
              </h1>
              <p className="text-gray-400">Last updated: December 2024</p>
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">
                1. Acceptance of Terms
              </h2>
              <p className="text-gray-300 leading-relaxed">
                By accessing and using the Standoff 2 Competitive Hub, you agree
                to be bound by these Terms of Service. If you do not agree to
                these terms, please do not use our services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">
                2. User Accounts
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                To use certain features, you must create an account. You are
                responsible for:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                <li>Maintaining the security of your account</li>
                <li>All activities that occur under your account</li>
                <li>Providing accurate and complete information</li>
                <li>Keeping your login credentials confidential</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">
                3. Fair Play
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                Users must maintain fair play standards:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                <li>No cheating, hacking, or exploiting bugs</li>
                <li>No abusive behavior towards other players</li>
                <li>No match manipulation or result fixing</li>
                <li>Respect all players regardless of skill level</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">
                4. Rewards and ELO
              </h2>
              <p className="text-gray-300 leading-relaxed">
                ELO ratings and rewards are earned through legitimate gameplay.
                Any attempt to manipulate rankings through unfair means may
                result in account suspension or permanent ban.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">
                5. Termination
              </h2>
              <p className="text-gray-300 leading-relaxed">
                We reserve the right to suspend or terminate accounts that
                violate these terms. Users may also delete their accounts at any
                time through the settings page.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                6. Contact
              </h2>
              <p className="text-gray-300 leading-relaxed">
                For questions about these terms, contact us at{" "}
                <a
                  href="mailto:support@standoff2hub.com"
                  className="text-orange-500 hover:underline"
                >
                  support@standoff2hub.com
                </a>
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

