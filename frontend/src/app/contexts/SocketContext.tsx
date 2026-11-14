"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { API_ENDPOINTS } from "../../config/api";

interface SocketContextType {
  isConnected: boolean;
  socket: Socket | null;
  sendMessage: (
    receiverId: string,
    content: string,
    replyToId?: string
  ) => void;
  joinMatchRoom: (matchId: string) => void;
  leaveMatchRoom: (matchId: string) => void;
  sendMatchMessage: (matchId: string, content: string) => void;
  updateStatus: (status: "online" | "away" | "busy") => void;
  // Streaming methods
  joinStream: (streamId: string) => void;
  leaveStream: (streamId: string) => void;
  sendStreamMessage: (streamId: string, message: string, replyToId?: string) => void;
  sendStreamReaction: (streamId: string, emoji: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Check backend health using HTTP instead of WebSocket
    const checkBackendHealth = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.HEALTH, {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        });
        setIsConnected(response.ok);
        console.log("🔌 Backend health check:", response.ok ? "Connected" : "Disconnected");
      } catch (error) {
        console.error("🔌 Backend health check failed:", error);
        setIsConnected(false);
      }
    };

    // Initial health check
    checkBackendHealth();

    // Set up periodic health checks every 10 seconds
    const healthCheckInterval = setInterval(checkBackendHealth, 10000);

    // Try WebSocket connection for authenticated users only
    if (isAuthenticated && user) {
      const token = localStorage.getItem("token");
      
      if (token) {
        // Create socket connection with better error handling
        const socket = io(API_ENDPOINTS.HEALTH.replace("/health", ""), {
          auth: { token: token },
          transports: ["websocket", "polling"],
          autoConnect: true,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          timeout: 20000,
        });

        socketRef.current = socket;

        // Connection events
        socket.on("connect", () => {
          setIsConnected(true);
        });

        socket.on("disconnect", (reason) => {
          // Don't set disconnected if backend is still healthy
          if (reason === "io server disconnect") {
            socket.connect();
          }
        });

        socket.on("connect_error", (error) => {
          console.error("🔌 Socket connection error:", error);
          // Don't set disconnected if backend is still healthy
        });

        socket.on("reconnect", (attemptNumber) => {
          setIsConnected(true);
        });

        socket.on("reconnect_error", (error) => {
          console.error("🔌 Reconnection error:", error);
        });
      }
    }

    return () => {
      clearInterval(healthCheckInterval);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []); // Remove dependencies to always attempt connection

  const sendMessage = (
    receiverId: string,
    content: string,
    replyToId?: string
  ) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("send_message", {
        receiverId,
        content,
        replyToId,
      });
    }
  };

  const joinMatchRoom = (matchId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("join_match_room", { matchId });
    }
  };

  const leaveMatchRoom = (matchId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("leave_match_room", { matchId });
    }
  };

  const sendMatchMessage = (matchId: string, content: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("send_match_message", {
        matchId,
        content,
      });
    }
  };

  const updateStatus = (status: "online" | "away" | "busy") => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("update_status", { status });
    }
  };

  // Streaming methods
  const joinStream = (streamId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("join_stream", { streamId });
    }
  };

  const leaveStream = (streamId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("leave_stream", { streamId });
    }
  };

  const sendStreamMessage = (streamId: string, message: string, replyToId?: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("stream_chat_message", {
        streamId,
        message,
        replyToId,
      });
    }
  };

  const sendStreamReaction = (streamId: string, emoji: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("stream_reaction", {
        streamId,
        emoji,
      });
    }
  };

  return (
    <SocketContext.Provider
      value={{
        isConnected,
        socket: socketRef.current,
        sendMessage,
        joinMatchRoom,
        leaveMatchRoom,
        sendMatchMessage,
        updateStatus,
        joinStream,
        leaveStream,
        sendStreamMessage,
        sendStreamReaction,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
}