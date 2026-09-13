/**
 * src/lib/payouts/errors.js
 *
 * API failures -> sentences a member can act on.
 *
 * The backend sends a machine-readable `code` (and sometimes `context`); this
 * module owns the wording. A payment provider's own error text (`detail`) is
 * never shown: it can name the provider, quote a URL, or describe a rail the
 * member was never meant to know about.
 *
 * No imports, on purpose: `node --test` runs this module directly.
 */

export const GENERIC_MESSAGE = "Something went wrong. Please try again.";
export const NEEDS_RECONFIRMATION_MESSAGE =
  "The amount changed since you reviewed it. Please check the new details.";
export const PRICE_EXPIRED_MESSAGE = "The price expired, so here is an updated one.";
export const PRICE_EXPIRED_REVIEW_AGAIN =
  "The price expired. Review your withdrawal again to see an updated one.";
export const DETAILS_NOT_ACCEPTED = "Some bank details were not accepted. Check them and try again.";

function displayOf(value) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && typeof value.display === "string") return value.display;
  return "";
}

function youHave(ctx) {
  const available = displayOf(ctx.available);
  return available ? ` You currently have ${available} available.` : "";
}

function countryPhrase(ctx) {
  return ctx.country_name || ctx.countryName || "";
}

const CODE_MESSAGES = {
  below_minimum: (ctx) => {
    const minimum = displayOf(ctx.minimum);
    if (!minimum) return `Your available balance is below the minimum withdrawal.${youHave(ctx)}`;
    return `The minimum withdrawal is ${minimum}.${youHave(ctx)}`;
  },
  recipient_minimum: (ctx) => amountLimited(ctx),
  source_minimum: (ctx) => amountLimited(ctx),
  corridor_unavailable: (ctx) => bankUnavailable(ctx),
  bank_payout_unavailable: (ctx) => bankUnavailable(ctx),
  currency_unknown: (ctx) => bankUnavailable(ctx),
  transfer_requirements_unresolved: (ctx) => {
    const country = countryPhrase(ctx);
    return country
      ? `Payouts to bank accounts in ${country} aren't currently available.`
      : "Payouts to this destination aren't currently available.";
  },
  invalid_bank_details: () => "Check the highlighted details.",
  invalid_state: () => "This withdrawal can no longer be changed. Refresh to see its latest status.",
  no_verified_destination: () => "Add a bank account to withdraw.",
  open_request_exists: () => "You already have a withdrawal in progress.",
  needs_reconfirmation: () => NEEDS_RECONFIRMATION_MESSAGE,
  negative_balance: () =>
    "A refund reversed more commission than your balance covered. Future earnings will offset it before you can withdraw.",
  account_frozen: () =>
    "Some of your earnings are on hold while your account is reviewed. Support can tell you more.",
  balance_changed: () =>
    "Your available balance changed. Please review your withdrawal again.",
  not_a_member: () => "Join Chakan Tree to earn and withdraw commission.",
  provider_error: () => "We couldn't prepare your withdrawal. Please try again shortly.",
  provider_temporarily_unavailable: () =>
    "The connection was interrupted. Nothing was sent. Please try again.",
  payouts_disabled: () =>
    "Withdrawals are paused at the moment. Your earnings are still being recorded.",
};

function amountLimited(ctx) {
  const name = ctx.target_currency_name || ctx.targetCurrencyName || ctx.target_currency || "";
  const lead = name
    ? `${name} payouts aren't available for this withdrawal amount.`
    : "Payouts to this destination aren't available for this withdrawal amount.";
  return `${lead}${youHave(ctx)}`;
}

function bankUnavailable(ctx) {
  const country = countryPhrase(ctx);
  return `Bank payouts to ${country || "this destination"} aren't currently available.`;
}

