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
 * `const { data } = await api.get(...)`.
 *
 * Normalizers map snake_case → camelCase and shape only what the backend sent.
 * They never invent values: a missing field stays missing so a broken endpoint
 * is visible rather than disguised as a zero balance.
 *
 * The browser talks only to Chakancha's API. No payment-provider credential,
 * host or rail name belongs in this file.
 */

import api from "./client";
import { ENDPOINTS } from "./endpoints";
import { describePayoutError } from "../payouts/errors";
import { validateField } from "../payouts/requirements";

// ─── Blocked reasons ──────────────────────────────────────────────────────────

/**
 * Machine-readable codes from the API, turned into sentences a member can act
 * on. Kept for the staff queue; the member screens use lib/payouts/errors.js.
 */
export const BLOCK_MESSAGES = {
  BELOW_MINIMUM: (ctx) =>
    ctx?.shortfall
      ? `You need ${ctx.minimum} to withdraw — ${ctx.shortfall} to go.`
      : `You have not reached the ${ctx?.minimum ?? "minimum"} withdrawal threshold yet.`,
  NO_VERIFIED_DESTINATION: () =>
    "Add a bank account before withdrawing.",
  NEGATIVE_BALANCE: () =>
    "A refund reversed more commission than your balance covered. Future earnings will offset it first.",
  OPEN_REQUEST_EXISTS: () =>
    "You already have a withdrawal in progress.",
  CORRIDOR_UNAVAILABLE: () =>
    "Bank payouts to this destination aren't currently available for this amount.",
  NEEDS_RECONFIRMATION: () =>
    "The amount changed while your withdrawal was being reviewed. Confirm the new amount to continue.",
  BALANCE_CHANGED: () =>
    "Your available balance changed while we were preparing the quote. Please try again.",
  ACCOUNT_FROZEN: () =>
    "Some of your earnings are on hold pending a review. Support can tell you more.",
  NOT_A_MEMBER: () => "Join Chakan Tree to earn and withdraw commission.",
};

export function describeBlock(code, ctx) {
  const fn = BLOCK_MESSAGES[code];
  return fn ? fn(ctx) : "Withdrawals aren't available right now.";
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
    // Kept for the staff queue and for sending back; never rendered to members.
    rail: raw.rail,
    label: raw.label ?? "",
    displayHint: raw.display_hint ?? "",
    country: raw.country ?? "",
    countryName: raw.country_name ?? "",
    currency: raw.currency ?? "",
    currencyName: raw.currency_name ?? "",
    status: raw.status,
    isDefault: raw.is_default ?? false,
    verifiedAt: raw.verified_at ?? null,
    createdAt: raw.created_at ?? null,
    method: raw.method ?? "",
    methodLabel: raw.method_label ?? "",
    last4: raw.last4 ?? "",
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
    rate: raw.rate ?? "",
    targetCurrency: raw.target_currency ?? "",
    targetCurrencyName: raw.target_currency_name ?? "",
    targetAmount: money(raw.target_amount),
    // Staff-facing. Failure messages can carry a provider's own words, so the
    // member screens never render attempts.
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
    // The id of the price the member reviewed. Confirming sends it back, so the
    // withdrawal is created at that price or not at all.
    quoteId: raw.quote_id ?? raw.provider_quote_id ?? "",
    expiresAt: raw.expires_at ?? null,
    grossMinor: raw.gross_minor ?? raw.gross?.minor ?? 0,
    feeMinor: raw.fee_minor ?? raw.fee?.minor ?? 0,
    withheldMinor: raw.withheld_minor ?? raw.withheld?.minor ?? 0,
    netMinor: raw.net_minor ?? raw.net?.minor ?? 0,
    gross: money(raw.gross),
    fee: money(raw.fee),
    withheld: money(raw.withheld),
    net: money(raw.net),
    targetAmount: money(raw.target_amount),
    currency: raw.currency ?? "USD",
    sourceCurrency: raw.source_currency ?? raw.currency ?? "USD",
    targetCurrency: raw.target_currency ?? "",
    targetCurrencyName: raw.target_currency_name ?? "",
    targetAmountMinor: raw.target_amount_minor ?? null,
    rate: raw.rate ?? "",
    estimatedDelivery: raw.estimated_delivery ?? null,
    formattedEstimatedDelivery: raw.formatted_estimated_delivery ?? "",
    destination: normalizeDestination(raw.destination),
  };
}

// ─── Error interpretation ─────────────────────────────────────────────────────

/** Is there still a token in this browser? Distinguishes sign-out from offline. */
export function hasStoredSession() {
  try {
    if (typeof window === "undefined") return true;
    return Boolean(window.localStorage.getItem("chakancha_access_token"));
  } catch {
    return true;      // cannot tell — do not claim the session ended
  }
}

