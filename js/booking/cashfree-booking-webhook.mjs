import { createRawBookingWebhookHandler } from './raw-booking-webhook.mjs';
import { createCashfreeWebhookVerifier } from './cashfree-webhook-verifier.mjs';

// Server-side factory. The caller provides the secret via server environment,
// not client JavaScript. This is an adapter, not a deployed route.
export function createCashfreeBookingWebhook({ db, signingSecret, loadBooking, now }) {
 if (!db || typeof loadBooking !== 'function') throw new TypeError('Trusted backend dependencies required');
 const verifyRawSignature = createCashfreeWebhookVerifier(signingSecret, { now });
 return createRawBookingWebhookHandler({ db, verifyRawSignature, loadBooking });
}
