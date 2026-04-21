/**
 * src/lib/api/client.js
 * Base Axios client — Integration Phase 1.
 *
 * SSE fix summary (two headers removed from createSSEStream):
 *  - 'Cache-Control': 'no-cache'   → caused CORS preflight failure:
 *    non-simple header not in Django's CORS_ALLOW_HEADERS, browser blocked POST
 *  - 'Accept': 'text/event-stream' → caused HTTP 406 Not Acceptable:
 *    DRF uses Accept to pick a renderer; text/event-stream is not registered,
 *    so DRF rejected the request before the StreamingHttpResponse view ran
 * Both headers are unnecessary — StreamingHttpResponse bypasses DRF renderers.
 */

import axios from 'axios';

// ─── Config ───────────────────────────────────────────────────────────────────

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_VERSION  = 'v1';
const TIMEOUT_MS   = 20_000;

const TOKEN_KEY   = 'chakancha_access_token';
const SESSION_KEY = 'chakancha_session_id';

// ─── Session ID ───────────────────────────────────────────────────────────────

export function getSessionId() {
  if (typeof window === 'undefined') return null;
  let id = window.localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function clearSessionId() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(SESSION_KEY);
}

// ─── Axios instance ───────────────────────────────────────────────────────────

export const apiClient = axios.create({
  baseURL:         `${API_BASE_URL}/api/${API_VERSION}/`,
  timeout:         TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
    'Accept':       'application/json',
  },
  withCredentials: false,
});

// ─── Request interceptor ─────────────────────────────────────────────────────

apiClient.interceptors.request.use(
  (config) => {
    try {
      const token = getAccessToken();
      if (token) config.headers['Authorization'] = `Bearer ${token}`;
    } catch { /* SSR */ }

    try {
      const sessionId = getSessionId();
      if (sessionId) config.headers['X-Session-Id'] = sessionId;
    } catch { /* SSR */ }

    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor ────────────────────────────────────────────────────

apiClient.interceptors.response.use(
  (response) => response,

  async (error) => {
    const status   = error.response?.status;
    const respData = error.response?.data;

    let message = 'Something went wrong. Please try again.';

    if (respData) {
      if (typeof respData.detail === 'string') {
        message = respData.detail;
      } else if (typeof respData.error === 'string') {
        message = respData.error;
      } else if (typeof respData.message === 'string') {
        message = respData.message;
      } else if (respData.errors && typeof respData.errors === 'object') {
        const firstField = Object.keys(respData.errors)[0];
        const firstError = respData.errors[firstField];
        message = Array.isArray(firstError) ? firstError[0] : String(firstError);
      } else if (typeof respData === 'string') {
        message = respData;
      }
    } else if (error.message) {
      message = error.message;
    }

    if (status === 401 && !error.config._retried) {
      error.config._retried = true;
      try {
        const refreshed = await _silentRefresh();
        if (refreshed) {
          const newToken = getAccessToken();
          error.config.headers['Authorization'] = `Bearer ${newToken}`;
          return apiClient(error.config);
        }
      } catch { /* fall through */ }
    }

    return Promise.reject(new ApiError(status, message, respData));
  }
);

// ─── Error class ──────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(status, message, data = null) {
    super(message);
    this.name   = 'ApiError';
    this.status = status;
    this.data   = data;
  }

  get isNotFound()     { return this.status === 404; }
  get isUnauthorized() { return this.status === 401; }
  get isForbidden()    { return this.status === 403; }
  get isValidation()   { return this.status === 400; }
  get isServerError()  { return this.status >= 500; }
  get isNetworkError() { return !this.status; }

  get fieldErrors() {
    if (!this.data?.errors) return {};
    const out = {};
    for (const [field, errors] of Object.entries(this.data.errors)) {
      out[field] = Array.isArray(errors) ? errors[0] : String(errors);
    }
    return out;
  }
}

// ─── Token helpers ────────────────────────────────────────────────────────────

export function getAccessToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

async function _silentRefresh() {
  try {
    const { useStore } = await import('@/store');
    const refreshAccessToken = useStore.getState().refreshAccessToken;
    if (!refreshAccessToken) return false;
    const result = await refreshAccessToken();
    return result?.success === true;
  } catch {
    return false;
  }
}

// ─── Convenience methods ──────────────────────────────────────────────────────

export const api = {
  get:    (url, config = {})       => apiClient.get(url, config).then((r) => r.data),
  post:   (url, data, config = {}) => apiClient.post(url, data, config).then((r) => r.data),
  put:    (url, data, config = {}) => apiClient.put(url, data, config).then((r) => r.data),
  patch:  (url, data, config = {}) => apiClient.patch(url, data, config).then((r) => r.data),
  delete: (url, config = {})       => apiClient.delete(url, config).then((r) => r.data),
};

// ─── SSE Streaming helper ─────────────────────────────────────────────────────
/**
 * createSSEStream
 * Opens a streaming POST to /api/v1/ai/stream/ and yields parsed JSON events.
 *
 * Headers sent: Content-Type: application/json, X-Session-Id, Authorization.
 * No Accept or Cache-Control — both cause Django/DRF to reject the request.
 *
 * Yields event objects: { type, content? } | { type, products? } |
 *                       { type, url? } | { type, intent?, follow_ups?, ... }
 */
export async function* createSSEStream(payload) {
  const token     = getAccessToken();
  const sessionId = getSessionId();

  const headers = {
    'Content-Type': 'application/json',
    'X-Session-Id': sessionId || '',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(
      `${API_BASE_URL}/api/${API_VERSION}/ai/stream/`,
      {
        method:  'POST',
        headers,
        body:    JSON.stringify(payload),
      }
    );
  } catch {
    throw new ApiError(undefined, 'Network error — please check your connection.');
  }

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      errData?.error || errData?.detail || errData?.message || `Stream failed (${response.status})`,
      errData,
    );
  }

  const reader  = response.body.getReader();
  const decoder = new TextDecoder();
  let   buffer  = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Split on double newline — the SSE event separator
    const blocks = buffer.split('\n\n');
    buffer = blocks.pop(); // keep the incomplete trailing chunk

    for (const block of blocks) {
      const trimmed = block.trim();
      if (!trimmed) continue;

      // Find the data: line within the block
      const dataLine = trimmed.split('\n').find((l) => l.startsWith('data: '));
      if (!dataLine) continue;

      const jsonStr = dataLine.slice(6).trim();
      if (!jsonStr || jsonStr === '[DONE]') continue;

      try {
        const event = JSON.parse(jsonStr);
        yield event;
        // Stop iterating after terminal events
        if (event.type === 'done' || event.type === 'error') return;
      } catch {
        // Malformed JSON — skip this chunk silently
      }
    }
  }
}

export default api;