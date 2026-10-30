import { evaluatePaymentWebhook } from './payment-webhook-gate.mjs';

// Trusted server orchestration boundary. Signature verification and transactionally
// persisted booking/order state are required from injected backend dependencies.
export async function handleVerifiedBookingPayment(payload, { verifySignature, loadBooking, applyConfirmedPayment }) {
 if (typeof verifySignature !== 'function' || typeof loadBooking !== 'function' || typeof applyConfirmedPayment !== 'function')
   throw new TypeError('Trusted backend adapters required');
 const verified = await verifySignature(payload);
 if (verified !== true) return { confirmed: false, reason: 'invalid_signature' };
 const bookingId = String(payload?.bookingId || '');
 if (!/^[a-zA-Z0-9_-]{8,100}$/.test(bookingId)) return { confirmed: false, reason: 'invalid_booking' };
 const booking = await loadBooking(bookingId);
 if (!booking || !['ready_for_payment', 'confirmed'].includes(booking.state)) return { confirmed: false, reason: 'booking_not_payable' };
 const checked = evaluatePaymentWebhook({
   signatureVerified: verified, bookingId,
   expectedOrderId: booking.orderId, expectedAmountMinor: booking.amountMinor,
   amountMinor: payload.amountMinor, currency: booking.currency,
   event: payload.event,
 });
 if (!checked.accepted) return { confirmed: false, reason: checked.reason };
 // Backend must atomically verify state/order and enforce unique payment event ID.
 const result = await applyConfirmedPayment({ bookingId, eventId: checked.eventId, orderId: booking.orderId, amountMinor: booking.amountMinor, currency: booking.currency });
 return { confirmed: result?.confirmed === true, reason: result?.reason || null };
}
