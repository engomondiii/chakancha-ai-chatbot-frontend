/**
 * src/lib/shipping/parcel.js
 *
 * What a parcel is, and how to read one out of a DHL tracking response.
 *
 * Pure: no network, no React, no Next. Split out from src/lib/api/shipping.js
 * so the translation can be tested on its own — this is the part that has to
 * keep working when DHL changes the shape of a response, and it is the part
 * every screen is built on.
 *
 * WHAT IT IS WRITTEN AGAINST. DHL's Shipment Tracking — Unified API
 * (https://api-eu.dhl.com/track/shipments), whose documented response is:
 *
 *   shipments[]
 *     id, service, serviceUrl, rerouteUrl, returnFlag
 *     origin/destination  { address { countryCode, postalCode, addressLocality,
 *                                     streetAddress }, servicePoint { url, label } }
 *     status              ShipmentEvent — the latest one, repeated
 *     estimatedTimeOfDelivery, estimatedTimeOfDeliveryRemark
 *     estimatedDeliveryTimeFrame { estimatedFrom, estimatedThrough }
 *     details  { product { productCode, productName },
 *                proofOfDelivery { timestamp, documentUrl, signatureUrl },
 *                proofOfDeliverySignedAvailable,
 *                totalNumberOfPieces, pieceIds[],
 *                weight { value, unitText }, dimensions, references[] }
 *     events[]            ShipmentEvent { timestamp, statusCode, status,
 *                                         description, remark, nextSteps,
 *                                         pieceIds[], location.address }
 *
 * Three inputs are accepted on purpose:
 *
 *   1. That body, whether the backend proxies it whole or hands over one
 *      shipment. Proxying it whole is the cheapest thing Django can do, and
 *      nothing here needs changing if it does.
 *   2. What /api/v1/orders/{id}/track/ answers today — the waybill and the
 *      estimate copied off the order, with no checkpoints.
 *   3. The normalised shape itself, so a response already translated
 *      server-side is not translated twice.
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

// ─── Reading DHL's vocabulary ─────────────────────────────────────────────────
//
// DHL sends a coarse `statusCode` and a free-text `description`. The code is
// one of five values and cannot tell "in transit" from "on the van", which is
// the distinction people care about on the last day, so the description is
// read too — and only for phrases DHL uses consistently.
//
const DHL_STATUS_CODES = {
  'pre-transit': PARCEL_STATUS.BOOKED,
  pretransit:    PARCEL_STATUS.BOOKED,
  transit:       PARCEL_STATUS.IN_TRANSIT,
  delivered:     PARCEL_STATUS.DELIVERED,
  failure:       PARCEL_STATUS.EXCEPTION,
  unknown:       null,
};

const DESCRIPTION_HINTS = [
  [/delivered|signed for/i,                                      PARCEL_STATUS.DELIVERED],
  [/out for delivery|with delivery courier|with courier/i,       PARCEL_STATUS.OUT_FOR_DELIVERY],
  [/clearance delay|on hold|held|customs status updated|exception|undeliverable|refused|returned to shipper|address.*(incorrect|invalid)/i,
                                                                 PARCEL_STATUS.EXCEPTION],
  [/picked up|collected/i,                                       PARCEL_STATUS.COLLECTED],
  [/arrived|departed|processed|clearance (processing )?complete|transit|forwarded/i,
                                                                 PARCEL_STATUS.IN_TRANSIT],
];

function statusFromDescription(text) {
  if (!text) return null;
  for (const [pattern, status] of DESCRIPTION_HINTS) {
    if (pattern.test(text)) return status;
  }
  return null;
}

// ─── Small readers ────────────────────────────────────────────────────────────

function numberOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

/** A DHL `Place`: `{ address: {...}, servicePoint: {...} }`. */
function readPlace(place) {
  const address = place?.address || {};
  const locality = text(address.addressLocality) || text(place?.addressLocality);
  if (!locality && !address.countryCode && !address.streetAddress) return null;

  return {
    locality,
    countryCode:   text(address.countryCode),
    postalCode:    text(address.postalCode),
    streetAddress: text(address.streetAddress),
    servicePoint:  place?.servicePoint?.label
      ? { label: text(place.servicePoint.label), url: text(place.servicePoint.url) }
      : null,
  };
}

