"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useSocket } from "../contexts/SocketContext";
import Image from "next/image";
import ChatModal from "./ChatModal";

interface Conversation {
  userId: string;
  userName: string;
  userAvatar?: string;
  lastMessage: {
    content: string;
    createdAt: string;
    isOwnMessage: boolean;
  } | null;
  unreadCount: number;
}

interface MessageListModalProps {
  onOpenChat?: (userId: string, userName: string, userAvatar?: string) => void;
}

export default function MessageListModal({
  onOpenChat,
}: MessageListModalProps) {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);
  const [selectedChat, setSelectedChat] = useState<{
    userId: string;
    userName: string;
    userAvatar?: string;
  } | null>(null);

  const fetchConversations = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) return;

      const response = await fetch("/api/messages/conversations", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setConversations(data.conversations || []);
          // Calculate total unread
          const unread = data.conversations.reduce(
            (sum: number, conv: Conversation) => sum + conv.unreadCount,
            0
          );
          setTotalUnread(unread);
        }
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && isOpen) {
      fetchConversations();
    }
  }, [user, isOpen, fetchConversations]);

  // Listen for new messages to update conversation list
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = () => {
      fetchConversations();
    };

    const handleNewNotification = () => {
      fetchConversations();
    };

    socket.on("new_message", handleNewMessage);
    socket.on("new_notification", handleNewNotification);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("new_notification", handleNewNotification);
    };
  }, [socket, fetchConversations]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString();
  };

  const handleConversationClick = (conversation: Conversation) => {
    setSelectedChat({
      userId: conversation.userId,
      userName: conversation.userName,
      userAvatar: conversation.userAvatar,
    });
    setIsOpen(false);

    if (onOpenChat) {
      onOpenChat(
        conversation.userId,
        conversation.userName,
        conversation.userAvatar
      );
    }
  };

  const handleChatClose = () => {
    setSelectedChat(null);
    // Refresh conversations after closing chat
    fetchConversations();
  };

  if (!user) return null;

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-40 p-4 bg-gradient-to-r from-purple-500 to-pink-500 dark:from-green-500 dark:to-blue-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
      >
        <MessageCircle className="w-6 h-6" />
        {totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center min-w-[24px] font-bold">
            {totalUnread > 99 ? "99+" : totalUnread}
          </span>
        )}
      </motion.button>

      {/* Conversation List Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-500 to-pink-500 dark:from-green-500 dark:to-blue-500">
              <h3 className="font-semibold text-white">Messages</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-white hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conversations List */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 dark:border-green-400"></div>
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center p-8 text-gray-500 dark:text-gray-400">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No conversations yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {conversations.map((conversation) => (
                    <motion.button
                      key={conversation.userId}
                      onClick={() => handleConversationClick(conversation)}
                      whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}
                      className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="relative flex-shrink-0">
                          <Image
                            src={
                              conversation.userAvatar || "/default-avatar.png"
                            }
                            alt={conversation.userName}
                            width={40}
                            height={40}
                            className="rounded-full object-cover"
                          />
                          {conversation.unreadCount > 0 && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">
                                {conversation.unreadCount > 9
                                  ? "9+"
                                  : conversation.unreadCount}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold text-gray-900 dark:text-white truncate">
                              {conversation.userName}
                            </p>
                            {conversation.lastMessage && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                                {formatTimestamp(
                                  conversation.lastMessage.createdAt
                                )}
                              </span>
                            )}
                          </div>
                          {conversation.lastMessage && (
                            <p
                              className={`text-sm truncate ${
                                conversation.unreadCount > 0
                                  ? "font-semibold text-gray-900 dark:text-white"
                                  : "text-gray-600 dark:text-gray-400"
                              }`}
                            >
                              {conversation.lastMessage.isOwnMessage && "You: "}
                              {conversation.lastMessage.content}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Modal */}
      {selectedChat && (
        <ChatModal
          isOpen={true}
          onClose={handleChatClose}
          playerId={selectedChat.userId}
          playerName={selectedChat.userName}
          playerAvatar={selectedChat.userAvatar}
        />
      )}
    </>
  );
}
