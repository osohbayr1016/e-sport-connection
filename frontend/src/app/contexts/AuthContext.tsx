"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { API_ENDPOINTS } from "../../config/api";

interface User {
  id: string;
  email: string;
  name: string;
  role: "PLAYER" | "ORGANIZATION" | "COACH" | "ADMIN";
  isVerified: boolean;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  hasProfile: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    role: string
  ) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  refreshToken: () => Promise<void>;
  checkProfileStatus: () => Promise<void>;
  getToken: () => string | null;
  validateToken: () => Promise<boolean>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Token management utilities
const getStoredToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
};

const setStoredToken = (token: string): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem("token", token);
  }
};

const removeStoredToken = (): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("hasProfile");
  }
};

const getStoredUser = (): User | null => {
  if (typeof window !== "undefined") {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch (error) {
        console.error("Error parsing user data:", error);
        removeStoredToken();
        return null;
      }
    }
  }
  return null;
};

const setStoredUser = (user: User): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem("user", JSON.stringify(user));
  }
};

const getStoredHasProfile = (): boolean => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("hasProfile") === "true";
  }
  return false;
};

const setStoredHasProfile = (hasProfile: boolean): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem("hasProfile", hasProfile.toString());
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);

  // Check if user is already logged in on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
      const token = getStoredToken();
      const userData = getStoredUser();
      const storedHasProfile = getStoredHasProfile();

      // Always set user from localStorage first to prevent logout on refresh
      if (token && userData) {
        setUser(userData);
        setHasProfile(storedHasProfile);
      }

      // Only validate token if we have both token and user data
      if (token && userData) {
        try {
          // First check if backend is accessible
          const healthResponse = await fetch(API_ENDPOINTS.HEALTH, {
            signal: AbortSignal.timeout(3000), // 3 second timeout
          });

          if (!healthResponse.ok) {
            // Keep user logged in if backend is not accessible
            // Don't return, continue with token validation but be more lenient
          }

          // Validate token with server in the background with retry
          let response;
          let retryCount = 0;
          const maxRetries = 2;

          while (retryCount < maxRetries) {
            try {
              response = await fetch(API_ENDPOINTS.AUTH.ME, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
                signal: AbortSignal.timeout(5000),
              });
              break; // Success, exit retry loop
            } catch (error) {
              retryCount++;
              if (retryCount >= maxRetries) {
                return; // Keep user logged in after max retries
              }
              // Wait a bit before retrying
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }
          }

          // If we get here without a response, keep user logged in
          if (!response) {
            return;
          }

          if (response.ok) {
            const data = await response.json();
            // Update user with fresh data from server
            const freshUser = data.data?.user || data.user;
            if (freshUser) {
              setUser(freshUser);
              setStoredUser(freshUser);
            }

            // If user is a player or organization, check profile status
            if (
              freshUser?.role === "PLAYER" ||
              freshUser?.role === "ORGANIZATION"
            ) {
              // Check profile status after setting user
              setTimeout(() => {
                checkProfileStatus();
              }, 100);
            }
          } else if (response.status === 401 || response.status === 403) {
            // Try to refresh the token first
            try {
              const refreshResponse = await fetch(API_ENDPOINTS.AUTH.REFRESH, {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
                signal: AbortSignal.timeout(5000),
              });

              if (refreshResponse.ok) {
                const refreshData = await refreshResponse.json();
                setStoredToken(refreshData.token);
                setStoredUser(refreshData.user);
                setUser(refreshData.user);
              } else {
                removeStoredToken();
                setUser(null);
                setHasProfile(false);
              }
            } catch (refreshError) {
              removeStoredToken();
              setUser(null);
              setHasProfile(false);
            }
          } else {
            // For other server errors, keep the user logged in
            // This includes 500, 502, 503, etc.
          }
        } catch (error) {
          console.error("🔍 AuthContext: Error validating token:", error);
          // On network error, keep the user logged in with stored data
          // Only clear if it's a specific authentication error
          if (
            error instanceof Error &&
            (error.message.includes("401") || error.message.includes("403"))
          ) {
            removeStoredToken();
            setUser(null);
            setHasProfile(false);
          }
          // For network errors, keep the user logged in
        }
      } else {
      }
      } finally {
        // Always unblock the app, including when the legacy backend times out.
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();

        let errorMessage = "Нэвтрэхэд алдаа гарлаа";
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          console.error("Failed to parse error response:", e);
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Нэвтрэхэд алдаа гарлаа");
      }

      setStoredToken(data.token);
      setStoredUser(data.user);
      setUser(data.user);

      // Check profile status for players and organizations
      if (data.user.role === "PLAYER" || data.user.role === "ORGANIZATION") {
        await checkProfileStatus();
      }
    } catch (error: unknown) {
      console.error("❌ Login error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Нэвтрэхэд алдаа гарлаа";
      throw new Error(errorMessage);
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role: string
  ) => {
    try {
      const response = await fetch(API_ENDPOINTS.AUTH.REGISTER, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password, role }),
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();

        let errorMessage = "Бүртгүүлэхэд алдаа гарлаа";
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          console.error("Failed to parse error response:", e);
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Бүртгүүлэхэд алдаа гарлаа");
      }

      setStoredToken(data.token);
      setStoredUser(data.user);
      setUser(data.user);

      // For new players and organizations, they don't have a profile yet
      if (data.user.role === "PLAYER" || data.user.role === "ORGANIZATION") {
        setHasProfile(false);
        setStoredHasProfile(false);
      }
    } catch (error: unknown) {
      console.error("❌ Registration error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Бүртгүүлэхэд алдаа гарлаа";
      throw new Error(errorMessage);
    }
  };

  const logout = useCallback(async () => {
    try {
      const token = getStoredToken();
      if (token) {
        // Call logout endpoint to update server state
        await fetch(API_ENDPOINTS.AUTH.LOGOUT, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      removeStoredToken();
      setUser(null);
      setHasProfile(false);
    }
  }, []);

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      setStoredUser(updatedUser);
    }
  };

  const refreshToken = useCallback(async () => {
    try {
      const token = getStoredToken();
      if (!token) {
        throw new Error("No token available");
      }

      const response = await fetch(API_ENDPOINTS.AUTH.REFRESH, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Token refresh failed");
      }

      setStoredToken(data.token);
      setStoredUser(data.user);
      setUser(data.user);
    } catch (error) {
      console.error("Token refresh error:", error);
      // If refresh fails, clear user data
      removeStoredToken();
      setUser(null);
      setHasProfile(false);
      throw error;
    }
  }, []);

  const getToken = (): string | null => {
    const token = getStoredToken();
    return token;
  };

  const validateToken = async (): Promise<boolean> => {
    const token = getStoredToken();
    if (!token) return false;

    try {
      const response = await fetch(API_ENDPOINTS.AUTH.ME, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error("Token validation error:", error);
      return false;
    }
  };

  useEffect(() => {
    if (!user) return;

    const refreshInterval = setInterval(async () => {
      try {
        await refreshToken();
      } catch (error) {
        console.error("Automatic token refresh failed:", error);
        // If refresh fails, logout the user
        await logout();
      }
    }, 6 * 24 * 60 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, [user, refreshToken, logout]);

  const checkProfileStatus = useCallback(async () => {
    const currentUser = user || getStoredUser();
    if (
      !currentUser ||
      (currentUser.role !== "PLAYER" && currentUser.role !== "ORGANIZATION")
    ) {
      setHasProfile(false);
      setStoredHasProfile(false);
      return;
    }

    try {
      const token = getStoredToken();
      if (!token) return;

      const endpoint =
        currentUser.role === "PLAYER"
          ? API_ENDPOINTS.PLAYER_PROFILES.HAS_PROFILE
          : API_ENDPOINTS.ORGANIZATION_PROFILES.HAS_PROFILE;

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setHasProfile(data.hasProfile);
        setStoredHasProfile(data.hasProfile);
      }
    } catch (error) {
      console.error("Error checking profile status:", error);
      // Don't set hasProfile to false on network errors, keep the stored value
      if (error instanceof Error && error.message.includes("401")) {
        setHasProfile(false);
        setStoredHasProfile(false);
      }
    }
  }, [user]);

  // Only check profile status when user changes and is not null
  useEffect(() => {
    if (user && (user.role === "PLAYER" || user.role === "ORGANIZATION")) {
      checkProfileStatus();
    }
  }, [user?.id, user?.role]); // Only depend on user ID and role changes

  const value = {
    user,
    loading,
    hasProfile,
    login,
    register,
    logout,
    updateUser,
    refreshToken,
    checkProfileStatus,
    getToken,
    validateToken,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
