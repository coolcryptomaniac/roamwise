import { createCashfreeWebhookVerifier } from './cashfree-webhook-verifier.mjs';
import { normalizeCashfreePaymentEvent } from './cashfree-payload-normalizer.mjs';
import { createBookingPaymentProcessor } from './booking-payment-processor.mjs';

// Trusted server adapter for Cashfree's actual event envelope.
// resolveBookingByOrderId must use server-controlled order-to-booking mapping.
export function createCashfreeEventProcessor({ db, signingSecret, resolveBookingByOrderId, now }) {
 if (!db || typeof resolveBookingByOrderId !== 'function') throw new TypeError('Trusted order lookup required');
 const verify = createCashfreeWebhookVerifier(signingSecret, { now });
 return async ({ rawBody, headers = {} }) => {
   if (!Buffer.isBuffer(rawBody) || rawBody.length === 0 || rawBody.length > 65536)
     return { status:400, body:{ confirmed:false, reason:'invalid_raw_body' } };
   if (!(await verify({ rawBody, headers }))) return { status:401, body:{ confirmed:false, reason:'invalid_signature' } };
   let event;
   try { event = JSON.parse(rawBody.toString('utf8')); }
   catch { return { status:400, body:{ confirmed:false, reason:'invalid_json' } }; }
   const orderId=event?.data?.order?.order_id;
   if (event?.type !== 'PAYMENT_SUCCESS_WEBHOOK' || typeof orderId !== 'string' || !orderId)
     return { status:400, body:{ confirmed:false, reason:'unsupported_event' } };
   const booking=await resolveBookingByOrderId(orderId);
   const normalized=normalizeCashfreePaymentEvent(event,booking);
   if (!normalized.accepted) return { status:409, body:{ confirmed:false, reason:normalized.reason } };
   const process=createBookingPaymentProcessor({ db, verifySignature:async()=>true,
     loadBooking:async id=>id===booking.id ? booking : null });
   const result=await process(normalized.payload);
   return { status:result.confirmed?200:409, body:result };
 };
}
