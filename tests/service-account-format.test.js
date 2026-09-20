const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

test('Firebase service-account private secret supports raw JSON and Base64-encoded JSON', async () => {
  const {parseServiceAccount}=await import(path.join(__dirname,'../worker/lib/service-account.js'));
  const sa={project_id:'roamwisepro',client_email:'tester@roamwisepro.iam.gserviceaccount.com',private_key:'-----BEGIN PRIVATE KEY-----\nFAKE-TEST-ONLY\n-----END PRIVATE KEY-----\n'};
  const raw=JSON.stringify(sa);
  assert.deepEqual(parseServiceAccount({FIREBASE_SERVICE_ACCOUNT_JSON:raw}),sa);
  assert.deepEqual(parseServiceAccount({FIREBASE_SERVICE_ACCOUNT_JSON:Buffer.from(raw).toString('base64')}),sa);
  assert.deepEqual(parseServiceAccount({FIREBASE_SERVICE_ACCOUNT_JSON:JSON.stringify(Buffer.from(raw).toString('base64'))}),sa);
  assert.throws(()=>parseServiceAccount({FIREBASE_SERVICE_ACCOUNT_JSON:'invalid%%'}),/not valid JSON or Base64 JSON/);
  assert.throws(()=>parseServiceAccount({FIREBASE_SERVICE_ACCOUNT_JSON:Buffer.from('{}').toString('base64')}),/missing client_email/);
});
