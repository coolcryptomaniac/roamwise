import {handleBookingCashfreeCheckout} from './handlers/booking-cashfree-checkout.js';
import {handleBookingCashfreeWebhook} from './handlers/booking-cashfree-webhook.js';
export default {async fetch(request,env) {
  const path=new URL(request.url).pathname;
  if(path==='/booking/cashfree/order')return handleBookingCashfreeCheckout(request,env);
  if(path==='/booking/cashfree/webhook')return handleBookingCashfreeWebhook(request,env);
  return Response.json({error:'not_found'},{status:404});
}};
