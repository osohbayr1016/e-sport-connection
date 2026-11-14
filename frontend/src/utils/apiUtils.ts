// API Utility functions for robust production deployment

interface ApiCallOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

/**
 * Robust API call with timeout, retries, and error handling
 */
export const robustApiCall = async (
  url: string,
  options: RequestInit = {},
  config: ApiCallOptions = {}
): Promise<Response> => {
  const { timeout = 15000, retries = 2, retryDelay = 1000 } = config;

  // Never replay a state-changing request just because the server returned 5xx
  // or the connection timed out. The first request may already have succeeded.
  const method = (options.method || "GET").toUpperCase();
  const safeToRetry = ["GET", "HEAD", "OPTIONS"].includes(method);
  const maxRetries = safeToRetry ? Math.max(0, retries) : 0;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const onAbort = () => controller.abort();
    if (options.signal?.aborted) {
      controller.abort();
    } else {
      options.signal?.addEventListener("abort", onAbort, { once: true });
    }

    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      if (response.status < 500 || attempt >= maxRetries) {
        return response;
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (options.signal?.aborted || attempt >= maxRetries) {
        throw lastError;
      }
    } finally {
      clearTimeout(timeoutId);
      options.signal?.removeEventListener("abort", onAbort);
    }

    if (options.signal?.aborted) {
      throw lastError || new Error("Request aborted");
    }
    await new Promise((resolve) => setTimeout(resolve, retryDelay));
  }

  throw lastError || new Error("API call failed after all retries");
};

/**
 * Check if backend is healthy
 */
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const response = await robustApiCall(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/health`,
      {},
      { timeout: 5000, retries: 1 }
    );
    return response.ok;
  } catch (error) {
    console.error("Backend health check failed:", error);
    return false;
  }
};

/**
 * Enhanced fetch with automatic fallback to demo data
 */
export const fetchWithFallback = async <T>(
  url: string,
  fallbackData: T,
  options: RequestInit = {},
  config: ApiCallOptions = {}
): Promise<{ data: T; isFromApi: boolean }> => {
  try {
    const response = await robustApiCall(url, options, config);

    if (response.ok) {
      const data = await response.json();
      return { data: data.success ? data : fallbackData, isFromApi: Boolean(data.success) };
    } else {
      return { data: fallbackData, isFromApi: false };
    }
  } catch {
    return { data: fallbackData, isFromApi: false };
  }
};

/**
 * Get API base URL with fallback
 */
export const getApiBaseUrl = (): string => {
  if (typeof window !== "undefined") {
    // In browser
    if (window.location.hostname === "localhost") {
      return "http://localhost:8000";
    } else {
      return (
        process.env.NEXT_PUBLIC_API_URL ||
        "https://e-sport-connection-0596.onrender.com"
      );
    }
  } else {
    // On server
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  }
};

/**
 * Check if we're in production
 */
export const isProduction = (): boolean => {
  return (
    process.env.NODE_ENV === "production" ||
    (typeof window !== "undefined" && window.location.hostname !== "localhost")
  );
};

/**
 * Log API errors in development, silent in production
 */
export const logApiError = (message: string, error?: any): void => {
  if (!isProduction()) {
    console.error(message, error);
  }
};
