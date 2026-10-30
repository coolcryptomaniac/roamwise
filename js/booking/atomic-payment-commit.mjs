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
   const claimRef = db.collection('bookingPaymentClaims').doc(eventId);
   return db.runTransaction(async tx => {
     const snap = await tx.get(ref);
     const claimSnap = await tx.get(claimRef);
     if (!snap.exists) return { confirmed: false, reason: 'missing_booking' };
     const booking = snap.data();
     if (claimSnap.exists) {
       const claim = claimSnap.data();
       if (claim.bookingId !== bookingId || claim.orderId !== orderId || claim.amountMinor !== amountMinor || claim.currency !== currency)
         return { confirmed: false, reason: 'payment_already_claimed' };
     }
     if (booking.state === 'confirmed' && booking.paymentEventId === eventId && booking.orderId === orderId && booking.amountMinor === amountMinor && booking.currency === currency)
       return claimSnap.exists ? { confirmed: true, reason: 'already_applied' } : { confirmed: false, reason: 'missing_payment_claim' };
     if (claimSnap.exists) return { confirmed: false, reason: 'payment_already_claimed' };
     if (booking.state !== 'ready_for_payment' || booking.orderId !== orderId || booking.amountMinor !== amountMinor || booking.currency !== currency)
       return { confirmed: false, reason: 'state_or_order_changed' };
     // Never confirm a booking whose server-defined payment window has expired.
     if (booking.paymentExpiresAt != null) {
       const expiry = Date.parse(booking.paymentExpiresAt);
       if (!Number.isFinite(expiry) || expiry <= Date.now())
         return { confirmed: false, reason: 'payment_window_expired' };
     }
     tx.create(claimRef, { bookingId, orderId, amountMinor, currency, claimedAt: new Date().toISOString() });
     tx.update(ref, { state: 'confirmed', paymentEventId: eventId, confirmedAt: new Date().toISOString() });
     return { confirmed: true, reason: 'applied' };
   });
 };
}
