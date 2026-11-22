import test from 'node:test';
import assert from 'node:assert/strict';
import { notificationCategory, preferenceAllows, throttleSeconds, DEFAULT_NOTIFICATION_PREFS } from '../worker/lib/notification-policy.js';
test('category validation does not silently turn unknown types into account alerts', () => {
  assert.equal(notificationCategory('offers'), 'offers');
  assert.equal(notificationCategory('hello'), undefined);
  assert.equal(notificationCategory(null), null);
});
test('transactional and safety alerts default on, travel and offers remain optional', () => {
  assert.equal(preferenceAllows('booking', {}), true);
  assert.equal(preferenceAllows('account', {}), true);
  assert.equal(preferenceAllows('safety', {}), true);
  assert.equal(preferenceAllows('travel', {}), false);
  assert.equal(preferenceAllows('offers', {}), false);
  assert.equal(preferenceAllows('travel', {travel:true}), true);
  assert.equal(preferenceAllows('offers', {offers:true}), true);
  assert.equal(preferenceAllows('safety', {safety:false}), false);
  assert.equal(preferenceAllows('operations', {operations:true}), false);
  assert.equal(DEFAULT_NOTIFICATION_PREFS.offers, false);
});
test('marketing and discovery categories have a frequency cap', () => {
  assert.equal(throttleSeconds('offers'), 604800);
  assert.equal(throttleSeconds('travel'), 172800);
  assert.equal(throttleSeconds('booking'), 0);
});
