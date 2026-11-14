"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { User, Settings, UserPlus, ChevronDown, Users } from "lucide-react";
// Clan removed from the app; drop related types and props
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ProfileDropdownProps {
  onInviteFriend: () => void;
}

export default function ProfileDropdown({
  onInviteFriend,
}: ProfileDropdownProps) {
  const { user, hasProfile } = useAuth();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [userSquad, setUserSquad] = useState<{
    _id: string;
    name: string;
  } | null>(null);
  const [isLoadingSquad, setIsLoadingSquad] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check if user is in a squad
  useEffect(() => {
    const checkUserSquad = async () => {
      if (!user?.id) return;

      try {
        setIsLoadingSquad(true);
        const token = localStorage.getItem("token");
        const response = await fetch(`/api/squads/user/${user.id}`, {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.squads && data.squads.length > 0) {
            // Get the first squad (user can only be in one squad at a time)
            setUserSquad(data.squads[0]);
          }
        }
      } catch (error) {
        console.error("Error checking user squad:", error);
      } finally {
        setIsLoadingSquad(false);
      }
    };

    checkUserSquad();
  }, [user?.id]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleItemClick = (callback?: () => void) => {
    setIsOpen(false);
    if (callback) {
      callback();
    }
  };

  const handleMySquadClick = () => {
    if (userSquad) {
      router.push(`/squads/${userSquad._id}`);
    }
  };

  const getProfileLink = () => {
    if (user?.role === "PLAYER" && hasProfile) return "/profile";
    if (user?.role === "ORGANIZATION" && hasProfile)
      return "/organization-profile";
    if (user?.role === "PLAYER") return "/create-profile";
    return "/create-organization-profile";
  };

  const getProfileTitle = () => {
    if (user?.role === "PLAYER" && hasProfile) return "Профайл";
    if (user?.role === "ORGANIZATION" && hasProfile)
      return "Байгууллагын профайл";
    if (user?.role === "PLAYER") return "Профайл үүсгэх";
    return "Байгууллагын профайл үүсгэх";
  };

  if (!user) return null;

  return (
    <div ref={dropdownRef} className="relative">
      {/* Profile Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center space-x-2 p-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl"
      >
        {user.avatar ? (
          <Image
            src={user.avatar}
            alt={user.name || "Profile"}
            width={20}
            height={20}
            className="rounded-full"
          />
        ) : (
          <User className="w-5 h-5" />
        )}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute right-0 top-full mt-2 w-48 bg-gray-900 rounded-xl shadow-2xl border border-gray-700 overflow-hidden z-50"
          >
            {/* User Info Header */}
            <div className="px-4 py-3 border-b border-gray-700 bg-gray-800">
              <div className="flex items-center space-x-3">
                {user.avatar ? (
                  <Image
                    src={user.avatar}
                    alt={user.name || "Profile"}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
                <div>
                  <div className="font-medium text-white text-sm">
                    {user.name || "Хэрэглэгч"}
                  </div>
                  <div className="text-xs text-gray-400">
                    {user.email}
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              {/* Profile */}
              <Link href={getProfileLink()}>
                <motion.button
                  onClick={() => handleItemClick()}
                  whileHover={{ backgroundColor: "rgba(37, 99, 235, 0.1)" }}
                  className="w-full flex items-center space-x-3 px-4 py-2 text-left text-gray-300 hover:text-blue-400 transition-colors duration-200"
                >
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {getProfileTitle()}
                  </span>
                </motion.button>
              </Link>

              {/* My Squad */}
              {isLoadingSquad ? (
                <motion.div className="w-full flex items-center space-x-3 px-4 py-2 text-left text-gray-400">
                  <Users className="w-4 h-4 animate-pulse" />
                  <span className="text-sm font-medium">Loading squad...</span>
                </motion.div>
              ) : userSquad ? (
                <motion.button
                  onClick={() => handleItemClick(handleMySquadClick)}
                  whileHover={{ backgroundColor: "rgba(37, 99, 235, 0.1)" }}
                  className="w-full flex items-center space-x-3 px-4 py-2 text-left text-gray-300 hover:text-blue-400 transition-colors duration-200"
                >
                  <Users className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    My Squad: {userSquad.name}
                  </span>
                </motion.button>
              ) : (
                <Link href="/squads">
                  <motion.button
                    onClick={() => handleItemClick()}
                    whileHover={{ backgroundColor: "rgba(37, 99, 235, 0.1)" }}
                    className="w-full flex items-center space-x-3 px-4 py-2 text-left text-gray-300 hover:text-blue-400 transition-colors duration-200"
                  >
                    <Users className="w-4 h-4" />
                    <span className="text-sm font-medium">Join Squad</span>
                  </motion.button>
                </Link>
              )}

              {/* Settings */}
              <Link href="/settings">
                <motion.button
                  onClick={() => handleItemClick()}
                  whileHover={{ backgroundColor: "rgba(37, 99, 235, 0.1)" }}
                  className="w-full flex items-center space-x-3 px-4 py-2 text-left text-gray-300 hover:text-blue-400 transition-colors duration-200"
                >
                  <Settings className="w-4 h-4" />
                  <span className="text-sm font-medium">Тохиргоо</span>
                </motion.button>
              </Link>

              {/* Invite Friend */}
              <motion.button
                onClick={() => handleItemClick(onInviteFriend)}
                whileHover={{ backgroundColor: "rgba(37, 99, 235, 0.1)" }}
                className="w-full flex items-center space-x-3 px-4 py-2 text-left text-gray-300 hover:text-blue-400 transition-colors duration-200"
              >
                <UserPlus className="w-4 h-4" />
                <span className="text-sm font-medium">Найзаа урих</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
