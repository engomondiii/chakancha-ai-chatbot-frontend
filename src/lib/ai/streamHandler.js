/**
 * streamHandler.js
 * Manages real-time streaming of Claude responses.
 * Handles token accumulation, markdown-aware chunking, and abort control.
 */

// ─── Stream state ─────────────────────────────────────────────────────────────

/**
 * Create a new stream state object.
 * Each conversation turn gets a fresh state.
 */
export function createStreamState() {
  return {
    content:       '',       // Full accumulated content so far
    tokens:        [],       // Individual token chunks
    isStreaming:   false,
    isComplete:    false,
    error:         null,
    startTime:     null,
    endTime:       null,
    abortController: null,
  };
}

// ─── StreamHandler class ──────────────────────────────────────────────────────

export class StreamHandler {
  constructor(options = {}) {
    this.onToken      = options.onToken      || (() => {});
    this.onComplete   = options.onComplete   || (() => {});
    this.onError      = options.onError      || (() => {});
    this.onStateChange = options.onStateChange || (() => {});

    this.state           = createStreamState();
    this.abortController = new AbortController();
    this._buffer         = '';   // Partial token buffer for smooth display
    this._flushTimer     = null;
  }

  // ── Control ────────────────────────────────────────────────────────────────

  start() {
    this.state.isStreaming = true;
    this.state.startTime   = Date.now();
    this.state.content     = '';
    this.state.tokens      = [];
    this.onStateChange({ ...this.state });
  }

  abort() {
    this.abortController.abort();
    this._clearFlushTimer();
    this.state.isStreaming = false;
    this.state.isComplete  = false;
    this.onStateChange({ ...this.state });
  }

  // ── Token processing ───────────────────────────────────────────────────────

  /**
   * Process an incoming token from the stream.
   * Accumulates content and fires callbacks.
   */
  processToken(token) {
    if (!this.state.isStreaming) return;

    this.state.content += token;
    this.state.tokens.push(token);

    // Fire the onToken callback with both the delta and full content
    this.onToken(token, this.state.content);
    this.onStateChange({ ...this.state });
  }

  /**
   * Mark the stream as complete.
   */
  complete(result = {}) {
    this._clearFlushTimer();

    this.state.isStreaming = false;
    this.state.isComplete  = true;
    this.state.endTime     = Date.now();

    this.onComplete({
      content:     this.state.content,
      tokens:      this.state.tokens,
      duration:    this.state.endTime - this.state.startTime,
      intent:      result.intent      || null,
      followUps:   result.followUps   || [],
      usage:       result.usage       || null,
      stopReason:  result.stopReason  || null,
    });

    this.onStateChange({ ...this.state });
  }

  /**
   * Handle a streaming error.
   */
  error(err) {
    this._clearFlushTimer();

    this.state.isStreaming = false;
    this.state.isComplete  = false;
    this.state.error       = err;

    this.onError(err);
    this.onStateChange({ ...this.state });
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  _clearFlushTimer() {
    if (this._flushTimer) {
      clearTimeout(this._flushTimer);
      this._flushTimer = null;
    }
  }

  getSignal() {
    return this.abortController.signal;
  }

  getContent() {
    return this.state.content;
  }

  isActive() {
    return this.state.isStreaming;
  }

  getDuration() {
    if (!this.state.startTime) return 0;
    const end = this.state.endTime || Date.now();
    return end - this.state.startTime;
  }
}

// ─── Utility: parse streaming chunks ─────────────────────────────────────────

/**
 * Split a raw SSE data string into clean text chunks.
 * Claude's SDK handles this internally, but useful for custom fetch-based streaming.
 *
 * @param {string} raw - Raw SSE chunk text
 * @returns {string[]} - Array of text delta strings
 */
export function parseSSEChunks(raw) {
  const lines   = raw.split('\n');
  const deltas  = [];

  for (const line of lines) {
    if (!line.startsWith('data: ')) continue;

    const jsonStr = line.slice(6).trim();
    if (jsonStr === '[DONE]') break;

    try {
      const parsed = JSON.parse(jsonStr);

      // Handle different event types
      if (parsed.type === 'content_block_delta') {
        const text = parsed.delta?.text;
        if (text) deltas.push(text);
      }
    } catch {
      // Skip malformed chunks
    }
  }

  return deltas;
}

// ─── Utility: smooth text animation ──────────────────────────────────────────

/**
 * Create a character-by-character reveal queue.
 * Used by StreamingText component for smooth typewriter effect.
 *
 * @param {string}   text       - Text to animate
 * @param {function} onChar     - Called with each character + accumulated text
 * @param {number}   charDelay  - Delay between characters (ms, default: 8)
 * @returns {{ cancel: function }} - Call cancel() to stop
 */
export function createTypewriterQueue(text, onChar, charDelay = 8) {
  let index     = 0;
  let cancelled = false;
  let timer     = null;

  function tick() {
    if (cancelled || index >= text.length) return;

    onChar(text[index], text.slice(0, index + 1));
    index++;

    if (index < text.length) {
      timer = setTimeout(tick, charDelay);
    }
  }

  // Start immediately
  timer = setTimeout(tick, 0);

  return {
    cancel() {
      cancelled = true;
      if (timer) clearTimeout(timer);
    },
    complete() {
      // Jump to end immediately
      cancelled = true;
      if (timer) clearTimeout(timer);
      onChar('', text);
    },
  };
}

// ─── Utility: detect if response contains product suggestions ────────────────

/**
 * Scan streaming content for signals that the AI is about to suggest products.
 * Used by ConversationView to pre-show the SuggestionCards skeleton.
 *
 * @param {string} partialContent - Content accumulated so far
 * @returns {boolean}
 */
export function hasProductSignals(partialContent) {
  const signals = [
    'i recommend',
    'you might enjoy',
    'perfect tea for',
    'suggest trying',
    'nandi hills black',
    'morning mist',
    'purple peak',
    'silver needle',
  ];

  const lower = partialContent.toLowerCase();
  return signals.some((s) => lower.includes(s));
}

/**
 * Detect if the AI response mentions Chakan Tree.
 * Used to trigger the Chakan Tree invitation layer.
 *
 * @param {string} content
 * @returns {boolean}
 */
export function hasChakanTreeSignal(content) {
  const signals = [
    'chakan tree',
    'value chain',
    'referral',
    'become more than a buyer',
    'share tea',
  ];

  const lower = content.toLowerCase();
  return signals.some((s) => lower.includes(s));
}

export default StreamHandler;