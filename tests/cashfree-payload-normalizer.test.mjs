import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCashfreePaymentEvent } from '../js/booking/cashfree-payload-normalizer.mjs';
const booking={id:'booking_1234',orderId:'order_12345'};
const event={type:'PAYMENT_SUCCESS_WEBHOOK',data:{order:{order_id:'order_12345',order_amount:1500,order_currency:'INR'},payment:{cf_payment_id:123456,payment_status:'SUCCESS'}}};
test('Cashfree payment event maps rupees to minor units',()=>{
 const x=normalizeCashfreePaymentEvent(event,booking);
 assert.equal(x.accepted,true);assert.equal(x.payload.amountMinor,150000);
 assert.equal(x.payload.event.paymentId,'123456');
});
test('reject unknown orders, unsupported events and fractional paise',()=>{
 assert.equal(normalizeCashfreePaymentEvent(event,{...booking,orderId:'wrong'}).accepted,false);
 assert.equal(normalizeCashfreePaymentEvent({...event,type:'PAYMENT_FAILED_WEBHOOK'},booking).accepted,false);
 assert.equal(normalizeCashfreePaymentEvent({...event,data:{...event.data,order:{...event.data.order,order_amount:1.234}}},booking).accepted,false);
});