/** Options for describePayoutError that only the browser can supply. */
export function payoutErrorOptions(context) {
  return {
    context,
    online: typeof navigator === "undefined" ? undefined : navigator.onLine,
    hasSession: hasStoredSession(),
  };
}

/**
 * Turn a failure from the API client into something a person can act on.
 *
 * Kept for the staff queue (AdminPayoutQueue). The member screens use
 * describePayoutError, which never shows the server's `detail`.
 *
 * Returns { status, message, codes, isAuthError }.
 */
export function describeApiError(err, fallback) {
  const status = err?.status ?? err?.response?.status ?? null;
  const data = err?.data ?? err?.response?.data ?? null;
  const codes = Array.isArray(data?.blocked_reasons) ? data.blocked_reasons : [];
  const detail = typeof data?.detail === "string" && data.detail ? data.detail : null;

  if (status === null || status === undefined) {
    const info = describePayoutError(err, payoutErrorOptions());
    return { status, message: info.message, codes, isAuthError: info.isAuthError };
  }

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
    default:
      message = detail || fallback;
  }
  return { status, message, codes, isAuthError };
}

// ─── Member endpoints ─────────────────────────────────────────────────────────

/** Everything the payout page needs, in one request. */
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
 * The countries a bank account can be in, and currency names.
 *
 * Both come from the backend, never from a list in this file.
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

export function normalizeRequirements(data, country) {
  const available = data?.available ?? false;
  return {
    country: data?.country ?? country,
    countryName: data?.country_name ?? "",
    // Derived from the country by the backend and confirmed payable, never
    // chosen by the member. Earnings stay USD; this is what their bank receives.
    currency: data?.currency ?? "",
    currencyName: data?.currency_name ?? "",
    sourceCurrency: data?.source_currency ?? "USD",
    available,
    // Whether a bank account in this country can be paid at all. Amount limits
    // (unavailableCode recipient_minimum / source_minimum) do not make this
    // false: a member may save an account before they have enough to withdraw.
    bankPayoutAvailable: data?.bank_payout_available ?? available,
    unavailableCode: data?.unavailable_code ?? "",
    disabledReason: data?.disabled_reason ?? "",
    refined: !!data?.refined,
    // Opaque to the member: sent back on refresh, never displayed.
    accountType: data?.account_type ?? "",
    usageInfo: data?.usage_info ?? "",
    fields: (data?.fields ?? []).map((f) => ({
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
      usageInfo: f.usage_info ?? "",
      default: f.default ?? null,
    })),
  };
}

/** What a bank account in this country needs. */
export async function getDestinationRequirements(country, { signal } = {}) {
  const data = await api.get(ENDPOINTS.PAYOUTS.DESTINATION_REQUIREMENTS, {
    params: { country },
    signal,
  });
  return normalizeRequirements(data, country);
}

/**
 * Re-ask with what has been filled in so far. Some fields change which other
 * fields are required. A POST because the answer depends on the details sent;
 * it writes nothing.
 */
export async function refineDestinationRequirements({ country, type, details }, { signal } = {}) {
  const data = await api.post(ENDPOINTS.PAYOUTS.DESTINATION_REQUIREMENTS, {
    country, type, details: details ?? {},
  }, { signal });
  return normalizeRequirements(data, country);
}

/** Kept for callers of the old name; lib/payouts/requirements.js owns the rules. */
export function validateRequirementField(field, rawValue) {
  return validateField(field, rawValue);
}

/**
 * Raw account details go straight to the backend and are never stored by us —
 * only a recipient reference and the last four digits come back.
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
 * Confirm the withdrawal the member reviewed.
 *
 * quoteId is the price they saw. If it no longer holds, the API answers 409
 * needs_reconfirmation with a new quote instead of creating the withdrawal at a
 * different price.
 *
 * The idempotency key is generated once per review by the caller and reused on
 * retry, so a double click returns the SAME payout rather than creating a second.
 */
export async function requestPayout({ destinationId, quoteId, idempotencyKey }) {
  const body = { destination_id: destinationId };
  if (quoteId) body.quote_id = quoteId;
  const data = await api.post(
    ENDPOINTS.PAYOUTS.REQUEST,
    body,
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

/** Accept a revised amount. Only the member can do this. */
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

const payoutsApi = {
  getDashboard, getBalance, getEntries, getDestinations, addDestination, archiveDestination,
  getQuote, requestPayout, getRequests, getRequest, cancelRequest, confirmRequest,
  getAdminQueue, getAdminRequest, approvePayout, rejectPayout,
  getFraudReviews, resolveFraudReview,
  newIdempotencyKey, daysUntil, describeBlock,
};

export default payoutsApi;
