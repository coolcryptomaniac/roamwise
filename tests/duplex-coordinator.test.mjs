import test from 'node:test';
import assert from 'node:assert/strict';
import { createVoiceCoordinator } from '../js/voice/duplex-coordinator.mjs';
test('late assistant response is discarded after interruption',()=>{
 let cancellations=0;const c=createVoiceCoordinator({onCancel:()=>cancellations++});
 c.listen();const token=c.speechEnd().turn;
 c.interrupt();assert.equal(c.reply(token),null);
 assert.equal(c.snapshot().mode,'listening');assert.equal(cancellations,1);
 const next=c.speechEnd().turn;assert.ok(next>token);
 assert.equal(c.reply(next).mode,'speaking');c.stop();assert.equal(c.snapshot().mode,'idle');
});
