/**
 * src/lib/api/payouts.js
 *
 * Payout endpoints wired through the shared Axios client.
 *
 * Money is never re-computed on the client. The backend returns every amount as
 * { minor, display, currency } and the UI renders `display` — a frontend that
 * divides by 100 is a frontend that eventually rounds someone's money wrong.
 *
 * IMPORTANT — response shape: `api.get/post/...` from ./client ALREADY unwraps
 * the axios response (`.then(r => r.data)`), so it resolves to the payload
 * itself. Use `const data = await api.get(...)`, never
 * `const { data } = await api.get(...)` — the latter destructures a `.data` key
 * that does not exist, yielding undefined and a TypeError on first property
 * access. Every other API module in this project uses the correct form.
 *
 * Normalizers map snake_case → camelCase and shape only what the backend sent.
 * They never invent values: a missing field stays missing so a broken endpoint
 * is visible rather than disguised as a zero balance.
 */

import api from "./client";
import { ENDPOINTS } from "./endpoints";

// ─── Blocked reasons ──────────────────────────────────────────────────────────

/**
 * Machine-readable codes from the API, turned into sentences a member can act
 * on. The API deliberately never sends prose for these — the UI owns wording,
 * the backend owns truth.
 */
export const BLOCK_MESSAGES = {
  BELOW_MINIMUM: (ctx) =>
    ctx?.shortfall
      ? `You need ${ctx.minimum} to withdraw — ${ctx.shortfall} to go.`
      : `You have not reached the ${ctx?.minimum ?? "minimum"} withdrawal threshold yet.`,
  NO_VERIFIED_DESTINATION: () =>
    "Add a payout destination before withdrawing.",
  NEGATIVE_BALANCE: () =>
    "A refund reversed more commission than your balance covered. Future earnings will offset it first.",
  OPEN_REQUEST_EXISTS: () =>
    "You already have a withdrawal in progress.",
  // The provider's own explanation is passed through verbatim by the API. It
  // is the only part a member can act on — "the smallest amount a recipient can
  // get is 100 KES" tells them to withdraw more or pick another currency.
  CORRIDOR_UNAVAILABLE: () =>
    "Your bank cannot receive this amount in that currency yet. Withdraw a larger amount, or choose a different receiving currency.",
  NEEDS_RECONFIRMATION: () =>
    "The transfer fee changed while your withdrawal was being reviewed. Confirm the new amount to continue.",
  BALANCE_CHANGED: () =>
    "Your available balance changed while we were preparing the quote. Please try again.",
  ACCOUNT_FROZEN: () =>
    "Some of your earnings are on hold pending a review. Support can tell you more.",
  NOT_A_MEMBER: () => "Join Chakan Tree to earn and withdraw commission.",
};

export function describeBlock(code, ctx) {
  const fn = BLOCK_MESSAGES[code];
  return fn ? fn(ctx) : code;
}

// ─── Normalizers ──────────────────────────────────────────────────────────────

export function money(raw) {
  if (!raw) return null;
  return {
    minor: raw.minor ?? 0,
    display: raw.display ?? "",
    currency: raw.currency ?? "USD",
  };
}

export function normalizeBalance(raw) {
  if (!raw) return null;
  return {
    currency: raw.currency ?? "USD",
    // Lifetime gross earnings and the shortfall to the minimum are computed by
    // the API. The client never adds balances together to produce a total, and
    // never subtracts to produce "you need X more" — both are money arithmetic.
    totalEarned: money(raw.total_earned),
    shortfallToMinimum: money(raw.shortfall_to_minimum),
    pending: money(raw.pending),
    eligible: money(raw.eligible),
    available: money(raw.available),
    reserved: money(raw.reserved),
    paid: money(raw.paid),
    negativeBalance: money(raw.negative_balance),
    minimumPayout: money(raw.minimum_payout),
    maturityDays: raw.maturity_days ?? null,
    canRequestPayout: raw.can_request_payout ?? false,
    blockedReasons: raw.blocked_reasons ?? [],
    nextMaturityAt: raw.next_maturity_at ?? null,
  };
}

