/**
 * checkoutQuote.test.mjs — regression guard for the checkout price quote.
 *
 * BUG THIS EXISTS TO PREVENT
 *   fetchCheckoutQuote() called `apiClient.post(...)`, but orders.js imports
 *   only the default `api` helper — `apiClient` was never in scope. Every call
 *   threw ReferenceError, the catch swallowed it and returned null, and the
 *   checkout Order Summary silently fell back to the local Redux estimate:
 *   $5 flat shipping, 0% tax, and no referral benefit ($25.00 instead of
 *   $25.20). The cart drawer was correct throughout, so the two surfaces
 *   disagreed. Nothing failed loudly.
 *
 * WHAT IS ASSERTED
 *   - a complete backend quote is returned and used verbatim
 *   - an incomplete quote (older backend, no discount/tax/total) returns null
 *     so the caller falls back cleanly rather than rendering NaN
 *   - a network/API error returns null
 *   - the fields OrderSummary renders equal the canonical Kenya figures and
 *     never the legacy $5 shipping
 *
 * HOW TO RUN
 *   The frontend has no test framework. This file is bundled with esbuild and
 *   executed with node; see `npm run test:quote`. A real runner (vitest) would
 *   be the better long-term home for it.
 */

import { fetchCheckoutQuote, isUsableQuote } from '../orders.js';
import { __setNext } from '../client.js';

const COMPLETE = {
  subtotal: '20.00', discount: '1.00', shipping_cost: '3.00',
  tax: '3.20', total: '25.20',
  discount_label: 'Referral benefit', currency: 'USD',
};

// What an older backend returns from /checkout/initialize/ — truthy, but not a quote.
const LEGACY = { subtotal: '20.00', item_count: 1, shipping: {}, can_proceed: true };

let pass = 0, fail = 0;
function check(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  ok ? pass++ : fail++;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}`);
  if (!ok) console.log(`        got=${JSON.stringify(got)}  want=${JSON.stringify(want)}`);
}

async function main() {
  // ── isUsableQuote ────────────────────────────────────────────────────────
  check('guard: complete quote',            isUsableQuote(COMPLETE), true);
  check('guard: legacy shape rejected',     isUsableQuote(LEGACY),   false);
  check('guard: null rejected',             isUsableQuote(null),     false);
  check('guard: zero discount still valid',
        isUsableQuote({ ...COMPLETE, discount: '0.00' }), true);
  check('guard: non-numeric total rejected',
        isUsableQuote({ ...COMPLETE, total: 'abc' }), false);
  check('guard: empty-string field rejected',
        isUsableQuote({ ...COMPLETE, discount: '' }), false);

  // ── fetchCheckoutQuote branches ──────────────────────────────────────────
  __setNext(COMPLETE, null);
  check('complete backend quote -> used', await fetchCheckoutQuote('KE', ''), COMPLETE);

  __setNext(LEGACY, null);
  check('incomplete quote -> null (fallback)', await fetchCheckoutQuote('KE', ''), null);

  __setNext(null, new Error('Network Error'));
  check('network error -> null (fallback)', await fetchCheckoutQuote('KE', ''), null);

  __setNext(undefined, null);
  check('undefined body -> null (fallback)', await fetchCheckoutQuote('KE', ''), null);

  // ── the exact values OrderSummary renders ────────────────────────────────
  __setNext(COMPLETE, null);
  const q = await fetchCheckoutQuote('KE', '');
  const rendered = {
    subtotal: Number(q.subtotal), discount: Number(q.discount),
    shipping: Number(q.shipping_cost), tax: Number(q.tax), total: Number(q.total),
  };
  check('checkout renders canonical Kenya figures', rendered,
        { subtotal: 20, discount: 1, shipping: 3, tax: 3.2, total: 25.2 });
  check('legacy $5 shipping never shown with a quote', rendered.shipping === 5, false);
  check('referral benefit label present', q.discount_label, 'Referral benefit');

  console.log(`\n  ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}

main();
