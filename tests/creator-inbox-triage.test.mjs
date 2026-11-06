import test from 'node:test';import assert from 'node:assert/strict';
import {classifyMail,triageInbox,maintenanceReport} from '../worker/lib/creator-inbox-triage.mjs';
test('payment failure requires review',()=>{const r=classifyMail({id:'1',subject:'Booking payment failed'});assert.equal(r.kind,'booking_payment');assert.equal(r.automaticSendAllowed,false)});
test('unsubscribe flagged for suppression review',()=>assert.equal(classifyMail({id:'2',subject:'Please unsubscribe'}).suggestedAction,'suppress_and_review'));
test('deduplicates inbox message IDs',()=>assert.equal(triageInbox([{id:'x',subject:'a'},{id:'x',subject:'b'}]).length,1));
test('maintenance only reports',()=>{const r=maintenanceReport({creators:[{email:'a@b.com'},{email:'a@b.com'}]});assert.equal(r.duplicateCreatorEmails,1);assert.equal(r.destructiveChangesMade,0)});
