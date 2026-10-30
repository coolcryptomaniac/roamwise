import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { createCashfreeWebhookVerifier } from '../js/booking/cashfree-webhook-verifier.mjs';
const secret='test_signing_secret_long_enough';
const rawBody=Buffer.from(' {"order":"abc", "amount":100} ');
const timestamp='1793440000';
const signature=createHmac('sha256',secret).update(timestamp).update(rawBody).digest('base64');
const verify=createCashfreeWebhookVerifier(secret,{now:()=>Number(timestamp)*1000});
test('valid Cashfree raw-body signature passes with case-insensitive headers',async()=>{
 assert.equal(await verify({rawBody,headers:{'X-Webhook-Timestamp':timestamp,'X-Webhook-Signature':signature}}),true);
});
test('modified bytes, wrong signature and stale timestamps fail',async()=>{
 const headers={'x-webhook-timestamp':timestamp,'x-webhook-signature':signature};
 assert.equal(await verify({rawBody:Buffer.from(rawBody.toString().trim()),headers}),false);
 assert.equal(await verify({rawBody,headers:{...headers,'x-webhook-signature':Buffer.alloc(32).toString('base64')}}),false);
 assert.equal(await createCashfreeWebhookVerifier(secret,{now:()=>Number(timestamp)*1000+301000})({rawBody,headers}),false);
});
