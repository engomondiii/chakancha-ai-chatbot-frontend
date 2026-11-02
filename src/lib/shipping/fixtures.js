/**
 * src/lib/shipping/fixtures.js
 *
 * A real DHL Express tracking response, for building and testing against.
 *
 * WHY IT LOOKS LIKE THIS. Everything below is the actual body DHL's Shipment
 * Tracking — Unified API returns, field for field: the `shipments` envelope,
 * `status` repeating the latest event, `details.product`, `details.pieceIds`,
 * `estimatedDeliveryTimeFrame`, `serviceUrl`, `rerouteUrl`, and `remark` /
 * `nextSteps` on the events that carry them. The checkpoint wording is DHL
 * Express's own — "Departed Facility in NAIROBI - KENYA", "Clearance
 * processing complete at INCHEON - KOREA, REPUBLIC OF", "Delivered - Signed
 * for by: ..." — rather than anything invented here.
 *
 * The point of that fidelity: when the DHL account opens and Django starts
 * proxying the real API, the screens should not move. If they do, the
 * mismatch is visible here first.
 *
 * Nothing in this file is reachable in production. See src/lib/api/shipping.js.
 */

const WAYBILL_ROUTE = {
  // Nandi Hills is served out of Nairobi; Seoul clears through Incheon.
  origin: {
    address: {
      countryCode: 'KE',
      postalCode: '00100',
      addressLocality: 'NAIROBI - KENYA',
      streetAddress: 'Chakancha Global, Nandi Hills',
    },
  },
  destination: {
    address: {
      countryCode: 'KR',
      postalCode: '04524',
      addressLocality: 'SEOUL - KOREA, REPUBLIC OF',
    },
  },
};

