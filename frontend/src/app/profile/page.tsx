"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Gamepad2,
  Shield,
  Sword,
  Zap,
  Monitor,
  Smartphone,
  Edit,
  Save,
  X,
  AlertCircle,
  Plus,
  Youtube,
  Twitter,
  Instagram,
  Twitch,
  MessageCircle,
  Globe,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import ImageUploader from "../components/ImageUploader";
import YouTubeVideoInput from "../components/YouTubeVideoInput";
import StreamModal from "@/components/StreamModal";

import ProtectedRoute from "../components/ProtectedRoute";
import { useAuth } from "../contexts/AuthContext";
import { API_ENDPOINTS } from "../../config/api";

interface PlayerProfile {
  id: string;
  name: string;
  avatar?: string;
  avatarPublicId?: string;
  category: "PC" | "Mobile";
  game: string;
  role: string;
  preferredRoles?: string[];
  inGameName: string;
  rank: string;
  rankStars?: number;
  experience: string;
  bio: string;
  socialLinks: {
    twitter?: string;
    instagram?: string;
    youtube?: string;
    twitch?: string;
    discord?: string;
    website?: string;
  };
  highlightVideo?: string;
  isLookingForTeam: boolean;
  mlbbId?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, getToken } = useAuth();
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState<Partial<PlayerProfile>>({});
  const [isStreamModalOpen, setIsStreamModalOpen] = useState(false);
  const [hasActiveStream, setHasActiveStream] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const token = getToken();

      if (!token) {
        console.error("No token available");
        setError("Authentication required");
        return;
      }

      const response = await fetch(API_ENDPOINTS.PLAYER_PROFILES.MY_PROFILE, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        setEditData(data.profile);
      } else if (response.status === 404) {
        router.push("/create-profile");
      } else if (response.status === 401) {
        console.error("Authentication error - invalid token");
        setError("Authentication error: Invalid token");
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Profile fetch error:", errorData);
        setError("Failed to load profile");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [getToken, router]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user, fetchProfile]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditData(profile || {});
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData(profile || {});
    setError("");
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");

      const token = localStorage.getItem("token");

      const response = await fetch(API_ENDPOINTS.PLAYER_PROFILES.UPDATE, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editData),
      });

      const data = await response.json();
      if (response.ok) {
        setProfile(data.profile);
        setIsEditing(false);
      } else {
        setError(data.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setError("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (
    field: string,
    value: string | number | string[] | undefined
  ) => {
    setEditData((prev) => {
      if (field.includes(".")) {
        const [parent, child] = field.split(".");
        const parentValue = prev[parent as keyof typeof prev] as
          | Record<string, string>
          | undefined;
        return {
          ...prev,
          [parent]: {
            ...(parentValue || {}),
            [child]: value,
          },
        };
      }
      return {
        ...prev,
        [field]: value,
      };
    });
  };

  const handleImageUpload = (url: string, publicId: string) => {
    setEditData((prev) => ({
      ...prev,
      avatar: url,
      avatarPublicId: publicId,
    }));
  };

  const handleImageRemove = () => {
    setEditData((prev) => ({
      ...prev,
      avatar: undefined,
      avatarPublicId: undefined,
    }));
  };

  const handleVideoChange = (url: string) => {
    setEditData((prev) => {
      const newData = {
        ...prev,
        highlightVideo: url,
      };
      return newData;
    });
  };

  const handleVideoRemove = () => {
    setEditData((prev) => ({
      ...prev,
      highlightVideo: undefined,
    }));
  };

  const getYouTubeVideoId = (url: string) => {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "Carry":
      case "Duelist":
      case "Assault":
      case "Fighter":
      case "ADC":
      case "DPS":
      case "Exp Laner":
        return <Sword className="w-6 h-6" />;
      case "Support":
      case "Hard Support":
      case "Sentinel":
        return <Shield className="w-6 h-6" />;
      case "Mid":
      case "Mage":
      case "Initiator":
      case "Controller":
      case "Mid Laner":
        return <Zap className="w-6 h-6" />;
      case "Core":
      case "Gold Laner":
        return <Sword className="w-6 h-6" />;
      case "Roamer":
        return <Shield className="w-6 h-6" />;
      case "Fill":
        return <Gamepad2 className="w-6 h-6" />;
      default:
        return <Gamepad2 className="w-6 h-6" />;
    }
  };

  const getCategoryIcon = (category: "PC" | "Mobile") => {
    return category === "PC" ? (
      <Monitor className="w-6 h-6" />
    ) : (
      <Smartphone className="w-6 h-6" />
    );
  };

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case "twitter":
        return <Twitter className="w-5 h-5" />;
      case "instagram":
        return <Instagram className="w-5 h-5" />;
      case "youtube":
        return <Youtube className="w-5 h-5" />;
      case "twitch":
        return <Twitch className="w-5 h-5" />;
      case "discord":
        return <MessageCircle className="w-5 h-5" />;
      case "website":
        return <Globe className="w-5 h-5" />;
      default:
        return <Globe className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <ProtectedRoute requireAuth requirePlayer requireProfile>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
          <Navigation />
          <main className="pt-20 pb-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 dark:border-green-400 mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-300">
                  Loading profile...
                </p>
              </div>
            </div>
          </main>
          <Footer />
        </div>
      </ProtectedRoute>
    );
  }

  if (!profile) {
    return (
      <ProtectedRoute requireAuth requirePlayer>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
          <Navigation />
          <main className="pt-20 pb-16">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-800/50 border border-blue-500/30 rounded-lg shadow-lg p-8 text-center"
              >
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-white mb-4">
                  Profile Not Found
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  You haven&apos;t created your player profile yet.
                </p>
                <Link
                  href="/create-profile"
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-purple-600 dark:bg-green-600 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-green-700 transition-colors duration-200"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create Profile</span>
                </Link>
              </motion.div>
            </div>
          </main>
          <Footer />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireAuth requirePlayer requireProfile>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <Navigation />

        <main className="pt-20 pb-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    My Profile
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300">
                    Manage your player profile and settings
                  </p>
                </div>
                {!isEditing ? (
                  <button
                    onClick={handleEdit}
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-purple-600 dark:bg-green-600 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-green-700 transition-colors duration-200"
                  >
                    <Edit className="w-5 h-5" />
                    <span>Edit Profile</span>
                  </button>
                ) : (
                  <div className="flex space-x-3">
                    <button
                      onClick={handleCancel}
                      className="inline-flex items-center space-x-2 px-6 py-3 border border-blue-500/30 text-gray-300 rounded-lg hover:bg-gray-600/50 transition-colors duration-200"
                    >
                      <X className="w-5 h-5" />
                      <span>Cancel</span>
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="inline-flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
              >
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="text-red-700 dark:text-red-300">
                    {error}
                  </span>
                </div>
              </motion.div>
            )}

            {/* Profile Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800/50 border border-blue-500/30 rounded-lg shadow-lg p-8 mb-8"
            >
              <div className="flex flex-col lg:flex-row items-center lg:items-start space-y-6 lg:space-y-0 lg:space-x-8">
                {/* Player Image */}
                <div className="relative">
                  {isEditing ? (
                    <ImageUploader
                      currentImage={profile.avatar}
                      onImageUpload={handleImageUpload}
                      onImageRemove={handleImageRemove}
                      className="max-w-xs"
                    />
                  ) : (
                    <Image
                      src={profile.avatar || "/default-avatar.png"}
                      alt={profile.name}
                      width={200}
                      height={200}
                      className="rounded-2xl object-cover border-4 border-white dark:border-gray-700 shadow-lg"
                    />
                  )}
                </div>

                {/* Player Info */}
                <div className="flex-1 text-center lg:text-left">
                  <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                    {profile.inGameName}
                  </h1>

                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mb-6">
                    <div className="flex items-center space-x-2">
                      {getCategoryIcon(profile.category)}
                      <span className="text-lg text-gray-600 dark:text-gray-400">
                        {profile.category}
                      </span>
                    </div>
                    <span className="text-gray-300">•</span>
                    <span className="text-lg text-gray-600 dark:text-gray-400">
                      {profile.game}
                    </span>
                    <span className="text-gray-300">•</span>
                    <div className="flex items-center space-x-2">
                      {getRoleIcon(profile.role)}
                      <span className="text-lg text-gray-600 dark:text-gray-400">
                        {profile.role}
                      </span>
                    </div>
                    {profile.preferredRoles &&
                      profile.preferredRoles.length > 0 && (
                        <>
                          <span className="text-gray-300">•</span>
                          <span className="text-sm text-gray-300">
                            Also: {profile.preferredRoles.join(", ")}
                          </span>
                        </>
                      )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-gray-300 mb-1">
                        In-Game Name
                      </h3>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.inGameName || ""}
                          onChange={(e) =>
                            handleInputChange("inGameName", e.target.value)
                          }
                          className="text-lg font-semibold text-white bg-transparent border-b border-blue-500/30 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none w-full"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-white">
                          {profile.inGameName}
                        </p>
                      )}
                    </div>
                    <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-gray-300 mb-1">
                        MLBB Game ID
                      </h3>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.mlbbId || ""}
                          onChange={(e) =>
                            handleInputChange("mlbbId", e.target.value)
                          }
                          className="text-lg font-semibold text-white bg-transparent border-b border-blue-500/30 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none w-full"
                          placeholder="Optional"
                          maxLength={20}
                        />
                      ) : (
                        <p className="text-lg font-semibold text-white">
                          {profile.mlbbId || "Not provided"}
                        </p>
                      )}
                    </div>
                    <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-gray-300 mb-1">
                        Highest Rank
                      </h3>
                      {isEditing ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editData.rank || ""}
                            onChange={(e) =>
                              handleInputChange("rank", e.target.value)
                            }
                            className="text-lg font-semibold text-purple-600 dark:text-green-400 bg-transparent border-b border-blue-500/30 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none w-full"
                          />
                          {editData.rank === "+Mythical Immortal" && (
                            <input
                              type="number"
                              min="100"
                              value={editData.rankStars || ""}
                              onChange={(e) =>
                                handleInputChange(
                                  "rankStars",
                                  parseInt(e.target.value) || undefined
                                )
                              }
                              className="text-sm text-yellow-600 dark:text-yellow-400 bg-transparent border-b border-blue-500/30 focus:border-yellow-500 outline-none w-full"
                              placeholder="Stars (100+)"
                            />
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <p className="text-lg font-semibold text-purple-600 dark:text-green-400">
                            {profile.rank}
                          </p>
                          {profile.rank === "+Mythical Immortal" &&
                            profile.rankStars && (
                              <span className="text-yellow-500 text-sm">
                                ⭐ {profile.rankStars}
                              </span>
                            )}
                        </div>
                      )}
                    </div>
                    <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-gray-300 mb-1">
                        Experience
                      </h3>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.experience || ""}
                          onChange={(e) =>
                            handleInputChange("experience", e.target.value)
                          }
                          className="text-lg font-semibold text-white bg-transparent border-b border-blue-500/30 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none w-full"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-white">
                          {profile.experience}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Preferred Roles Section - Only show in edit mode */}
                  {isEditing && (
                    <div className="mt-6">
                      <h3 className="text-sm font-medium text-gray-300 mb-3">
                        Preferred Roles (Select up to 2)
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {[
                          "Roamer",
                          "Exp Laner",
                          "Core",
                          "Mid Laner",
                          "Gold Laner",
                          "Support",
                          "Fill",
                        ].map((role) => (
                          <button
                            key={role}
                            type="button"
                            onClick={() => {
                              const currentRoles =
                                editData.preferredRoles || [];
                              if (currentRoles.includes(role)) {
                                // Remove role if already selected
                                handleInputChange(
                                  "preferredRoles",
                                  currentRoles.filter((r) => r !== role)
                                );
                              } else if (currentRoles.length < 2) {
                                // Add role if less than 2 selected
                                handleInputChange("preferredRoles", [
                                  ...currentRoles,
                                  role,
                                ]);
                              }
                            }}
                            className={`p-2 rounded-lg border-2 transition-all duration-200 text-sm ${
                              editData.preferredRoles?.includes(role)
                                ? "border-purple-500 dark:border-green-500 bg-purple-50 dark:bg-green-900/20"
                                : "border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-green-300"
                            }`}
                          >
                            {role}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-gray-300 mt-2">
                        Selected: {editData.preferredRoles?.length || 0}/2
                      </p>
                    </div>
                  )}

                  <div className="flex items-center space-x-4">
                    {profile.isLookingForTeam && (
                      <div className="inline-block px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                        Баг Хайж Байна
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Stream Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-lg shadow-lg p-8 mb-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    📺 Live Streaming
                  </h2>
                  <p className="text-gray-400">
                    {hasActiveStream
                      ? "Your stream is live!"
                      : "Promote your streaming content"}
                  </p>
                </div>
                {hasActiveStream ? (
                  <div className="flex items-center space-x-3">
                    <Link
                      href="/live-streams"
                      className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-colors flex items-center space-x-2"
                    >
                      <Twitch className="w-5 h-5" />
                      <span>View Stream</span>
                    </Link>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsStreamModalOpen(true)}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-colors flex items-center space-x-2"
                  >
                    <Twitch className="w-5 h-5" />
                    <span>Start Streaming</span>
                  </button>
                )}
              </div>
            </motion.div>

            {/* Bio Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-gray-800/50 border border-blue-500/30 rounded-lg shadow-lg p-8 mb-8"
            >
              <h2 className="text-2xl font-bold text-white mb-6">
                Bio
              </h2>
              {isEditing ? (
                <textarea
                  value={editData.bio || ""}
                  onChange={(e) => handleInputChange("bio", e.target.value)}
                  rows={4}
                  className="w-full p-3 border border-blue-500/30 rounded-lg bg-gray-800/50 border border-blue-500/30 text-white focus:ring-2 focus:ring-purple-500 dark:focus:ring-green-500 focus:border-transparent"
                  placeholder="Tell us about your gaming experience..."
                />
              ) : (
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg">
                  {profile.bio}
                </p>
              )}
            </motion.div>

            {/* Social Links Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-gray-800/50 border border-blue-500/30 rounded-lg shadow-lg p-8 mb-8"
            >
              <h2 className="text-2xl font-bold text-white mb-6">
                Social Links
              </h2>
              {isEditing ? (
                <div className="space-y-4">
                  {Object.entries({
                    twitter: "Twitter",
                    instagram: "Instagram",
                    youtube: "YouTube",
                    twitch: "Twitch",
                    discord: "Discord",
                    website: "Website",
                  }).map(([platform, label]) => (
                    <div key={platform} className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-400">
                        {getSocialIcon(platform)}
                      </div>
                      <input
                        type="text"
                        placeholder={`Your ${label} ${
                          platform === "discord" ? "username" : "URL"
                        }`}
                        value={
                          editData.socialLinks?.[
                            platform as keyof typeof editData.socialLinks
                          ] || ""
                        }
                        onChange={(e) =>
                          handleInputChange(
                            `socialLinks.${platform}`,
                            e.target.value
                          )
                        }
                        className="flex-1 p-3 border border-blue-500/30 rounded-lg bg-gray-800/50 border border-blue-500/30 text-white focus:ring-2 focus:ring-purple-500 dark:focus:ring-green-500 focus:border-transparent"
                      />
                      {(editData.socialLinks?.[
                        platform as keyof typeof editData.socialLinks
                      ] ||
                        profile.socialLinks?.[
                          platform as keyof typeof profile.socialLinks
                        ]) && (
                        <button
                          onClick={() =>
                            handleInputChange(`socialLinks.${platform}`, "")
                          }
                          className="p-2 text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors"
                          title={`Remove ${label}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      <strong>Tip:</strong> Add your social media links to help
                      other players connect with you. For Discord, you can enter
                      your username (e.g., &quot;username#1234&quot;).
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {profile.socialLinks &&
                  Object.entries(profile.socialLinks).filter(([, link]) => link)
                    .length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      {Object.entries(profile.socialLinks)
                        .filter(([, link]) => link)
                        .map(([platform, link]) => (
                          <motion.a
                            key={platform}
                            href={
                              platform === "discord"
                                ? `https://discord.com/users/${link}`
                                : link
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-col items-center space-y-2 p-4 bg-gray-700/50 border border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200 group"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <div className="text-gray-600 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-green-400 transition-colors">
                              {getSocialIcon(platform)}
                            </div>
                            <span className="text-sm font-medium text-gray-300 capitalize">
                              {platform}
                            </span>
                          </motion.a>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-gray-400 dark:text-gray-500 mb-2">
                        <Globe className="w-12 h-12 mx-auto" />
                      </div>
                      <p className="text-gray-600 dark:text-gray-400">
                        No social links added yet. Click &quot;Edit
                        Profile&quot; to add your social media links.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>

            {/* YouTube Highlight Video Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="bg-gray-800/50 border border-blue-500/30 rounded-lg shadow-lg p-8"
            >
              <h2 className="text-2xl font-bold text-white mb-6">
                Highlight Video
              </h2>
              {isEditing ? (
                <YouTubeVideoInput
                  currentVideo={profile.highlightVideo}
                  onVideoChange={handleVideoChange}
                  onVideoRemove={handleVideoRemove}
                />
              ) : (
                <>
                  {profile.highlightVideo ? (
                    <div className="space-y-4">
                      <div
                        className="relative w-full"
                        style={{ paddingBottom: "56.25%" }}
                      >
                        <iframe
                          src={`https://www.youtube.com/embed/${getYouTubeVideoId(
                            profile.highlightVideo
                          )}`}
                          title={`${profile.name} Highlight Video`}
                          className="absolute top-0 left-0 w-full h-full rounded-lg"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          YouTube Highlight Video
                        </p>
                        <a
                          href={profile.highlightVideo}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-2 text-purple-600 dark:text-green-400 hover:underline"
                        >
                          <Youtube className="w-4 h-4" />
                          <span>Watch on YouTube</span>
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Youtube className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-white mb-2">
                        No Highlight Video
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        Add a highlight video to showcase your skills.
                      </p>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </div>
        </main>

        {/* Stream Modal */}
        <StreamModal
          isOpen={isStreamModalOpen}
          onClose={() => setIsStreamModalOpen(false)}
          onStreamStarted={() => {
            setIsStreamModalOpen(false);
            setHasActiveStream(true);
            // Optionally refresh the page or show success message
            alert("Stream started successfully! It will appear on the live streams page.");
          }}
        />
      </div>
    </ProtectedRoute>
  );
}
