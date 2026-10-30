// Opt-in transactional payment claim implementation. Must be integrated with
// booking commit in the SAME Firestore transaction before production use.
export async function claimPaymentInTransaction(tx, db, { eventId, bookingId, orderId, amountMinor, currency }) {
 if (!tx || typeof tx.get !== 'function' || typeof tx.create !== 'function' || !db || typeof db.collection !== 'function') throw new TypeError('Firestore transaction required');
 if (!/^payment_[a-zA-Z0-9_-]{6,120}$/.test(String(eventId||'')) || !/^[a-zA-Z0-9_-]{8,100}$/.test(String(bookingId||'')) || !orderId || !Number.isSafeInteger(amountMinor) || amountMinor <= 0 || currency !== 'INR')
   return { accepted:false, reason:'invalid_claim' };
 const ref=db.collection('bookingPaymentClaims').doc(eventId);
 const snap=await tx.get(ref);
 if (snap.exists) {
   const claim=snap.data();
   if (claim.bookingId === bookingId && claim.orderId === orderId && claim.amountMinor === amountMinor && claim.currency === currency)
     return { accepted:true, reason:'existing_claim' };
   return { accepted:false, reason:'payment_already_claimed' };
 }
 tx.create(ref,{bookingId,orderId,amountMinor,currency});
 return { accepted:true, reason:'new_claim' };
}
