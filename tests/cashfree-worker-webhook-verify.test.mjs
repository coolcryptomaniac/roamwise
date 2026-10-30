import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac,webcrypto} from 'node:crypto';
import {verifyCashfreeWorkerWebhook} from '../worker/lib/cashfree-booking-webhook-verify.js';
test('Workers webhook verifier accepts exact raw signed bytes and rejects tampering',async()=>{
 const original=globalThis.crypto;
 Object.defineProperty(globalThis,'crypto',{configurable:true,value:webcrypto});
 try {
  const secret='sandbox_webhook_secret_123',timestamp='1793404800',now=()=>1793404800000;
  const rawBody=new TextEncoder().encode('{"type":"PAYMENT_SUCCESS_WEBHOOK","data":{}}');
  const signature=createHmac('sha256',secret).update(timestamp).update(rawBody).digest('base64');
  const headers=new Headers({'x-webhook-timestamp':timestamp,'x-webhook-signature':signature});
  const check=(bytes,h=headers)=>verifyCashfreeWorkerWebhook({rawBody:bytes,headers:h,secret,now});
  assert.equal(await check(rawBody),true);
  assert.equal(await check(new TextEncoder().encode('{"type":"PAYMENT_FAILED_WEBHOOK"}')),false);
  assert.equal(await check(rawBody,new Headers({'x-webhook-timestamp':timestamp,'x-webhook-signature':'A'.repeat(43)+'='})),false);
  assert.equal(await verifyCashfreeWorkerWebhook({rawBody,headers,secret,now:()=>1793405800000}),false);
 } finally {if(original===undefined)delete globalThis.crypto;else Object.defineProperty(globalThis,'crypto',{configurable:true,value:original});}
});
