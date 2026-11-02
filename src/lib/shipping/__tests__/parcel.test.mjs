/**
 * parcel.test.mjs — how a tracking response is read.
 *
 * WHAT THIS GUARDS. The interface was built before the DHL account existed,
 * against DHL's documented response shape. The risk that carries is that the
 * translation is wrong in a way nobody notices until a real parcel is in the
 * air — and the two mistakes that would matter are both about overstating
 * progress: drawing a held parcel as one happily in transit, and leaving a
 * delivered one short of the end because DHL's summary lags its own events.
 *
 * HOW TO RUN
 *   npm run test:shipping
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  PARCEL_STATUS, normaliseParcel, stageIndex, trackingUrlFor,
} from '../parcel.js';

// A trimmed copy of DHL's Shipment Tracking response shape.
const dhlResponse = (events, status = {}) => ({
  shipments: [{
    id: '1234567890',
    service: 'express',
    status: { statusCode: 'transit', description: 'In transit', ...status },
    estimatedTimeOfDelivery: '2026-11-08T17:00:00',
    origin:      { address: { addressLocality: 'Nairobi, KE' } },
    destination: { address: { addressLocality: 'Seoul, KR' } },
    details:     { weight: { value: 0.85, unitText: 'kg' }, totalNumberOfPieces: 1 },
    events,
  }],
});

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

test("DHL's own response is read whole", () => {
  const parcel = normaliseParcel(dhlResponse([
    { timestamp: '2026-11-02T09:10:00', description: 'Shipment picked up',
      location: { address: { addressLocality: 'Nairobi, KE' } } },
    { timestamp: '2026-11-03T04:40:00', description: 'Processed at DHL facility',
      location: { address: { addressLocality: 'Dubai, AE' } } },
  ]));

  assert.equal(parcel.status, PARCEL_STATUS.IN_TRANSIT);
  assert.equal(parcel.trackingNumber, '1234567890');
  assert.equal(parcel.weightKg, 0.85);
  assert.equal(parcel.pieces, 1);
  assert.equal(parcel.origin, 'Nairobi, KE');
  assert.equal(parcel.destination, 'Seoul, KR');
  assert.equal(parcel.estimatedDelivery, '2026-11-08T17:00:00');
  assert.equal(parcel.checkpoints.length, 2);
});

test('checkpoints come back newest first', () => {
  const parcel = normaliseParcel(dhlResponse([
    { timestamp: '2026-11-02T09:10:00', description: 'Shipment picked up' },
    { timestamp: '2026-11-04T11:00:00', description: 'Arrived at destination' },
    { timestamp: '2026-11-03T04:40:00', description: 'Processed at DHL facility' },
  ]));

  assert.deepEqual(parcel.checkpoints.map((c) => c.description), [
    'Arrived at destination',
    'Processed at DHL facility',
    'Shipment picked up',
  ]);
});

test('a parcel on the van is out for delivery, not merely in transit', () => {
  const parcel = normaliseParcel(dhlResponse([
    { timestamp: '2026-11-08T07:30:00', description: 'With delivery courier' },
  ], { description: 'With delivery courier' }));

  assert.equal(parcel.status, PARCEL_STATUS.OUT_FOR_DELIVERY);
  assert.ok(stageIndex(parcel.status) > stageIndex(PARCEL_STATUS.IN_TRANSIT));
});

test('a parcel on the van is out for delivery even when the summary lags', () => {
  // The summary is left at its default "In transit" on purpose: that is what
  // DHL actually sends while the courier is already carrying the box.
  const parcel = normaliseParcel(dhlResponse([
    { timestamp: '2026-11-08T07:30:00', description: 'Out for delivery' },
    { timestamp: '2026-11-07T22:10:00', description: 'Arrived at delivery facility' },
  ]));

  assert.equal(parcel.status, PARCEL_STATUS.OUT_FOR_DELIVERY);
});

test('a customs hold is an exception even while DHL still says transit', () => {
  //
  // This is the one that matters. DHL keeps the summary statusCode at
  // `transit` through a clearance delay, so reading the code alone would draw
  // a stuck parcel as one on its way and the customer would wait in silence.
  //
  const parcel = normaliseParcel(dhlResponse([
    { timestamp: '2026-11-06T12:00:00', description: 'Clearance delay' },
  ]));

  assert.equal(parcel.status, PARCEL_STATUS.EXCEPTION);
});

test('a delivery checkpoint outranks a lagging summary status', () => {
  const parcel = normaliseParcel(dhlResponse([
    { timestamp: '2026-11-08T14:02:00', description: 'Delivered - Signed for by: KIM' },
  ]));

  assert.equal(parcel.status, PARCEL_STATUS.DELIVERED);
  assert.equal(parcel.deliveredAt, '2026-11-08T14:02:00');
});

test('an already-normalised parcel is passed through untouched', () => {
  const once  = normaliseParcel(dhlResponse([
    { timestamp: '2026-11-02T09:10:00', description: 'Shipment picked up' },
  ]));
  const twice = normaliseParcel(once);

  assert.equal(twice.status, once.status);
  assert.equal(twice.trackingNumber, once.trackingNumber);
  assert.deepEqual(twice.checkpoints, once.checkpoints);
});

test('nothing is invented when the response is empty', () => {
  const parcel = normaliseParcel(null);

  assert.equal(parcel.status, PARCEL_STATUS.NOT_BOOKED);
  assert.equal(parcel.estimatedDelivery, null);
  assert.equal(parcel.weightKg, null);
  assert.equal(parcel.trackingNumber, null);
  assert.equal(trackingUrlFor(null), null);
});