export function normalizeEntry(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    order: raw.order ?? "",
    level: raw.level ?? null,
    amount: money(raw.amount),
    state: raw.state,
    maturesAt: raw.matures_at ?? null,
    reason: raw.reason ?? "",
    createdAt: raw.created_at ?? null,
  };
}

export function normalizeDestination(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    rail: raw.rail,
    label: raw.label ?? "",
    displayHint: raw.display_hint ?? "",
    country: raw.country ?? "",
    currency: raw.currency ?? "USD",
    status: raw.status,
    isDefault: raw.is_default ?? false,
    verifiedAt: raw.verified_at ?? null,
    createdAt: raw.created_at ?? null,
  };
}

export function normalizeRequest(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    status: raw.status,
    gross: money(raw.gross),
    fee: money(raw.fee),
    withheld: money(raw.withheld),
    net: money(raw.net),
    currency: raw.currency ?? "USD",
    destination: normalizeDestination(raw.destination),
    confirmedNet: money(raw.confirmed_net),
    requiresReconfirmation: raw.requires_reconfirmation ?? false,
    quoteExpiresAt: raw.quote_expires_at ?? null,
    requoteCount: raw.requote_count ?? 0,
    requestedAt: raw.requested_at ?? null,
    approvedAt: raw.approved_at ?? null,
    completedAt: raw.completed_at ?? null,
    rejectionReason: raw.rejection_reason ?? "",
    attempts: (raw.attempts ?? []).map((a) => ({
      id: a.id,
      attemptNumber: a.attempt_number,
      provider: a.provider,
      status: a.status,
      failureCode: a.failure_code ?? "",
      failureMessage: a.failure_message ?? "",
      sentAt: a.sent_at ?? null,
      settledAt: a.settled_at ?? null,
    })),
    timeline: (raw.timeline ?? []).map((t) => ({
      at: t.at,
      label: t.label,
      state: t.state,
    })),
  };
}

export function normalizeQuote(raw) {
  if (!raw) return null;
  return {
    // Minor units for comparisons; `gross`/`fee`/`net` carry the formatted
    // strings the UI renders. The client never divides by 100 itself.
    grossMinor: raw.gross_minor ?? 0,
    feeMinor: raw.fee_minor ?? 0,
    withheldMinor: raw.withheld_minor ?? 0,
    netMinor: raw.net_minor ?? 0,
    gross: money(raw.gross),
    fee: money(raw.fee),
    withheld: money(raw.withheld),
    net: money(raw.net),
    targetAmount: money(raw.target_amount),
    currency: raw.currency ?? "USD",
    targetCurrency: raw.target_currency ?? "",
    targetAmountMinor: raw.target_amount_minor ?? null,
    rate: raw.rate ?? "",
  };
}


// ─── Error interpretation ─────────────────────────────────────────────────────

/**
 * Turn a failure from the API client into something a member can act on.
 *
 * client.js rejects with ApiError — `{ status, message, data }`. It is NOT an
 * axios error, so there is no `err.response`. The payout screens used to read
 * `err.response.status`, which is always undefined, so 401, 403, 429 and 503
 * all collapsed into one generic sentence and the server's own explanation in
 * `err.message` was thrown away. That is why a failing payout page could only
 * ever say "Could not load your earnings".
 *
 * Returns { status, message, codes } — codes being the API's machine-readable
 * blocked_reasons when present.
 */
