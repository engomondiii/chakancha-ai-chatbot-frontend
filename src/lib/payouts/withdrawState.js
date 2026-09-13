/**
 * src/lib/payouts/withdrawState.js
 *
 * What the withdraw card offers, decided in one place.
 *
 * The card used to offer "Review withdrawal" whenever the ledger allowed a
 * withdrawal, and only found out the provider would refuse the amount after the
 * member clicked — the explanation then appeared in a banner at the top of the
 * page, away from the button, and the button stayed exactly as it was. A member
 * who had just saved a bank account saw nothing happen. And below the Chakancha
 * minimum the button was replaced by a sentence, so the action simply vanished.
 *
 * Now the destination is checked before the member acts, and every state has a
 * visible action: enabled when it can succeed, disabled with the reason when it
 * cannot. A saved account is always acknowledged as saved.
 *
 * No imports, on purpose: `node --test` runs this module directly.
 */

export const AMOUNT_LIMIT_CODES = ["recipient_minimum", "source_minimum"];
export const DESTINATION_UNAVAILABLE_CODES = [
  "corridor_unavailable", "bank_payout_unavailable", "currency_unknown", "transfer_requirements_unresolved",
];

export const WITHDRAW_WHEN_AVAILABLE = "Withdraw when available";
export const REVIEW_WITHDRAWAL = "Review withdrawal";
export const CHECKING = "Checking your withdrawal…";

function display(value) {
  return value && typeof value === "object" && typeof value.display === "string" ? value.display : "";
}

/** One check per destination and available balance; a new balance is a new question. */
export function checkKey(destinationId, availableMinor) {
  return destinationId ? `${destinationId}:${availableMinor ?? ""}` : "";
}

export function checkPending(key) {
  return { key, status: "checking" };
}

export function checkFromQuote(key, quote) {
  return { key, status: "ok", quote };
}

/** `info` is a describePayoutError() result. */
export function checkFromError(key, info) {
  const code = info?.code || "";
  const context = info?.context || {};
  if (AMOUNT_LIMIT_CODES.includes(code) || code === "below_minimum") {
    return { key, status: "amount_too_small", code, context };
  }
  if (DESTINATION_UNAVAILABLE_CODES.includes(code)) {
    return { key, status: "destination_unavailable", code, context };
  }
  if (code === "open_request_exists") return { key, status: "open_request", code };
  return { key, status: "failed", code, message: info?.message || "", isAuthError: Boolean(info?.isAuthError) };
}

function savedLine(destination) {
  if (!destination) return "";
  const where = destination.countryName ? `${destination.countryName} bank account` : "bank account";
  const tail = destination.last4 ? ` ••••${destination.last4}` : "";
  return `Your ${where}${tail} is saved.`;
}

function nextEarnings(balance, formatDate) {
  const pending = balance?.pending?.minor ?? 0;
  const next = balance?.nextMaturityAt ?? balance?.next_maturity_at;
  if (pending <= 0 || !next) return "";
  const when = formatDate ? formatDate(next) : String(next).slice(0, 10);
  return when ? ` More earnings become available on ${when}.` : "";
}

function amountTooSmallMessage(check, balance, destination, formatDate) {
  const ctx = check.context || {};
  if (check.code === "below_minimum") {
    const minimum = display(ctx.minimum) || display(balance?.minimumPayout);
    const available = display(ctx.available) || display(balance?.available);
    return `The minimum withdrawal is ${minimum || "not yet reached"}.`
      + (available ? ` You currently have ${available} available.` : "")
      + nextEarnings(balance, formatDate);
  }
  const name = ctx.target_currency_name || destination?.currencyName || destination?.currency || "";
  const available = display(ctx.available) || display(balance?.available);
  const minimum = display(ctx.provider_minimum);
  const minimumInSource = minimum && ctx.provider_minimum.currency === (balance?.available?.currency || "USD");

  let message = name
    ? `${name} withdrawals need a larger amount than you have available right now.`
    : "This withdrawal needs a larger amount than you have available right now.";
  if (minimum && minimumInSource) {
    message += ` The smallest withdrawal to this account is currently ${minimum}`
      + (available ? `, and you have ${available}.` : ".");
  } else if (minimum) {
    // Stated in the receiving currency; shown as the provider stated it, never converted.
    message += ` Your bank must receive at least ${minimum}` + (available ? `, and you have ${available} available.` : ".");
  } else if (available) {
    message += ` You have ${available} available.`;
  }
  return `${message} Nothing is wrong with your account — you can withdraw once enough earnings are available.`
    + nextEarnings(balance, formatDate);
}

function unavailableMessage(check, destination) {
  const ctx = check.context || {};
  const country = ctx.country_name || destination?.countryName || "this country";
  return check.code === "transfer_requirements_unresolved"
    ? `Payouts to bank accounts in ${country} aren't currently available.`
    : `Bank payouts to ${country} aren't currently available.`;
}

/**
 * @returns {{kind: string, saved?: string, message?: string,
 *            action?: {label: string, enabled: boolean, intent?: string},
 *            secondary?: {label: string, intent: string}}}
 */
export function decideWithdrawState({ balance, destinations, destinationId, openRequest, review, check, formatDate }) {
  const verified = (destinations || []).filter((d) => d.status === "VERIFIED");
  if (openRequest) return { kind: "open" };
  if (review) return { kind: "review" };
  if (verified.length === 0) {
    return { kind: "no_destination", action: { label: "Add bank account", enabled: true, intent: "add_bank" } };
  }

  const selected = verified.find((d) => d.id === destinationId) || null;
  const saved = savedLine(selected);
  const blockers = (balance?.blockedReasons || [])
    .map((code) => String(code).toUpperCase())
    .filter((code) => code !== "NO_VERIFIED_DESTINATION");

  if (blockers.includes("BELOW_MINIMUM")) {
    return {
      kind: "below_minimum", saved,
      message: amountTooSmallMessage({ code: "below_minimum", context: {} }, balance, selected, formatDate),
      action: { label: WITHDRAW_WHEN_AVAILABLE, enabled: false },
    };
  }
  if (blockers.length > 0) {
    return { kind: "blocked", saved, codes: blockers, action: { label: WITHDRAW_WHEN_AVAILABLE, enabled: false } };
  }

  const key = checkKey(selected?.id, balance?.available?.minor);
  if (!selected || !check || check.key !== key || check.status === "checking") {
    return { kind: "checking", saved, action: { label: CHECKING, enabled: false } };
  }

  switch (check.status) {
    case "ok":
      return { kind: "ready", saved, action: { label: REVIEW_WITHDRAWAL, enabled: true, intent: "review" } };
    case "amount_too_small":
      return {
        kind: "amount_too_small", saved,
        message: amountTooSmallMessage(check, balance, selected, formatDate),
        action: { label: WITHDRAW_WHEN_AVAILABLE, enabled: false },
      };
    case "destination_unavailable":
      return {
        kind: "destination_unavailable", saved,
        message: unavailableMessage(check, selected),
        action: { label: "Withdrawals to this account aren't available", enabled: false },
        secondary: { label: "Add another bank account", intent: "add_bank" },
      };
    case "open_request":
      return { kind: "open" };
    default:
      return {
        kind: "check_failed", saved,
        message: check.message || "We couldn't check your withdrawal just now.",
        action: { label: "Try again", enabled: true, intent: "retry" },
      };
  }
}
