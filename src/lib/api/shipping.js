/**
 * src/lib/api/shipping.js
 *
 * Asking the backend where a parcel is.
 *
 * WHY THIS EXISTS AHEAD OF THE INTEGRATION. The DHL Express account is not
 * open yet, so nothing here can reach DHL today. What it can do is fix the
 * calls and the shape the screens read, so that when the account arrives the
 * only work left is in Django: the backend answers with the shape
 * src/lib/shipping/parcel.js already knows how to read.
 *
 * Every call goes to our own backend, never to DHL from the browser — a DHL
 * API key is a server credential and cannot be shipped to a page.
 */

import api from './client';
import { ENDPOINTS } from './endpoints';
//
// Imported as well as re-exported, deliberately. `export … from` forwards a
// name without binding it in this module, so anything named below — the
// default-export object included — has to be imported too or it is a
// ReferenceError the moment the page hydrates.
//
import { normaliseParcel, trackingUrlFor } from '@/lib/shipping/parcel';
import { dhlTrackingResponse } from '@/lib/shipping/fixtures';

export {
  PARCEL_STAGES, PARCEL_STATUS, stageIndex, normaliseParcel, trackingUrlFor,
} from '@/lib/shipping/parcel';

// ─── Calls ────────────────────────────────────────────────────────────────────

/**
 * Where is the parcel for one of my orders?
 *
 * Signed in, and the backend checks the order belongs to the caller. Returns
 * the normalised parcel; a parcel nobody has booked yet is NOT an error — it
 * comes back with status `not_booked` and whatever the backend said about why.
 */
export async function trackOrderParcel(orderId) {
  const data = await api.get(ENDPOINTS.ORDERS.TRACK(orderId));
  return normaliseParcel({ ...data, order_id: data?.order_id ?? orderId });
}

/**
 * Where is waybill 1234567890?
 *
 * Public on purpose: the person chasing a parcel is often not the person who
 * ordered it — a gift, an office delivery, somebody reading the card on the
 * box. They have the number and nothing else.
 *
 * The backend is expected to proxy DHL rather than let the browser call it,
 * because the DHL API key must not reach the browser.
 */
export async function trackParcel(trackingNumber) {
  const waybill = String(trackingNumber || '').trim();
  if (!waybill) throw new Error('Enter a tracking number.');

  try {
    const data = await api.get(ENDPOINTS.SHIPPING.TRACK, {
      params: { tracking_number: waybill },
    });
    return normaliseParcel({ ...data, tracking_number: data?.tracking_number || waybill });
  } catch (err) {
    //
    // Nothing answers /shipping/track/ until the DHL account is open, so in
    // development the interface is fed a parcel instead of a blank page. The
    // same thing the other API modules in this folder already do, and for the
    // same reason: the screens have to be buildable before the integration is.
    //
    // Production never reaches this — the error is thrown and the page says
    // tracking is unavailable, which is the truth.
    //
    if (process.env.NODE_ENV === 'development') return developmentParcel(waybill);
    throw err;
  }
}

//
// Which parcel the fixture hands back is chosen by the LAST DIGIT of the
// number typed in, so every state the interface can draw is reachable from
// the search box without editing code:
//
//   …0  nothing booked yet        …4  out for delivery
//   …1  label made, not collected …5  delivered, with proof of delivery
//   …2  collected                 …6  held at customs (an exception)
//   …3  in transit (anything else)
//
const DEVELOPMENT_STATES = {
  0: 'not_booked',
  1: 'booked',
  2: 'collected',
  3: 'in_transit',
  4: 'out_for_delivery',
  5: 'delivered',
  6: 'exception',
};

/**
 * A DHL response for `waybill`, run through the same translation the real
 * API's will be — the fixture is a response body, not a ready-made parcel,
 * so building against it exercises `normaliseParcel` exactly as production
 * will.
 */
function developmentParcel(waybill) {
  const lastDigit = Number(String(waybill).replace(/\D/g, '').slice(-1));
  const wanted    = DEVELOPMENT_STATES[lastDigit] || 'in_transit';

  if (wanted === 'not_booked') {
    return normaliseParcel({
      tracking_number: null,
      message: 'This order has not been dispatched yet. We will email you the '
             + 'tracking number the moment it is booked.',
    });
  }

  return normaliseParcel(dhlTrackingResponse(waybill, wanted));
}

export default { trackOrderParcel, trackParcel, normaliseParcel, trackingUrlFor };
