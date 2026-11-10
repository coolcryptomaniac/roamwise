import test from 'node:test';
import assert from 'node:assert/strict';
import {tuskPresentation,bookingIntentResponse} from '../worker/lib/tusk-presentation.js';
import {handleTuskCapabilities,handleTuskOpenApi} from '../worker/handlers/tusk-partner.js';
test('short cards have no invented prices',()=>{const r=tuskPresentation('Almora stays\nStay A\nStay B');assert.equal(r.cards.length,2);assert.equal(r.cards[0].price,null);});
test('full text only on expand',()=>{assert.equal(tuskPresentation('Hello\nDetails').fullText,undefined);assert.equal(tuskPresentation('Hello\nDetails',{expanded:true}).fullText,'Hello\nDetails');});
test('booking cannot bypass verification',()=>{assert.equal(bookingIntentResponse({packageId:'p',authenticated:true}).status,'verification_required');});
test('public discovery does not create orders',async()=>{const r=await handleTuskCapabilities(new Request('https://example.com/tusk/capabilities'));assert.equal((await r.json()).booking.publicCreateOrder,false);assert.equal((await handleTuskOpenApi(new Request('https://example.com/tusk/openapi.json'))).status,200);});
