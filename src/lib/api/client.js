/**
 * src/lib/api/client.js
 * Base API client built on Axios.
 * Handles auth token injection, response normalisation, and error mapping.
 */

import axios from 'axios';

// ─── Config ───────────────────────────────────────────────────────────────────

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_VERSION  = 'v1';
const TIMEOUT_MS   = 15_000;

// ─── Axios instance ───────────────────────────────────────────────────────────

export const apiClient = axios.create({
  baseURL:        `${API_BASE_URL}/api/${API_VERSION}`,
  timeout:        TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
    Accept:         'application/json',
  },
  withCredentials: true, // send cookies (refresh token in httpOnly cookie)
});

// ─── Request interceptor — inject access token ────────────────────────────────

apiClient.interceptors.request.use(
  (config) => {
    // Pull token from Zustand store at request time
    // (avoids stale closure from module-level import)
    try {
      const token = getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Store may not be initialised during SSR
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor — error normalisation ───────────────────────────────

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status  = error.response?.status;
    const message = error.response?.data?.message || error.message;

    // 401 — token expired: attempt silent refresh then retry
    if (status === 401 && !error.config._retried) {
      error.config._retried = true;

      try {
        await refreshToken();
        const newToken = getAccessToken();
        if (newToken) {
          error.config.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(error.config);
        }
      } catch {
        // Refresh failed — propagate original error
      }
    }

    // Normalise to a plain error object
    const apiError = new ApiError(status, message, error.response?.data);
    return Promise.reject(apiError);
  }
);

// ─── Error class ──────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(status, message, data = null) {
    super(message);
    this.name    = 'ApiError';
    this.status  = status;
    this.data    = data;
  }

  get isNotFound()     { return this.status === 404; }
  get isUnauthorized() { return this.status === 401; }
  get isForbidden()    { return this.status === 403; }
  get isServerError()  { return this.status >= 500; }
  get isNetworkError() { return !this.status; }
}

// ─── Token helpers ─────────────────────────────────────────────────────────────

function getAccessToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('chakancha_access_token');
}

async function refreshToken() {
  // Dynamic import to avoid circular dependency with store
  const { useStore } = await import('@/store');
  const refreshAccessToken = useStore.getState().refreshAccessToken;
  return refreshAccessToken?.();
}

// ─── Convenience methods ──────────────────────────────────────────────────────

export const api = {
  get:    (url, config = {})         => apiClient.get(url, config).then((r) => r.data),
  post:   (url, data, config = {})   => apiClient.post(url, data, config).then((r) => r.data),
  put:    (url, data, config = {})   => apiClient.put(url, data, config).then((r) => r.data),
  patch:  (url, data, config = {})   => apiClient.patch(url, data, config).then((r) => r.data),
  delete: (url, config = {})         => apiClient.delete(url, config).then((r) => r.data),
};

export default api;