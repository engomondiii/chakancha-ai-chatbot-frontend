/**
 * intentDetection.js
 * Lightweight client-side intent classifier.
 * Categorises user messages to power contextual UI, Chakan Tree signals,
 * and product suggestion rendering — without an extra API call.
 */

// ─── Intent definitions ───────────────────────────────────────────────────────

export const INTENTS = {
  DISCOVERY:    'discovery',
  ORIGIN:       'origin',
  IMPACT:       'impact',
  BREWING:      'brewing',
  PRODUCTS:     'products',
  CHAKAN_TREE:  'chakanTree',
  ORDER:        'order',
  SHIPPING:     'shipping',
  ACCOUNT:      'account',
  GENERAL:      'general',
};

// ─── Keyword maps ──────────────────────────────────────────────────────────────

const INTENT_PATTERNS = [
  {
    intent:   INTENTS.CHAKAN_TREE,
    weight:   10,
    keywords: [
      'chakan tree', 'join', 'referral', 'community', 'participate',
      'become more', 'value chain', 'reward', 'share tea', 'invite',
    ],
  },
  {
    intent:   INTENTS.IMPACT,
    weight:   9,
    keywords: [
      'living wage', 'impact', 'tea picker', 'fair', 'ethical',
      'transparency', 'supply chain', 'worker', 'farmer', 'poverty',
      'how much', 'percentage', 'donate', 'mission', 'purpose',
    ],
  },
  {
    intent:   INTENTS.ORIGIN,
    weight:   8,
    keywords: [
      'nandi hills', 'origin', 'where', 'estate', 'farm', 'kenya',
      'altitude', 'elevation', 'soil', 'climate', 'grow', 'harvest',
      'traceability', 'trace', 'single origin', 'field', 'plantation',
    ],
  },
  {
    intent:   INTENTS.BREWING,
    weight:   7,
    keywords: [
      'brew', 'steep', 'temperature', 'water', 'how to make', 'prepare',
      'minutes', 'teaspoon', 'grams', 'cup', 'pot', 'infuse',
      'cold brew', 'iced', 'milk tea', 'resteep', 'reuse',
    ],
  },
  {
    intent:   INTENTS.ORDER,
    weight:   7,
    keywords: [
      'order', 'buy', 'purchase', 'add to cart', 'checkout',
      'price', 'cost', 'how much', 'payment', 'pay', 'subscribe',
      'subscription', 'gift', 'send', 'deliver to',
    ],
  },
  {
    intent:   INTENTS.SHIPPING,
    weight:   6,
    keywords: [
      'ship', 'shipping', 'delivery', 'arrive', 'how long', 'days',
      'international', 'dhl', 'track', 'tracking', 'country',
      'customs', 'duty', 'free shipping',
    ],
  },
  {
    intent:   INTENTS.PRODUCTS,
    weight:   6,
    keywords: [
      'tea', 'black tea', 'green tea', 'white tea', 'purple tea',
      'oolong', 'blend', 'product', 'collection', 'range',
      'nandi gold', 'nandi black', 'morning mist', 'silver needle',
      'purple peak', 'what teas', 'available', 'stock',
    ],
  },
  {
    intent:   INTENTS.DISCOVERY,
    weight:   5,
    keywords: [
      'recommend', 'suggestion', 'which tea', 'find', 'help me choose',
      'for me', 'taste', 'flavor', 'prefer', 'mood', 'morning',
      'evening', 'relax', 'energy', 'caffeine', 'sleep',
    ],
  },
  {
    intent:   INTENTS.ACCOUNT,
    weight:   4,
    keywords: [
      'account', 'login', 'sign in', 'sign up', 'register',
      'profile', 'password', 'email', 'my orders', 'history',
    ],
  },
];

// ─── Core classifier ──────────────────────────────────────────────────────────

/**
 * Detect the primary intent of a user message.
 * Scoring: each matching keyword adds the pattern's weight.
 *
 * @param {string} userMessage     - The user's raw message
 * @param {string} [aiResponse=''] - The AI's response (optional; improves accuracy)
 * @returns {Promise<string>}      - One of the INTENTS values
 */
export async function detectIntent(userMessage, aiResponse = '') {
  const text = `${userMessage} ${aiResponse}`.toLowerCase();

  const scores = {};

  for (const pattern of INTENT_PATTERNS) {
    let score = 0;

    for (const keyword of pattern.keywords) {
      if (text.includes(keyword)) {
        score += pattern.weight;

        // Bonus: keyword appears in user message specifically
        if (userMessage.toLowerCase().includes(keyword)) {
          score += 2;
        }
      }
    }

    if (score > 0) {
      scores[pattern.intent] = (scores[pattern.intent] || 0) + score;
    }
  }

  // Return the highest scoring intent, or 'general' if no match
  const entries = Object.entries(scores);
  if (entries.length === 0) return INTENTS.GENERAL;

  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}

