// Transaction callback for a trusted server-side Firestore Admin SDK.
// The caller MUST verify the provider signature and order/amount before invoking.
export function createAtomicBookingPaymentCommit(db, { collection = 'bookingSessions' } = {}) {
 if (!db || typeof db.runTransaction !== 'function' || typeof db.collection !== 'function') throw new TypeError('Trusted Firestore client required');
 if (collection !== 'bookingSessions') throw new Error('Unexpected collection');
 return async ({ bookingId, eventId, orderId, amountMinor, currency }) => {
   if (!/^[a-zA-Z0-9_-]{8,100}$/.test(String(bookingId || '')) ||
       !/^payment_[a-zA-Z0-9_-]{6,120}$/.test(String(eventId || '')) || !orderId || !Number.isSafeInteger(amountMinor) || amountMinor <= 0 || currency !== 'INR')
     return { confirmed: false, reason: 'invalid_event' };
   const ref = db.collection(collection).doc(bookingId);
   return db.runTransaction(async tx => {
     const snap = await tx.get(ref);
     if (!snap.exists) return { confirmed: false, reason: 'missing_booking' };
     const booking = snap.data();
     if (booking.state === 'confirmed' && booking.paymentEventId === eventId) return { confirmed: true, reason: 'already_applied' };
     if (booking.state !== 'ready_for_payment' || booking.orderId !== orderId || booking.amountMinor !== amountMinor || booking.currency !== currency)
       return { confirmed: false, reason: 'state_or_order_changed' };
     tx.update(ref, { state: 'confirmed', paymentEventId: eventId, confirmedAt: new Date().toISOString() });
     return { confirmed: true, reason: 'applied' };
   });
 };
}
