/**
 * src/lib/ai/streamHandler.js — Integration Phase 2
 *
 * What changed from the original:
 *  - parseSSEChunks() updated to handle the backend's event format:
 *      {"type": "token",    "content": "..."}
 *      {"type": "products", "products": [...]}
 *      {"type": "image",    "url": "..."}
 *      {"type": "metadata", "intent": "...", "follow_ups": [...], "tokens_used": N}
 *      {"type": "done",     "session_id": "...", ...}
 *      {"type": "error",    "message": "..."}
 *  - StreamHandler class updated: onProducts and onImage callbacks added
 *  - hasProductSignals() still works client-side but is now supplemented
 *    by the real 'products' SSE event from the backend
 *  - Everything else unchanged
 */

// ─── Stream state ─────────────────────────────────────────────────────────────

export function createStreamState() {
  return {
    content:         '',
    tokens:          [],
    products:        [],      // From 'products' SSE event
    generatedImage:  null,    // From 'image' SSE event
    isStreaming:     false,
    isComplete:      false,
    error:           null,
    startTime:       null,
    endTime:         null,
    abortController: null,
  };
}

// ─── StreamHandler class ──────────────────────────────────────────────────────

export class StreamHandler {
  constructor(options = {}) {
    this.onToken       = options.onToken       || (() => {});
    this.onProducts    = options.onProducts    || (() => {});
    this.onImage       = options.onImage       || (() => {});
    this.onComplete    = options.onComplete    || (() => {});
    this.onError       = options.onError       || (() => {});
    this.onStateChange = options.onStateChange || (() => {});

    this.state           = createStreamState();
    this.abortController = new AbortController();
    this._flushTimer     = null;
  }

  start() {
    this.state.isStreaming = true;
    this.state.startTime   = Date.now();
    this.state.content     = '';
    this.state.tokens      = [];
    this.state.products    = [];
    this.state.generatedImage = null;
    this.onStateChange({ ...this.state });
  }

  abort() {
    this.abortController.abort();
    this._clearFlushTimer();
    this.state.isStreaming = false;
    this.onStateChange({ ...this.state });
  }

  // ── Token ──────────────────────────────────────────────────────────────────
  processToken(token) {
    if (!this.state.isStreaming) return;
    this.state.content += token;
    this.state.tokens.push(token);
    this.onToken(token, this.state.content);
    this.onStateChange({ ...this.state });
  }

  // ── Products (Phase 2 — from backend 'products' SSE event) ────────────────
  processProducts(products) {
    this.state.products = products;
    this.onProducts(products);
    this.onStateChange({ ...this.state });
  }

  // ── Image (Phase 2 — from backend 'image' SSE event) ──────────────────────
  processImage(imageUrl) {
    this.state.generatedImage = imageUrl;
    this.onImage(imageUrl);
    this.onStateChange({ ...this.state });
  }

  // ── Complete ───────────────────────────────────────────────────────────────
  complete(result = {}) {
    this._clearFlushTimer();
    this.state.isStreaming = false;
    this.state.isComplete  = true;
    this.state.endTime     = Date.now();

    this.onComplete({
      content:        this.state.content,
      tokens:         this.state.tokens,
      products:       this.state.products,
      generatedImage: this.state.generatedImage,
      duration:       this.state.endTime - this.state.startTime,
      intent:         result.intent      || null,
      followUps:      result.followUps   || [],
      usage:          result.usage       || null,
    });

    this.onStateChange({ ...this.state });
  }

  error(err) {
    this._clearFlushTimer();
    this.state.isStreaming = false;
    this.state.isComplete  = false;
    this.state.error       = err;
    this.onError(err);
    this.onStateChange({ ...this.state });
  }

  _clearFlushTimer() {
    if (this._flushTimer) {
      clearTimeout(this._flushTimer);
      this._flushTimer = null;
    }
  }

  getSignal()    { return this.abortController.signal; }
  getContent()   { return this.state.content; }
  isActive()     { return this.state.isStreaming; }
  getDuration()  {
    if (!this.state.startTime) return 0;
    return (this.state.endTime || Date.now()) - this.state.startTime;
  }
}

// ─── parseSSEChunks — updated for backend event format ───────────────────────

/**
 * Parse raw SSE data string into structured event objects.
 * Handles the backend's event format (all events are JSON objects with a "type" field).
 *
 * Backend emits:
 *   data: {"type": "token",    "content": "Hello"}
 *   data: {"type": "products", "products": [...]}
 *   data: {"type": "image",    "url": "https://..."}
 *   data: {"type": "metadata", "intent": "...", ...}
 *   data: {"type": "done",     ...}
 *   data: {"type": "error",    "message": "..."}
 *
 * @param {string} raw - Raw SSE chunk text (may contain multiple events)
 * @returns {Array}    - Array of parsed event objects
 */
export function parseSSEChunks(raw) {
  const events = [];
  const lines  = raw.split('\n\n');

  for (const block of lines) {
    const trimmed = block.trim();
    if (!trimmed || !trimmed.startsWith('data: ')) continue;

    const jsonStr = trimmed.slice(6).trim();
    if (jsonStr === '[DONE]') break;

    try {
      const event = JSON.parse(jsonStr);
      if (event && event.type) {
        events.push(event);
      }
    } catch {
      // Skip malformed chunks
    }
  }

  return events;
}

// ─── createTypewriterQueue — unchanged ───────────────────────────────────────

export function createTypewriterQueue(text, onChar, charDelay = 8) {
  let index     = 0;
  let cancelled = false;
  let timer     = null;

  function tick() {
    if (cancelled || index >= text.length) return;
    onChar(text[index], text.slice(0, index + 1));
    index++;
    if (index < text.length) timer = setTimeout(tick, charDelay);
  }

  timer = setTimeout(tick, 0);

  return {
    cancel()   { cancelled = true; if (timer) clearTimeout(timer); },
    complete() { cancelled = true; if (timer) clearTimeout(timer); onChar('', text); },
  };
}

// ─── Signal helpers — unchanged ───────────────────────────────────────────────

export function hasProductSignals(partialContent) {
  const signals = [
    'i recommend', 'you might enjoy', 'perfect tea for',
    'suggest trying', 'nandi hills black', 'morning mist',
    'purple peak', 'silver needle',
  ];
  const lower = partialContent.toLowerCase();
  return signals.some((s) => lower.includes(s));
}

export function hasChakanTreeSignal(content) {
  const signals = [
    'chakan tree', 'value chain', 'referral',
    'become more than a buyer', 'share tea',
  ];
  const lower = content.toLowerCase();
  return signals.some((s) => lower.includes(s));
}

export default StreamHandler;