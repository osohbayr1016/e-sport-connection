"use client";

import { useState } from "react";
import { API_ENDPOINTS } from "../../../config/api";

export default function TestNewsPage() {
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const testFetchNews = async () => {
    setLoading(true);
    try {
      console.log("Testing fetch news from:", API_ENDPOINTS.NEWS.ALL);
      const response = await fetch(API_ENDPOINTS.NEWS.ALL);
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testCreateNews = async () => {
    setLoading(true);
    try {
      const testData = {
        title: "Test News Article",
        description: "This is a test news article",
        content: "This is the content of the test news article.",
        image:
          "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop",
        type: "update",
        category: "Game Updates",
        author: "Test Author",
        readTime: "2 min read",
        tags: ["test", "news"],
      };

      console.log("Testing create news with data:", testData);
      const response = await fetch(API_ENDPOINTS.NEWS.ALL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testData),
      });

      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">News API Test</h1>

      <div className="space-y-4 mb-8">
        <button
          onClick={testFetchNews}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          {loading ? "Testing..." : "Test Fetch News"}
        </button>

        <button
          onClick={testCreateNews}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50 ml-4"
        >
          {loading ? "Testing..." : "Test Create News"}
        </button>
      </div>

      {result && (
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-xl font-bold mb-4">Result:</h2>
          <pre className="text-sm overflow-auto">{result}</pre>
        </div>
      )}
    </div>
  );
}