export function describeApiError(err, fallback) {
  const status = err?.status ?? err?.response?.status ?? null;
  const data = err?.data ?? err?.response?.data ?? null;
  const codes = Array.isArray(data?.blocked_reasons) ? data.blocked_reasons : [];

  // The server's own words, when it gave any.
  const detail =
    (typeof data?.detail === "string" && data.detail) ||
    (typeof err?.message === "string" && err.message !== "Network Error" && err.message) ||
    null;

  // An aborted request has no status, and neither does a genuine network
  // failure — but they are not the same thing and must not read the same.
  // A request is aborted when the page navigates away mid-flight, which is
  // exactly what happens when a rejected refresh token logs the member out.
  // Reporting that as "check your connection" sends them to debug their wifi
  // when what they need is to sign in again.
  const isApiError = err?.name === "ApiError" || status !== null;

  const aborted =
    err?.code === "ERR_CANCELED" ||
    err?.name === "CanceledError" ||
    err?.name === "AbortError" ||
    /canceled|aborted/i.test(err?.message || "");

  let message;
  let isAuthError = false;
  switch (status) {
    case 401:
      message = "Your session has expired. Please sign in again.";
      isAuthError = true;
      break;
    case 403:
      message = detail ||
        "Your account cannot access payouts. Chakan Tree membership and a verified email are required.";
      break;
    case 429:
      message = "You are refreshing faster than we can keep up. Please wait a moment and try again.";
      break;
    case 503:
      message = detail ||
        "Withdrawals are closed at the moment. Your earnings are still being recorded.";
      break;
    case null:
    case undefined:
      if (!isApiError && err instanceof Error) {
        // A TypeError here is a bug in this code, not a connection problem.
        // Saying "check your connection" would send someone to debug their wifi
        // while the real fault sits in the browser — which is how this class of
        // failure hides.
        message = `Something went wrong while reading your earnings (${err.name}: ${err.message}).`;
      } else if (aborted || !hasStoredSession()) {
        // No status AND no session: the request was cut short by the sign-out
        // that a rejected refresh token triggers.
        message = "Your session has expired. Please sign in again.";
        isAuthError = true;
      } else {
        message = "We could not reach the server. Check your connection and try again.";
      }
      break;
    default:
      message = detail || fallback;
  }
  return { status, message, codes, isAuthError };
}

/** Is there still a token in this browser? Distinguishes sign-out from offline. */
function hasStoredSession() {
  try {
    if (typeof window === "undefined") return true;
    return Boolean(window.localStorage.getItem("chakancha_access_token"));
  } catch {
    return true;      // cannot tell — do not claim the session ended
  }
}

// ─── Member endpoints ─────────────────────────────────────────────────────────

/**
 * Everything the payout page needs, in one request.
 *
 * The page used to make four calls — balance, destinations, requests, entries —
 * which cost four round trips, four throttle hits, and left the panels able to
 * disagree because each was fetched at a different moment.
 */
export async function getDashboard({ limit = 25 } = {}) {
  const data = await api.get(ENDPOINTS.PAYOUTS.DASHBOARD, { params: { limit } });
  return {
    balance: normalizeBalance(data.balance),
    destinations: (data.destinations ?? []).map(normalizeDestination),
    requests: (data.requests ?? []).map(normalizeRequest),
    entries: {
      count: data.entries?.count ?? 0,
      results: (data.entries?.results ?? []).map(normalizeEntry),
    },
  };
}


export async function getBalance() {
  const data = await api.get(ENDPOINTS.PAYOUTS.BALANCE);
  return normalizeBalance(data);
}

export async function getEntries({ state, limit = 50, offset = 0 } = {}) {
  const params = { limit, offset };
  if (state) params.state = state;
  const data = await api.get(ENDPOINTS.PAYOUTS.ENTRIES, { params });
  return {
    count: data.count ?? 0,
    limit: data.limit ?? limit,
    offset: data.offset ?? offset,
    results: (data.results ?? []).map(normalizeEntry),
  };
}

export async function getDestinations() {
  const data = await api.get(ENDPOINTS.PAYOUTS.DESTINATIONS);
  return (data ?? []).map(normalizeDestination);
}

/**
 * The countries a member may live in and the currencies we can pay them in.
 *
 * Both come from the provider, never from a list in this file. A hardcoded
 * country or currency table here would be a stale copy of the provider's rules,
 * and the member would meet the difference as a rejection after filling in a
 * form. `countryHints` is a ranking hint, not a filter — every supported
 * currency stays selectable whatever country is chosen.
 */
export async function getCorridors() {
  const data = await api.get(ENDPOINTS.PAYOUTS.CORRIDORS);
  return {
    countries: (data?.countries ?? []).map((c) => ({ code: c.code, name: c.name })),
    currencies: (data?.currencies ?? []).map((c) => ({
      code: c.code,
      name: c.name,
      symbol: c.symbol ?? "",
      countryHints: c.country_hints ?? [],
    })),
  };
}

