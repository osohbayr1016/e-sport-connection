import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useSocket } from "../contexts/SocketContext";
import { API_ENDPOINTS } from "@/config/api";

interface Notification {
  _id: string;
  title: string;
  content: string;
  type: "MESSAGE" | "SYSTEM" | "CLAN_INVITATION";
  status: "PENDING" | "SEEN" | "DELETED";
  senderId: {
    _id: string;
    name: string;
    avatar?: string;
  };
  relatedMessageId?: string;
  relatedClanId?: string;
  createdAt: string;
}

export const useNotifications = () => {
  const { getToken } = useAuth();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [processingNotifications, setProcessingNotifications] = useState<Set<string>>(new Set());
  const [markingAllAsSeen, setMarkingAllAsSeen] = useState(false);
  // Ref guards same-tick requests; React state alone updates asynchronously.
  const markingAllRef = useRef(false);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    const token = getToken();
    if (!token) {
      console.warn("No token available for fetching notifications");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `${API_ENDPOINTS.NOTIFICATIONS.ALL}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(
          data.notifications?.filter(
            (n: Notification) => n.status === "PENDING"
          ).length || 0
        );
      } else {
        console.error("Failed to fetch notifications:", response.status, response.statusText);
        // Try to get error details
        try {
          const errorData = await response.json();
          console.error("Error details:", errorData);
        } catch (e) {
          console.error("Could not parse error response");
        }
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      // Check if it's a network error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error("Network error - check API endpoint and connectivity");
      }
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    const token = getToken();
    if (!token) {
      console.warn("No token available for fetching unread count");
      return;
    }

    try {
      const response = await fetch(
        `${API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unreadCount || 0);
      } else {
        console.error("Failed to fetch unread count:", response.status, response.statusText);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
      // Check if it's a network error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error("Network error - check API endpoint and connectivity");
      }
    }
  }, [getToken]);

  // Mark notification as seen
  const markAsSeen = async (notificationId: string) => {
    const token = getToken();
    if (!token) {
      console.warn("No token available for marking notification as seen");
      return;
    }

    // Prevent duplicate processing
    if (processingNotifications.has(notificationId)) {
      console.warn("Notification already being processed:", notificationId);
      return;
    }

    try {
      setProcessingNotifications(prev => new Set(prev).add(notificationId));

      // Optimistically update the UI first
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notificationId ? { ...n, status: "SEEN" as const } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      const url = `${API_ENDPOINTS.NOTIFICATIONS.MARK_READ(notificationId)}`;
      console.log("Marking notification as seen:", { notificationId, url });
      
      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.error("Failed to mark notification as seen:", response.status, response.statusText);
        // Revert optimistic update on failure
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notificationId ? { ...n, status: "PENDING" as const } : n
          )
        );
        setUnreadCount((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Error marking notification as seen:", error);
      
      // Check if it's a network error and provide helpful message
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error("Network error - API might be unavailable. Check if backend is running.");
        // Don't revert optimistic update for network errors - keep the UI updated
        // as the user has already seen the notification
      } else {
        // Revert optimistic update on other types of errors
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notificationId ? { ...n, status: "PENDING" as const } : n
          )
        );
        setUnreadCount((prev) => prev + 1);
      }
    } finally {
      setProcessingNotifications(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    }
  };

  // Mark all notifications as seen
  const markAllAsSeen = async () => {
    const token = getToken();
    if (!token) {
      console.warn("No token available for marking all notifications as seen");
      return;
    }

    if (markingAllRef.current) {
      console.warn("Already marking all notifications as seen");
      return;
    }

    markingAllRef.current = true;

    // Store current state for potential rollback
    const currentNotifications = notifications;
    const currentUnreadCount = unreadCount;

    try {
      setMarkingAllAsSeen(true);
      
      // Optimistically update the UI first
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, status: "SEEN" as const }))
      );
      setUnreadCount(0);

      console.log("Marking all notifications as seen:", { url: API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ });

      const response = await fetch(
        `${API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        console.error("Failed to mark all notifications as seen:", response.status, response.statusText);
        // Revert optimistic update on failure
        setNotifications(currentNotifications);
        setUnreadCount(currentUnreadCount);
      } else {
        console.log("Successfully marked all notifications as seen");
      }
    } catch (error) {
      console.error("Error marking all notifications as seen:", error);
      
      // Check if it's a network error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error("Network error - API might be unavailable. Check if backend is running.");
        // Don't revert optimistic update for network errors - keep the UI updated
        // as the user has already seen the notifications
      } else {
        // Revert optimistic update on other types of errors
        setNotifications(currentNotifications);
        setUnreadCount(currentUnreadCount);
      }
    } finally {
      markingAllRef.current = false;
      setMarkingAllAsSeen(false);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch(
        `${API_ENDPOINTS.NOTIFICATIONS.DELETE(notificationId)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setNotifications((prev) =>
          prev.filter((n) => n._id !== notificationId)
        );
        setUnreadCount((prev) => {
          const notification = notifications.find(
            (n) => n._id === notificationId
          );
          return notification?.status === "PENDING"
            ? Math.max(0, prev - 1)
            : prev;
        });
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    // Listen for pending notifications when user comes online
    const handlePendingNotifications = (data: {
      notifications: Notification[];
      count: number;
    }) => {
      setNotifications((prev) => {
        const existingIds = new Set(prev.map((n) => n._id));
        const newNotifications = data.notifications.filter(
          (n) => !existingIds.has(n._id)
        );
        return [...newNotifications, ...prev];
      });
      setUnreadCount((prev) => prev + data.count);
    };

    // Listen for new messages to update unread count
    const handleNewMessage = (data: {
      id?: string;
      content: string;
      senderId: string;
      receiverId?: string;
      timestamp?: string;
      senderName: string;
      senderAvatar?: string;
    }) => {
      // Update unread count when new message is received
      setUnreadCount((prev) => prev + 1);
    };

    socket.on("pending_notifications", handlePendingNotifications);
    socket.on("new_message", handleNewMessage);

    return () => {
      socket.off("pending_notifications", handlePendingNotifications);
      socket.off("new_message", handleNewMessage);
    };
  }, [socket]);

  // Initial fetch
  useEffect(() => {
    const token = getToken();
    if (token) {
      fetchNotifications();
    }
  }, [getToken, fetchNotifications]);

  // Auto-refresh unread count every 30 seconds
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [getToken, fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    loading,
    markingAllAsSeen,
    fetchNotifications,
    fetchUnreadCount,
    markAsSeen,
    markAllAsSeen,
    deleteNotification,
  };
};
