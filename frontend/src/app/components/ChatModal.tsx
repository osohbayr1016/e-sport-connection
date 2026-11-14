"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Send,
  MessageCircle,
  Check,
  CheckCheck,
  Copy,
  Reply,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useSocket } from "../contexts/SocketContext";
import Image from "next/image";
import { API_ENDPOINTS } from "../../config/api";

type MessageStatus = "SENT" | "DELIVERED" | "READ";

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  status?: MessageStatus;
  isRead?: boolean;
  createdAt: string;
  replyToId?: string;
  replyTo?: {
    id: string;
    content: string;
    sender: {
      name: string;
    };
  };
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
  receiver: {
    id: string;
    name: string;
    avatar?: string;
  };
}

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerId: string;
  playerName: string;
  playerAvatar?: string;
}

export default function ChatModal({
  isOpen,
  onClose,
  playerId,
  playerName,
  playerAvatar,
}: ChatModalProps) {
  const { user } = useAuth();
  const {
    sendMessage: socketSendMessage,
    sendTypingStart,
    sendTypingStop,
    markMessageAsRead,
    isConnected,
  } = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [error, setError] = useState("");
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [hoveredMessage, setHoveredMessage] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(isConnected);
  const [lastSeen, setLastSeen] = useState<Date | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom("smooth");
    }
  }, [messages, scrollToBottom]);

  const fetchMessages = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Authentication required. Please log in again.");
        return;
      }

      const response = await fetch(`/api/messages/${playerId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError("Authentication expired. Please log in again.");
          return;
        }

        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Failed to fetch messages (${response.status})`
        );
      }

      const data = await response.json();
      if (data.success) {
        setMessages(data.messages || []);
        // Scroll to bottom after loading messages
        setTimeout(() => scrollToBottom("auto"), 100);
      } else {
        throw new Error(data.message || "Failed to load messages");
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load messages"
      );
    } finally {
      setLoading(false);
    }
  }, [user, playerId, scrollToBottom]);

  // Fetch user status
  const fetchUserStatus = useCallback(async () => {
    if (!user) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`/api/users/profile/${playerId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          setIsOnline(data.user.isOnline || false);
          if (data.user.lastSeen) {
            setLastSeen(new Date(data.user.lastSeen));
          }
        }
      }
    } catch (error) {
      console.error("Error fetching user status:", error);
    }
  }, [user, playerId]);

  useEffect(() => {
    if (isOpen && user) {
      fetchMessages();
      fetchUserStatus();
      // Mark messages as read when chat is opened
      markMessageAsRead(playerId);
    }
  }, [
    isOpen,
    user,
    fetchMessages,
    fetchUserStatus,
    markMessageAsRead,
    playerId,
  ]);

  // Real-time message handling
  useEffect(() => {
    const handleNewMessage = (event: CustomEvent) => {
      const messageData = event.detail;

      // Only add message if it's from the current chat partner
      if (messageData.senderId === playerId) {
        const newMessage: Message = {
          id: messageData.id || Date.now().toString(),
          content: messageData.content,
          senderId: messageData.senderId,
          receiverId: messageData.receiverId || user?.id || "",
          status: messageData.status || "SENT",
          isRead: messageData.isRead || false,
          createdAt: messageData.timestamp || new Date().toISOString(),
          replyToId: messageData.replyToId,
          replyTo: messageData.replyTo,
          sender: messageData.sender || {
            id: messageData.senderId,
            name: playerName,
            avatar: playerAvatar,
          },
          receiver: messageData.receiver || {
            id: user?.id || "",
            name: user?.name || "",
            avatar: user?.avatar,
          },
        };

        setMessages((prev) => [...prev, newMessage]);
      }
    };

    const handleUserTyping = (event: CustomEvent) => {
      const { userId } = event.detail;
      if (userId === playerId) {
        setOtherUserTyping(true);
        setTimeout(() => setOtherUserTyping(false), 3000);
      }
    };

    const handleUserStoppedTyping = (event: CustomEvent) => {
      const { userId } = event.detail;
      if (userId === playerId) {
        setOtherUserTyping(false);
      }
    };

    const handleUserStatusChanged = (event: CustomEvent) => {
      const { userId, status } = event.detail;
      if (userId === playerId) {
        setIsOnline(status === "online");
        if (status !== "online") {
          setLastSeen(new Date());
        }
      }
    };

    const handleUserOffline = (event: CustomEvent) => {
      const { userId } = event.detail;
      if (userId === playerId) {
        setIsOnline(false);
        setLastSeen(new Date());
      }
    };

    const handleMessageRead = (event: CustomEvent) => {
      const { readerId } = event.detail;
      if (readerId === playerId) {
        // Update all messages from this user to READ status
        setMessages((prev) =>
          prev.map((msg) =>
            msg.receiverId === playerId && msg.senderId === user?.id
              ? { ...msg, status: "READ" as MessageStatus, isRead: true }
              : msg
          )
        );
      }
    };

    const handleMessageDelivered = (event: CustomEvent) => {
      const { receiverId, messageId } = event.detail;
      if (receiverId === playerId) {
        // Update specific message to DELIVERED status
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId || msg.receiverId === receiverId
              ? { ...msg, status: "DELIVERED" as MessageStatus }
              : msg
          )
        );
      }
    };

    window.addEventListener("new_message", handleNewMessage as EventListener);
    window.addEventListener("user_typing", handleUserTyping as EventListener);
    window.addEventListener(
      "user_stopped_typing",
      handleUserStoppedTyping as EventListener
    );
    window.addEventListener(
      "user_status_changed",
      handleUserStatusChanged as EventListener
    );
    window.addEventListener("user_offline", handleUserOffline as EventListener);
    window.addEventListener("message_read", handleMessageRead as EventListener);
    window.addEventListener(
      "message_delivered",
      handleMessageDelivered as EventListener
    );

    return () => {
      window.removeEventListener(
        "new_message",
        handleNewMessage as EventListener
      );
      window.removeEventListener(
        "user_typing",
        handleUserTyping as EventListener
      );
      window.removeEventListener(
        "user_stopped_typing",
        handleUserStoppedTyping as EventListener
      );
      window.removeEventListener(
        "user_status_changed",
        handleUserStatusChanged as EventListener
      );
      window.removeEventListener(
        "user_offline",
        handleUserOffline as EventListener
      );
      window.removeEventListener(
        "message_read",
        handleMessageRead as EventListener
      );
      window.removeEventListener(
        "message_delivered",
        handleMessageDelivered as EventListener
      );
    };
  }, [playerId, playerName, playerAvatar, user]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    try {
      setSending(true);
      setError("");

      const messageContent = newMessage.trim();
      const replyToId = replyingTo?.id;

      // Send via WebSocket if connected
      if (isConnected) {
        // Send message with replyToId if replying
        if (replyToId) {
          socketSendMessage(playerId, messageContent, replyToId);
        } else {
          socketSendMessage(playerId, messageContent);
        }

        // Add message to local state immediately for instant feedback
        const tempMessage: Message = {
          id: Date.now().toString(),
          content: messageContent,
          senderId: user.id,
          receiverId: playerId,
          status: "SENT",
          createdAt: new Date().toISOString(),
          replyToId,
          replyTo: replyingTo
            ? {
                id: replyingTo.id,
                content: replyingTo.content,
                sender: {
                  name: replyingTo.sender.name,
                },
              }
            : undefined,
          sender: {
            id: user.id,
            name: user.name,
            avatar: user.avatar,
          },
          receiver: {
            id: playerId,
            name: playerName,
            avatar: playerAvatar,
          },
        };

        setMessages((prev) => [...prev, tempMessage]);
        setNewMessage("");
        setReplyingTo(null);
        setSending(false);
        // Scroll to bottom immediately after sending
        setTimeout(() => scrollToBottom("smooth"), 50);
        return;
      }

      // Fallback to REST API if WebSocket is not connected
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Authentication required. Please log in again.");
        return;
      }

      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          receiverId: playerId,
          content: messageContent,
          ...(replyToId && { replyToId }),
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError("Authentication expired. Please log in again.");
          return;
        }

        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Failed to send message (${response.status})`
        );
      }

      const data = await response.json();

      if (data.success) {
        setMessages((prev) => [...prev, data.data]);
        setNewMessage("");
        setReplyingTo(null);
        // Scroll to bottom immediately after sending
        setTimeout(() => scrollToBottom("smooth"), 50);
      } else {
        throw new Error(data.message || "Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setError(
        error instanceof Error ? error.message : "Failed to send message"
      );
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMessage(value);

    // Handle typing indicators
    if (isConnected) {
      if (value && !isTyping) {
        setIsTyping(true);
        sendTypingStart(playerId);
      } else if (!value && isTyping) {
        setIsTyping(false);
        sendTypingStop(playerId);
      }

      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set timeout to stop typing indicator
      if (value) {
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
          sendTypingStop(playerId);
        }, 2000);
      }
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatLastSeen = (date: Date) => {
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

  const copyMessage = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      console.error("Failed to copy message:", error);
    }
  };

  const handleReply = (message: Message) => {
    setReplyingTo(message);
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  const getMessageStatus = (status?: MessageStatus, isRead?: boolean) => {
    if (isRead || status === "READ") return "READ";
    if (status === "DELIVERED") return "DELIVERED";
    return "SENT";
  };

  if (!user) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md h-[600px] flex flex-col border border-gray-200 dark:border-gray-700 theme-transition"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 theme-transition">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Image
                    src={playerAvatar || "/default-avatar.png"}
                    alt={playerName}
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                  />
                  <div
                    className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${
                      isOnline ? "bg-green-500" : "bg-gray-400"
                    }`}
                  ></div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white theme-transition">
                    {playerName}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 theme-transition">
                    {otherUserTyping ? (
                      <span className="text-green-600 dark:text-green-400">
                        typing...
                      </span>
                    ) : isOnline ? (
                      <span className="text-green-600 dark:text-green-400">
                        Online
                      </span>
                    ) : lastSeen ? (
                      `Last seen ${formatLastSeen(lastSeen)}`
                    ) : (
                      "Offline"
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div
              className="flex-1 overflow-y-auto p-4 space-y-4 theme-transition scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent"
              style={{
                scrollBehavior: "smooth",
                scrollbarWidth: "thin",
              }}
            >
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 dark:border-green-400"></div>
                </div>
              ) : error ? (
                <div className="text-center text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((message) => {
                  const isOwnMessage = message.senderId === user.id;
                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${
                        isOwnMessage ? "justify-end" : "justify-start"
                      } mb-4`}
                    >
                      <div
                        className={`flex ${
                          isOwnMessage ? "flex-row-reverse" : "flex-row"
                        } items-end space-x-2 max-w-xs lg:max-w-md relative group`}
                        onMouseEnter={() => setHoveredMessage(message.id)}
                        onMouseLeave={() => setHoveredMessage(null)}
                      >
                        {/* Avatar for other user's messages */}
                        {!isOwnMessage && (
                          <div className="flex-shrink-0">
                            <Image
                              src={playerAvatar || "/default-avatar.png"}
                              alt={playerName}
                              width={32}
                              height={32}
                              className="rounded-full object-cover"
                            />
                          </div>
                        )}

                        <div className="flex flex-col">
                          {/* Message bubble */}
                          <div
                            className={`px-4 py-3 rounded-2xl theme-transition shadow-sm ${
                              isOwnMessage
                                ? "bg-purple-600 dark:bg-green-600 text-white rounded-br-md"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md"
                            }`}
                          >
                            {/* Quoted message */}
                            {message.replyTo && (
                              <div
                                className={`mb-2 pb-2 border-l-2 pl-2 text-xs opacity-80 ${
                                  isOwnMessage
                                    ? "border-purple-300 dark:border-green-300"
                                    : "border-gray-400 dark:border-gray-500"
                                }`}
                              >
                                <p className="font-semibold">
                                  {message.replyTo.sender.name}
                                </p>
                                <p className="truncate">
                                  {message.replyTo.content}
                                </p>
                              </div>
                            )}

                            <p className="text-sm leading-relaxed">
                              {message.content}
                            </p>

                            <div className="flex items-center justify-between mt-1">
                              <p
                                className={`text-xs theme-transition ${
                                  isOwnMessage
                                    ? "text-purple-200 dark:text-green-200"
                                    : "text-gray-500 dark:text-gray-400"
                                }`}
                              >
                                {formatTime(message.createdAt)}
                              </p>

                              {/* Read receipts for own messages */}
                              {isOwnMessage && (
                                <div className="ml-2">
                                  {getMessageStatus(
                                    message.status,
                                    message.isRead
                                  ) === "READ" ? (
                                    <CheckCheck className="w-4 h-4 text-blue-400" />
                                  ) : getMessageStatus(
                                      message.status,
                                      message.isRead
                                    ) === "DELIVERED" ? (
                                    <CheckCheck className="w-4 h-4 text-gray-300" />
                                  ) : (
                                    <Check className="w-4 h-4 text-gray-300" />
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Message actions */}
                          {hoveredMessage === message.id && (
                            <div
                              className={`flex items-center space-x-1 mt-1 ${
                                isOwnMessage ? "justify-end" : "justify-start"
                              }`}
                            >
                              <button
                                onClick={() => handleReply(message)}
                                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                                title="Reply"
                              >
                                <Reply className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                              </button>
                              <button
                                onClick={() =>
                                  copyMessage(message.content, message.id)
                                }
                                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                                title="Copy"
                              >
                                <Copy className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                              </button>
                              {copiedMessageId === message.id && (
                                <span className="text-xs text-green-600 dark:text-green-400">
                                  Copied!
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Avatar for own messages */}
                        {isOwnMessage && (
                          <div className="flex-shrink-0">
                            <Image
                              src={user.avatar || "/default-avatar.png"}
                              alt={user.name}
                              width={32}
                              height={32}
                              className="rounded-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}

              {/* Typing indicator */}
              {otherUserTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start mb-4"
                >
                  <div className="flex items-end space-x-2 max-w-xs lg:max-w-md">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <Image
                        src={playerAvatar || "/default-avatar.png"}
                        alt={playerName}
                        width={32}
                        height={32}
                        className="rounded-full object-cover"
                      />
                    </div>

                    {/* Typing bubble */}
                    <div className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-3 rounded-2xl rounded-bl-md shadow-sm">
                      <div className="flex items-center space-x-1">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                          {playerName} is typing...
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 dark:border-gray-700 theme-transition">
              {/* Reply preview */}
              {replyingTo && (
                <div className="px-4 pt-3 pb-2 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Reply className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                          Replying to {replyingTo.sender.name}
                        </p>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate pl-5">
                        {replyingTo.content}
                      </p>
                    </div>
                    <button
                      onClick={cancelReply}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>
                </div>
              )}

              <div className="p-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white theme-transition placeholder-gray-500 dark:placeholder-gray-400"
                    disabled={sending}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="p-2 bg-purple-600 dark:bg-green-600 text-white rounded-full hover:bg-purple-700 dark:hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 theme-transition"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
