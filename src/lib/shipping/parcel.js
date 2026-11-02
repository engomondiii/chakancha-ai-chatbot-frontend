/**
 * src/lib/shipping/parcel.js
 *
 * What a parcel is, and how to read one out of whatever the backend sent.
 *
 * Pure: no network, no React, no Next. It is split out from
 * src/lib/api/shipping.js so the translation can be tested on its own — this
 * is the part that has to keep working when DHL changes the shape of a
 * response, and it is the part the screens are built on.
 *
 * `normaliseParcel` deliberately accepts three different inputs:
 *
 *   1. What /api/v1/orders/{id}/track/ answers today — the waybill and the
 *      estimate copied off the order, with no checkpoints.
 *   2. What DHL's Shipment Tracking API answers — `{ shipments: [ ... ] }`,
 *      with `events`, `estimatedTimeOfDelivery` and the rest. The backend may
 *      end up passing this straight through, and if it does, nothing on the
 *      front end needs to change.
 *   3. The normalised shape itself, so a response that has already been
 *      translated server-side is not translated twice.
 *
 * Anything it cannot work out is left null rather than guessed. A parcel
 * interface that invents a delivery date is worse than one that admits it does
 * not have one.
 */

// ─── The stages a parcel moves through ────────────────────────────────────────
//
// Five, because that is what a customer actually wants to know and it is the
// most DHL's own statuses reliably support. `exception` is not a stage — it is
// a parcel that has come off the rails, and it is shown instead of the bar.
//
export const PARCEL_STAGES = [
  { id: 'booked',           label: 'Label made',       hint: 'We have booked the parcel with DHL.' },
  { id: 'collected',        label: 'Collected',        hint: 'DHL has the parcel.' },
  { id: 'in_transit',       label: 'In transit',       hint: 'On its way to your country.' },
  { id: 'out_for_delivery', label: 'Out for delivery', hint: 'With the courier today.' },
  { id: 'delivered',        label: 'Delivered',        hint: 'Signed for.' },
];

export const PARCEL_STATUS = {
  NOT_BOOKED:       'not_booked',
  BOOKED:           'booked',
  COLLECTED:        'collected',
  IN_TRANSIT:       'in_transit',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED:        'delivered',
  EXCEPTION:        'exception',
};

const STAGE_ORDER = PARCEL_STAGES.map((stage) => stage.id);

/** How far along the bar a status sits. -1 for a parcel with no label yet. */
export function stageIndex(status) {
  return STAGE_ORDER.indexOf(status);
}

// ─── Reading DHL's own vocabulary ─────────────────────────────────────────────
//
// DHL sends a coarse `statusCode` and a free-text description. The code alone
// cannot tell "in transit" from "on the van", which is the distinction people
// care about on the last day, so the description is read too — and only for
// phrases DHL uses consistently. Where neither is certain the coarser answer
// wins, because overstating progress is the error a customer notices.
//
const DHL_STATUS_CODES = {
  'pre-transit': PARCEL_STATUS.BOOKED,
  pretransit:    PARCEL_STATUS.BOOKED,
  transit:       PARCEL_STATUS.IN_TRANSIT,
  delivered:     PARCEL_STATUS.DELIVERED,
  failure:       PARCEL_STATUS.EXCEPTION,
};

const DESCRIPTION_HINTS = [
  [/out for delivery|with delivery courier|with courier/i, PARCEL_STATUS.OUT_FOR_DELIVERY],
  [/delivered|signed for/i,                                PARCEL_STATUS.DELIVERED],
  [/picked up|collected|shipment picked/i,                 PARCEL_STATUS.COLLECTED],
  [/clearance delay|held|customs status updated|exception|undeliverable|returned/i,
                                                           PARCEL_STATUS.EXCEPTION],
];

function statusFromDescription(text) {
  if (!text) return null;
  for (const [pattern, status] of DESCRIPTION_HINTS) {
    if (pattern.test(text)) return status;
  }
  return null;
}

function statusFrom(statusCode, description) {
  const fromText = statusFromDescription(description);
  const fromCode = DHL_STATUS_CODES[String(statusCode || '').toLowerCase()] || null;

  // Within the summary itself the free text is the finer of the two: the code
  // has no value for "on the van" and none for "held at customs".
  return fromText || fromCode || null;
}

// ─── Checkpoints ──────────────────────────────────────────────────────────────

function placeOf(node) {
  if (!node) return '';
  const address = node.address || node;
  return (
    address.addressLocality ||
    address.locality ||
    address.city ||
    node.location ||
    ''
  );
}

function normaliseCheckpoint(event) {
  if (!event) return null;
  const when = event.timestamp || event.time || event.at || event.occurred_at || null;
  const description = event.description || event.status || event.message || '';
  if (!when && !description) return null;

  return {
    at:          when,
    description: description || 'Status updated',
    location:    placeOf(event.location) || event.location_name || event.place || '',
    statusCode:  event.statusCode || event.status_code || '',
  };
}