//
// DHL sends local time with no zone suffix — "2026-11-03T09:00:00" — so the
// fixture does too. Using toISOString() here would hand back UTC in the same
// shape, and every checkpoint would then be read as local and shown hours
// out: a delivery window of 09:00–13:00 displayed as 06:00–10:00.
//
function localIso(date) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
       + `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

const hoursAgo = (hours) => localIso(new Date(Date.now() - hours * 3600000));

/** Tomorrow's delivery window, in the business hours DHL actually quotes. */
function deliveryWindow() {
  const at = (hour) => {
    const day = new Date(Date.now() + 86400000);
    day.setHours(hour, 0, 0, 0);
    return localIso(day);
  };
  return { eta: at(12), from: at(9), to: at(13) };
}

/**
 * The journey a Nairobi → Seoul express parcel actually produces, oldest
 * first. `normaliseParcel` turns it round for display.
 */
function journey() {
  return [
    { timestamp: hoursAgo(58), statusCode: 'pre-transit', status: 'Pre-transit',
      description: 'Shipment information received',
      location: { address: { addressLocality: 'NAIROBI - KENYA' } } },
    { timestamp: hoursAgo(54), statusCode: 'transit', status: 'Transit',
      description: 'Shipment picked up',
      location: { address: { addressLocality: 'KAPSABET - KENYA' } } },
    { timestamp: hoursAgo(50), statusCode: 'transit', status: 'Transit',
      description: 'Processed at NAIROBI - KENYA',
      location: { address: { addressLocality: 'NAIROBI - KENYA' } } },
    { timestamp: hoursAgo(47), statusCode: 'transit', status: 'Transit',
      description: 'Departed Facility in NAIROBI - KENYA',
      location: { address: { addressLocality: 'NAIROBI - KENYA' } } },
    { timestamp: hoursAgo(36), statusCode: 'transit', status: 'Transit',
      description: 'Arrived at Sort Facility DUBAI - UNITED ARAB EMIRATES',
      location: { address: { addressLocality: 'DUBAI - UNITED ARAB EMIRATES' } } },
    { timestamp: hoursAgo(33), statusCode: 'transit', status: 'Transit',
      description: 'Departed Facility in DUBAI - UNITED ARAB EMIRATES',
      location: { address: { addressLocality: 'DUBAI - UNITED ARAB EMIRATES' } } },
    { timestamp: hoursAgo(14), statusCode: 'transit', status: 'Transit',
      description: 'Arrived at Sort Facility INCHEON - KOREA, REPUBLIC OF',
      location: { address: { addressLocality: 'INCHEON - KOREA, REPUBLIC OF' } } },
    { timestamp: hoursAgo(11), statusCode: 'transit', status: 'Transit',
      description: 'Clearance processing complete at INCHEON - KOREA, REPUBLIC OF',
      location: { address: { addressLocality: 'INCHEON - KOREA, REPUBLIC OF' } } },
    { timestamp: hoursAgo(6), statusCode: 'transit', status: 'Transit',
      description: 'Processed at SEOUL - KOREA, REPUBLIC OF',
      location: { address: { addressLocality: 'SEOUL - KOREA, REPUBLIC OF' } } },
  ];
}

const OUT_FOR_DELIVERY = {
  timestamp: hoursAgo(3), statusCode: 'transit', status: 'Transit',
  description: 'With delivery courier',
  location: { address: { addressLocality: 'SEOUL - KOREA, REPUBLIC OF' } },
};

const DELIVERED = {
  timestamp: hoursAgo(1), statusCode: 'delivered', status: 'Delivered',
  description: 'Delivered - Signed for by: J. KIM',
  location: { address: { addressLocality: 'SEOUL - KOREA, REPUBLIC OF' } },
};

//
// A clearance delay is the exception that actually happens to tea going into
// Korea, and it is the one case where DHL's `remark` and `nextSteps` earn
// their place: DHL says what it is waiting for and who has to act.
//
const CLEARANCE_DELAY = {
  timestamp: hoursAgo(9), statusCode: 'transit', status: 'Transit',
  description: 'Clearance delay - Shipment on hold',
  remark: 'Customs requires a copy of the commercial invoice before release.',
  nextSteps: 'No action is needed from you — DHL has what it needs from the '
           + 'shipper and the shipment will move on once customs release it.',
  location: { address: { addressLocality: 'INCHEON - KOREA, REPUBLIC OF' } },
};

/** How many of the journey's steps each state has reached. */
const REACHED = {
  booked:           1,
  collected:        2,
  in_transit:       9,   // through the last sort in Seoul
  out_for_delivery: 9,
  delivered:        9,
  // The hold lands at Incheon, before clearance completes — which is where
  // it lands in practice.
  exception:        7,
};

/**
 * A DHL tracking body for `waybill` in the state `wanted`.
 *
 * Returned exactly as DHL would send it — the caller runs it through
 * `normaliseParcel` like any other response, so the fixture exercises the
 * same translation the real API will.
 */
export function dhlTrackingResponse(waybill, wanted = 'in_transit') {
  const events = journey().slice(0, REACHED[wanted] ?? 7);

  if (wanted === 'out_for_delivery') events.push(OUT_FOR_DELIVERY);
  if (wanted === 'delivered')        events.push(OUT_FOR_DELIVERY, DELIVERED);
  if (wanted === 'exception')        events.push(CLEARANCE_DELAY);

  const latest    = events[events.length - 1];
  const delivered = wanted === 'delivered';
  const window    = deliveryWindow();

  return {
    shipments: [{
      id: waybill,
      service: 'express',
      serviceUrl: `https://www.dhl.com/global-en/home/tracking/tracking-express.html?submit=1&tracking-id=${waybill}`,
      // DHL only offers On Demand Delivery once a parcel is in the country.
      ...(wanted === 'in_transit' || wanted === 'out_for_delivery'
        ? { rerouteUrl: `https://ondemand.dhl.com/?trackingNumber=${waybill}` }
        : {}),
      returnFlag: false,
      ...WAYBILL_ROUTE,
      status: latest,
      estimatedTimeOfDelivery: delivered ? undefined : window.eta,
      ...(delivered ? {} : {
        estimatedDeliveryTimeFrame: {
          estimatedFrom:    window.from,
          estimatedThrough: window.to,
        },
      }),
      ...(wanted === 'exception'
        ? { estimatedTimeOfDeliveryRemark: 'Delivery date may change while the shipment is held.' }
        : {}),
      details: {
        product: { productCode: 'P', productName: 'EXPRESS WORLDWIDE' },
        totalNumberOfPieces: 1,
        pieceIds: [`JD${waybill}0001`],
        weight: { value: 0.85, unitText: 'kg' },
        dimensions: { length: 24, width: 16, height: 9, unitText: 'cm' },
        references: [
          { number: 'ORD-7K3M2P91', type: 'customer-reference' },
        ],
        ...(delivered
          ? {
              proofOfDeliverySignedAvailable: true,
              proofOfDelivery: {
                timestamp: DELIVERED.timestamp,
                documentUrl: `https://www.dhl.com/pod?awb=${waybill}`,
              },
            }
          : {}),
      },
      events,
    }],
  };
}

export const FIXTURE_STATES = [
  'not_booked', 'booked', 'collected', 'in_transit',
  'out_for_delivery', 'delivered', 'exception',
];