/** The locality of a place or of an event's `location`. */
function localityOf(node) {
  if (!node) return '';
  return (
    text(node.address?.addressLocality) ||
    text(node.addressLocality) ||
    text(node.locality) ||
    text(node.city) ||
    (typeof node === 'string' ? node.trim() : '')
  );
}

function readEvent(event) {
  if (!event) return null;

  const when        = event.timestamp || event.time || event.at || event.occurred_at || null;
  const description = text(event.description) || text(event.status) || text(event.message);
  if (!when && !description) return null;

  return {
    at:          when,
    //
    // DHL sends both: `status` is the short title ("Transit") and
    // `description` is the line a human reads ("Departed Facility in
    // NAIROBI - KENYA"). The description is the one worth showing.
    //
    description: description || 'Status updated',
    title:       text(event.status),
    statusCode:  text(event.statusCode) || text(event.status_code),
    location:    localityOf(event.location) || text(event.location_name) || text(event.place),
    //
    // `remark` and `nextSteps` are the two fields that make a real
    // integration worth having: DHL says what went wrong and what the
    // customer should do about it, in its own words. Passing them through
    // beats anything we could write from a status code.
    //
    remark:      text(event.remark),
    nextSteps:   text(event.nextSteps) || text(event.next_steps),
    pieceIds:    Array.isArray(event.pieceIds) ? event.pieceIds : [],
  };
}

/** Newest first — the question is "where is it now", not "where did it start". */
function sortEvents(events) {
  return [...events].sort((a, b) => {
    const left  = a.at ? Date.parse(a.at) : 0;
    const right = b.at ? Date.parse(b.at) : 0;
    return right - left;
  });
}

// ─── The normalised parcel ────────────────────────────────────────────────────

const EMPTY_PARCEL = {
  orderId:            null,
  status:             PARCEL_STATUS.NOT_BOOKED,
  statusText:         '',
  statusRemark:       '',
  nextSteps:          '',
  carrier:            'DHL Express',
  service:            '',
  productName:        '',
  trackingNumber:     null,
  trackingUrl:        null,
  rerouteUrl:         null,
  isReturn:           false,
  pieces:             { total: null, ids: [] },
  weightKg:           null,
  dimensions:         null,
  references:         [],
  origin:             null,
  destination:        null,
  estimatedDelivery:  null,
  estimatedWindow:    null,
  estimatedRemark:    '',
  deliveredAt:        null,
  signedBy:           '',
  proofOfDelivery:    null,
  checkpoints:        [],
  message:            '',
  lastCheckedAt:      null,
};

//
// "Delivered - Signed for by: J. KIM" is how DHL Express words it. The name is
// worth pulling out: it is the single fact that settles "did it arrive".
// Initials carry full stops, so those cannot be a stop character; only a
// comma, a semicolon or the end of the line ends the name.
//
const SIGNATORY = /signed for by[:\s]*([^,;]+)/i;

function signatoryIn(description) {
  const name = description?.match(SIGNATORY)?.[1] || '';
  return name.trim().replace(/\.$/, '');
}

