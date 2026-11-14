"use client";

import { motion } from "framer-motion";
import PageTransition from "../components/PageTransition";
import DivisionCoinImage from "../../components/DivisionCoinImage";
import { SquadDivision } from "../../types/division";

export default function DivisionCoinsDemoPage() {
  const divisions = [
    {
      division: SquadDivision.SILVER,
      name: "Silver Division",
      description: "0-250 Bounty Coins",
    },
    {
      division: SquadDivision.GOLD,
      name: "Gold Division",
      description: "0-750 Bounty Coins",
    },
    {
      division: SquadDivision.DIAMOND,
      name: "Diamond Division",
      description: "0+ Bounty Coins",
    },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">
              Division-Specific Coin Images
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Each division now has its own unique coin image. Silver division
              uses the new silver coin, Gold division uses the default gold
              coin, and Diamond division uses the diamond coin.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {divisions.map((div, index) => (
              <motion.div
                key={div.division}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-8 text-center"
              >
                <div className="mb-6">
                  <DivisionCoinImage
                    division={div.division}
                    size={120}
                    showGlow={true}
                  />
                </div>

                <h3 className="text-2xl font-bold text-white mb-2">
                  {div.name}
                </h3>

                <p className="text-gray-300 mb-4">{div.description}</p>

                <div className="space-y-3">
                  <div className="flex justify-center">
                    <DivisionCoinImage division={div.division} size={48} />
                  </div>

                  <div className="flex justify-center">
                    <DivisionCoinImage division={div.division} size={32} />
                  </div>

                  <div className="flex justify-center">
                    <DivisionCoinImage division={div.division} size={24} />
                  </div>
                </div>

                <div className="mt-6 p-4 bg-white/5 rounded-lg">
                  <p className="text-sm text-gray-400">
                    <strong>Coin Image URL:</strong>
                  </p>
                  <p className="text-xs text-gray-500 break-all mt-1">
                    {div.division === SquadDivision.SILVER
                      ? "Silver coin (Gemini generated)"
                      : div.division === SquadDivision.GOLD
                      ? "Default gold coin"
                      : "Diamond division coin"}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">
              Implementation Details
            </h2>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6 max-w-4xl mx-auto">
              <div className="text-left space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Division Service Updates
                  </h3>
                  <p className="text-gray-300">
                    Added{" "}
                    <code className="bg-white/20 px-2 py-1 rounded">
                      getDivisionCoinImage()
                    </code>{" "}
                    method to return division-specific coin URLs.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    DivisionCoinImage Component
                  </h3>
                  <p className="text-gray-300">
                    Created a reusable component that automatically displays the
                    correct coin image based on the division, with optional glow
                    effects and customizable sizes.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Updated Pages
                  </h3>
                  <p className="text-gray-300">
                    Bounty Coins page, Squad detail page, and Admin match
                    results page now use division-specific coin images instead
                    of hardcoded URLs.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
