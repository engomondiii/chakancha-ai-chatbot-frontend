/**
 * src/lib/api/client.js
 * Base Axios client — Integration Phase 1.
 *
 * What changed from the original:
 *  - baseURL now explicitly appends trailing slash to match Django's
 *    APPEND_SLASH=True behaviour (avoids 301 redirects that strip POST bodies)
 *  - Response interceptor extracts error detail from Django/DRF error shapes:
 *      { detail: "..." }          ← DRF default
 *      { errors: { field: [] } }  ← serializer validation
 *      { message: "..." }         ← custom views
 *      { error: "..." }           ← custom views
 *  - getAccessToken reads from localStorage key 'chakancha_access_token'
 *    (matches TOKEN_STORAGE_KEY in authSlice.js)
 *  - refreshToken calls the Zustand store's refreshAccessToken action
 *  - SSE helper added: createSSEStream() for the /ai/stream/ endpoint
 *  - x-session-id header helper: setSessionId() / getSessionId()
 *  - ApiError.fieldErrors property extracts DRF validation errors per-field
 */

import axios from 'axios';

// ─── Config ───────────────────────────────────────────────────────────────────

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_VERSION  = 'v1';
const TIMEOUT_MS   = 20_000; // 20s — AI responses can be slow

// Storage keys — must match authSlice.js
const TOKEN_KEY   = 'chakancha_access_token';
const SESSION_KEY = 'chakancha_session_id';

// ─── Session ID ───────────────────────────────────────────────────────────────
// The AI agent uses session_id to maintain conversation context.
// Generated once per browser session, persisted to localStorage.

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
    'Accept':        'application/json',
  },
  withCredentials: false, // JWT in Authorization header — not httpOnly cookies
});

// ─── Request interceptor — inject tokens ─────────────────────────────────────

apiClient.interceptors.request.use(
  (config) => {
    // Inject JWT access token
    try {
      const token = getAccessToken();
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    } catch {
      // SSR — window not available
    }

    // Inject session ID for AI chat context
    try {
      const sessionId = getSessionId();
      if (sessionId) {
        config.headers['X-Session-Id'] = sessionId;
      }
    } catch {
      // SSR
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor — error normalisation ───────────────────────────────

apiClient.interceptors.response.use(
  // Success — return response as-is (caller uses .then(r => r.data))
  (response) => response,

  async (error) => {
    const status   = error.response?.status;
    const respData = error.response?.data;

    // ── Extract the most useful error message from Django/DRF responses ───────
    // DRF validation errors: { errors: { field: ["msg"] } }
    // DRF detail errors:     { detail: "Not found." }
    // Custom views:          { error: "..." } or { message: "..." }
    let message = 'Something went wrong. Please try again.';

    if (respData) {
      if (typeof respData.detail === 'string') {
        message = respData.detail;
      } else if (typeof respData.error === 'string') {
        message = respData.error;
      } else if (typeof respData.message === 'string') {
        message = respData.message;
      } else if (respData.errors && typeof respData.errors === 'object') {
        // First field's first error message
        const firstField = Object.keys(respData.errors)[0];
        const firstError = respData.errors[firstField];
        message = Array.isArray(firstError) ? firstError[0] : String(firstError);
      } else if (typeof respData === 'string') {
        message = respData;
      }
    } else if (error.message) {
      message = error.message;
    }

    // ── 401 — silently attempt token refresh then retry original request ──────
    if (status === 401 && !error.config._retried) {
      error.config._retried = true;
      try {
        const refreshed = await _silentRefresh();
        if (refreshed) {
          const newToken = getAccessToken();
          error.config.headers['Authorization'] = `Bearer ${newToken}`;
          return apiClient(error.config);
        }
      } catch {
        // Refresh also failed — fall through to ApiError
      }
    }

    const apiError = new ApiError(status, message, respData);
    return Promise.reject(apiError);
  }
);

// ─── Error class ──────────────────────────────────────────────────────────────

export class ApiError extends Error {
  /**
   * @param {number|undefined} status  - HTTP status code
   * @param {string}           message - Human-readable message
   * @param {object|null}      data    - Raw response body
   */
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

  /**
   * fieldErrors — returns { field: "first error message" } for form use.
   * Works with DRF serializer validation errors shape:
   *   { errors: { email: ["Already taken."], password: ["Too short."] } }
   */
  get fieldErrors() {
    if (!this.data?.errors) return {};
    const out = {};
    for (const [field, errors] of Object.entries(this.data.errors)) {
      out[field] = Array.isArray(errors) ? errors[0] : String(errors);
    }
    return out;
  }
}

// ─── Token helpers ─────────────────────────────────────────────────────────────

export function getAccessToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

async function _silentRefresh() {
  try {
    // Dynamic import prevents circular dependency: store → client → store
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
 * Opens an SSE connection to POST /api/v1/ai/stream/
 * Returns an AsyncGenerator that yields parsed event objects.
 *
 * The backend sends events in this format:
 *   data: {"type": "token",    "content": "Hello"}
 *   data: {"type": "products", "products": [...]}
 *   data: {"type": "image",    "url": "https://..."}
 *   data: {"type": "done",     "session_id": "...", "intent": "...", ...}
 *   data: {"type": "error",    "message": "..."}
 *
 * Usage:
 *   for await (const event of createSSEStream(payload)) {
 *     if (event.type === 'token') appendText(event.content);
 *     if (event.type === 'done')  finalise(event);
 *   }
 */
export async function* createSSEStream(payload) {
  const token     = getAccessToken();
  const sessionId = getSessionId();

  const headers = {
    'Content-Type':  'application/json',
    'Accept':        'text/event-stream',
    'Cache-Control': 'no-cache',
    'X-Session-Id':  sessionId || '',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(
    `${API_BASE_URL}/api/${API_VERSION}/ai/stream/`,
    {
      method:  'POST',
      headers,
      body:    JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      errData?.error || errData?.detail || 'Stream request failed',
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

    // SSE lines end with \n\n — split and process complete events
    const lines = buffer.split('\n\n');
    buffer = lines.pop(); // Keep incomplete last chunk

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;

      const jsonStr = trimmed.slice(6); // strip "data: "
      try {
        const event = JSON.parse(jsonStr);
        yield event;
        if (event.type === 'done' || event.type === 'error') return;
      } catch {
        // Malformed JSON — skip
      }
    }
  }
}

export default api;