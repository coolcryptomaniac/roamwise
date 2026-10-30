import test from 'node:test';
import assert from 'node:assert/strict';
import {nextBookingState,mayRequestPayment} from '../js/booking/booking-state-core.mjs';
test('payment requires partner and customer confirmations',()=>{
 let s='draft';assert.equal(mayRequestPayment(s),false);s=nextBookingState(s,'request');
 assert.equal(mayRequestPayment(s),false);s=nextBookingState(s,'partner_confirm');
 assert.equal(mayRequestPayment(s),false);s=nextBookingState(s,'customer_confirm');assert.equal(mayRequestPayment(s),true);
});
