import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { createCashfreeNodeHttpHandler } from '../js/booking/cashfree-node-http-handler.mjs';
function request(parts,method='POST',headers={}) {const req=Readable.from(parts);req.method=method;req.headers=headers;return req;}
function response(){return {statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v},end(body){this.body=JSON.parse(body)}};}
test('POST forwards exact raw body bytes and headers',async()=>{
 let received;const handle=createCashfreeNodeHttpHandler(async x=>{received=x;return {status:200,body:{confirmed:true}}});
 const res=response();await handle(request([Buffer.from(' {'),Buffer.from('"ok":true} ')], 'POST',{'x-webhook-signature':'test'}),res);
 assert.equal(received.rawBody.toString(),' {"ok":true} ');assert.equal(res.statusCode,200);
});
test('rejects non POST, oversized and failing processor without leaking errors',async()=>{
 const handle=createCashfreeNodeHttpHandler(async()=>{throw new Error('secret!')},{maxBytes:1024});
 const get=response();await handle(request([],'GET'),get);assert.equal(get.statusCode,405);
 const huge=response();await handle(request([Buffer.alloc(1025)]),huge);assert.equal(huge.statusCode,413);
 const fail=response();await handle(request([Buffer.from('{}')]),fail);assert.equal(fail.statusCode,500);assert.equal(JSON.stringify(fail.body).includes('secret'),false);
});
