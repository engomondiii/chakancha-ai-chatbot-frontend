/**
 * validation.test.mjs — the checkout steps advance for every payment method.
 *
 * BUG THIS EXISTS TO PREVENT
 *   validatePayment() exempted PayPal by name and let everything else fall
 *   through to the card rules, which demand a name on card. When the Wise
 *   method was added it was never added to that exemption, so selecting Wise
 *   produced { cardName: 'Required' } — for a field that does not exist on the
 *   Wise panel. The error had nowhere to render, so Continue did nothing at
 *   all: no message, no highlighted field, no way forward. The order could not
 *   be placed and nothing said why.
 *
 * WHAT IS ASSERTED
 *   - every non-card method advances with no fields filled in
 *   - card still requires the name we collect locally
 *   - a method nobody has invented yet advances too, which is the property
 *     that makes this class of bug impossible rather than merely fixed
 *
 * HOW TO RUN
 *   node --test "src/components/checkout/__tests__/*.test.mjs"
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { validatePayment, validateShipping } from '../validation.js';

const COMPLETE_SHIPPING = {
  firstName: 'A', lastName: 'B', email: 'a@b.com',
  address1: '1 Test Rd', city: 'Nairobi', postalCode: '00100', country: 'KE',
};

test('Wise advances with nothing filled in — the reported bug', () => {
  assert.deepEqual(validatePayment({ method: 'wise' }), {});
});

test('PayPal advances with nothing filled in', () => {
  assert.deepEqual(validatePayment({ method: 'paypal' }), {});
});

test('a payment method that does not exist yet still advances', () => {
  // The point of the allow-list: adding a method cannot silently dead-end the
  // button again, because only 'card' is ever asked for card fields.
  assert.deepEqual(validatePayment({ method: 'some-future-rail' }), {});
});

test('card still needs the name we collect locally', () => {
  assert.deepEqual(validatePayment({ method: 'card' }), { cardName: 'Required' });
  assert.deepEqual(validatePayment({ method: 'card', cardName: '   ' }),
                   { cardName: 'Required' });
  assert.deepEqual(validatePayment({ method: 'card', cardName: 'A Buyer' }), {});
});

test('a missing method is treated as not-card and advances', () => {
  // Defensive: the selector always sets one, but an undefined method must not
  // resurrect the dead button.
  assert.deepEqual(validatePayment({}), {});
});

test('shipping validation is unchanged', () => {
  assert.deepEqual(validateShipping(COMPLETE_SHIPPING), {});
  assert.deepEqual(
    validateShipping({ ...COMPLETE_SHIPPING, city: '' }),
    { city: 'Required' },
  );
});
