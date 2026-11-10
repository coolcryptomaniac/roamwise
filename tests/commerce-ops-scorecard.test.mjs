import test from 'node:test';import assert from 'node:assert/strict';import {commerceScorecard,chooseNextAction} from '../worker/lib/commerce-ops-scorecard.js';
test('missing metrics stay unknown',()=>{const r=commerceScorecard({visits:100});assert.equal(r.values.paidOrders,null);assert.equal(r.conversionPercent,null);});
test('conversion and reply rates use verified counts',()=>{const r=commerceScorecard({visits:200,paidOrders:4,outreachSent:50,outreachReplies:5});assert.equal(r.conversionPercent,2);assert.equal(r.replyRatePercent,10);});
test('inconsistent fulfillment triggers review',()=>{const r=commerceScorecard({paidOrders:1,fulfilledOrders:3});assert.ok(r.flags.includes('fulfillment_count_inconsistent'));});
test('support issues take precedence over growth',()=>{const r=commerceScorecard({paidOrders:10,supportExceptions:2});assert.match(chooseNextAction(r),/Resolve customer support/);});
