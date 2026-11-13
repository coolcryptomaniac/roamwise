import test from 'node:test';import assert from 'node:assert/strict';import {evaluateFirebaseCost} from '../worker/lib/firebase-cost-policy.js';
test('missing billing data fails unknown',()=>assert.equal(evaluateFirebaseCost({}).status,'unknown'));
test('forecast triggers early warning',()=>assert.equal(evaluateFirebaseCost({actualUsd:1,forecastUsd:9,reportAgeHours:1}).status,'critical'));
test('stale data is not called safe',()=>assert.equal(evaluateFirebaseCost({actualUsd:0,forecastUsd:0,reportAgeHours:50}).status,'stale'));
test('cost policy is not a hard cap',()=>assert.equal(evaluateFirebaseCost({actualUsd:9.9,forecastUsd:11,reportAgeHours:1}).hardCap,false));
