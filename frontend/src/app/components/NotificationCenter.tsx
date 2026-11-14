"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  X,
  Trash2,
  MessageCircle,
  Crown,
  Check,
  Ban,
} from "lucide-react";
import { useNotifications } from "../hooks/useNotifications";
import { useAuth } from "../contexts/AuthContext";
import { useNotificationNavigation } from "../../utils/notificationNavigation";
import Image from "next/image";
import Link from "next/link";
import { API_ENDPOINTS } from "../../config/api";

interface NotificationCenterProps {
  onMessageNotificationClick?: (
    senderId: string,
    senderName: string,
    senderAvatar?: string
  ) => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  onMessageNotificationClick,
}) => {
  const { getToken } = useAuth();
  const { navigateToNotification } = useNotificationNavigation();
  const {
    notifications,
    unreadCount,
    loading,
    markingAllAsSeen,
    fetchNotifications,
    markAsSeen,
    markAllAsSeen,
    deleteNotification,
  } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [processingNotification, setProcessingNotification] = useState<
    string | null
  >(null);

  // Fetch notifications when component mounts
  useEffect(() => {
    const token = getToken();
    if (isOpen && token) {
      fetchNotifications();
    }
  }, [isOpen, getToken, fetchNotifications]);

  // Note: Auto-marking notifications as seen when dropdown opens is removed
  // to prevent infinite loops. Notifications will only be marked as seen when clicked.

  const handleNotificationClick = async (notification: {
    _id: string;
    status: string;
    type: string;
    title: string;
    content: string;
    senderId?: {
      _id: string;
      name: string;
      avatar?: string;
    };
    relatedMessageId?: string;
    relatedClanId?: string;
    createdAt: string;
  }) => {
    // Always mark as seen when clicked, regardless of current status
    if (notification.status === "PENDING") {
      await markAsSeen(notification._id);
    }

    // Close the notification center
    setIsOpen(false);

    // If it's a message notification, open the chat
    if (
      notification.type === "MESSAGE" &&
      notification.senderId &&
      onMessageNotificationClick
    ) {
      onMessageNotificationClick(
        notification.senderId._id,
        notification.senderId.name,
        notification.senderId.avatar
      );
    } else {
      // For all other notification types, use the navigation utility
      navigateToNotification(notification);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) {
      return "Саяхан";
    } else if (diffInHours < 24) {
      return `${diffInHours} цагийн өмнө`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} өдрийн өмнө`;
    }
  };

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="p-2 text-gray-400 hover:text-blue-400 transition-colors duration-200 relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </motion.button>

      {/* Notification Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="font-semibold text-white">
                Мэдэгдэл
              </h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsSeen}
                    disabled={markingAllAsSeen}
                    className={`text-xs hover:underline ${
                      markingAllAsSeen 
                        ? 'text-gray-500 cursor-not-allowed' 
                        : 'text-blue-400 hover:text-blue-300'
                    }`}
                  >
                    {markingAllAsSeen ? 'Тэмдэглэж байна...' : 'Бүгдийг уншсан гэж тэмдэглэх'}
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-700 rounded transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-400">
                  Уншиж байна...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-400">
                  Мэдэгдэл байхгүй байна
                </div>
              ) : (
                <div className="divide-y divide-gray-700">
                  {notifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={`p-4 hover:bg-gray-700 cursor-pointer transition-colors ${
                        notification.status === "PENDING"
                          ? "bg-blue-900/20"
                          : ""
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          {notification.senderId?.avatar ? (
                            <Image
                              src={notification.senderId.avatar}
                              alt={notification.senderId.name}
                              width={32}
                              height={32}
                              className="rounded-full"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                              <MessageCircle
                                size={16}
                                className="text-gray-300"
                              />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-white">
                              {notification.title}
                            </p>
                            <div className="flex items-center space-x-1">
                              {notification.status === "PENDING" && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notification._id);
                                }}
                                className="p-1 hover:bg-gray-600 rounded transition-colors"
                              >
                                <Trash2 size={12} className="text-gray-400" />
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-gray-300 mt-1">
                            {notification.content}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            {formatTime(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-700 bg-gray-700/50">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>
                    {unreadCount} уншаагүй / {notifications.length} нийт
                  </span>
                  <span>7 хоногийн дараа устана</span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
};

export default NotificationCenter;
