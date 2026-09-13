import test from "node:test";
import assert from "node:assert/strict";

import {
  CHECKING, REVIEW_WITHDRAWAL, WITHDRAW_WHEN_AVAILABLE,
  checkFromError, checkFromQuote, checkKey, checkPending, decideWithdrawState,
} from "../withdrawState.js";

const money = (minor, display, currency = "USD") => ({ minor, display, currency });

// John's production state on 13 Sep 2026: $1.43 available, $1.90 pending, a verified Kenyan bank account.
const kenya = {
  id: "dest-ke", status: "VERIFIED", country: "KE", countryName: "Kenya",
  currency: "KES", currencyName: "Kenyan Shilling", last4: "0937", methodLabel: "Bank account",
};
const johnBalance = {
  available: money(143, "$1.43"), pending: money(190, "$1.90"), minimumPayout: money(100, "$1.00"),
  blockedReasons: [], nextMaturityAt: "2027-03-10T04:59:41Z",
};
const formatDate = (iso) => (iso ? "10 March 2027" : "");
const johnKey = checkKey(kenya.id, 143);

// The body the backend returned for this state, generated from the Wise sandbox.
const sourceMinimum = {
  code: "source_minimum",
  context: {
    available: money(143, "$1.43"), provider_minimum: money(218, "$2.18"),
    target_currency_name: "Kenyan Shilling", country_name: "Kenya",
  },
};

function john(check) {
  return decideWithdrawState({
    balance: johnBalance, destinations: [kenya], destinationId: kenya.id,
    openRequest: null, review: null, check, formatDate,
  });
}

test("John: a saved Kenyan account and $1.43 gets an explicit, disabled next step", () => {
  const state = john(checkFromError(johnKey, sourceMinimum));
  assert.equal(state.kind, "amount_too_small");
  assert.deepEqual(state.action, { label: WITHDRAW_WHEN_AVAILABLE, enabled: false });
  assert.equal(state.saved, "Your Kenya bank account ••••0937 is saved.");
  assert.match(state.message, /Kenyan Shilling withdrawals need a larger amount/);
  assert.match(state.message, /smallest withdrawal to this account is currently \$2\.18, and you have \$1\.43/);
  assert.match(state.message, /Nothing is wrong with your account/);
  assert.match(state.message, /More earnings become available on 10 March 2027/);
});

test("John: nothing technical, and no suggestion to switch the currency", () => {
  const { message, saved } = john(checkFromError(johnKey, sourceMinimum));
  for (const text of [message, saved]) {
    assert.ok(!/\bwise\b|sourceAmount|error\.quote|\bACH\b|swift|provider/i.test(text), text);
    assert.ok(!/in USD instead|switch to USD|receive USD/i.test(text), text);
  }
});

test("while the account is being checked the action is visible but disabled", () => {
  assert.deepEqual(john(null).action, { label: CHECKING, enabled: false });
  assert.deepEqual(john(checkPending(johnKey)).action, { label: CHECKING, enabled: false });
  // A check for another balance or account is not this one.
  assert.equal(john(checkFromQuote(checkKey(kenya.id, 9999), {})).kind, "checking");
});

test("$100 with a valid quote offers Review withdrawal", () => {
  const state = decideWithdrawState({
    balance: { ...johnBalance, available: money(10000, "$100.00") },
    destinations: [kenya], destinationId: kenya.id,
    check: checkFromQuote(checkKey(kenya.id, 10000), { quoteId: "q" }),
  });
  assert.equal(state.kind, "ready");
  assert.deepEqual(state.action, { label: REVIEW_WITHDRAWAL, enabled: true, intent: "review" });
});

test("below the Chakancha minimum the action no longer disappears", () => {
  const state = decideWithdrawState({
    balance: { ...johnBalance, available: money(50, "$0.50"), blockedReasons: ["BELOW_MINIMUM"] },
    destinations: [kenya], destinationId: kenya.id, formatDate,
  });
  assert.equal(state.kind, "below_minimum");
  assert.deepEqual(state.action, { label: WITHDRAW_WHEN_AVAILABLE, enabled: false });
  assert.match(state.message, /minimum withdrawal is \$1\.00\. You currently have \$0\.50 available/);
  assert.match(state.saved, /is saved/);
});

test("a recipient minimum stated in the receiving currency is shown as stated, never converted", () => {
  const state = john(checkFromError(johnKey, {
    code: "recipient_minimum",
    context: { available: money(143, "$1.43"), provider_minimum: money(10000, "KSh 100.00", "KES"),
               target_currency_name: "Kenyan Shilling" },
  }));
  assert.match(state.message, /Your bank must receive at least KSh 100\.00, and you have \$1\.43 available/);
});

test("a minimum the backend did not state is not invented", () => {
  const state = john(checkFromError(johnKey, { code: "source_minimum", context: { available: money(143, "$1.43") } }));
  assert.match(state.message, /You have \$1\.43 available/);
  assert.ok(!/smallest withdrawal/.test(state.message));
});

test("an unavailable destination keeps the account and offers another", () => {
  const state = john(checkFromError(johnKey, { code: "corridor_unavailable", context: { country_name: "Kenya" } }));
  assert.equal(state.kind, "destination_unavailable");
  assert.equal(state.action.enabled, false);
  assert.deepEqual(state.secondary, { label: "Add another bank account", intent: "add_bank" });
  assert.match(state.saved, /is saved/);
});

test("a temporary failure can be retried from the card", () => {
  const state = john(checkFromError(johnKey, {
    code: "provider_temporarily_unavailable", message: "The connection was interrupted. Nothing was sent. Please try again.",
  }));
  assert.equal(state.kind, "check_failed");
  assert.deepEqual(state.action, { label: "Try again", enabled: true, intent: "retry" });
  assert.match(state.message, /Nothing was sent/);
});

test("no account, an open withdrawal and an open review keep their own states", () => {
  assert.equal(decideWithdrawState({ balance: johnBalance, destinations: [] }).action.intent, "add_bank");
  assert.equal(decideWithdrawState({ balance: johnBalance, destinations: [kenya], openRequest: { id: "r" } }).kind, "open");
  assert.equal(decideWithdrawState({ balance: johnBalance, destinations: [kenya], review: { quote: {} } }).kind, "review");
});