function normalizeRequirements(data, currency) {
  return {
    currency: data?.currency ?? currency,
    available: data?.available ?? false,
    disabledReason: data?.disabled_reason ?? "",
    refined: !!data?.refined,
    types: (data?.types ?? []).map((t) => ({
      type: t.type,
      title: t.title,
      usageInfo: t.usage_info ?? "",
      fields: (t.fields ?? []).map((f) => ({
        key: f.key,
        name: f.name,
        type: f.type,
        required: !!f.required,
        example: f.example ?? "",
        minLength: f.min_length ?? null,
        maxLength: f.max_length ?? null,
        validationRegexp: f.validation_regexp ?? null,
        displayFormat: f.display_format ?? null,
        refreshRequirementsOnChange: !!f.refresh_requirements_on_change,
        valuesAllowed: f.values_allowed ?? [],
      })),
    })),
  };
}

/**
 * What the provider needs in order to pay this currency.
 *
 * Every attribute the provider publishes is kept, including the lengths and
 * regular expression it validates against. Dropping those moves validation the
 * provider already described to us onto a rejection the member only sees after
 * submitting a form they cannot tell is wrong.
 */
export async function getDestinationRequirements(currency) {
  const data = await api.get(ENDPOINTS.PAYOUTS.DESTINATION_REQUIREMENTS, {
    params: { currency },
  });
  return normalizeRequirements(data, currency);
}

/**
 * Re-ask with what has been filled in so far.
 *
 * Some fields change which other fields are required — the provider marks them
 * refreshRequirementsOnChange. Continuing to render the initial answer after
 * one of those changes shows a field set for a question the member is no longer
 * asking. A POST, because the answer depends on the details sent; it writes
 * nothing.
 */
export async function refineDestinationRequirements({ currency, type, details }) {
  const data = await api.post(ENDPOINTS.PAYOUTS.DESTINATION_REQUIREMENTS, {
    currency, type, details: details ?? {},
  });
  return normalizeRequirements(data, currency);
}

/**
 * Validate one field against what the provider said about it.
 *
 * Returns an error string, or "" when the value is acceptable. The provider is
 * still the final authority — this only avoids spending a round trip, and a
 * rejection the member has to interpret, on a rule we were already told.
 */
export function validateRequirementField(field, rawValue) {
  const value = (rawValue ?? "").trim();
  if (!value) return field.required ? `${field.name} is required.` : "";

  if (field.minLength != null && value.length < field.minLength) {
    return `${field.name} must be at least ${field.minLength} characters.`;
  }
  if (field.maxLength != null && value.length > field.maxLength) {
    return `${field.name} must be at most ${field.maxLength} characters.`;
  }
  if (field.valuesAllowed?.length) {
    const allowed = field.valuesAllowed.some((v) => v.key === value);
    if (!allowed) return `Choose a valid ${field.name.toLowerCase()}.`;
  }
  if (field.validationRegexp) {
    let re = null;
    // A pattern we cannot compile must not block a member: the provider still
    // checks it, so fall through rather than inventing a failure.
    try { re = new RegExp(field.validationRegexp); } catch { re = null; }
    if (re && !re.test(value)) {
      return field.example
        ? `${field.name} does not look right. Example: ${field.example}`
        : `${field.name} does not look right.`;
    }
  }
  return "";
}

/**
 * Raw account details go straight to the provider and are never stored by us —
 * only the provider's recipient id and a masked hint come back.
 */
export async function addDestination(payload) {
  const data = await api.post(ENDPOINTS.PAYOUTS.DESTINATIONS, payload);
  return normalizeDestination(data);
}

export async function archiveDestination(id) {
  await api.delete(ENDPOINTS.PAYOUTS.DESTINATION(id));
}

export async function getQuote(destinationId) {
  const data = await api.post(ENDPOINTS.PAYOUTS.QUOTE, {
    destination_id: destinationId,
  });
  return normalizeQuote(data);
}

