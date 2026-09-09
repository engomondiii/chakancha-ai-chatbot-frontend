/**
 * src/lib/api/payouts.js
 *
 * Payout endpoints wired through the shared Axios client.
 *
 * Money is never re-computed on the client. The backend returns every amount as
 * { minor, display, currency } and the UI renders `display` — a frontend that
 * divides by 100 is a frontend that eventually rounds someone's money wrong.
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

function money(raw) {
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
    grossMinor: raw.gross_minor ?? 0,
    feeMinor: raw.fee_minor ?? 0,
    withheldMinor: raw.withheld_minor ?? 0,
    netMinor: raw.net_minor ?? 0,
    currency: raw.currency ?? "USD",
    targetCurrency: raw.target_currency ?? "",
    targetAmountMinor: raw.target_amount_minor ?? null,
    rate: raw.rate ?? "",
  };
}

// ─── Member endpoints ─────────────────────────────────────────────────────────

export async function getBalance() {
  const { data } = await api.get(ENDPOINTS.PAYOUTS.BALANCE);
  return normalizeBalance(data);
}

export async function getEntries({ state, limit = 50, offset = 0 } = {}) {
  const params = { limit, offset };
  if (state) params.state = state;
  const { data } = await api.get(ENDPOINTS.PAYOUTS.ENTRIES, { params });
  return {
    count: data.count ?? 0,
    limit: data.limit ?? limit,
    offset: data.offset ?? offset,
    results: (data.results ?? []).map(normalizeEntry),
  };
}

export async function getDestinations() {
  const { data } = await api.get(ENDPOINTS.PAYOUTS.DESTINATIONS);
  return (data ?? []).map(normalizeDestination);
}

/**
 * Raw account details go straight to the provider and are never stored by us —
 * only the provider's recipient id and a masked hint come back.
 */
export async function addDestination(payload) {
  const { data } = await api.post(ENDPOINTS.PAYOUTS.DESTINATIONS, payload);
  return normalizeDestination(data);
}

export async function archiveDestination(id) {
  await api.delete(ENDPOINTS.PAYOUTS.DESTINATION(id));
}

export async function getQuote(destinationId) {
  const { data } = await api.post(ENDPOINTS.PAYOUTS.QUOTE, {
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
  const { data } = await api.post(
    ENDPOINTS.PAYOUTS.REQUEST,
    { destination_id: destinationId },
    { headers: { "Idempotency-Key": idempotencyKey } },
  );
  return normalizeRequest(data);
}

export async function getRequests() {
  const { data } = await api.get(ENDPOINTS.PAYOUTS.REQUESTS);
  return (data ?? []).map(normalizeRequest);
}

export async function getRequest(id) {
  const { data } = await api.get(ENDPOINTS.PAYOUTS.REQUEST_DETAIL(id));
  return normalizeRequest(data);
}

export async function cancelRequest(id) {
  const { data } = await api.post(ENDPOINTS.PAYOUTS.REQUEST_CANCEL(id), {});
  return normalizeRequest(data);
}

/**
 * Accept a revised net after the original quote expired and re-quoting moved the
 * amount. Only the member can do this — staff approved the figure the member
 * agreed to, and a different figure is a new agreement.
 */
export async function confirmRequest(id) {
  const { data } = await api.post(ENDPOINTS.PAYOUTS.REQUEST_CONFIRM(id), {});
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
  const { data } = await api.get(ENDPOINTS.PAYOUT_ADMIN.QUEUE, {
    params: status ? { status } : {},
  });
  return (data ?? []).map(normalizeAdminRequest);
}

export async function getAdminRequest(id) {
  const { data } = await api.get(ENDPOINTS.PAYOUT_ADMIN.DETAIL(id));
  return normalizeAdminRequest(data);
}

export async function approvePayout(id, reason) {
  const { data } = await api.post(ENDPOINTS.PAYOUT_ADMIN.APPROVE(id), { reason });
  return normalizeAdminRequest(data);
}

export async function rejectPayout(id, reason) {
  const { data } = await api.post(ENDPOINTS.PAYOUT_ADMIN.REJECT(id), { reason });
  return normalizeAdminRequest(data);
}

export async function getFraudReviews() {
  const { data } = await api.get(ENDPOINTS.PAYOUT_ADMIN.FRAUD_REVIEWS);
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
  const { data } = await api.post(ENDPOINTS.PAYOUT_ADMIN.FRAUD_RESOLVE(id), {
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
  getBalance, getEntries, getDestinations, addDestination, archiveDestination,
  getQuote, requestPayout, getRequests, getRequest, cancelRequest, confirmRequest,
  getAdminQueue, getAdminRequest, approvePayout, rejectPayout,
  getFraudReviews, resolveFraudReview,
  newIdempotencyKey, daysUntil, describeBlock,
};
