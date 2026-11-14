"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Search,
  UserPlus,
  Mail,
  Link as LinkIcon,
  Copy,
  Check,
} from "lucide-react";
import Image from "next/image";

interface InviteFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Friend {
  id: string;
  name: string;
  email: string;
  avatar: string;
  game: string;
  rank: string;
}

// Friends will be loaded from API
const friends: Friend[] = [];

export default function InviteFriendModal({
  isOpen,
  onClose,
}: InviteFriendModalProps) {
  const [activeTab, setActiveTab] = useState<"search" | "email" | "link">(
    "search"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [inviteLink] = useState("E-Sport-Connection.vercel.app");
  const [copiedLink, setCopiedLink] = useState(false);
  const [sentInvites, setSentInvites] = useState<string[]>([]);

  const filteredFriends = friends.filter(
    (friend) =>
      friend.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      friend.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInviteFriend = (friendId: string) => {
    setSentInvites([...sentInvites, friendId]);
    // TODO: Implement API call to send friend invitation
    // Example: await api.sendFriendInvitation(friendId);
  };

  const handleEmailInvite = () => {
    if (emailInput.trim()) {
      // TODO: Implement API call to send email invitation
      // Example: await api.sendEmailInvitation(emailInput);
      setEmailInput("");
      // TODO: Show success/error message based on API response
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          style={{ minHeight: "100vh", minWidth: "100vw" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="bg-gray-800 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden relative border border-blue-500/30 m-auto theme-transition"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-blue-500/30 theme-transition">
              <h2 className="text-2xl font-bold text-white theme-transition">
                Найзаа урих
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors theme-transition"
              >
                <X className="w-5 h-5 text-gray-400 theme-transition" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-blue-500/30 theme-transition">
              <button
                onClick={() => setActiveTab("search")}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                  activeTab === "search"
                    ? "text-purple-400 dark:text-green-400 border-b-2 border-purple-400 dark:border-green-400 bg-purple-500/20 dark:bg-green-500/20"
                    : "text-gray-400 hover:text-gray-300"
                }`}
              >
                <Search className="w-4 h-4 inline mr-2" />
                Хайх
              </button>
              <button
                onClick={() => setActiveTab("email")}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                  activeTab === "email"
                    ? "text-purple-400 dark:text-green-400 border-b-2 border-purple-400 dark:border-green-400 bg-purple-500/20 dark:bg-green-500/20"
                    : "text-gray-400 hover:text-gray-300"
                }`}
              >
                <Mail className="w-4 h-4 inline mr-2" />
                И-мэйл
              </button>
              <button
                onClick={() => setActiveTab("link")}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                  activeTab === "link"
                    ? "text-purple-400 dark:text-green-400 border-b-2 border-purple-400 dark:border-green-400 bg-purple-500/20 dark:bg-green-500/20"
                    : "text-gray-400 hover:text-gray-300"
                }`}
              >
                <LinkIcon className="w-4 h-4 inline mr-2" />
                Холбоос
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-160px)]">
              <div className="p-6">
                {/* Search Tab */}
                {activeTab === "search" && (
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Найзынхаа нэр эсвэл и-мэйл хайх..."
                        className="w-full pl-10 pr-4 py-2 border border-blue-500/30 rounded-lg bg-gray-800/50 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 dark:focus:ring-green-400 focus:border-transparent"
                      />
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {filteredFriends.map((friend) => (
                                          <div
                    key={friend.id}
                    className="flex items-center justify-between p-3 border border-blue-500/30 rounded-lg hover:bg-gray-700/50 transition-colors theme-transition"
                  >
                          <div className="flex items-center space-x-3">
                            <Image
                              src={friend.avatar}
                              alt={friend.name}
                              width={40}
                              height={40}
                              className="rounded-full"
                            />
                                                          <div>
                                <div className="font-medium text-white theme-transition">
                                  {friend.name}
                                </div>
                                <div className="text-sm text-gray-400 theme-transition">
                                  {friend.game} • {friend.rank}
                                </div>
                              </div>
                          </div>

                          {sentInvites.includes(friend.id) ? (
                            <div className="flex items-center space-x-1 px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg">
                              <Check className="w-4 h-4" />
                              <span className="text-sm">Илгээсэн</span>
                            </div>
                          ) : (
                            <motion.button
                              onClick={() => handleInviteFriend(friend.id)}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="flex items-center space-x-1 px-3 py-1 bg-gray-500 dark:bg-gray-500 text-white rounded-lg hover:bg-gray-600 dark:hover:bg-gray-600 transition-colors"
                            >
                              <UserPlus className="w-4 h-4" />
                              <span className="text-sm">Урих</span>
                            </motion.button>
                          )}
                        </div>
                      ))}
                    </div>

                    {filteredFriends.length === 0 && searchTerm && (
                      <p className="text-gray-400 text-center py-4 theme-transition">
                        Хэрэглэгч олдсонгүй
                      </p>
                    )}

                    {!searchTerm && (
                      <p className="text-gray-400 text-center py-4 theme-transition">
                        Найзын жагсаалт API-аас ачаалагдах болно
                      </p>
                    )}
                  </div>
                )}

                {/* Email Tab */}
                {activeTab === "email" && (
                  <div className="space-y-4">
                    <p className="text-gray-300 text-sm theme-transition">
                      Найзынхаа и-мэйл хаягийг оруулж урилга илгээнэ үү:
                    </p>

                    <div className="space-y-3">
                      <input
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="friend@example.com"
                        className="w-full px-3 py-2 border border-blue-500/30 rounded-lg bg-gray-800/50 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 dark:focus:ring-green-400 focus:border-transparent theme-transition"
                      />

                      <motion.button
                        onClick={handleEmailInvite}
                        disabled={!emailInput.trim()}
                        whileHover={{ scale: emailInput.trim() ? 1.05 : 1 }}
                        whileTap={{ scale: emailInput.trim() ? 0.95 : 1 }}
                        className={`w-full py-2 px-4 rounded-lg font-medium transition-all ${
                          emailInput.trim()
                            ? "bg-gray-500 text-white hover:bg-gray-600"
                            : "bg-gray-700 text-gray-500 cursor-not-allowed"
                        }`}
                      >
                        Урилга илгээх
                      </motion.button>
                    </div>
                  </div>
                )}

                {/* Link Tab */}
                {activeTab === "link" && (
                  <div className="space-y-4">
                    <p className="text-gray-300 text-sm theme-transition">
                      Энэ холбоосыг найзуудтайгаа хуваалцаж E-Sport Connection-д
                      урина уу:
                    </p>

                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={inviteLink}
                        readOnly
                        className="flex-1 px-3 py-2 border border-blue-500/30 rounded-lg bg-gray-800/50 text-white theme-transition"
                      />
                      <motion.button
                        onClick={handleCopyLink}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                          copiedLink
                            ? "bg-green-500 text-white"
                            : "bg-gray-500 dark:bg-gray-500 text-white hover:bg-gray-600 dark:hover:bg-gray-600"
                        }`}
                      >
                        {copiedLink ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </motion.button>
                    </div>

                    {copiedLink && (
                      <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-green-600 dark:text-green-400 text-sm text-center"
                      >
                        Холбоос хуулагдлаа!
                      </motion.p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
