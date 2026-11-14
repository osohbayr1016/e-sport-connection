"use client";

import { useState } from "react";
import { API_ENDPOINTS } from "../../config/api";

export default function TestApiPage() {
  const [testResults, setTestResults] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    const results: Record<string, unknown> = {};

    try {
      // Test 1: Health check
      console.log("Testing health endpoint...");
      const healthResponse = await fetch(API_ENDPOINTS.HEALTH);
      results.health = {
        status: healthResponse.status,
        ok: healthResponse.ok,
        data: await healthResponse.json().catch(() => "Failed to parse JSON"),
      };

      // Test 2: Player profiles endpoint
      console.log("Testing player profiles endpoint...");
      const profilesResponse = await fetch(API_ENDPOINTS.PLAYER_PROFILES.ALL);
      results.profiles = {
        status: profilesResponse.status,
        ok: profilesResponse.ok,
        data: await profilesResponse.json().catch(() => "Failed to parse JSON"),
      };

      // Test 3: Test endpoint
      console.log("Testing test endpoint...");
      const testResponse = await fetch(
        `${API_BASE_URL}/api/player-profiles/test`
      );
      results.test = {
        status: testResponse.status,
        ok: testResponse.ok,
        data: await testResponse.json().catch(() => "Failed to parse JSON"),
      };

      // Test 4: CORS test
      console.log("Testing CORS endpoint...");
      const corsResponse = await fetch(`${API_BASE_URL}/api/test-cors`);
      results.cors = {
        status: corsResponse.status,
        ok: corsResponse.ok,
        data: await corsResponse.json().catch(() => "Failed to parse JSON"),
      };
    } catch (error) {
      results.error = error;
    }

    setTestResults(results);
    setLoading(false);
  };

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    (typeof window !== "undefined" && window.location.hostname !== "localhost"
      ? "https://e-sport-connection-0596.onrender.com"
      : "http://localhost:8000");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          API Test Page
        </h1>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            API Configuration
          </h2>
          <div className="space-y-2 text-sm">
            <p>
              <strong>API Base URL:</strong> {API_BASE_URL}
            </p>
            <p>
              <strong>Health Endpoint:</strong> {API_ENDPOINTS.HEALTH}
            </p>
            <p>
              <strong>Player Profiles Endpoint:</strong>{" "}
              {API_ENDPOINTS.PLAYER_PROFILES.ALL}
            </p>
          </div>
        </div>

        <button
          onClick={runTests}
          disabled={loading}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 mb-6"
        >
          {loading ? "Running Tests..." : "Run API Tests"}
        </button>

        {Object.keys(testResults).length > 0 && (
          <div className="space-y-4">
            {Object.entries(testResults).map(
              ([testName, result]: [string, unknown]) => {
                const typedResult = result as {
                  status: number;
                  ok: boolean;
                  data: unknown;
                };
                return (
                  <div
                    key={testName}
                    className="bg-white dark:bg-gray-800 rounded-lg p-6"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {testName.toUpperCase()} Test
                    </h3>
                    <div className="space-y-2">
                      <p>
                        <strong>Status:</strong> {typedResult.status}
                      </p>
                      <p>
                        <strong>OK:</strong> {typedResult.ok ? "✅" : "❌"}
                      </p>
                      <p>
                        <strong>Data:</strong>
                      </p>
                      <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded text-sm overflow-auto">
                        {JSON.stringify(typedResult.data, null, 2)}
                      </pre>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>
    </div>
  );
}
