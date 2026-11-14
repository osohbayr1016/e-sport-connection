"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { useDarkMode } from "../contexts/DarkModeContext";
import {
  User,
  Users,
  Bell,
  Shield,
  Palette,
  Globe,
  Monitor,
  Sun,
  Moon,
  Check,
} from "lucide-react";

interface Team {
  id: string;
  name: string;
  tag: string;
  logo: string;
  game: string;
  gameIcon: string;
  createdBy: string;
  members: TeamMember[];
  createdAt: string;
}

interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  status: "pending" | "accepted" | "declined";
  invitedAt: string;
}

interface NotificationSettings {
  teamInvites: boolean;
  directMessages: boolean;
  teamMessages: boolean;
  tournaments: boolean;
  systemUpdates: boolean;
  emailNotifications: boolean;
}

interface PrivacySettings {
  profileVisibility: "public" | "friends" | "private";
  showEmail: boolean;
  showOnlineStatus: boolean;
  allowDirectMessages: "everyone" | "friends" | "none";
  searchVisibility: boolean;
}

interface AppearanceSettings {
  theme: "light" | "dark" | "system";
  accentColor: "purple" | "green" | "blue" | "red" | "orange";
  compactMode: boolean;
}

interface LanguageSettings {
  language: "mn" | "en";
  dateFormat: "dd/mm/yyyy" | "mm/dd/yyyy" | "yyyy-mm-dd";
  timeFormat: "12h" | "24h";
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [activeTab, setActiveTab] = useState("profile");
  const [userTeam, setUserTeam] = useState<Team | null>(null);
  const [isTeamSettingsOpen, setIsTeamSettingsOpen] = useState(false);

