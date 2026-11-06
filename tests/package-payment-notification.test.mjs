import test from 'node:test';import assert from 'node:assert/strict';
import {planPaymentEscalation} from '../worker/lib/package-payment-notification.mjs';
const booking={id:'booking_12345'};
const payment={verification:'provider_reconciled',ledgerCommitted:true,bookingId:booking.id,amountMinor:125000,currency:'INR',providerPaymentId:'cf_998877'};
test('rejects unsigned or uncommitted notification',()=>{assert.equal(planPaymentEscalation({booking,payment:{...payment,ledgerCommitted:false}}).ready,false)});
test('routes only to active assigned support staff',()=>{
 const x=planPaymentEscalation({booking,payment,supportRoster:[
 {id:'deepanshi_staff',active:true,acceptsPackageBookings:true,openCases:1},
 {id:'febin_staff',active:false,acceptsPackageBookings:true,openCases:0}
 ]});
 assert.equal(x.ready,true);assert.equal(x.assignee,'deepanshi_staff');
 assert.deepEqual(x.recipients,['founder@roamwise.co.in','support@roamwise.co.in']);
 assert.equal(x.deliveryStatus,'queued_not_sent');
});
test('no active staff falls back to support queue',()=>{assert.equal(planPaymentEscalation({booking,payment}).assignee,'support_queue')});
