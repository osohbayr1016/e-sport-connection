"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import ProtectedRoute from "../components/ProtectedRoute";
import ImageUploader from "../components/ImageUploader";
import {
  Building,
  Gamepad2,
  Trophy,
  Edit3,
  Save,
  X,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface OrganizationProfile {
  _id: string;
  userId: string;
  organizationName: string;
  description: string;
  logo?: string;
  logoPublicId?: string;
  website?: string;
  location?: string;
  foundedYear?: number;
  teamSize?: number;
  games: string[];
  achievements: string[];
  socialMedia: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
    twitch?: string;
  };
  contactInfo: {
    email: string;
    phone?: string;
    address?: string;
  };
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function OrganizationProfilePage() {
  const router = useRouter();
  const { user, hasProfile } = useAuth();
  const [profile, setProfile] = useState<OrganizationProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentGame, setCurrentGame] = useState("");
  const [currentAchievement, setCurrentAchievement] = useState("");

  const [formData, setFormData] = useState({
    organizationName: "",
    description: "",
    logo: "",
    logoPublicId: "",
    website: "",
    location: "",
    foundedYear: "",
    teamSize: "",
    games: [] as string[],
    achievements: [] as string[],
    socialMedia: {
      facebook: "",
      twitter: "",
      instagram: "",
      youtube: "",
      twitch: "",
    },
    contactInfo: {
      email: "",
      phone: "",
      address: "",
    },
  });

  useEffect(() => {
    if (user && !hasProfile) {
      router.push("/create-organization-profile");
      return;
    }

    if (user && hasProfile) {
      fetchProfile();
    }
  }, [user, hasProfile, router]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch("/api/organization-profiles/my-profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }

      const data = await response.json();
      setProfile(data.organization);

      // Initialize form data
      setFormData({
        organizationName: data.organization.organizationName || "",
        description: data.organization.description || "",
        logo: data.organization.logo || "",
        logoPublicId: data.organization.logoPublicId || "",
        website: data.organization.website || "",
        location: data.organization.location || "",
        foundedYear: data.organization.foundedYear?.toString() || "",
        teamSize: data.organization.teamSize?.toString() || "",
        games: data.organization.games || [],
        achievements: data.organization.achievements || [],
        socialMedia: {
          facebook: data.organization.socialMedia?.facebook || "",
          twitter: data.organization.socialMedia?.twitter || "",
          instagram: data.organization.socialMedia?.instagram || "",
          youtube: data.organization.socialMedia?.youtube || "",
          twitch: data.organization.socialMedia?.twitch || "",
        },
        contactInfo: {
          email: data.organization.contactInfo?.email || "",
          phone: data.organization.contactInfo?.phone || "",
          address: data.organization.contactInfo?.address || "",
        },
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      setError("Профайл татахад алдаа гарлаа");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [section, field] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [section]: {
          ...(prev[section as keyof typeof formData] as Record<
            string,
            unknown
          >),
          [field]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleImageUpload = (url: string, publicId: string) => {
    setFormData((prev) => ({
      ...prev,
      logo: url,
      logoPublicId: publicId,
    }));
  };

  const handleImageRemove = () => {
    setFormData((prev) => ({
      ...prev,
      logo: "",
      logoPublicId: "",
    }));
  };

  const addGame = () => {
    if (currentGame.trim() && !formData.games.includes(currentGame.trim())) {
      setFormData((prev) => ({
        ...prev,
        games: [...prev.games, currentGame.trim()],
      }));
      setCurrentGame("");
    }
  };

  const removeGame = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      games: prev.games.filter((_, i) => i !== index),
    }));
  };

  const addAchievement = () => {
    if (
      currentAchievement.trim() &&
      !formData.achievements.includes(currentAchievement.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        achievements: [...prev.achievements, currentAchievement.trim()],
      }));
      setCurrentAchievement("");
    }
  };

  const removeAchievement = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      achievements: prev.achievements.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(
        "/api/organization-profiles/update-profile",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update profile");
      }

      setSuccess("Профайл амжилттай шинэчлэгдлээ!");
      setProfile(data.organization);
      setIsEditing(false);

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Профайл шинэчлэхэд алдаа гарлаа"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        organizationName: profile.organizationName || "",
        description: profile.description || "",
        logo: profile.logo || "",
        logoPublicId: profile.logoPublicId || "",
        website: profile.website || "",
        location: profile.location || "",
        foundedYear: profile.foundedYear?.toString() || "",
        teamSize: profile.teamSize?.toString() || "",
        games: profile.games || [],
        achievements: profile.achievements || [],
        socialMedia: {
          facebook: profile.socialMedia?.facebook || "",
          twitter: profile.socialMedia?.twitter || "",
          instagram: profile.socialMedia?.instagram || "",
          youtube: profile.socialMedia?.youtube || "",
          twitch: profile.socialMedia?.twitch || "",
        },
        contactInfo: {
          email: profile.contactInfo?.email || "",
          phone: profile.contactInfo?.phone || "",
          address: profile.contactInfo?.address || "",
        },
      });
    }
    setIsEditing(false);
    setError("");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="w-8 h-8 text-purple-600 dark:text-green-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Уншиж байна...</p>
        </motion.div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Профайл олдсонгүй
          </p>
          <Link
            href="/create-organization-profile"
            className="px-6 py-3 bg-purple-600 dark:bg-green-600 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-green-700 transition-colors"
          >
            Профайл үүсгэх
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requireAuth requireOrganization>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center space-x-2 text-purple-600 dark:text-green-400 hover:text-purple-700 dark:hover:text-green-300 transition-colors duration-200 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Нүүр хуудас руу буцах</span>
            </Link>

            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-purple-600 dark:bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Байгууллагын профайл
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                {isEditing ? "Профайлаа засах" : "Профайлын мэдээлэл"}
              </p>
            </motion.div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-green-600 dark:text-green-400">{success}</p>
            </div>
          )}

          {/* Profile Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 lg:p-8"
          >
            {/* Edit/View Toggle */}
            <div className="flex justify-end mb-6">
              {isEditing ? (
                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-4 py-2 bg-purple-600 dark:bg-green-600 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {isSaving ? "Хадгалж байна..." : "Хадгалах"}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-purple-600 dark:bg-green-600 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  Засах
                </button>
              )}
            </div>

            {/* Basic Information */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Үндсэн мэдээлэл
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Байгууллагын нэр
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="organizationName"
                      value={formData.organizationName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white font-medium">
                      {profile.organizationName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Вэбсайт
                  </label>
                  {isEditing ? (
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">
                      {profile.website || "Тодорхойгүй"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Байршил
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">
                      {profile.location || "Тодорхойгүй"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Үүсгэсэн он
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      name="foundedYear"
                      value={formData.foundedYear}
                      onChange={handleInputChange}
                      min="1900"
                      max={new Date().getFullYear()}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">
                      {profile.foundedYear || "Тодорхойгүй"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Багийн хэмжээ
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      name="teamSize"
                      value={formData.teamSize}
                      onChange={handleInputChange}
                      min="1"
                      max="1000"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">
                      {profile.teamSize || "Тодорхойгүй"}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Тайлбар
                </label>
                {isEditing ? (
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">
                    {profile.description}
                  </p>
                )}
              </div>
            </div>

            {/* Logo */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Лого
              </h2>
              {isEditing ? (
                <ImageUploader
                  onImageUpload={handleImageUpload}
                  onImageRemove={handleImageRemove}
                  currentImage={formData.logo}
                />
              ) : (
                <div className="flex items-center space-x-4">
                  {profile.logo ? (
                    <Image
                      src={profile.logo}
                      alt="Organization Logo"
                      width={80}
                      height={80}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <Building className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <p className="text-gray-600 dark:text-gray-400">
                    {profile.logo ? "Лого байна" : "Лого байхгүй"}
                  </p>
                </div>
              )}
            </div>

            {/* Games */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Тоглоомууд
              </h2>
              {isEditing ? (
                <>
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      value={currentGame}
                      onChange={(e) => setCurrentGame(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && (e.preventDefault(), addGame())
                      }
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Тоглоомын нэр"
                    />
                    <button
                      type="button"
                      onClick={addGame}
                      className="px-4 py-2 bg-purple-600 dark:bg-green-600 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-green-700 transition-colors"
                    >
                      Нэмэх
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.games.map((game, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 dark:bg-green-900/30 text-purple-800 dark:text-green-300 rounded-full text-sm"
                      >
                        <Gamepad2 className="w-4 h-4" />
                        {game}
                        <button
                          type="button"
                          onClick={() => removeGame(index)}
                          className="text-purple-600 dark:text-green-400 hover:text-purple-800 dark:hover:text-green-200"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile.games.length > 0 ? (
                    profile.games.map((game, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 dark:bg-green-900/30 text-purple-800 dark:text-green-300 rounded-full text-sm"
                      >
                        <Gamepad2 className="w-4 h-4" />
                        {game}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-600 dark:text-gray-400">
                      Тоглоом тодорхойгүй
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Achievements */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Амжилтууд
              </h2>
              {isEditing ? (
                <>
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      value={currentAchievement}
                      onChange={(e) => setCurrentAchievement(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" &&
                        (e.preventDefault(), addAchievement())
                      }
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Амжилтын тайлбар"
                    />
                    <button
                      type="button"
                      onClick={addAchievement}
                      className="px-4 py-2 bg-purple-600 dark:bg-green-600 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-green-700 transition-colors"
                    >
                      Нэмэх
                    </button>
                  </div>
                  <div className="space-y-2">
                    {formData.achievements.map((achievement, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <Trophy className="w-4 h-4 text-yellow-500" />
                        <span className="flex-1 text-gray-700 dark:text-gray-300">
                          {achievement}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeAchievement(index)}
                          className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  {profile.achievements.length > 0 ? (
                    profile.achievements.map((achievement, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <Trophy className="w-4 h-4 text-yellow-500" />
                        <span className="text-gray-700 dark:text-gray-300">
                          {achievement}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-600 dark:text-gray-400">
                      Амжилт тодорхойгүй
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Contact Information */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Холбоо барих мэдээлэл
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    И-мэйл
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      name="contactInfo.email"
                      value={formData.contactInfo.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">
                      {profile.contactInfo.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Утас
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="contactInfo.phone"
                      value={formData.contactInfo.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">
                      {profile.contactInfo.phone || "Тодорхойгүй"}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Хаяг
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="contactInfo.address"
                      value={formData.contactInfo.address}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">
                      {profile.contactInfo.address || "Тодорхойгүй"}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Нийгмийн сүлжээ
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(profile.socialMedia).map(([platform, url]) => (
                  <div key={platform}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 capitalize">
                      {platform}
                    </label>
                    {isEditing ? (
                      <input
                        type="url"
                        name={`socialMedia.${platform}`}
                        value={
                          formData.socialMedia[
                            platform as keyof typeof formData.socialMedia
                          ]
                        }
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    ) : (
                      <p className="text-gray-900 dark:text-white">
                        {url || "Тодорхойгүй"}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
