"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

export default function TestAuthPage() {
  const { user, loading, isAuthenticated, getToken } = useAuth();
  const [localStorageData, setLocalStorageData] = useState<{
    token: string | null;
    user: { name: string } | null;
    hasProfile: string | null;
  } | null>(null);

  useEffect(() => {
    // Get localStorage data
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    const hasProfile = localStorage.getItem("hasProfile");

    setLocalStorageData({
      token: token ? `${token.substring(0, 20)}...` : null,
      user: userData ? JSON.parse(userData) : null,
      hasProfile,
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Authentication Test Page
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* AuthContext State */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              AuthContext State
            </h2>
            <div className="space-y-3">
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Loading:
                </span>{" "}
                <span
                  className={loading ? "text-yellow-600" : "text-green-600"}
                >
                  {loading ? "Yes" : "No"}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Is Authenticated:
                </span>{" "}
                <span
                  className={
                    isAuthenticated ? "text-green-600" : "text-red-600"
                  }
                >
                  {isAuthenticated ? "Yes" : "No"}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  User:
                </span>{" "}
                <span className="text-gray-600 dark:text-gray-400">
                  {user ? user.name : "None"}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  User Role:
                </span>{" "}
                <span className="text-gray-600 dark:text-gray-400">
                  {user ? user.role : "None"}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  User Email:
                </span>{" "}
                <span className="text-gray-600 dark:text-gray-400">
                  {user ? user.email : "None"}
                </span>
              </div>
            </div>
          </div>

          {/* LocalStorage Data */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              LocalStorage Data
            </h2>
            <div className="space-y-3">
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Token:
                </span>{" "}
                <span className="text-gray-600 dark:text-gray-400">
                  {localStorageData?.token || "None"}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  User Data:
                </span>{" "}
                <span className="text-gray-600 dark:text-gray-400">
                  {localStorageData?.user ? localStorageData.user.name : "None"}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Has Profile:
                </span>{" "}
                <span className="text-gray-600 dark:text-gray-400">
                  {localStorageData?.hasProfile || "None"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Test Instructions */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            Test Instructions
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800 dark:text-blue-200">
            <li>Login to your account first</li>
            <li>Come back to this page</li>
            <li>Refresh the page (F5 or Ctrl+R)</li>
            <li>Check if the authentication state persists</li>
            <li>
              Both &quot;AuthContext State&quot; and &quot;LocalStorage
              Data&quot; should show the same user information
            </li>
          </ol>
        </div>

        {/* Debug Info */}
        <div className="mt-8 bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Debug Information
          </h3>
          <pre className="text-sm text-gray-600 dark:text-gray-400 overflow-auto">
            {JSON.stringify(
              {
                authContext: {
                  loading,
                  isAuthenticated,
                  user: user
                    ? {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                      }
                    : null,
                },
                localStorage: localStorageData,
              },
              null,
              2
            )}
          </pre>
        </div>
      </div>
    </div>
  );
}