const REASON_MESSAGES = {
  quote_expired: "The price expired.",
  amount_changed: "Your available balance changed.",
  fee_changed: "The transfer fee changed.",
  recipient_amount_changed: "The exchange rate changed.",
  rate_changed: "The exchange rate changed.",
  target_currency_changed: "The receiving currency changed.",
  destination_changed: "Please review again.",
  quote_invalid: "Please review again.",
};

/** Why a reviewed quote was replaced, as unique sentences in the order given. */
export function reconfirmReasons(reasons) {
  const out = [];
  for (const reason of Array.isArray(reasons) ? reasons : []) {
    const text = REASON_MESSAGES[String(reason).toLowerCase()] || "Please review again.";
    if (!out.includes(text)) out.push(text);
  }
  return out;
}

/** The backend's code, lower-cased; falls back to the first blocked reason. */
export function errorCode(data) {
  if (data && typeof data.code === "string" && data.code) return data.code.toLowerCase();
  if (data && Array.isArray(data.blocked_reasons) && data.blocked_reasons.length) {
    return String(data.blocked_reasons[0]).toLowerCase();
  }
  return null;
}

/** One blocked reason (e.g. from balance.blocked_reasons) in the member's words. */
export function describeBlockCode(code, context = {}) {
  const fn = CODE_MESSAGES[String(code ?? "").toLowerCase()];
  return fn ? fn(context || {}) : "Withdrawals aren't available right now.";
}

function mergeContext(callerContext, serverContext) {
  const merged = { ...(callerContext || {}) };
  if (serverContext && typeof serverContext === "object") {
    for (const [key, value] of Object.entries(serverContext)) {
      if (value !== null && value !== undefined && value !== "") merged[key] = value;
    }
  }
  return merged;
}

function isAborted(err) {
  return (
    err?.code === "ERR_CANCELED" ||
    err?.name === "CanceledError" ||
    err?.name === "AbortError"
  );
}

/**
 * Interpret any failure from the payout API.
 *
 * options.context   caller-known values (available, minimum, country_name, …);
 *                   the server's `context` wins where it has a value
 * options.online    navigator.onLine, when known
 * options.hasSession whether a sign-in token is still stored
 *
 * Returns { status, code, message, isAuthError, fieldErrors, reasons, quote }.
 */
export function describePayoutError(err, options = {}) {
  const { context, online, hasSession = true } = options;
  const status = err?.status ?? err?.response?.status ?? null;
  const data = err?.data ?? err?.response?.data ?? null;
  const code = errorCode(data);
  const ctx = mergeContext(context, data?.context);

  const result = {
    status,
    code,
    message: GENERIC_MESSAGE,
    isAuthError: false,
    fieldErrors:
      data && data.field_errors && typeof data.field_errors === "object" ? { ...data.field_errors } : {},
    reasons: Array.isArray(data?.reasons) ? data.reasons : [],
    quote: data?.quote ?? null,
  };

  if (status === 401) {
    result.message = "Your session has expired. Please sign in again.";
    result.isAuthError = true;
    return result;
  }

  if (code === "invalid_bank_details" && Object.keys(result.fieldErrors).length === 0) {
    // Nothing to highlight: saying "check the highlighted details" would point at nothing.
    result.message = DETAILS_NOT_ACCEPTED;
    return result;
  }

  if (code && CODE_MESSAGES[code]) {
    result.message = CODE_MESSAGES[code](ctx);
    return result;
  }

  switch (status) {
    case 403:
      result.message =
        "Your account cannot access payouts. Chakan Tree membership and a verified email are required.";
      return result;
    case 429:
      result.message = "You are refreshing faster than we can keep up. Please wait a moment and try again.";
      return result;
    case 502:
      result.message = CODE_MESSAGES.provider_error();
      return result;
    case 503:
      result.message = CODE_MESSAGES.payouts_disabled();
      return result;
    case null:
    case undefined:
      if (online === false) {
        result.message = "You appear to be offline.";
      } else if (isAborted(err) || hasSession === false) {
        result.message = "Your session has expired. Please sign in again.";
        result.isAuthError = true;
      }
      return result;
    default:
      return result;
  }
}
