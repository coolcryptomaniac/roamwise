import test from 'node:test';import assert from 'node:assert/strict';import {routeAiTask} from '../worker/lib/ai-autopilot-policy.js';
test('routine support routes cheaply',()=>assert.equal(routeAiTask({task:'customer_support'}).model,'gpt-6-luna'));
test('money movement cannot be authorized by model',()=>assert.equal(routeAiTask({task:'complex_audit',requestedAction:'refund',verified:true}).allowed,false));
test('unverified audit fails closed',()=>assert.equal(routeAiTask({task:'complex_audit'}).reason,'source_evidence_required'));
test('high-risk code review needs approval',()=>assert.equal(routeAiTask({task:'code_review'}).requiresApproval,true));
