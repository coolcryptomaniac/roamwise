// Server-side payment webhook gate. The caller MUST verify Cashfree's signature
// and authenticate the booking against durable storage before calling this helper.
export function evaluatePaymentWebhook({ signatureVerified, bookingId, expectedOrderId, event, amountMinor, currency = 'INR', expectedAmountMinor }) {
 if (signatureVerified !== true) return { accepted: false, reason: 'invalid_signature' };
 if (!/^[a-zA-Z0-9_-]{8,100}$/.test(String(bookingId || ''))) return { accepted: false, reason: 'invalid_booking' };
 if (!event || event.orderId !== expectedOrderId || !expectedOrderId) return { accepted: false, reason: 'order_mismatch' };
 if (event.status !== 'SUCCESS') return { accepted: false, reason: 'not_paid' };
 if (!Number.isSafeInteger(amountMinor) || !Number.isSafeInteger(expectedAmountMinor) || amountMinor <= 0 || amountMinor !== expectedAmountMinor)
   return { accepted: false, reason: 'amount_mismatch' };
 if (currency !== 'INR' || event.currency !== currency) return { accepted: false, reason: 'currency_mismatch' };
 const paymentId = String(event.paymentId || '');
 if (!/^[a-zA-Z0-9_-]{6,120}$/.test(paymentId)) return { accepted: false, reason: 'invalid_payment_id' };
 return { accepted: true, eventId: 'payment_' + paymentId, event: 'payment_confirmed', actor: 'server' };
}
