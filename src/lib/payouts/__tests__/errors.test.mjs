/**
 * errors.test.mjs — payout API failures in the member's words.
 *
 * Run: npm run test:payouts
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  describeBlockCode, describePayoutError, errorCode, GENERIC_MESSAGE,
  NEEDS_RECONFIRMATION_MESSAGE, reconfirmReasons,
} from "../errors.js";

function apiError(status, data) {
  return Object.assign(new Error("server said something"), { name: "ApiError", status, data });
}

const money = (display) => ({ minor: 1, display, currency: "USD" });

test("below minimum names the minimum and what the member has", () => {
  const err = apiError(422, { code: "below_minimum", context: { minimum: money("$1.00"), available: money("$0.40") } });
  assert.equal(describePayoutError(err).message,
    "The minimum withdrawal is $1.00. You currently have $0.40 available.");
});

test("below minimum degrades without context", () => {
  const err = apiError(422, { blocked_reasons: ["BELOW_MINIMUM"] });
  assert.equal(describePayoutError(err).message, "Your available balance is below the minimum withdrawal.");
});

test("the $1.43 KES case is an amount limit, not an unsupported currency", () => {
  const err = apiError(422, {
    code: "recipient_minimum", detail: "The smallest amount a recipient can get is 100 KES.",
    context: { available: money("$1.43"), target_currency: "KES", target_currency_name: "Kenyan Shilling" },
  });
  const { message } = describePayoutError(err);
  assert.equal(message,
    "Kenyan Shilling payouts aren't available for this withdrawal amount. You currently have $1.43 available.");
  assert.ok(!/100 KES/.test(message), "provider detail is never shown");
});

test("source minimum reads the same, and degrades without names", () => {
  assert.equal(describePayoutError(apiError(422, { code: "source_minimum" })).message,
    "Payouts to this destination aren't available for this withdrawal amount.");
});

test("caller context fills gaps; server context wins where it has a value", () => {
  const err = apiError(422, { code: "recipient_minimum", context: { target_currency_name: "Kenyan Shilling", available: null } });
  const { message } = describePayoutError(err, { context: { available: money("$1.43"), target_currency_name: "Wrong" } });
  assert.equal(message,
    "Kenyan Shilling payouts aren't available for this withdrawal amount. You currently have $1.43 available.");
});

for (const code of ["corridor_unavailable", "bank_payout_unavailable", "currency_unknown"]) {
  test(`${code} says bank payouts are unavailable`, () => {
    assert.equal(describePayoutError(apiError(422, { code, context: { country_name: "Tanzania" } })).message,
      "Bank payouts to Tanzania aren't currently available.");
    assert.equal(describePayoutError(apiError(422, { code })).message,
      "Bank payouts to this destination aren't currently available.");
  });
}

test("an unresolved transfer declaration (India) is not currently available", () => {
  assert.equal(
    describePayoutError(apiError(422, { code: "transfer_requirements_unresolved", context: { country_name: "India" } })).message,
    "Payouts to bank accounts in India aren't currently available.");
  assert.equal(describePayoutError(apiError(422, { code: "transfer_requirements_unresolved" })).message,
    "Payouts to this destination aren't currently available.");
});

test("invalid bank details carries field errors", () => {
  const info = describePayoutError(apiError(422, {
    code: "invalid_bank_details", detail: "Wise rejected POST /v1/accounts",
    field_errors: { accountNumber: "Please enter a valid account number." },
  }));
  assert.equal(info.message, "Check the highlighted details.");
  assert.deepEqual(info.fieldErrors, { accountNumber: "Please enter a valid account number." });
});

test("error handling keys on the code, not the status (invalid_bank_details is a 400)", () => {
  const info = describePayoutError(apiError(400, {
    code: "invalid_bank_details", detail: "Some bank details were not accepted.",
    field_errors: { "address.postCode": "Enter a valid post code." },
  }));
  assert.equal(info.code, "invalid_bank_details");
  assert.equal(info.message, "Check the highlighted details.");
  assert.deepEqual(info.fieldErrors, { "address.postCode": "Enter a valid post code." });
});

test("simple codes", () => {
  const cases = {
    no_verified_destination: "Add a bank account to withdraw.",
    open_request_exists: "You already have a withdrawal in progress.",
    provider_error: "We couldn't prepare your withdrawal. Please try again shortly.",
    provider_temporarily_unavailable: "The connection was interrupted. Nothing was sent. Please try again.",
    payouts_disabled: "Withdrawals are paused at the moment. Your earnings are still being recorded.",
  };
  for (const [code, want] of Object.entries(cases)) {
    assert.equal(describePayoutError(apiError(409, { code })).message, want, code);
  }
  for (const code of ["negative_balance", "account_frozen", "balance_changed"]) {
    const message = describePayoutError(apiError(422, { code })).message;
    assert.notEqual(message, GENERIC_MESSAGE, code);
  }
});

test("needs_reconfirmation returns the new quote and reasons", () => {
  const quote = { quote_id: "q2" };
  const info = describePayoutError(apiError(409, {
    code: "needs_reconfirmation", reasons: ["fee_changed", "rate_changed", "recipient_amount_changed"], quote,
  }));
  assert.equal(info.message, NEEDS_RECONFIRMATION_MESSAGE);
  assert.equal(info.quote, quote);
  assert.deepEqual(reconfirmReasons(info.reasons), ["The transfer fee changed.", "The exchange rate changed."]);
});

test("every reconfirmation reason has member wording", () => {
  assert.deepEqual(reconfirmReasons([
    "quote_expired", "amount_changed", "target_currency_changed", "destination_changed", "quote_invalid", "something_new",
  ]), [
    "The price expired.", "Your available balance changed.", "The receiving currency changed.", "Please review again.",
  ]);
  assert.deepEqual(reconfirmReasons(undefined), []);
});

test("status fallbacks without a code", () => {
  assert.equal(describePayoutError(apiError(401, {})).isAuthError, true);
  assert.match(describePayoutError(apiError(403, { detail: "internal" })).message, /membership/);
  assert.match(describePayoutError(apiError(429, {})).message, /Please wait/);
  assert.equal(describePayoutError(apiError(502, { detail: "Wise rejected" })).message,
    "We couldn't prepare your withdrawal. Please try again shortly.");
  assert.equal(describePayoutError(apiError(503, { detail: "Payouts are not enabled on this server." })).message,
    "Withdrawals are paused at the moment. Your earnings are still being recorded.");
  assert.equal(describePayoutError(apiError(500, {})).message, GENERIC_MESSAGE);
});

test("no response: offline, signed out, or generic — never the raw exception", () => {
  const network = new TypeError("Cannot read properties of undefined (reading 'x')");
  assert.equal(describePayoutError(network, { online: false }).message, "You appear to be offline.");
  assert.equal(describePayoutError(network, { hasSession: false }).isAuthError, true);
  const generic = describePayoutError(network, { online: true }).message;
  assert.equal(generic, GENERIC_MESSAGE);
  assert.ok(!generic.includes("TypeError"));
});

test("errorCode prefers code, then blocked reasons", () => {
  assert.equal(errorCode({ code: "PROVIDER_ERROR", blocked_reasons: ["BELOW_MINIMUM"] }), "provider_error");
  assert.equal(errorCode({ blocked_reasons: ["CORRIDOR_UNAVAILABLE"] }), "corridor_unavailable");
  assert.equal(errorCode(null), null);
});

test("blocked reasons from the balance use the same wording", () => {
  assert.equal(describeBlockCode("OPEN_REQUEST_EXISTS"), "You already have a withdrawal in progress.");
  assert.equal(describeBlockCode("SOMETHING_UNKNOWN"), "Withdrawals aren't available right now.");
});

test("no member-facing message mentions the payment provider or a rail", () => {
  const codes = [
    "below_minimum", "recipient_minimum", "source_minimum", "corridor_unavailable",
    "bank_payout_unavailable", "currency_unknown", "transfer_requirements_unresolved",
    "invalid_bank_details", "no_verified_destination", "open_request_exists",
    "needs_reconfirmation", "negative_balance", "account_frozen", "balance_changed",
    "not_a_member", "provider_error", "provider_temporarily_unavailable", "payouts_disabled",
  ];
  const messages = codes.map((code) =>
    describePayoutError(apiError(422, { code, detail: "Wise rejected POST", context: { country_name: "Kenya" } })).message);
  messages.push(...[401, 403, 429, 502, 503, 500].map((s) => describePayoutError(apiError(s, { detail: "Wise" })).message));
  messages.push(...reconfirmReasons(["quote_expired", "fee_changed", "rate_changed", "target_currency_changed"]));
  for (const message of messages) {
    assert.ok(!/wise|ach\b|swift|fedwire|iban|provider/i.test(message), message);
  }
});

test("refused bank details with nothing to highlight do not point at highlights", () => {
  const info = describePayoutError(apiError(400, {
    code: "invalid_bank_details", detail: "Some bank details were not accepted.", field_errors: {},
  }));
  assert.equal(info.message, "Some bank details were not accepted. Check them and try again.");
  assert.deepEqual(info.fieldErrors, {});
});

test("a withdrawal that can no longer be changed says so", () => {
  const message = describePayoutError(apiError(400, { code: "invalid_state", detail: "A request in COMPLETED cannot be cancelled." })).message;
  assert.equal(message, "This withdrawal can no longer be changed. Refresh to see its latest status.");
  assert.ok(!/wise|provider|COMPLETED/i.test(message));
});
