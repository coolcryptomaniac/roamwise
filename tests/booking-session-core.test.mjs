import test from 'node:test';
import assert from 'node:assert/strict';
import { createBookingSession } from '../js/booking/booking-session-core.mjs';
test('booking requires partner confirmation and server payment verification',()=>{
 const b=createBookingSession({bookingId:'booking_1234'});
 assert.equal(b.apply({event:'request',eventId:'evt_00001',actor:'customer'}).applied,true);
 assert.equal(b.apply({event:'partner_confirm',eventId:'evt_00002',actor:'customer'}).applied,false);
 assert.equal(b.apply({event:'partner_confirm',eventId:'evt_00002',actor:'partner'}).applied,true);
 assert.equal(b.apply({event:'customer_confirm',eventId:'evt_00003',actor:'customer'}).paymentAllowed,true);
 assert.equal(b.apply({event:'payment_confirmed',eventId:'evt_00004',actor:'customer'}).applied,false);
 assert.equal(b.apply({event:'payment_confirmed',eventId:'evt_00004',actor:'server'}).state,'confirmed');
 assert.equal(b.apply({event:'payment_confirmed',eventId:'evt_00004',actor:'server'}).reason,'duplicate');
});
