/**
 * src/components/payouts/format.js
 *
 * Wording and date formatting for the member payout screens.
 *
 * Statuses are Chakancha's own lifecycle states. Their wording lives here, and
 * the backend's timeline labels are never rendered: those can name the payment
 * provider ("Sent to …") or carry a raw failure code.
 */

export const STATUS_TEXT = {
  REQUESTED:          { badge: "Requested", tone: "warn" },
  VALIDATING:         { badge: "Requested", tone: "warn" },
  PENDING_REVIEW:     { badge: "Being reviewed", tone: "warn" },
  BLOCKED:            { badge: "Being reviewed", tone: "warn" },
  APPROVED:           { badge: "Approved", tone: "warn" },
  PROCESSING:         { badge: "Sending to your bank", tone: "warn" },
  COMPLETED:          { badge: "Paid", tone: "good" },
  AWAITING_RECONFIRM: { badge: "Please confirm the new amount", tone: "warn" },
  FAILED: {
    badge: "Couldn't be sent", tone: "bad",
    detail: "Couldn't be sent. Your earnings are available again.",
  },
  RETURNED: {
    badge: "Returned", tone: "bad",
    detail: "Returned by your bank. Your earnings are available again.",
  },
  UNCLAIMED:          { badge: "Waiting for your bank", tone: "warn" },
  REJECTED:           { badge: "Not approved", tone: "bad" },
  CANCELLED:          { badge: "Cancelled", tone: "neutral" },
};

export function statusText(state) {
  return STATUS_TEXT[state] ?? { badge: "Updated", tone: "neutral" };
}

/** Ledger entry states, in the member's language rather than the ledger's. */
export const ENTRY_WORDS = {
  PENDING: "Maturing",
  ELIGIBLE: "Ready to release",
  AVAILABLE: "Available",
  RESERVED: "In a withdrawal",
  PAID: "Paid",
  FROZEN: "On hold",
  REVERSED: "Reversed",
  CLAWED_BACK: "Reversed",
};

export const OPEN_STATES = [
  "REQUESTED", "VALIDATING", "PENDING_REVIEW", "AWAITING_RECONFIRM",
  "BLOCKED", "APPROVED", "PROCESSING",
];

export const CANCELLABLE_STATES = ["REQUESTED", "PENDING_REVIEW", "APPROVED"];

/** Finished withdrawals a member may clear from their history (server: HIDEABLE_PAYOUT_STATES). */
export const HIDEABLE_STATES = ["COMPLETED", "FAILED", "RETURNED", "REJECTED", "CANCELLED"];

export function formatDate(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
}

export function formatDateTime(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

export function formatTime(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function methodLabelOf(destination) {
  return destination?.methodLabel || "Bank account";
}

/** "Kenya · Bank account ••••1234 · KES" — for lists and the "Send to" select. */
export function destinationLabel(destination) {
  if (!destination) return "";
  const account = destination.last4
    ? `${methodLabelOf(destination)} ••••${destination.last4}`
    : methodLabelOf(destination);
  return [destination.countryName || destination.country, account, destination.currency]
    .filter(Boolean)
    .join(" · ");
}

/** "Kenya bank account ••••1234" — the review screen's destination row. */
export function reviewDestinationLabel(destination) {
  if (!destination) return "";
  const where = destination.countryName || destination.country;
  const method = !destination.method || destination.method === "bank_account"
    ? "bank account"
    : methodLabelOf(destination).toLowerCase();
  const base = where ? `${where} ${method}` : method.charAt(0).toUpperCase() + method.slice(1);
  return destination.last4 ? `${base} ••••${destination.last4}` : base;
}