/**
 * The idempotency key is what makes a double-clicked withdraw button safe. It
 * is generated once per attempt by the caller and reused on retry, so a
 * resubmitted request returns the SAME payout rather than creating a second.
 */
export async function requestPayout({ destinationId, idempotencyKey }) {
  const data = await api.post(
    ENDPOINTS.PAYOUTS.REQUEST,
    { destination_id: destinationId },
    { headers: { "Idempotency-Key": idempotencyKey } },
  );
  return normalizeRequest(data);
}

export async function getRequests() {
  const data = await api.get(ENDPOINTS.PAYOUTS.REQUESTS);
  return (data ?? []).map(normalizeRequest);
}

export async function getRequest(id) {
  const data = await api.get(ENDPOINTS.PAYOUTS.REQUEST_DETAIL(id));
  return normalizeRequest(data);
}

export async function cancelRequest(id) {
  const data = await api.post(ENDPOINTS.PAYOUTS.REQUEST_CANCEL(id), {});
  return normalizeRequest(data);
}

/**
 * Accept a revised net after the original quote expired and re-quoting moved the
 * amount. Only the member can do this — staff approved the figure the member
 * agreed to, and a different figure is a new agreement.
 */
export async function confirmRequest(id) {
  const data = await api.post(ENDPOINTS.PAYOUTS.REQUEST_CONFIRM(id), {});
  return normalizeRequest(data);
}

// ─── Admin endpoints ──────────────────────────────────────────────────────────

export function normalizeAdminRequest(raw) {
  const base = normalizeRequest(raw);
  if (!base) return null;
  return {
    ...base,
    member: raw.member ?? null,
    riskScore: raw.risk_score ?? null,
    riskBand: raw.risk_band ?? "",
    riskSignals: raw.risk_signals ?? [],
    requiresDualApproval: raw.requires_dual_approval ?? false,
    approvalsRequired: raw.approvals_required ?? 1,
    approvals: raw.approvals ?? [],
    ledger: (raw.ledger ?? []).map(normalizeEntry),
    dispatched: raw.dispatched ?? false,
    approvalsOutstanding: raw.approvals_outstanding ?? null,
  };
}

export async function getAdminQueue(status) {
  const data = await api.get(ENDPOINTS.PAYOUT_ADMIN.QUEUE, {
    params: status ? { status } : {},
  });
  return (data ?? []).map(normalizeAdminRequest);
}

export async function getAdminRequest(id) {
  const data = await api.get(ENDPOINTS.PAYOUT_ADMIN.DETAIL(id));
  return normalizeAdminRequest(data);
}

export async function approvePayout(id, reason) {
  const data = await api.post(ENDPOINTS.PAYOUT_ADMIN.APPROVE(id), { reason });
  return normalizeAdminRequest(data);
}

export async function rejectPayout(id, reason) {
  const data = await api.post(ENDPOINTS.PAYOUT_ADMIN.REJECT(id), { reason });
  return normalizeAdminRequest(data);
}

export async function getFraudReviews() {
  const data = await api.get(ENDPOINTS.PAYOUT_ADMIN.FRAUD_REVIEWS);
  return (data ?? []).map((r) => ({
    id: r.id,
    member: r.member,
    score: r.score,
    signals: r.signals ?? [],
    status: r.status,
    resolution: r.resolution ?? "",
    createdAt: r.created_at,
    payoutRequest: r.payout_request,
  }));
}

export async function resolveFraudReview(id, { clear, resolution }) {
  const data = await api.post(ENDPOINTS.PAYOUT_ADMIN.FRAUD_RESOLVE(id), {
    clear,
    resolution,
  });
  return data;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function newIdempotencyKey() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `payout-${crypto.randomUUID()}`;
  }
  return `payout-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Whole days until a date, floored at 0. Null-safe. */
export function daysUntil(iso) {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

export default {
  getDashboard, getBalance, getEntries, getDestinations, addDestination, archiveDestination,
  getQuote, requestPayout, getRequests, getRequest, cancelRequest, confirmRequest,
  getAdminQueue, getAdminRequest, approvePayout, rejectPayout,
  getFraudReviews, resolveFraudReview,
  newIdempotencyKey, daysUntil, describeBlock,
};
