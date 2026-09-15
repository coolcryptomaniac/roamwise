/* Deterministic, provider-neutral settlement intent for a paid stay.
   This module does not call Cashfree. A trusted server may translate the
   validated output to Easy Split only after vendor onboarding, signed payment
   verification and product activation. Amounts use integer paise throughout. */

const ALLOWED_BOOKING_STATES = new Set(['confirmed', 'completed', 'checked_out']);
const PAID_STATES = new Set(['paid', 'captured']);

function safeId(value, max = 80) {
  return String(value || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, max);
}

function fail(message) {
  const error = new Error(message);
  error.code = 'invalid_settlement_intent';
  throw error;
}

export function buildMarketplaceSettlement(booking, partner) {
  const b = booking || {};
  const p = partner || {};
  const bookingId = safeId(b.id || b.bookingId || b.ref);
  if (!bookingId) fail('Booking id is required.');
  const orderId = safeId(b.cashfreeOrderId || b.orderId);
  if (!orderId) fail('A trusted provider order id is required.');
  if (!ALLOWED_BOOKING_STATES.has(String(b.status || '').toLowerCase())) {
    fail('The booking must be confirmed or completed before settlement.');
  }
  if (!PAID_STATES.has(String(b.paymentStatus || '').toLowerCase())) {
    fail('A trusted payment event must mark the booking paid before settlement.');
  }

  const vendorId = safeId(p.cashfreeVendorId || p.settlementVendorId);
  if (!vendorId || p.settlementStatus !== 'active') {
    fail('The property does not have an active verified settlement vendor.');
  }

  const amountINR = Number(b.amount);
  const grossPaise = Math.round(amountINR * 100);
  if (!Number.isFinite(amountINR) || grossPaise <= 0) fail('A positive booking amount is required.');

  // The commission must already be snapshotted on the trusted booking record.
  // Never fall back to a current plan or a browser-supplied percentage here.
  const commissionPct = Number(b.commissionPctSnapshot);
  if (!Number.isFinite(commissionPct) || commissionPct < 0 || commissionPct > 30) {
    fail('A valid snapshotted commission percentage is required.');
  }

  const platformPaise = Math.round(grossPaise * commissionPct / 100);
  const propertyPaise = grossPaise - platformPaise;
  if (propertyPaise < 0 || propertyPaise + platformPaise !== grossPaise) {
    fail('Settlement amounts do not balance.');
  }

  return Object.freeze({
    version: 1,
    provider: 'cashfree_easy_split',
    bookingId,
    orderId,
    vendorId,
    currency: 'INR',
    grossPaise,
    propertyPaise,
    platformPaise,
    commissionPct,
    idempotencyKey: safeId(`rw_split_${bookingId}`, 100)
  });
}
