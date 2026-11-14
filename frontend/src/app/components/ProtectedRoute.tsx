"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requirePlayer?: boolean;
  requireOrganization?: boolean;
  requireProfile?: boolean;
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  requireAuth = true,
  requirePlayer = false,
  requireOrganization = false,
  requireProfile = false,
  redirectTo,
}: ProtectedRouteProps) {
  const { user, isAuthenticated, loading, hasProfile } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (loading) return;

    // If authentication is required and user is not authenticated
    if (requireAuth && !isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    // If player role is required and user is not a player
    if (requirePlayer && user?.role !== "PLAYER") {
      router.push(redirectTo || "/");
      return;
    }

    // If organization role is required and user is not an organization
    if (requireOrganization && user?.role !== "ORGANIZATION") {
      router.push(redirectTo || "/");
      return;
    }

    // If profile is required and player doesn't have a profile
    if (requireProfile && user?.role === "PLAYER" && !hasProfile) {
      router.push("/create-profile");
      return;
    }

    // If profile is required and organization doesn't have a profile
    if (requireProfile && user?.role === "ORGANIZATION" && !hasProfile) {
      router.push("/create-organization-profile");
      return;
    }

    // If user has a profile but is trying to access create-profile page
    if (hasProfile && window.location.pathname === "/create-profile") {
      router.push("/profile");
      return;
    }

    // If user has a profile but is trying to access create-organization-profile page
    if (
      hasProfile &&
      window.location.pathname === "/create-organization-profile"
    ) {
      router.push("/organization-profile");
      return;
    }

    setIsChecking(false);
  }, [
    loading,
    isAuthenticated,
    user,
    hasProfile,
    requireAuth,
    requirePlayer,
    requireOrganization,
    requireProfile,
    redirectTo,
    router,
  ]);

  if (loading || isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="w-8 h-8 text-purple-600 dark:text-green-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Уншиж байна...</p>
        </motion.div>
      </div>
    );
  }

  // If authentication is required and user is not authenticated, don't render children
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  // If player role is required and user is not a player, don't render children
  if (requirePlayer && user?.role !== "PLAYER") {
    return null;
  }

  // If organization role is required and user is not an organization, don't render children
  if (requireOrganization && user?.role !== "ORGANIZATION") {
    return null;
  }

  // If profile is required and player doesn't have a profile, don't render children
  if (requireProfile && user?.role === "PLAYER" && !hasProfile) {
    return null;
  }

  // If profile is required and organization doesn't have a profile, don't render children
  if (requireProfile && user?.role === "ORGANIZATION" && !hasProfile) {
    return null;
  }

  return <>{children}</>;
}
