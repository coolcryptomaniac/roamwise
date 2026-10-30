import { handleVerifiedBookingPayment } from './verified-payment-handler.mjs';
import { createAtomicBookingPaymentCommit } from './atomic-payment-commit.mjs';

// Composition for a trusted webhook service. This is not an HTTP endpoint:
// provider-specific signature validation, replay protection and authenticated
// order lookup must be supplied by the deployed backend.
export function createBookingPaymentProcessor({ db, verifySignature, loadBooking }) {
 if (typeof verifySignature !== 'function' || typeof loadBooking !== 'function') throw new TypeError('Verified backend dependencies required');
 const applyConfirmedPayment = createAtomicBookingPaymentCommit(db);
 return payload => handleVerifiedBookingPayment(payload, {
   verifySignature, loadBooking, applyConfirmedPayment,
 });
}
