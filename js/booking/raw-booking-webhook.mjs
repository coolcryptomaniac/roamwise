import { createBookingPaymentProcessor } from './booking-payment-processor.mjs';

// Trusted HTTP boundary: retain original raw bytes for the provider's verifier.
// A parsed JSON object alone is not sufficient to validate a Cashfree webhook.
export function createRawBookingWebhookHandler({ db, verifyRawSignature, loadBooking, maxBytes = 65536 }) {
 if (typeof verifyRawSignature !== 'function' || typeof loadBooking !== 'function') throw new TypeError('Trusted webhook dependencies required');
 if (!Number.isSafeInteger(maxBytes) || maxBytes < 1024 || maxBytes > 1048576) throw new RangeError('Invalid payload limit');
 return async ({ rawBody, headers = {} }) => {
   if (!Buffer.isBuffer(rawBody) || rawBody.length === 0 || rawBody.length > maxBytes)
     return { status: 400, body: { confirmed: false, reason: 'invalid_raw_body' } };
   // Verify bytes before trusting or parsing any webhook fields.
   let verified = false;
   try { verified = await verifyRawSignature({ rawBody, headers }) === true; }
   catch { verified = false; }
   if (!verified) return { status: 401, body: { confirmed: false, reason: 'invalid_signature' } };
   let payload;
   try { payload = JSON.parse(rawBody.toString('utf8')); }
   catch { return { status: 400, body: { confirmed: false, reason: 'invalid_json' } }; }
   const process = createBookingPaymentProcessor({ db, verifySignature: async () => true, loadBooking });
   const result = await process(payload);
   return { status: result.confirmed ? 200 : 409, body: result };
 };
}
