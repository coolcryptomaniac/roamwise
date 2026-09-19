const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const project = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(project, 'worker/handlers/cashfree.js'), 'utf8');
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const sample = {
  type: 'service_account', project_id: 'roamwisepro',
  client_email: 'checkout-test@roamwisepro.iam.gserviceaccount.com',
  private_key: privateKey.export({ type:'pkcs8', format:'pem' })
};
const sampleJson = JSON.stringify(sample);
function request(token){ return {
  headers:{get: name => name.toLowerCase()==='authorization' && token ? `Bearer ${token}` : ''},
  json:async()=>({amount:100,customer:{phone:'9999999999'},meta:{planId:'founder'}})
}; }
async function order(requestObject, secret, getFetch){
  const { handleCashfreeOrder } = await import(path.join(project,'worker/handlers/cashfree.js'));
  const prior = global.fetch;
  if(getFetch) global.fetch=getFetch;
  try {return await handleCashfreeOrder(requestObject,{
    CASHFREE_APP_ID:'test-id',CASHFREE_SECRET_KEY:'test-secret',
    FIREBASE_SERVICE_ACCOUNT_JSON:secret,CASHFREE_ENV:'live'
  });} finally {global.fetch=prior;}
}

test('raw JSON and base64 Firebase service-account secrets parse without exposing credentials',async()=>{
  const {parseServiceAccount}=await import(path.join(project,'worker/lib/service-account.js'));
  assert.equal(parseServiceAccount({FIREBASE_SERVICE_ACCOUNT_JSON:sampleJson}).project_id,'roamwisepro');
  assert.equal(parseServiceAccount({FIREBASE_SERVICE_ACCOUNT_JSON:Buffer.from(sampleJson).toString('base64')}).client_email,sample.client_email);
});

test('shared parser rejects malformed secrets but remains compatible with push test projects',async()=>{
  const {parseServiceAccount}=await import(path.join(project,'worker/lib/service-account.js'));
  assert.throws(()=>parseServiceAccount({}),/service_account_missing/);
  assert.throws(()=>parseServiceAccount({FIREBASE_SERVICE_ACCOUNT_JSON:'broken'}),/service_account_invalid/);
  assert.equal(parseServiceAccount({FIREBASE_SERVICE_ACCOUNT_JSON:JSON.stringify({...sample,project_id:'other-project'})}).project_id,'other-project');
});

test('Cashfree returns a backend error, never a fake sign-in-expired error, for malformed server credentials',async()=>{
  let calls=0;
  const response=await order(request('not-a-token'),'bad-base64',async()=>{calls++;throw new Error('must not reach network');});
  assert.equal(response.status,503);
  assert.equal((await response.json()).error,'payment_backend_unavailable');
  assert.equal(calls,0);
});

test('Cashfree rejects a different Firebase service-account project before network calls',async()=>{
  let calls=0;
  const wrong=JSON.stringify({...sample,project_id:'different-project'});
  const response=await order(request('not-a-token'),wrong,async()=>{calls++;throw new Error('must not reach network');});
  assert.equal(response.status,503);
  assert.equal((await response.json()).error,'payment_backend_unavailable');
  assert.equal(calls,0);
});

test('Cashfree rejects missing or malformed customer authentication before payment creation',async()=>{
  let calls=0;
  const fetch=async()=>{calls++;throw new Error('must not reach network');};
  const missing=await order(request(null),sampleJson,fetch);
  assert.equal(missing.status,401);
  const invalid=await order(request('not-a-jwt'),sampleJson,fetch);
  assert.equal(invalid.status,401);
  assert.equal(calls,0);
});

test('a correctly signed Firebase ID token plus rejected Google OAuth returns backend 503 without contacting Cashfree',async()=>{
  const now=Math.floor(Date.now()/1000);
  function enc(value){return Buffer.from(JSON.stringify(value)).toString('base64url');}
  const signingInput=enc({alg:'RS256',typ:'JWT',kid:'cashfree-auth-test-kid'})+'.'+enc({aud:'roamwisepro',iss:'https://securetoken.google.com/roamwisepro',sub:'signed-in-user',iat:now,exp:now+3600});
  const token=signingInput+'.'+crypto.sign('RSA-SHA256',Buffer.from(signingInput),privateKey).toString('base64url');
  const urls=[];
  const mockedFetch=async url=>{
    urls.push(String(url));
    if(String(url).includes('service_accounts/v1/jwk/')){
      return new Response(JSON.stringify({keys:[{...publicKey.export({format:'jwk'}),kid:'cashfree-auth-test-kid',alg:'RS256',use:'sig'}]}),{status:200});
    }
    if(String(url).includes('oauth2.googleapis.com/token'))return new Response('{}',{status:403});
    throw new Error('must not contact a payment provider or Firestore');
  };
  const response=await order(request(token),sampleJson,mockedFetch);
  assert.equal(response.status,503);
  assert.equal((await response.json()).error,'payment_backend_unavailable');
  assert.ok(urls.some(url=>url.includes('oauth2.googleapis.com/token')));
  assert.ok(!urls.some(url=>url.includes('cashfree.com')));
});

test('Cashfree has separate backend and customer identity checks; project policy is payment-only',()=>{
  assert.match(source,/if\(sa\.project_id !== 'roamwisepro'\) return \{error:backendUnavailable\(\)\};/);
  assert.match(source,/try \{ claims = await verifyFirebaseIdToken\(match\[1\], sa.project_id\); \}/);
});
