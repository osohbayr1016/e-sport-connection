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
  ArrowLeft,
  Loader2,
} from "lucide-react";
import Link from "next/link";

interface FormData {
  organizationName: string;
  description: string;
  logo: string;
  logoPublicId: string;
  website: string;
  location: string;
  foundedYear: string;
  teamSize: string;
  games: string[];
  achievements: string[];
  socialMedia: {
    facebook: string;
    twitter: string;
    instagram: string;
    youtube: string;
    twitch: string;
  };
  contactInfo: {
    email: string;
    phone: string;
    address: string;
  };
}

export default function CreateOrganizationProfilePage() {
  const router = useRouter();
  const { user, hasProfile, checkProfileStatus } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentGame, setCurrentGame] = useState("");
  const [currentAchievement, setCurrentAchievement] = useState("");

  const [formData, setFormData] = useState<FormData>({
    organizationName: "",
    description: "",
    logo: "",
    logoPublicId: "",
    website: "",
    location: "",
    foundedYear: "",
    teamSize: "",
    games: [],
    achievements: [],
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
    if (user && hasProfile) {
      router.push("/organization-profile");
    }
  }, [user, hasProfile, router]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [section, field] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [section]: {
          ...(prev[section as keyof FormData] as Record<string, unknown>),
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(
        "/api/organization-profiles/create-profile",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create profile");
      }

      setSuccess("Байгууллагын профайл амжилттай үүслээ!");
      await checkProfileStatus();

      setTimeout(() => {
        router.push("/organization-profile");
      }, 2000);
    } catch (error) {
      console.error("Error creating organization profile:", error);
      setError(
        error instanceof Error ? error.message : "Профайл үүсгэхэд алдаа гарлаа"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute requireAuth requirePlayer={false}>
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
                Байгууллагын профайл үүсгэх
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Байгууллагынхаа мэдээллийг оруулж, тоглогчидтой холбогдоорой
              </p>
            </motion.div>
          </div>

          {/* Form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onSubmit={handleSubmit}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 lg:p-8"
          >
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

            {/* Basic Information */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Үндсэн мэдээлэл
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Байгууллагын нэр *
                  </label>
                  <input
                    type="text"
                    name="organizationName"
                    value={formData.organizationName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Байгууллагын нэр"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Вэбсайт
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Байршил
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Улаанбаатар, Монгол"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Үүсгэсэн он
                  </label>
                  <input
                    type="number"
                    name="foundedYear"
                    value={formData.foundedYear}
                    onChange={handleInputChange}
                    min="1900"
                    max={new Date().getFullYear()}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="2020"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Багийн хэмжээ
                  </label>
                  <input
                    type="number"
                    name="teamSize"
                    value={formData.teamSize}
                    onChange={handleInputChange}
                    min="1"
                    max="1000"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="10"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Тайлбар *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Байгууллагынхаа талаар товч тайлбар бичнэ үү..."
                />
              </div>
            </div>

            {/* Logo Upload */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Лого
              </h2>
              <ImageUploader
                onImageUpload={handleImageUpload}
                onImageRemove={handleImageRemove}
                currentImage={formData.logo}
              />
            </div>

            {/* Games */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Тоглоомууд
              </h2>
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
            </div>

            {/* Achievements */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Амжилтууд
              </h2>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={currentAchievement}
                  onChange={(e) => setCurrentAchievement(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addAchievement())
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
            </div>

            {/* Contact Information */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Холбоо барих мэдээлэл
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    И-мэйл *
                  </label>
                  <input
                    type="email"
                    name="contactInfo.email"
                    value={formData.contactInfo.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="contact@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Утас
                  </label>
                  <input
                    type="tel"
                    name="contactInfo.phone"
                    value={formData.contactInfo.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="+976 9999 9999"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Хаяг
                  </label>
                  <input
                    type="text"
                    name="contactInfo.address"
                    value={formData.contactInfo.address}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Хаягийн дэлгэрэнгүй мэдээлэл"
                  />
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Нийгмийн сүлжээ
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Facebook
                  </label>
                  <input
                    type="url"
                    name="socialMedia.facebook"
                    value={formData.socialMedia.facebook}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="https://facebook.com/..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Twitter
                  </label>
                  <input
                    type="url"
                    name="socialMedia.twitter"
                    value={formData.socialMedia.twitter}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="https://twitter.com/..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Instagram
                  </label>
                  <input
                    type="url"
                    name="socialMedia.instagram"
                    value={formData.socialMedia.instagram}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="https://instagram.com/..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    YouTube
                  </label>
                  <input
                    type="url"
                    name="socialMedia.youtube"
                    value={formData.socialMedia.youtube}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="https://youtube.com/..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Twitch
                  </label>
                  <input
                    type="url"
                    name="socialMedia.twitch"
                    value={formData.socialMedia.twitch}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="https://twitch.tv/..."
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="px-8 py-3 bg-purple-600 dark:bg-green-600 text-white font-semibold rounded-lg hover:bg-purple-700 dark:hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Үүсгэж байна...
                  </>
                ) : (
                  "Профайл үүсгэх"
                )}
              </button>
            </div>
          </motion.form>
        </div>
      </div>
    </ProtectedRoute>
  );
}
