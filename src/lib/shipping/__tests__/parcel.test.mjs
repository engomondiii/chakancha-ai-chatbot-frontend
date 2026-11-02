/**
 * parcel.test.mjs — how a DHL tracking response is read.
 *
 * WHAT THIS GUARDS. The interface was built before the DHL account existed,
 * against DHL's documented Shipment Tracking — Unified response. The risk
 * that carries is that the translation is wrong in a way nobody notices until
 * a real parcel is in the air, so the fixture here is a response body in
 * DHL's own shape and wording, and every assertion is made through the same
 * `normaliseParcel` the live API will go through.
 *
 * The two mistakes that would matter most are both about overstating
 * progress: drawing a held parcel as one happily in transit, and leaving a
 * delivered one short of the end because DHL's summary lags its own events.
 *
 * HOW TO RUN
 *   npm run test:shipping
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PARCEL_STATUS, normaliseParcel, stageIndex, trackingUrlFor } from '../parcel.js';
import { dhlTrackingResponse } from '../fixtures.js';

const WAYBILL = '1234567893';
const read = (state) => normaliseParcel(dhlTrackingResponse(WAYBILL, state));

// ─── What the order alone knows, before DHL is connected ─────────────────────

test('an order with no waybill is not booked, and says nothing more', () => {
  const parcel = normaliseParcel({
    order_id: 'ORD-ABC12345', status: 'confirmed', tracking_number: null,
    message: 'Tracking information is not yet available.',
  });

  assert.equal(parcel.status, PARCEL_STATUS.NOT_BOOKED);
  assert.equal(parcel.trackingNumber, null);
  assert.equal(parcel.checkpoints.length, 0);
  assert.equal(parcel.message, 'Tracking information is not yet available.');
});

test('a waybill with no checkpoints reads as a label made', () => {
  const parcel = normaliseParcel({
    order_id: 'ORD-ABC12345', status: 'confirmed', tracking_number: '1234567890',
  });

  assert.equal(parcel.status, PARCEL_STATUS.BOOKED);
  assert.equal(parcel.trackingNumber, '1234567890');
  // Built locally, so the dhl.com link works before the API is connected.
  assert.match(parcel.trackingUrl, /tracking-id=1234567890/);
});

test('the order status carries a hand-booked parcel until DHL is connected', () => {
  const parcel = normaliseParcel({
    order_id: 'ORD-ABC12345', status: 'dispatched', tracking_number: '1234567890',
  });
  assert.equal(parcel.status, PARCEL_STATUS.IN_TRANSIT);
});

// ─── The real response, read whole ───────────────────────────────────────────

test("the shipment's own details are read, not just its status", () => {
  const parcel = read('in_transit');

  assert.equal(parcel.trackingNumber, WAYBILL);
  assert.equal(parcel.service, 'express');
  assert.equal(parcel.productName, 'EXPRESS WORLDWIDE');
  assert.equal(parcel.pieces.total, 1);
  assert.deepEqual(parcel.pieces.ids, [`JD${WAYBILL}0001`]);
  assert.equal(parcel.weightKg, 0.85);
  assert.deepEqual(parcel.dimensions, { length: 24, width: 16, height: 9, unit: 'cm' });
  assert.equal(parcel.references[0].number, 'ORD-7K3M2P91');
});

test('origin and destination keep their country, not just a city', () => {
  const parcel = read('in_transit');

  assert.equal(parcel.origin.locality, 'NAIROBI - KENYA');
  assert.equal(parcel.origin.countryCode, 'KE');
  assert.equal(parcel.destination.locality, 'SEOUL - KOREA, REPUBLIC OF');
  assert.equal(parcel.destination.countryCode, 'KR');
});

test("DHL's own tracking link is preferred over one we build", () => {
  const parcel = read('in_transit');
  assert.equal(parcel.trackingUrl, dhlTrackingResponse(WAYBILL).shipments[0].serviceUrl);
});

test('the delivery window is kept, not flattened to a date', () => {
  const parcel = read('in_transit');

  assert.ok(parcel.estimatedDelivery);
  assert.ok(parcel.estimatedWindow.from);
  assert.ok(parcel.estimatedWindow.to);
  assert.ok(Date.parse(parcel.estimatedWindow.to) > Date.parse(parcel.estimatedWindow.from));
});

test('On Demand Delivery is offered only when DHL offers it', () => {
  assert.ok(read('in_transit').rerouteUrl, 'in transit — DHL offers a reroute');
  assert.equal(read('collected').rerouteUrl, null, 'too early to reroute');
  assert.equal(read('delivered').rerouteUrl, null, 'too late to reroute');
});

test('checkpoints come back newest first', () => {
  const { checkpoints } = read('in_transit');

  assert.equal(checkpoints[0].description, 'Processed at SEOUL - KOREA, REPUBLIC OF');
  assert.equal(checkpoints.at(-1).description, 'Shipment information received');
  for (let i = 1; i < checkpoints.length; i += 1) {
    assert.ok(Date.parse(checkpoints[i - 1].at) >= Date.parse(checkpoints[i].at));
  }
});

// ─── The readings that would be wrong in a costly way ────────────────────────

test('a parcel on the van is out for delivery even when the summary lags', () => {
  const parcel = read('out_for_delivery');

  assert.equal(parcel.status, PARCEL_STATUS.OUT_FOR_DELIVERY);
  assert.ok(stageIndex(parcel.status) > stageIndex(PARCEL_STATUS.IN_TRANSIT));
});

test('a customs hold is an exception, and DHL says why and what follows', () => {
  //
  // This is the one that matters. DHL leaves the summary statusCode at
  // `transit` through a clearance delay, so reading the code alone would draw
  // a stuck parcel as one on its way and the customer would wait in silence.
  //
  const parcel = read('exception');

  assert.equal(parcel.status, PARCEL_STATUS.EXCEPTION);
  assert.match(parcel.checkpoints[0].description, /Clearance delay/);
  assert.match(parcel.statusRemark, /commercial invoice/);
  assert.match(parcel.nextSteps, /No action is needed from you/);
});

test('a delivery is read from the checkpoint, with the name that signed', () => {
  const parcel = read('delivered');

  assert.equal(parcel.status, PARCEL_STATUS.DELIVERED);
  assert.equal(parcel.signedBy, 'J. KIM');
  assert.ok(parcel.deliveredAt);
  assert.match(parcel.proofOfDelivery.documentUrl, /pod\?awb=/);
  assert.equal(parcel.proofOfDelivery.signed, true);
});

// ─── Not translating twice, and not inventing ────────────────────────────────

test('an already-normalised parcel is passed through untouched', () => {
  const once  = read('in_transit');
  const twice = normaliseParcel(once);

  assert.equal(twice.status, once.status);
  assert.equal(twice.trackingNumber, once.trackingNumber);
  assert.equal(twice.productName, once.productName);
  assert.deepEqual(twice.checkpoints, once.checkpoints);
});

test('nothing is invented when the response is empty', () => {
  const parcel = normaliseParcel(null);

  assert.equal(parcel.status, PARCEL_STATUS.NOT_BOOKED);
  assert.equal(parcel.estimatedDelivery, null);
  assert.equal(parcel.estimatedWindow, null);
  assert.equal(parcel.weightKg, null);
  assert.equal(parcel.dimensions, null);
  assert.equal(parcel.proofOfDelivery, null);
  assert.equal(parcel.trackingNumber, null);
  assert.deepEqual(parcel.references, []);
  assert.equal(trackingUrlFor(null), null);
});
