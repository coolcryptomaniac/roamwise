import test from 'node:test';import assert from 'node:assert/strict';import {secretReadiness,redactSensitive} from '../worker/lib/secret-guard.js';
test('payment operations fail closed on missing secrets',()=>assert.deepEqual(secretReadiness({},'payments'),{ready:false,missing:['CASHFREE_APP_ID','CASHFREE_SECRET_KEY']}));
test('valid secret bindings are not returned',()=>assert.deepEqual(secretReadiness({QIKINK_CLIENT_ID:'abc',QIKINK_CLIENT_SECRET:'secret'},'supplier'),{ready:true,missing:[]}));
test('redacts bearer tokens',()=>assert.ok(!redactSensitive('Authorization: Bearer abc123').includes('abc123')));
