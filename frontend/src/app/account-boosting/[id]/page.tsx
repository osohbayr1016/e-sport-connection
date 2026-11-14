"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { ProPlayer } from "@/types/proPlayer";
import proPlayerApi from "@/config/proPlayerApi";
import {
  StarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  TrophyIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/solid";
import { StarIcon as StarOutlineIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

export default function ProPlayerDetailPage() {
  const params = useParams();
  const [proPlayer, setProPlayer] = useState<ProPlayer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (params.id) {
      fetchProPlayer(params.id as string);
    }
  }, [params.id]);

  const fetchProPlayer = async (id: string) => {
    try {
      setLoading(true);
      const player = await proPlayerApi.getProPlayer(id);
      setProPlayer(player);
      setError("");
    } catch (err) {
      setError("Failed to load pro player details. Please try again.");
      console.error("Error fetching pro player:", err);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i}>
          {i <= rating ? (
            <StarIcon className="w-5 h-5 text-yellow-400 inline" />
          ) : (
            <StarOutlineIcon className="w-5 h-5 text-gray-300 inline" />
          )}
        </span>
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-white mt-4 text-lg">
              Loading pro player details...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !proPlayer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="bg-red-600/20 border border-red-500/30 rounded-lg p-8 max-w-md mx-auto">
              <p className="text-red-200 text-lg mb-4">
                {error || "Pro player not found"}
              </p>
              <Link
                href="/account-boosting"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
              >
                Back to Account Boosting
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      {/* Back Button */}
      <div className="container mx-auto px-4 py-6">
        <Link
          href="/account-boosting"
          className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Back to Account Boosting
        </Link>
      </div>

      <div className="container mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Player Header Card */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-8 mb-8">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-3xl">
                  {proPlayer.userId.avatar ? (
                    <Image
                      src={proPlayer.userId.avatar}
                      alt={proPlayer.userId.name}
                      width={96}
                      height={96}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span>{proPlayer.userId.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-white">
                      {proPlayer.userId.name}
                    </h1>
                    <div className="flex items-center bg-green-600/20 border border-green-500/30 rounded-full px-3 py-1">
                      <CheckCircleIcon className="w-4 h-4 text-green-400 mr-1" />
                      <span className="text-green-200 text-sm font-medium">
                        Verified Pro
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center mb-3">
                    {renderStars(proPlayer.rating)}
                    <span className="text-gray-400 ml-3 text-lg">
                      {proPlayer.rating.toFixed(1)} ({proPlayer.totalReviews}{" "}
                      reviews)
                    </span>
                  </div>

                  {proPlayer.userId.bio && (
                    <p className="text-gray-300 text-lg">
                      {proPlayer.userId.bio}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Game Details Card */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-8 mb-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <TrophyIcon className="w-6 h-6 text-yellow-400 mr-3" />
                Game & Boosting Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-blue-400 mb-3">
                    Game Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Game:</span>
                      <span className="text-white font-medium">
                        {proPlayer.game}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Current Rank:</span>
                      <span className="text-white font-medium">
                        {proPlayer.currentRank}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Target Rank:</span>
                      <span className="text-white font-medium">
                        {proPlayer.targetRank}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Price:</span>
                      <span className="text-green-400 font-bold text-lg">
                        ${proPlayer.price}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-green-400 mb-3">
                    Boosting Stats
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Total Boosts:</span>
                      <span className="text-white font-medium">
                        {proPlayer.totalBoosts}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Successful:</span>
                      <span className="text-white font-medium">
                        {proPlayer.successfulBoosts}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Success Rate:</span>
                      <span className="text-white font-medium">
                        {proPlayer.totalBoosts > 0
                          ? `${(
                              (proPlayer.successfulBoosts /
                                proPlayer.totalBoosts) *
                              100
                            ).toFixed(1)}%`
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Estimated Time:</span>
                      <span className="text-white font-medium">
                        {proPlayer.estimatedTime}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Description Card */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                About This Service
              </h2>
              <p className="text-gray-300 text-lg leading-relaxed">
                {proPlayer.description}
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Boosting Request Card */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6 mb-6 sticky top-24">
              <h3 className="text-xl font-bold text-white mb-4">
                Request Boosting
              </h3>

              <div className="space-y-4 mb-6">
                <div className="bg-gray-700/30 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-400 mb-1">
                      ${proPlayer.price}
                    </div>
                    <div className="text-gray-400 text-sm">Total Price</div>
                  </div>
                </div>

                <div className="flex items-center text-gray-300">
                  <ClockIcon className="w-5 h-5 mr-2 text-blue-400" />
                  <span>Estimated: {proPlayer.estimatedTime}</span>
                </div>

                <div className="flex items-center text-gray-300">
                  <ShieldCheckIcon className="w-5 h-5 mr-2 text-green-400" />
                  <span>100% Secure</span>
                </div>
              </div>

              <button className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 px-6 rounded-lg font-semibold transition-colors mb-3">
                <CurrencyDollarIcon className="w-5 h-5 inline mr-2" />
                Request Boosting
              </button>

              <button className="w-full bg-gray-600 hover:bg-gray-500 text-white py-3 px-6 rounded-lg font-semibold transition-colors">
                Contact Pro Player
              </button>
            </div>

            {/* Verification Badge */}
            <div className="bg-green-600/20 border border-green-500/30 rounded-xl p-6 text-center">
              <CheckCircleIcon className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <h4 className="text-lg font-semibold text-green-200 mb-2">
                Verified Professional
              </h4>
              <p className="text-green-300 text-sm">
                This pro player has been verified and approved by our admin
                team.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
