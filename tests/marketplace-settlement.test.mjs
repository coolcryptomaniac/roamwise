import assert from 'node:assert/strict';
import test from 'node:test';
import { buildMarketplaceSettlement } from '../payments/marketplace-settlement.mjs';

const partner = { cashfreeVendorId: 'vendor_property_1', settlementStatus: 'active' };

test('marketplace settlement uses integer paise and always balances', () => {
  const intent = buildMarketplaceSettlement({
    id: 'booking_1', status: 'confirmed', paymentStatus: 'paid', amount: 1000.01,
    commissionPctSnapshot: 7, cashfreeOrderId: 'order_1'
  }, partner);
  assert.equal(intent.grossPaise, 100001);
  assert.equal(intent.platformPaise, 7000);
  assert.equal(intent.propertyPaise, 93001);
  assert.equal(intent.propertyPaise + intent.platformPaise, intent.grossPaise);
  assert.equal(intent.idempotencyKey, 'rw_split_booking_1');
});

test('marketplace settlement refuses an unverified vendor', () => {
  assert.throws(() => buildMarketplaceSettlement({
    id: 'booking_1', orderId: 'order_1', status: 'confirmed', paymentStatus: 'paid', amount: 1000,
    commissionPctSnapshot: 7
  }, { cashfreeVendorId: 'vendor_1', settlementStatus: 'pending' }), /active verified/);
});

test('marketplace settlement refuses a browser callback without trusted paid state', () => {
  assert.throws(() => buildMarketplaceSettlement({
    id: 'booking_1', orderId: 'order_1', status: 'confirmed', paymentStatus: 'checkout_complete', amount: 1000,
    commissionPctSnapshot: 7
  }, partner), /trusted payment event/);
});

test('marketplace settlement never substitutes current plan terms for a missing snapshot', () => {
  assert.throws(() => buildMarketplaceSettlement({
    id: 'booking_1', orderId: 'order_1', status: 'completed', paymentStatus: 'captured', amount: 1000
  }, partner), /snapshotted commission/);
});
