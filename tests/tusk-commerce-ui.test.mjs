import test from 'node:test';import assert from 'node:assert/strict';
import {tuskCommerceCard,tuskCompactResult,tuskCheckoutPolicy,TUSK_BRAND} from '../worker/lib/tusk-commerce-ui.js';
import {tuskDailyReview} from '../worker/lib/tusk-daily-review.js';
test('RoamWise violet and gold branding',()=>{assert.equal(TUSK_BRAND.violet,'#7357F6');assert.equal(TUSK_BRAND.gold,'#D9AA55');});
test('never invents checkout price',()=>{const c=tuskCommerceCard('shop',{id:'sku_1',name:'Scarf',price:5,checkoutUrl:'https://attacker.test'});assert.equal(c.price,null);assert.equal(c.action.requiresServerQuote,true);assert.equal(c.action.href,'/shop/');});
test('compact and expand',()=>{const t='x'.repeat(300);assert.equal(tuskCompactResult(t).summary.length,200);assert.equal(tuskCompactResult(t,[],true).details.length,300);});
test('no payment confirmation without verified booking',()=>assert.equal(tuskCheckoutPolicy({authenticated:true,serverQuoteVerified:true,userApproved:true,providerSessionCreated:true,paymentVerified:true}),'await_booking_confirmation'));
test('daily audit is read-only',()=>assert.equal(tuskDailyReview({TUSK_AUTONOMOUS_CHANGES:'true'}).changesApplied,0));