  // Settings states
  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettings>({
      teamInvites: true,
      directMessages: true,
      teamMessages: true,
      tournaments: true,
      systemUpdates: false,
      emailNotifications: true,
    });

  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    profileVisibility: "public",
    showEmail: false,
    showOnlineStatus: true,
    allowDirectMessages: "everyone",
    searchVisibility: true,
  });

  const [appearanceSettings, setAppearanceSettings] =
    useState<AppearanceSettings>({
      theme: "system",
      accentColor: "purple",
      compactMode: false,
    });

  const [languageSettings, setLanguageSettings] = useState<LanguageSettings>({
    language: "mn",
    dateFormat: "dd/mm/yyyy",
    timeFormat: "24h",
  });

  // Apply appearance settings to the document
  const applyAppearanceSettings = useCallback(
    (settings: AppearanceSettings) => {
      const root = document.documentElement;

      // Apply accent color CSS variables
      const colorMappings = {
        purple: {
          primary: "#8b5cf6",
          primaryForeground: "#ffffff",
          primaryHover: "#7c3aed",
          ring: "#8b5cf6",
        },
        green: {
          primary: "#10b981",
          primaryForeground: "#ffffff",
          primaryHover: "#059669",
          ring: "#10b981",
        },
        blue: {
          primary: "#3b82f6",
          primaryForeground: "#ffffff",
          primaryHover: "#2563eb",
          ring: "#3b82f6",
        },
        red: {
          primary: "#ef4444",
          primaryForeground: "#ffffff",
          primaryHover: "#dc2626",
          ring: "#ef4444",
        },
        orange: {
          primary: "#f97316",
          primaryForeground: "#ffffff",
          primaryHover: "#ea580c",
          ring: "#f97316",
        },
      };

      const colors = colorMappings[settings.accentColor];
      root.style.setProperty("--primary", colors.primary);
      root.style.setProperty("--primary-foreground", colors.primaryForeground);
      root.style.setProperty("--primary-hover", colors.primaryHover);
      root.style.setProperty("--ring", colors.ring);

      // Apply compact mode
      if (settings.compactMode) {
        root.classList.add("compact-mode");
      } else {
        root.classList.remove("compact-mode");
      }
    },
    []
  );

  useEffect(() => {
    // Load user team from localStorage
    const savedTeam = localStorage.getItem("userTeam");
    if (savedTeam) {
      try {
        setUserTeam(JSON.parse(savedTeam));
      } catch (error) {
        console.error("Error parsing saved team:", error);
      }
    }

    // Load settings from localStorage
    const savedNotifications = localStorage.getItem("notificationSettings");
    if (savedNotifications) {
      try {
        setNotificationSettings(JSON.parse(savedNotifications));
      } catch (error) {
        console.error("Error parsing notification settings:", error);
      }
    }

    const savedPrivacy = localStorage.getItem("privacySettings");
    if (savedPrivacy) {
      try {
        setPrivacySettings(JSON.parse(savedPrivacy));
      } catch (error) {
        console.error("Error parsing privacy settings:", error);
      }
    }

    const savedAppearance = localStorage.getItem("appearanceSettings");
    if (savedAppearance) {
      try {
        const parsedAppearance = JSON.parse(savedAppearance);
        setAppearanceSettings(parsedAppearance);
        // Apply the saved appearance settings
        applyAppearanceSettings(parsedAppearance);
      } catch (error) {
        console.error("Error parsing appearance settings:", error);
      }
    } else {
      // Apply default settings
      applyAppearanceSettings(appearanceSettings);
    }

    // Sync theme setting with current dark mode state
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark" || savedTheme === "light") {
      setAppearanceSettings((prev) => ({
        ...prev,
        theme: savedTheme as "light" | "dark",
      }));
    } else {
      // No saved theme means system preference
      setAppearanceSettings((prev) => ({ ...prev, theme: "system" }));
    }

    const savedLanguage = localStorage.getItem("languageSettings");
    if (savedLanguage) {
      try {
        setLanguageSettings(JSON.parse(savedLanguage));
      } catch (error) {
        console.error("Error parsing language settings:", error);
      }
    }

    // Check URL hash and switch to team tab if needed
    const hash = window.location.hash.replace("#", "");
    if (hash === "team") {
      setActiveTab("team");
      // Clear the hash to avoid confusion
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  // Apply appearance settings whenever they change
  useEffect(() => {
    applyAppearanceSettings(appearanceSettings);
  }, [appearanceSettings, applyAppearanceSettings]);

  // Save functions
  const saveNotificationSettings = (settings: NotificationSettings) => {
    setNotificationSettings(settings);
    localStorage.setItem("notificationSettings", JSON.stringify(settings));
  };

  const savePrivacySettings = (settings: PrivacySettings) => {
    setPrivacySettings(settings);
    localStorage.setItem("privacySettings", JSON.stringify(settings));
  };

  const saveAppearanceSettings = (settings: AppearanceSettings) => {
    setAppearanceSettings(settings);
    localStorage.setItem("appearanceSettings", JSON.stringify(settings));

    // Handle theme changes
    if (settings.theme === "dark") {
      localStorage.setItem("theme", "dark");
      if (!isDarkMode) toggleDarkMode();
    } else if (settings.theme === "light") {
      localStorage.setItem("theme", "light");
      if (isDarkMode) toggleDarkMode();
    } else if (settings.theme === "system") {
      localStorage.removeItem("theme"); // Remove theme preference to let system take over
      // Check system preference and apply it
      const systemPrefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      if (systemPrefersDark && !isDarkMode) {
        toggleDarkMode();
      } else if (!systemPrefersDark && isDarkMode) {
        toggleDarkMode();
      }
    }

    // Apply accent color and compact mode to document
    applyAppearanceSettings(settings);
  };

  const saveLanguageSettings = (settings: LanguageSettings) => {
    setLanguageSettings(settings);
    localStorage.setItem("languageSettings", JSON.stringify(settings));
  };

  const tabs = [
    { id: "profile", name: "Профайл", icon: User },
    { id: "team", name: "Миний баг", icon: Users },
    { id: "notifications", name: "Мэдэгдэл", icon: Bell },
    { id: "privacy", name: "Нууцлал", icon: Shield },
    { id: "appearance", name: "Харагдах байдал", icon: Palette },
    { id: "language", name: "Хэл", icon: Globe },
  ];

  const handleRemovePlayer = (memberId: string) => {
    if (!userTeam) return;

    const updatedTeam = {
      ...userTeam,
      members: userTeam.members.filter((member) => member.id !== memberId),
    };

    setUserTeam(updatedTeam);
    localStorage.setItem("userTeam", JSON.stringify(updatedTeam));
    // Trigger update event to notify other components
    window.dispatchEvent(new Event("teamUpdated"));
  };

  const handleLeaveTeam = () => {
    setUserTeam(null);
    localStorage.removeItem("userTeam");
    // Trigger update event to notify other components
    window.dispatchEvent(new Event("teamUpdated"));
  };

  const handleTeamSettings = () => {
    setIsTeamSettingsOpen(true);
  };

  const handleTeamUpdated = (updatedTeam: Team) => {
    setUserTeam(updatedTeam);
    // Trigger update event to notify other components
    window.dispatchEvent(new Event("teamUpdated"));
  };

  const handleTeamDeleted = () => {
    setUserTeam(null);
    // Trigger update event to notify other components
    window.dispatchEvent(new Event("teamUpdated"));
  };

  const isTeamOwner = userTeam && user && userTeam.createdBy === user.id;

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Нэвтэрч орно уу
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Тохиргоо хэсэгт нэвтрэхийн тулд эхлээд нэвтэрч орно уу.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black pt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Тохиргоо
          </h1>
          <p className="text-xl text-gray-300">
            Өөрийн профайл болон багийн тохиргоог удирдана уу
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:w-64 bg-gray-800/50 border border-blue-500/30 rounded-lg shadow-lg p-6"
          >
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        : "text-gray-300 hover:bg-gray-700/50"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1"
          >
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="bg-gray-800/50 border border-blue-500/30 rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-white mb-6">
                  Профайлын тохиргоо
                </h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Нэр
                    </label>
                    <input
                      type="text"
                      defaultValue={user.name || ""}
                      className="w-full px-3 py-2 bg-gray-800/50 border border-blue-500/30 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      И-мэйл
                    </label>
                    <input
                      type="email"
                      defaultValue={user.email}
                      disabled
                      className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-400"
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-600 hover:to-cyan-600 transition-all duration-300"
                  >
                    Хадгалах
                  </motion.button>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <div className="bg-gray-800/50 border border-blue-500/30 rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-white mb-6">
                  Мэдэгдлийн тохиргоо
                </h2>
                <div className="space-y-6">
                  {/* Team Invites */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-white">
                        Багийн урилга
                      </h3>
                      <p className="text-sm text-gray-400">
                        Багт орох урилга ирэхэд мэдэгдэх
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={notificationSettings.teamInvites}
                        onChange={(e) =>
                          saveNotificationSettings({
                            ...notificationSettings,
                            teamInvites: e.target.checked,
                          })
                        }
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                    </label>
                  </div>

                  {/* Direct Messages */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-white">
                        Шууд зурвас
                      </h3>
                      <p className="text-sm text-gray-400">
                        Шууд зурвас ирэхэд мэдэгдэх
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={notificationSettings.directMessages}
                        onChange={(e) =>
                          saveNotificationSettings({
                            ...notificationSettings,
                            directMessages: e.target.checked,
                          })
                        }
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                    </label>
                  </div>

                  {/* Team Messages */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-white">
                        Багийн зурвас
                      </h3>
                      <p className="text-sm text-gray-400">
                        Багийн чатад зурвас ирэхэд мэдэгдэх
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={notificationSettings.teamMessages}
                        onChange={(e) =>
                          saveNotificationSettings({
                            ...notificationSettings,
                            teamMessages: e.target.checked,
                          })
                        }
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                    </label>
                  </div>

                  {/* Tournaments */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-white">
                        Тэмцээн
                      </h3>
                      <p className="text-sm text-gray-400">
                        Тэмцээний мэдээлэл ирэхэд мэдэгдэх
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={notificationSettings.tournaments}
                        onChange={(e) =>
                          saveNotificationSettings({
                            ...notificationSettings,
                            tournaments: e.target.checked,
                          })
                        }
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                    </label>
                  </div>

                  {/* System Updates */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-white">
                        Системийн шинэчлэл
                      </h3>
                      <p className="text-sm text-gray-400">
                        Системийн шинэчлэл болон мэдээллийн талаар мэдэгдэх
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={notificationSettings.systemUpdates}
                        onChange={(e) =>
                          saveNotificationSettings({
                            ...notificationSettings,
                            systemUpdates: e.target.checked,
                          })
                        }
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                    </label>
                  </div>

                  {/* Email Notifications */}
                  <div className="flex items-center justify-between border-t border-gray-700 pt-4">
                    <div>
                      <h3 className="font-medium text-white">
                        И-мэйл мэдэгдэл
                      </h3>
                      <p className="text-sm text-gray-400">
                        Чухал мэдэгдлүүдийг и-мэйлээр хүлээн авах
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={notificationSettings.emailNotifications}
                        onChange={(e) =>
                          saveNotificationSettings({
                            ...notificationSettings,
                            emailNotifications: e.target.checked,
                          })
                        }
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === "privacy" && (
              <div className="bg-gray-800/50 border border-blue-500/30 rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-white mb-6">
                  Нууцлалын тохиргоо
                </h2>
                <div className="space-y-6">
                  {/* Profile Visibility */}
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                      Профайлын харагдах байдал
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      Таны профайлыг хэн харж чадахыг тохируулна уу
                    </p>
                    <div className="space-y-2">
                      {[
                        {
                          value: "public",
                          label: "Бүгдэд харагдах",
                          desc: "Хэн ч таны профайлыг харж чадна",
                        },
                        {
                          value: "friends",
                          label: "Найз нартаа",
                          desc: "Зөвхөн найз нарт харагдах",
                        },
                        {
                          value: "private",
                          label: "Приват",
                          desc: "Хэн ч харж чадахгүй",
                        },
                      ].map((option) => (
                        <label
                          key={option.value}
                          className={`flex items-start space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                            privacySettings.profileVisibility === option.value
                              ? "border-blue-500 bg-blue-500/20"
                              : "border-gray-600 hover:border-gray-500"
                          }`}
                        >
                          <input
                            type="radio"
                            name="profileVisibility"
                            value={option.value}
                            checked={
                              privacySettings.profileVisibility === option.value
                            }
                            onChange={(e) =>
                              savePrivacySettings({
                                ...privacySettings,
                                profileVisibility: e.target.value as
                                  | "public"
                                  | "friends"
                                  | "private",
                              })
                            }
                            className="mt-1 w-4 h-4 text-blue-500"
                          />
                          <div>
                            <div className="font-medium text-white">
                              {option.label}
                            </div>
                            <div className="text-sm text-gray-400">
                              {option.desc}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Show Email */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-white">
                        И-мэйл хаягийг харуулах
                      </h3>
                      <p className="text-sm text-gray-400">
                        Профайлд и-мэйл хаягийг харуулах эсэх
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={privacySettings.showEmail}
                        onChange={(e) =>
                          savePrivacySettings({
                            ...privacySettings,
                            showEmail: e.target.checked,
                          })
                        }
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                    </label>
                  </div>

                  {/* Show Online Status */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-white">
                        Онлайн байдлыг харуулах
                      </h3>
                      <p className="text-sm text-gray-400">
                        Бусад хүмүүст таны онлайн байгаа эсэхийг мэдэгдэх
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={privacySettings.showOnlineStatus}
                        onChange={(e) =>
                          savePrivacySettings({
                            ...privacySettings,
                            showOnlineStatus: e.target.checked,
                          })
                        }
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                    </label>
                  </div>

                  {/* Allow Direct Messages */}
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                      Шууд зурвас илгээх эрх
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      Хэн танд шууд зурвас илгээж чадахыг тохируулна уу
                    </p>
                    <div className="space-y-2">
                      {[
                        {
                          value: "everyone",
                          label: "Бүгд",
                          desc: "Хэн ч танд зурвас илгээж чадна",
                        },
                        {
                          value: "friends",
                          label: "Найз нар",
                          desc: "Зөвхөн найз нарынх танд зурвас илгээх",
                        },
                        {
                          value: "none",
                          label: "Хэн ч үгүй",
                          desc: "Хэн ч танд зурвас илгээж чадахгүй",
                        },
                      ].map((option) => (
                        <label
                          key={option.value}
                          className={`flex items-start space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                            privacySettings.allowDirectMessages === option.value
                              ? "border-blue-500 bg-blue-500/20"
                              : "border-gray-600 hover:border-gray-500"
                          }`}
                        >
                          <input
                            type="radio"
                            name="allowDirectMessages"
                            value={option.value}
                            checked={
                              privacySettings.allowDirectMessages ===
                              option.value
                            }
                            onChange={(e) =>
                              savePrivacySettings({
                                ...privacySettings,
                                allowDirectMessages: e.target.value as
                                  | "everyone"
                                  | "friends"
                                  | "none",
                              })
                            }
                            className="mt-1 w-4 h-4 text-blue-500"
                          />
                          <div>
                            <div className="font-medium text-white">
                              {option.label}
                            </div>
                            <div className="text-sm text-gray-400">
                              {option.desc}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Search Visibility */}
                  <div className="flex items-center justify-between border-t border-gray-700 pt-4">
                    <div>
                      <h3 className="font-medium text-white">
                        Хайлтад харагдах
                      </h3>
                      <p className="text-sm text-gray-400">
                        Бусад хүмүүс таны профайлыг хайж олж чадах эсэх
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={privacySettings.searchVisibility}
                        onChange={(e) =>
                          savePrivacySettings({
                            ...privacySettings,
                            searchVisibility: e.target.checked,
                          })
                        }
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === "appearance" && (
              <div className="bg-gray-800/50 border border-blue-500/30 rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-white mb-6">
                  Харагдах байдлын тохиргоо
                </h2>
                <div className="space-y-6">
                  {/* Theme Selection */}
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                      Дэлгэцийн горим
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      Аппликешний өнгийн горимыг сонгоно уу
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {[
                        {
                          value: "light",
                          label: "Цагаан горим",
                          icon: Sun,
                          preview: "bg-white border-gray-300",
                        },
                        {
                          value: "dark",
                          label: "Хар горим",
                          icon: Moon,
                          preview: "bg-gray-800 border-gray-600",
                        },
                        {
                          value: "system",
                          label: "Системийн",
                          icon: Monitor,
                          preview:
                            "bg-gradient-to-br from-white to-gray-800 border-gray-400",
                        },
                      ].map((theme) => {
                        const Icon = theme.icon;
                        return (
                          <label
                            key={theme.value}
                            className={`flex flex-col items-center p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                              appearanceSettings.theme === theme.value
                                ? "border-blue-500 bg-blue-500/20"
                                : "border-gray-600 hover:border-gray-500"
                            }`}
                          >
                            <input
                              type="radio"
                              name="theme"
                              value={theme.value}
                              checked={appearanceSettings.theme === theme.value}
                              onChange={(e) =>
                                saveAppearanceSettings({
                                  ...appearanceSettings,
                                  theme: e.target.value as
                                    | "light"
                                    | "dark"
                                    | "system",
                                })
                              }
                              className="sr-only"
                            />
                            <div
                              className={`w-12 h-8 rounded-md border-2 ${theme.preview} mb-2 flex items-center justify-center`}
                            >
                              <Icon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white text-center">
                              {theme.label}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Accent Color */}
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                      Тэмдэглэгээний өнгө
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      Системийн үндсэн өнгийг сонгоно уу
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {[
                        {
                          value: "purple",
                          label: "Ягаан",
                          color: "bg-purple-500",
                        },
                        {
                          value: "green",
                          label: "Ногоон",
                          color: "bg-green-500",
                        },
                        {
                          value: "blue",
                          label: "Цэнхэр",
                          color: "bg-blue-500",
                        },
                        { value: "red", label: "Улаан", color: "bg-red-500" },
                        {
                          value: "orange",
                          label: "Улбар шар",
                          color: "bg-orange-500",
                        },
                      ].map((color) => (
                        <label
                          key={color.value}
                          className={`flex flex-col items-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                            appearanceSettings.accentColor === color.value
                              ? "border-blue-500 bg-blue-500/20"
                              : "border-gray-600 hover:border-gray-500"
                          }`}
                        >
                          <input
                            type="radio"
                            name="accentColor"
                            value={color.value}
                            checked={
                              appearanceSettings.accentColor === color.value
                            }
                            onChange={(e) =>
                              saveAppearanceSettings({
                                ...appearanceSettings,
                                accentColor: e.target.value as
                                  | "purple"
                                  | "green"
                                  | "blue"
                                  | "red"
                                  | "orange",
                              })
                            }
                            className="sr-only"
                          />
                          <div
                            className={`w-8 h-8 rounded-full ${color.color} mb-2 border-2 border-white dark:border-gray-800 shadow-lg`}
                          >
                            {appearanceSettings.accentColor === color.value && (
                              <div className="w-full h-full rounded-full flex items-center justify-center">
                                <Check className="w-4 h-4 text-white" />
                              </div>
                            )}
                          </div>
                          <span className="text-xs font-medium text-gray-900 dark:text-white text-center">
                            {color.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Compact Mode */}
                  <div className="flex items-center justify-between border-t border-gray-700 pt-4">
                    <div>
                      <h3 className="font-medium text-white">
                        Компакт горим
                      </h3>
                      <p className="text-sm text-gray-400">
                        Дэлгэц дээрх элементүүдийг жижгээр харуулах
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={appearanceSettings.compactMode}
                        onChange={(e) =>
                          saveAppearanceSettings({
                            ...appearanceSettings,
                            compactMode: e.target.checked,
                          })
                        }
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                    </label>
                  </div>

                  {/* Current Theme Preview */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                      Одоогийн тохиргоо
                    </h3>
                    <div className="p-4 rounded-lg border border-gray-600 bg-gray-700/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-300">
                          Горим:
                        </span>
                        <span className="text-sm font-medium text-white">
                          {appearanceSettings.theme === "light" && "Цагаан"}
                          {appearanceSettings.theme === "dark" && "Хар"}
                          {appearanceSettings.theme === "system" && "Системийн"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-300">
                          Өнгө:
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-white">
                            {appearanceSettings.accentColor === "purple" &&
                              "Ягаан"}
                            {appearanceSettings.accentColor === "green" &&
                              "Ногоон"}
                            {appearanceSettings.accentColor === "blue" &&
                              "Цэнхэр"}
                            {appearanceSettings.accentColor === "red" &&
                              "Улаан"}
                            {appearanceSettings.accentColor === "orange" &&
                              "Улбар шар"}
                          </span>
                          <div
                            className={`w-4 h-4 rounded-full ${
                              appearanceSettings.accentColor === "purple"
                                ? "bg-purple-500"
                                : appearanceSettings.accentColor === "green"
                                ? "bg-green-500"
                                : appearanceSettings.accentColor === "blue"
                                ? "bg-blue-500"
                                : appearanceSettings.accentColor === "red"
                                ? "bg-red-500"
                                : "bg-orange-500"
                            }`}
                          ></div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-300">
                          Компакт:
                        </span>
                        <span className="text-sm font-medium text-white">
                          {appearanceSettings.compactMode
                            ? "Идэвхжүүлсэн"
                            : "Унтраасан"}
                        </span>
                      </div>
                    </div>

                    {/* Live Preview Demo */}
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-white mb-2">
                        Жишээ харах:
                      </h4>
                      <div className="p-3 rounded-lg border border-gray-600 bg-gray-800/50">
                        <div className="flex items-center space-x-3 mb-3">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`px-4 py-2 rounded-lg text-white font-medium transition-colors ${
                              appearanceSettings.accentColor === "purple"
                                ? "bg-purple-500 hover:bg-purple-600"
                                : appearanceSettings.accentColor === "green"
                                ? "bg-green-500 hover:bg-green-600"
                                : appearanceSettings.accentColor === "blue"
                                ? "bg-blue-500 hover:bg-blue-600"
                                : appearanceSettings.accentColor === "red"
                                ? "bg-red-500 hover:bg-red-600"
                                : "bg-orange-500 hover:bg-orange-600"
                            }`}
                          >
                            Товч
                          </motion.button>
                          <div
                            className={`w-3 h-3 rounded-full ${
                              appearanceSettings.accentColor === "purple"
                                ? "bg-purple-500"
                                : appearanceSettings.accentColor === "green"
                                ? "bg-green-500"
                                : appearanceSettings.accentColor === "blue"
                                ? "bg-blue-500"
                                : appearanceSettings.accentColor === "red"
                                ? "bg-red-500"
                                : "bg-orange-500"
                            }`}
                          ></div>
                          <span className="text-sm text-gray-400">
                            {appearanceSettings.compactMode
                              ? "Жижиг"
                              : "Энгийн"}{" "}
                            хэмжээ
                          </span>
                        </div>
                        <div
                          className={`text-sm text-gray-400 ${
                            appearanceSettings.compactMode
                              ? "leading-tight"
                              : "leading-normal"
                          }`}
                        >
                          Энэ нь таны сонгосон тохиргооны жишээ харагдах байдал
                          юм.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Language Tab */}
            {activeTab === "language" && (
              <div className="bg-gray-800/50 border border-blue-500/30 rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-white mb-6">
                  Хэлний тохиргоо
                </h2>
                <div className="space-y-6">
                  {/* Language Selection */}
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                      Интерфейсийн хэл
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      Аппликешний хэлийг сонгоно уу
                    </p>
                    <div className="space-y-2">
                      {[
                        {
                          value: "mn",
                          label: "Монгол",
                          flag: "🇲🇳",
                          desc: "Монгол хэл дээр харуулах",
                        },
                        {
                          value: "en",
                          label: "English",
                          flag: "🇺🇸",
                          desc: "Display interface in English",
                        },
                      ].map((language) => (
                        <label
                          key={language.value}
                          className={`flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                            languageSettings.language === language.value
                              ? "border-blue-500 bg-blue-500/20"
                              : "border-gray-600 hover:border-gray-500"
                          }`}
                        >
                          <input
                            type="radio"
                            name="language"
                            value={language.value}
                            checked={
                              languageSettings.language === language.value
                            }
                            onChange={(e) =>
                              saveLanguageSettings({
                                ...languageSettings,
                                language: e.target.value as "mn" | "en",
                              })
                            }
                            className="mt-1 w-4 h-4 text-blue-500"
                          />
                          <div className="text-2xl">{language.flag}</div>
                          <div>
                            <div className="font-medium text-white">
                              {language.label}
                            </div>
                            <div className="text-sm text-gray-400">
                              {language.desc}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Date Format */}
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                      Огнооны формат
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      Огнооны харагдах байдлыг сонгоно уу
                    </p>
                    <div className="space-y-2">
                      {[
                        {
                          value: "dd/mm/yyyy",
                          label: "31/12/2024",
                          desc: "Өдөр/Сар/Жил",
                        },
                        {
                          value: "mm/dd/yyyy",
                          label: "12/31/2024",
                          desc: "Сар/Өдөр/Жил",
                        },
                        {
                          value: "yyyy-mm-dd",
                          label: "2024-12-31",
                          desc: "Жил-Сар-Өдөр",
                        },
                      ].map((format) => (
                        <label
                          key={format.value}
                          className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                            languageSettings.dateFormat === format.value
                              ? "border-blue-500 bg-blue-500/20"
                              : "border-gray-600 hover:border-gray-500"
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <input
                              type="radio"
                              name="dateFormat"
                              value={format.value}
                              checked={
                                languageSettings.dateFormat === format.value
                              }
                              onChange={(e) =>
                                saveLanguageSettings({
                                  ...languageSettings,
                                  dateFormat: e.target.value as
                                    | "dd/mm/yyyy"
                                    | "mm/dd/yyyy"
                                    | "yyyy-mm-dd",
                                })
                              }
                              className="w-4 h-4 text-purple-600 dark:text-green-500"
                            />
                            <div>
                              <div className="font-medium text-white">
                                {format.label}
                              </div>
                              <div className="text-sm text-gray-400">
                                {format.desc}
                              </div>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Time Format */}
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                      Цагийн формат
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      Цагийн харагдах байдлыг сонгоно уу
                    </p>
                    <div className="space-y-2">
                      {[
                        {
                          value: "12h",
                          label: "2:30 PM",
                          desc: "12 цагийн формат (AM/PM)",
                        },
                        {
                          value: "24h",
                          label: "14:30",
                          desc: "24 цагийн формат",
                        },
                      ].map((format) => (
                        <label
                          key={format.value}
                          className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                            languageSettings.timeFormat === format.value
                              ? "border-blue-500 bg-blue-500/20"
                              : "border-gray-600 hover:border-gray-500"
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <input
                              type="radio"
                              name="timeFormat"
                              value={format.value}
                              checked={
                                languageSettings.timeFormat === format.value
                              }
                              onChange={(e) =>
                                saveLanguageSettings({
                                  ...languageSettings,
                                  timeFormat: e.target.value as "12h" | "24h",
                                })
                              }
                              className="w-4 h-4 text-purple-600 dark:text-green-500"
                            />
                            <div>
                              <div className="font-medium text-white">
                                {format.label}
                              </div>
                              <div className="text-sm text-gray-400">
                                {format.desc}
                              </div>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Current Settings Preview */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                      Одоогийн тохиргоо
                    </h3>
                    <div className="p-4 rounded-lg border border-gray-600 bg-gray-700/50">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-300">
                            Хэл:
                          </span>
                          <span className="text-sm font-medium text-white">
                            {languageSettings.language === "mn"
                              ? "🇲🇳 Монгол"
                              : "🇺🇸 English"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-300">
                            Огноо:
                          </span>
                          <span className="text-sm font-medium text-white">
                            {new Date()
                              .toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              })
                              .replace(
                                /\//g,
                                languageSettings.dateFormat.includes("-")
                                  ? "-"
                                  : "/"
                              )}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-300">
                            Цаг:
                          </span>
                          <span className="text-sm font-medium text-white">
                            {new Date().toLocaleTimeString("en-US", {
                              hour12: languageSettings.timeFormat === "12h",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Language Change Notice */}
                  {languageSettings.language === "en" && (
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                      <div className="flex items-start space-x-2">
                        <Globe className="w-5 h-5 text-blue-500 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-blue-400">
                            Language Change Notice
                          </h4>
                          <p className="text-sm text-blue-300 mt-1">
                            The interface language will change to English when
                            this feature is fully implemented. Currently, the
                            interface remains in Mongolian.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
