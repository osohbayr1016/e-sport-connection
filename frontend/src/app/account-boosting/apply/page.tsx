"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CreateProPlayerRequest } from "@/types/proPlayer";
import proPlayerApi from "@/config/proPlayerApi";
import { useAuth } from "@/app/contexts/AuthContext";
import {
  TrophyIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

const mlbbRanks = [
  "Warrior",
  "Elite",
  "Master",
  "Grandmaster",
  "Epic",
  "Legend",
  "Mythic",
  "Mythical Honor",
  "Mythical Glory",
  "Mythical Immortal",
];

export default function ApplyProPlayerPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();

  // Move all useState hooks to the top before any conditional returns
  const [formData, setFormData] = useState<CreateProPlayerRequest>({
    game: "Mobile Legends: Bang Bang",
    rank: "",
    currentRank: "",
    targetRank: "",
    price: 0,
    estimatedTime: "",
    description: "",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [stars, setStars] = useState<number>(0);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, authLoading, router]);

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Don't render the form if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.rank.trim()) newErrors.rank = "Name is required";
    if (!formData.targetRank) newErrors.targetRank = "Target rank is required";
    if (formData.price <= 0) newErrors.price = "Price must be greater than 0";
    if (!formData.estimatedTime)
      newErrors.estimatedTime = "Estimated time is required";
    if (!formData.description)
      newErrors.description = "Description is required";

    // Validate stars for Mythical Immortal
    if (formData.targetRank === "Mythical Immortal" && stars < 100) {
      newErrors.targetRank = "Stars must be at least 100 for Mythical Immortal";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);

      // Format the target rank with stars if applicable
      const formattedTargetRank =
        formData.targetRank === "Mythical Immortal"
          ? `${formData.targetRank} ${stars} Stars`
          : formData.targetRank;

      const submitData = {
        ...formData,
        targetRank: formattedTargetRank,
      };

      await proPlayerApi.createProPlayer(submitData);
      setSuccess(true);

      // Redirect after 3 seconds
      setTimeout(() => {
        router.push("/account-boosting");
      }, 3000);
    } catch (err: unknown) {
      console.error("Error creating pro player profile:", err);

      // Handle authentication errors
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      if (
        errorMessage.includes("Authentication") ||
        errorMessage.includes("token")
      ) {
        alert("Please log in to submit your application.");
        router.push("/auth/login");
        return;
      }

      alert(errorMessage || "Failed to create profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    field: keyof CreateProPlayerRequest,
    value: string | number
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-12 text-center max-w-2xl mx-4">
          <CheckCircleIcon className="w-24 h-24 text-green-400 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-white mb-4">
            Application Submitted!
          </h1>
          <p className="text-gray-300 text-lg mb-6">
            Your application to become a professional MLBB player has been
            submitted successfully. Our admin team will review your application
            and get back to you soon.
          </p>
          <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-4 mb-6">
            <p className="text-blue-200 text-sm">
              You will receive an email notification once your application is
              reviewed.
            </p>
          </div>
          <p className="text-gray-400">
            Redirecting to account boosting page in a few seconds...
          </p>
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
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600/20 border border-blue-500/30 rounded-full mb-6">
              <TrophyIcon className="w-10 h-10 text-blue-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Apply to Become a Pro MLBB Player
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Join our elite team of professional Mobile Legends: Bang Bang
              players and start earning by providing account boosting services.
            </p>
          </div>

          {/* Requirements Info */}
          <div className="bg-blue-600/20 border border-blue-500/30 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-blue-200 mb-4 flex items-center">
              <ExclamationTriangleIcon className="w-6 h-6 mr-2" />
              Requirements & Process
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-100">
              <div>
                <h3 className="font-medium mb-2">What We Look For:</h3>
                <ul className="space-y-1">
                  <li>• High skill level in MLBB</li>
                  <li>• Good communication skills</li>
                  <li>• Reliable and professional attitude</li>
                  <li>• Previous boosting experience (preferred)</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium mb-2">Application Process:</h3>
                <ul className="space-y-1">
                  <li>1. Submit your application</li>
                  <li>2. Admin review (24-48 hours)</li>
                  <li>3. Approval notification</li>
                  <li>4. Start accepting boosting requests</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Application Form */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Game Selection - Auto-filled */}
              <div>
                <label className="block text-white font-medium mb-2">
                  Game <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value="Mobile Legends: Bang Bang"
                  disabled
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white opacity-75 cursor-not-allowed"
                />
                <p className="text-gray-400 text-sm mt-1">
                  Currently accepting MLBB players only
                </p>
              </div>

              {/* Name and Target Rank */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-medium mb-2">
                    Your Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.rank}
                    onChange={(e) => handleInputChange("rank", e.target.value)}
                    className={`w-full bg-gray-700 border rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.rank ? "border-red-500" : "border-gray-600"
                    }`}
                    placeholder="Enter your name"
                  />
                  {errors.rank && (
                    <p className="text-red-400 text-sm mt-1">{errors.rank}</p>
                  )}
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">
                    Target Rank <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={formData.targetRank}
                    onChange={(e) =>
                      handleInputChange("targetRank", e.target.value)
                    }
                    className={`w-full bg-gray-700 border rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.targetRank ? "border-red-500" : "border-gray-600"
                    }`}
                  >
                    <option value="">Select target rank</option>
                    {mlbbRanks.map((rank) => (
                      <option key={rank} value={rank}>
                        {rank}
                      </option>
                    ))}
                  </select>
                  {errors.targetRank && (
                    <p className="text-red-400 text-sm mt-1">
                      {errors.targetRank}
                    </p>
                  )}
                </div>
              </div>

              {/* Stars for Mythical Immortal */}
              {(formData.rank === "Mythical Immortal" ||
                formData.targetRank === "Mythical Immortal") && (
                <div>
                  <label className="block text-white font-medium mb-2">
                    Stars (for Mythical Immortal){" "}
                    <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="100"
                    value={stars}
                    onChange={(e) => setStars(Number(e.target.value))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter number of stars (minimum 100)"
                  />
                  <p className="text-gray-400 text-sm mt-1">
                    Enter the number of stars for Mythical Immortal rank
                    (minimum 100)
                  </p>
                </div>
              )}

              {/* Price and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-medium mb-2">
                    1 Star Price (MNT) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.price}
                    onChange={(e) =>
                      handleInputChange("price", Number(e.target.value))
                    }
                    className={`w-full bg-gray-700 border rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.price ? "border-red-500" : "border-gray-600"
                    }`}
                    placeholder="Enter price per star in USD"
                  />
                  {errors.price && (
                    <p className="text-red-400 text-sm mt-1">{errors.price}</p>
                  )}
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">
                    Estimated Time <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.estimatedTime}
                    onChange={(e) =>
                      handleInputChange("estimatedTime", e.target.value)
                    }
                    className={`w-full bg-gray-700 border rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.estimatedTime
                        ? "border-red-500"
                        : "border-gray-600"
                    }`}
                    placeholder="e.g., 2-3 days, 1 week"
                  />
                  {errors.estimatedTime && (
                    <p className="text-red-400 text-sm mt-1">
                      {errors.estimatedTime}
                    </p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-white font-medium mb-2">
                  Service Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  rows={6}
                  className={`w-full bg-gray-700 border rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.description ? "border-red-500" : "border-gray-600"
                  }`}
                  placeholder="Describe your boosting service, experience, and what makes you a great choice for customers."
                />
                {errors.description && (
                  <p className="text-red-400 text-sm mt-1">
                    {errors.description}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-4 px-8 rounded-lg font-semibold text-lg transition-colors"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Submitting Application...
                    </div>
                  ) : (
                    "Submit Application"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