/** Newest first — the question is "where is it now", not "where did it start". */
function sortCheckpoints(checkpoints) {
  return [...checkpoints].sort((a, b) => {
    const left  = a.at ? Date.parse(a.at) : 0;
    const right = b.at ? Date.parse(b.at) : 0;
    return right - left;
  });
}

// ─── The normaliser ───────────────────────────────────────────────────────────

const EMPTY_PARCEL = {
  orderId:           null,
  status:            PARCEL_STATUS.NOT_BOOKED,
  statusText:        '',
  carrier:           '',
  service:           '',
  trackingNumber:    null,
  trackingUrl:       null,
  weightKg:          null,
  pieces:            null,
  origin:            '',
  destination:       '',
  estimatedDelivery: null,
  deliveredAt:       null,
  signedBy:          '',
  checkpoints:       [],
  message:           '',
  lastCheckedAt:     null,
};

export function normaliseParcel(raw) {
  if (!raw) return { ...EMPTY_PARCEL };

  // Already normalised — a backend that does the translation server-side.
  if (Array.isArray(raw.checkpoints) && 'trackingNumber' in raw) {
    return { ...EMPTY_PARCEL, ...raw };
  }

  // DHL's own envelope, whether the backend proxies it whole or unwraps it.
  const shipment = Array.isArray(raw.shipments) ? raw.shipments[0] : null;
  const source   = shipment || raw;

  const events = (source.events || raw.events || [])
    .map(normaliseCheckpoint)
    .filter(Boolean);
  const checkpoints = sortCheckpoints(events);

  const statusNode   = source.status && typeof source.status === 'object' ? source.status : {};
  const statusText   = statusNode.description || statusNode.status ||
                       (typeof source.status === 'string' ? source.status : '') ||
                       checkpoints[0]?.description || '';
  const statusCode   = statusNode.statusCode || source.status_code || '';

  const trackingNumber =
    source.trackingNumber || source.id || raw.tracking_number || raw.trackingNumber || null;

  //
  // The order's own status is the fallback, and it has to be: until DHL is
  // live, it is the ONLY thing that knows a parcel went out, because the
  // waybill is typed in by hand in MyDHL+.
  //
  const fromOrderStatus = {
    dispatched: PARCEL_STATUS.IN_TRANSIT,
    delivered:  PARCEL_STATUS.DELIVERED,
  }[String(raw.order_status || raw.status || '').toLowerCase()] || null;

  //
  // The newest checkpoint outranks the summary, because the summary lags it.
  // DHL keeps `status.statusCode` at `transit` through a clearance delay and
  // through the morning a parcel spends on the van, so reading the summary
  // first would draw a held parcel as one happily on its way — and the held
  // one is the only parcel whose owner needs to hear from us.
  //
  let status =
    statusFromDescription(checkpoints[0]?.description) ||
    statusFrom(statusCode, statusText) ||
    fromOrderStatus ||
    (trackingNumber ? PARCEL_STATUS.BOOKED : PARCEL_STATUS.NOT_BOOKED);

  // A delivery checkpoint outranks everything: DHL sometimes leaves the
  // summary status behind the events by an hour or so.
  if (checkpoints.some((c) => /delivered|signed for/i.test(c.description))) {
    status = PARCEL_STATUS.DELIVERED;
  }

  const delivery = checkpoints.find((c) => /delivered|signed for/i.test(c.description));

  return {
    ...EMPTY_PARCEL,
    orderId:        raw.order_id || raw.orderId || null,
    status,
    statusText,
    carrier:        source.serviceUrl ? 'DHL Express' : (raw.carrier || 'DHL Express'),
    service:        source.service || raw.service || '',
    trackingNumber,
    trackingUrl:    raw.tracking_url || raw.trackingUrl || trackingUrlFor(trackingNumber),
    weightKg:       numberOrNull(source.details?.weight?.value ?? raw.weight_kg ?? raw.declared_weight_kg),
    pieces:         numberOrNull(source.details?.totalNumberOfPieces ?? raw.pieces),
    origin:         placeOf(source.origin),
    destination:    placeOf(source.destination) || raw.destination || '',
    estimatedDelivery:
      source.estimatedTimeOfDelivery || raw.estimated_delivery || raw.estimatedDelivery || null,
    deliveredAt:    delivery?.at || null,
    signedBy:       source.details?.proofOfDelivery?.signatureUrl ? '' : (raw.signed_by || ''),
    checkpoints,
    message:        raw.message || '',
    lastCheckedAt:  new Date().toISOString(),
  };
}

function numberOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

/** DHL's public tracking page for a waybill. Safe to build without the API. */
export function trackingUrlFor(trackingNumber) {
  if (!trackingNumber) return null;
  return `https://www.dhl.com/global-en/home/tracking/tracking-express.html?submit=1&tracking-id=${encodeURIComponent(trackingNumber)}`;
}
