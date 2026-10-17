"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDarkMode } from "../contexts/DarkModeContext";
import { useAuth } from "../contexts/AuthContext";
import { useSocket } from "../contexts/SocketContext";
import {
  Sun,
  Moon,
  Menu,
  X,
  Search,
  Bell,
  User,
  Users,
  LogOut,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import NotificationCenter from "./NotificationCenter";
import ProfileDropdown from "./ProfileDropdown";
import InviteFriendModal from "./InviteFriendModal";
import SearchModal from "./SearchModal";

import ChatModal from "./ChatModal";

export default function Navigation() {
  const { isDarkMode, toggleDarkMode, isLoaded } = useDarkMode();
  const { user, logout, hasProfile } = useAuth();
  const { isConnected } = useSocket();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isInviteFriendModalOpen, setIsInviteFriendModalOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [userSquad, setUserSquad] = useState<{
    _id: string;
    name: string;
  } | null>(null);
  const [isLoadingSquad, setIsLoadingSquad] = useState(false);
  const [chatModalState, setChatModalState] = useState<{
    isOpen: boolean;
    userId: string;
    userName: string;
    userAvatar?: string;
  } | null>(null);

  const handleOpenChatFromNotification = (
    userId: string,
    userName: string,
    userAvatar?: string
  ) => {
    setChatModalState({
      isOpen: true,
      userId,
      userName,
      userAvatar,
    });
  };

  const handleCloseChat = () => {
    setChatModalState(null);
  };

  // Fetch the current user's squad for mobile access
  useEffect(() => {
    const fetchUserSquad = async () => {
      if (!user?.id) {
        setUserSquad(null);
        return;
      }
      try {
        setIsLoadingSquad(true);
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const response = await fetch(`/api/squads/user/${user.id}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (response.ok) {
          const data = await response.json();
          if (
            data?.success &&
            Array.isArray(data.squads) &&
            data.squads.length > 0
          ) {
            setUserSquad(data.squads[0]);
          } else {
            setUserSquad(null);
          }
        } else {
          setUserSquad(null);
        }
      } catch (err) {
        setUserSquad(null);
      } finally {
        setIsLoadingSquad(false);
      }
    };

    fetchUserSquad();
  }, [user?.id]);

  // Main navigation items (always visible)
  const mainNavItems: Array<{ name: string; href: string; icon?: string }> = [
    { name: "Нүүр", href: "/" },
    { name: "Тоглогчид", href: "/players" },
    { name: "Мэдээ", href: "/news" },
    { name: "Тэмцээнүүд", href: "/tournaments" },
    { name: "Live Streams", href: "/live-streams" },
    { name: "Shopping", href: "/shopping" },
    { name: "Leaderboard", href: "/leaderboard" },
    { name: "Бидний", href: "/about" },
  ];

  // Additional navigation items (in dropdown)
  const moreNavItems = [
    { name: "Squads", href: "/squads" },
    { name: "Matchmaking", href: "/matchmaking" },
    { name: "Divisions", href: "/divisions" },
    { name: "Achievements", href: "/achievements" },
    {
      name: "Bounty Coins",
      href: "/bounty-coins",
      icon: "https://res.cloudinary.com/djvjsyzgw/image/upload/v1756557908/coin_masl_nzwekq.png",
    },
    { name: "Account Boosting", href: "/account-boosting" },
  ];

  // Add admin link if user is admin
  const isAdmin =
    user?.role === "ADMIN"; // Replace with your admin email
  if (isAdmin) {
    moreNavItems.push({ name: "Admin", href: "/admin" });
  }

  const handleInviteFriend = () => {
    setIsInviteFriendModalOpen(true);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-md border-b border-gray-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-2"
            >
              <Link
                href="/"
                className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent transition-all duration-300"
              >
                E-Sport Connection
              </Link>
            </motion.div>

            <div className="hidden md:flex items-center space-x-6">
              {/* Main Navigation Items */}
              {mainNavItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-gray-300 hover:text-blue-400 transition-colors duration-200 font-medium flex items-center space-x-2"
                >
                  {item.icon && (
                    <Image
                      src={item.icon}
                      alt={item.name}
                      width={20}
                      height={20}
                      className="rounded-full"
                    />
                  )}
                  <span>{item.name}</span>
                </Link>
              ))}

              {/* More Dropdown */}
              {moreNavItems.length > 0 && (
                <div className="relative">
                  <button
                    onMouseEnter={() => setIsMoreMenuOpen(true)}
                    onMouseLeave={() => setIsMoreMenuOpen(false)}
                    className="flex items-center space-x-1 text-gray-300 hover:text-blue-400 transition-colors duration-200 font-medium"
                  >
                    <span>Бусад</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  <AnimatePresence>
                    {isMoreMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        onMouseEnter={() => setIsMoreMenuOpen(true)}
                        onMouseLeave={() => setIsMoreMenuOpen(false)}
                        className="absolute top-full right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg border border-gray-700 py-2 z-50"
                      >
                        {moreNavItems.map((item) => (
                          <Link
                            key={item.name}
                            href={item.href}
                            className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-blue-400 transition-colors"
                            onClick={() => setIsMoreMenuOpen(false)}
                          >
                            {item.name}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            <div className="hidden md:flex items-center space-x-4">
              <motion.button
                onClick={() => setIsSearchModalOpen(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 text-gray-400 hover:text-blue-400 transition-colors duration-200"
              >
                <Search className="w-5 h-5" />
              </motion.button>

              <NotificationCenter
                onMessageNotificationClick={handleOpenChatFromNotification}
              />

              {/* Connection Status Indicator - Always visible on desktop */}
              <div className="hidden md:flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                <span className="text-xs text-gray-400">
                  {isConnected ? "Connected" : "Disconnected"}
                </span>
              </div>

              {user ? (
                <div className="flex items-center space-x-2">
                  <ProfileDropdown onInviteFriend={handleInviteFriend} />
                  <motion.button
                    onClick={logout}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 transition-colors duration-200"
                    title="Гарах"
                  >
                    <LogOut className="w-5 h-5" />
                  </motion.button>
                </div>
              ) : (
                <Link href="/auth/login">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <User className="w-5 h-5" />
                  </motion.button>
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <motion.button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 transition-colors duration-200"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </motion.button>
            </div>
          </div>

          {/* Mobile Navigation */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="md:hidden overflow-hidden"
              >
                <div className="py-4 space-y-4 border-t border-gray-800">
                  {/* Main Navigation Items */}
                  {mainNavItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block text-gray-300 hover:text-blue-400 transition-colors duration-200 font-medium"
                    >
                      {item.name}
                    </Link>
                  ))}

                  {/* More Navigation Items */}
                  {moreNavItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block text-gray-300 hover:text-blue-400 transition-colors duration-200 font-medium ml-4 text-sm"
                    >
                      • {item.name}
                    </Link>
                  ))}

                  {/* Mobile Actions */}
                  <div className="flex items-center space-x-4 pt-4 border-t border-gray-800">
                    <motion.button
                      onClick={() => {
                        setIsSearchModalOpen(true);
                        setIsMobileMenuOpen(false);
                      }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 text-gray-400 hover:text-blue-400 transition-colors duration-200"
                    >
                      <Search className="w-5 h-5" />
                    </motion.button>

                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      className="p-2 text-gray-400 hover:text-blue-400 transition-colors duration-200"
                    >
                      <Bell className="w-5 h-5" />
                    </motion.button>
                  </div>

                  {/* Mobile User Actions */}
                  {user ? (
                    <div className="flex flex-col space-y-3 pt-4 border-t border-gray-800">
                      {/* My Squad / Join Squad for mobile */}
                      {isLoadingSquad ? (
                        <div className="flex items-center space-x-2 text-gray-400">
                          <Users className="w-5 h-5 animate-pulse" />
                          <span>Loading squad...</span>
                        </div>
                      ) : userSquad ? (
                        <Link
                          href={`/squads/${userSquad._id}`}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center space-x-2 text-gray-300 hover:text-blue-400 transition-colors duration-200"
                        >
                          <Users className="w-5 h-5" />
                          <span>My Squad: {userSquad.name}</span>
                        </Link>
                      ) : (
                        <Link
                          href="/squads"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center space-x-2 text-gray-300 hover:text-blue-400 transition-colors duration-200"
                        >
                          <Users className="w-5 h-5" />
                          <span>Join Squad</span>
                        </Link>
                      )}

                      {/* Profile */}
                      <Link
                        href={
                          user.role === "PLAYER" && hasProfile
                            ? "/profile"
                            : user.role === "PLAYER"
                            ? "/create-profile"
                            : "/create-organization-profile"
                        }
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center space-x-2 text-gray-300 hover:text-blue-400 transition-colors duration-200"
                      >
                        <User className="w-5 h-5" />
                        <span>
                          {user.role === "PLAYER" && hasProfile
                            ? "Profile"
                            : user.role === "PLAYER"
                            ? "Create Profile"
                            : "Create Organization Profile"}
                        </span>
                      </Link>

                      {/* Logout */}
                      <button
                        onClick={() => {
                          logout();
                          setIsMobileMenuOpen(false);
                        }}
                        className="flex items-center space-x-2 text-gray-300 hover:text-red-400 transition-colors duration-200"
                      >
                        <LogOut className="w-5 h-5" />
                        <span>Гарах</span>
                      </button>
                    </div>
                  ) : (
                    <div className="pt-4 border-t border-gray-800">
                      <Link
                        href="/auth/login"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block text-gray-300 hover:text-blue-400 transition-colors duration-200 font-medium"
                      >
                        Нэвтрэх
                      </Link>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* Modals - Moved outside nav for proper positioning */}
      <InviteFriendModal
        isOpen={isInviteFriendModalOpen}
        onClose={() => setIsInviteFriendModalOpen(false)}
      />

      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />

      {/* Chat Modal */}
      {chatModalState && (
        <ChatModal
          isOpen={chatModalState.isOpen}
          onClose={handleCloseChat}
          playerId={chatModalState.userId}
          playerName={chatModalState.userName}
          playerAvatar={chatModalState.userAvatar}
        />
      )}
    </>
  );
}