/**
 * Detect multiple intents (for multi-topic messages).
 *
 * @param {string} userMessage
 * @returns {string[]} - Sorted array of intents, most relevant first
 */
export function detectMultipleIntents(userMessage) {
  const text = userMessage.toLowerCase();
  const scores = {};

  for (const pattern of INTENT_PATTERNS) {
    let score = 0;

    for (const keyword of pattern.keywords) {
      if (text.includes(keyword)) {
        score += pattern.weight;
      }
    }

    if (score > 0) {
      scores[pattern.intent] = score;
    }
  }

  const entries = Object.entries(scores);
  if (entries.length === 0) return [INTENTS.GENERAL];

  return entries
    .sort((a, b) => b[1] - a[1])
    .map(([intent]) => intent);
}

// ─── Chakan Tree readiness ─────────────────────────────────────────────────────

/**
 * Assess whether the conversation is ready for a Chakan Tree introduction.
 * Based on the design doc: only introduce after visitor understands
 * tea quality → origin → supply chain → CKC credibility.
 *
 * @param {Array}  messages        - Full conversation history
 * @param {string} currentIntent   - Latest detected intent
 * @returns {{ ready: boolean, layer: 1|2|3, reason: string }}
 */
export function assessChakanTreeReadiness(messages, currentIntent) {
  const intents = messages
    .filter((m) => m.intent)
    .map((m) => m.intent);

  const hasDiscoveredTea    = intents.includes(INTENTS.DISCOVERY) || intents.includes(INTENTS.PRODUCTS);
  const hasLearnedOrigin    = intents.includes(INTENTS.ORIGIN);
  const hasExploredImpact   = intents.includes(INTENTS.IMPACT);
  const isAskingAboutChakan = currentIntent === INTENTS.CHAKAN_TREE;
  const messageCount        = messages.filter((m) => m.type === 'user').length;

  // Layer 3 — explicit ask
  if (isAskingAboutChakan) {
    return { ready: true, layer: 3, reason: 'user_asked' };
  }

  // Layer 2 — has gone through the journey + asking about impact/sharing
  if (
    hasDiscoveredTea &&
    hasLearnedOrigin &&
    hasExploredImpact &&
    messageCount >= 4
  ) {
    return { ready: true, layer: 2, reason: 'journey_complete' };
  }

  // Layer 1 — subtle awareness after 3+ messages
  if (messageCount >= 3 && (hasDiscoveredTea || hasExploredImpact)) {
    return { ready: true, layer: 1, reason: 'early_awareness' };
  }

  return { ready: false, layer: 0, reason: 'too_early' };
}

// ─── Product suggestion signals ───────────────────────────────────────────────

/**
 * Determine if the response context warrants showing product cards.
 *
 * @param {string} intent
 * @param {Array}  messages
 * @returns {boolean}
 */
export function shouldShowProductSuggestions(intent, messages) {
  const productIntents = [
    INTENTS.DISCOVERY,
    INTENTS.PRODUCTS,
    INTENTS.ORDER,
  ];

  if (productIntents.includes(intent)) return true;

  // Also show after 2+ messages even on general intent
  const userCount = messages.filter((m) => m.type === 'user').length;
  return userCount >= 2 && intent !== INTENTS.ACCOUNT;
}

// ─── Intent → UI config ───────────────────────────────────────────────────────

/**
 * Get UI configuration for a given intent.
 * Used by ConversationView to adjust the interface.
 */
export function getIntentUIConfig(intent) {
  const configs = {
    [INTENTS.DISCOVERY]:   { color: '#4A7C2C', label: 'Tea Discovery',   emoji: '🍃' },
    [INTENTS.ORIGIN]:      { color: '#6B5544', label: 'Origin Story',    emoji: '🗺️' },
    [INTENTS.IMPACT]:      { color: '#D63031', label: 'Impact & Values', emoji: '❤️' },
    [INTENTS.BREWING]:     { color: '#D4A574', label: 'Brewing Guide',   emoji: '☕' },
    [INTENTS.PRODUCTS]:    { color: '#2D5016', label: 'Our Teas',        emoji: '🫖' },
    [INTENTS.CHAKAN_TREE]: { color: '#2D5016', label: 'Chakan Tree',     emoji: '🌳' },
    [INTENTS.ORDER]:       { color: '#D4A574', label: 'Order',           emoji: '🛒' },
    [INTENTS.SHIPPING]:    { color: '#B8C5D6', label: 'Shipping',        emoji: '📦' },
    [INTENTS.ACCOUNT]:     { color: '#8B8C5A', label: 'Account',         emoji: '👤' },
    [INTENTS.GENERAL]:     { color: '#B8C5D6', label: 'Chat',            emoji: '💬' },
  };

  return configs[intent] || configs[INTENTS.GENERAL];
}

export default {
  INTENTS,
  detectIntent,
  detectMultipleIntents,
  assessChakanTreeReadiness,
  shouldShowProductSuggestions,
  getIntentUIConfig,
};