export function normaliseParcel(raw) {
  if (!raw) return { ...EMPTY_PARCEL };

  // Already normalised — a backend that translates server-side.
  if (Array.isArray(raw.checkpoints) && 'trackingNumber' in raw) {
    return { ...EMPTY_PARCEL, ...raw };
  }

  const shipment = Array.isArray(raw.shipments) ? raw.shipments[0] : null;
  const source   = shipment || raw;
  const details  = source.details || {};

  const checkpoints = sortEvents(
    (source.events || raw.events || []).map(readEvent).filter(Boolean)
  );

  // `status` is the latest event repeated at the top level.
  const summary    = readEvent(source.status) || {};
  const statusCode = summary.statusCode || text(source.status_code);
  const statusText = summary.description || text(source.status) ||
                     checkpoints[0]?.description || '';

  const trackingNumber =
    text(source.id) || raw.tracking_number || raw.trackingNumber || null;

  //
  // The order's own status is the fallback, and it has to be: until DHL is
  // connected it is the ONLY thing that knows a parcel went out, because the
  // waybill is typed in by hand in MyDHL+.
  //
  const fromOrderStatus = {
    dispatched: PARCEL_STATUS.IN_TRANSIT,
    delivered:  PARCEL_STATUS.DELIVERED,
  }[String(raw.order_status || raw.status || '').toLowerCase()] || null;

  //
  // The newest checkpoint outranks the summary, because the summary lags it.
  // DHL keeps `statusCode` at `transit` through a clearance delay and through
  // the morning a parcel spends on the van, so reading the summary first would
  // draw a held parcel as one happily on its way — and the held one is the
  // only parcel whose owner needs to hear from us.
  //
  let status =
    statusFromDescription(checkpoints[0]?.description) ||
    statusFromDescription(statusText) ||
    DHL_STATUS_CODES[statusCode.toLowerCase()] ||
    fromOrderStatus ||
    (trackingNumber ? PARCEL_STATUS.BOOKED : PARCEL_STATUS.NOT_BOOKED);

  const delivery = checkpoints.find((c) => /delivered|signed for/i.test(c.description));
  if (delivery) status = PARCEL_STATUS.DELIVERED;

  const pod = details.proofOfDelivery || null;

  const timeFrame = source.estimatedDeliveryTimeFrame || null;
  const window = timeFrame && (timeFrame.estimatedFrom || timeFrame.estimatedThrough)
    ? { from: timeFrame.estimatedFrom || null, to: timeFrame.estimatedThrough || null }
    : null;

  const weight = details.weight || {};

  return {
    ...EMPTY_PARCEL,
    orderId:      raw.order_id || raw.orderId || null,
    status,
    statusText,
    statusRemark: summary.remark || checkpoints[0]?.remark || '',
    nextSteps:    summary.nextSteps || checkpoints[0]?.nextSteps || '',
    carrier:      raw.carrier || 'DHL Express',
    service:      text(source.service) || text(raw.service),
    productName:  text(details.product?.productName),
    trackingNumber,
    //
    // DHL's own `serviceUrl` points at the tracking page for THIS shipment and
    // is preferred over anything we build, because it carries whatever query
    // DHL currently expects. The fallback exists so the link still works
    // before the API is connected at all.
    //
    trackingUrl:  text(source.serviceUrl) || raw.tracking_url || raw.trackingUrl ||
                  trackingUrlFor(trackingNumber),
    //
    // On Demand Delivery. When DHL offers it, the customer can move the
    // delivery themselves — to another day, a neighbour, a service point —
    // without anybody emailing us. It is the one genuinely useful thing a
    // tracking page can do besides tell you where the box is.
    //
    rerouteUrl:   text(source.rerouteUrl) || null,
    isReturn:     Boolean(source.returnFlag),

    pieces: {
      total: numberOrNull(details.totalNumberOfPieces),
      ids:   Array.isArray(details.pieceIds) ? details.pieceIds : [],
    },
    weightKg:   numberOrNull(weight.value ?? raw.weight_kg ?? raw.declared_weight_kg),
    dimensions: details.dimensions
      ? {
          length: numberOrNull(details.dimensions.length),
          width:  numberOrNull(details.dimensions.width),
          height: numberOrNull(details.dimensions.height),
          unit:   text(details.dimensions.unitText) || 'cm',
        }
      : null,
    references: (details.references || [])
      .map((reference) => ({
        number: text(reference.number),
        type:   text(reference.type),
      }))
      .filter((reference) => reference.number),

    origin:      readPlace(source.origin),
    destination: readPlace(source.destination) ||
                 (raw.destination ? { locality: text(raw.destination) } : null),

    estimatedDelivery: source.estimatedTimeOfDelivery || raw.estimated_delivery ||
                       raw.estimatedDelivery || null,
    estimatedWindow:   window,
    estimatedRemark:   text(source.estimatedTimeOfDeliveryRemark),

    deliveredAt: delivery?.at || pod?.timestamp || null,
    signedBy:    signatoryIn(delivery?.description),
    proofOfDelivery: pod
      ? {
          at:          pod.timestamp || null,
          // signatureUrl is deprecated in favour of documentUrl; read both so
          // an older response is not silently dropped.
          documentUrl: text(pod.documentUrl) || text(pod.signatureUrl) || '',
          signed:      Boolean(details.proofOfDeliverySignedAvailable),
        }
      : null,

    checkpoints,
    message:       text(raw.message),
    lastCheckedAt: new Date().toISOString(),
  };
}

/** DHL's public tracking page for a waybill. Safe to build without the API. */
export function trackingUrlFor(trackingNumber) {
  if (!trackingNumber) return null;
  return `https://www.dhl.com/global-en/home/tracking/tracking-express.html?submit=1&tracking-id=${encodeURIComponent(trackingNumber)}`;
}
