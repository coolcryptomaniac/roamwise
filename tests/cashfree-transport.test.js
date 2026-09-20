const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const url = require('node:url');

async function load(){
  return import(url.pathToFileURL(path.join(__dirname,'../worker/lib/cashfree-transport.js')).href);
}

test('Cashfree transport preserves successful response without reporting',async()=>{
  const {cashfreeTransportFetch}=await load();
  const expected=new Response('{}',{status:401});
  const reports=[];
  const result=await cashfreeTransportFetch('https://api.cashfree.com/pg/orders',{method:'POST'},async()=>expected,(...args)=>reports.push(args));
  assert.equal(result,expected);
  assert.equal(reports.length,0);
});

test('Cashfree transport reports only safe classifications; rethrows original error',async()=>{
  const {cashfreeTransportFetch}=await load();
  const secret='secret_ThisMustNeverReachLogs';
  const failure=new TypeError(`fetch failed ${secret}`,{cause:Object.assign(new Error('connect ECONNRESET'),{code:'ECONNRESET'})});
  const reports=[];
  await assert.rejects(cashfreeTransportFetch('https://api.cashfree.com/pg/orders',{
    method:'POST',headers:{'x-client-secret':secret},body:JSON.stringify({phone:'9999999999'})
  },async()=>{throw failure;},(...args)=>reports.push(args)),error=>error===failure);
  assert.equal(reports.length,1);
  assert.equal(reports[0][0],'cashfree_transport_failure');
  assert.deepEqual(reports[0][1],{operation:'create_order',category:'connection',code:'ECONNRESET'});
  assert.ok(!JSON.stringify(reports).includes(secret));
  assert.ok(!JSON.stringify(reports).includes('9999999999'));
});

test('Cashfree transport rejects untrusted error codes and distinguishes status calls',async()=>{
  const {cashfreeTransportFetch}=await load();
  const reports=[];
  await assert.rejects(cashfreeTransportFetch('https://api.cashfree.com/pg/orders/order-id',{method:'GET'},
    async()=>{throw Object.assign(new Error('TLS certificate expired'),{code:'secret:leak-me'});},
    (...args)=>reports.push(args)));
  assert.deepEqual(reports[0][1],{operation:'get_order',category:'tls',code:'unknown'});
});
