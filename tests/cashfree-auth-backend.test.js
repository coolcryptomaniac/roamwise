const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { generateKeyPairSync } = require('node:crypto');
const project = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(project, 'worker/handlers/cashfree.js'), 'utf8');
const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const sample = {
  type: 'service_account', project_id: 'roamwisepro',
  client_email: 'checkout-test@roamwisepro.iam.gserviceaccount.com',
  private_key: privateKey.export({ type:'pkcs8', format:'pem' })
};

test('both JSON and base64 service-account secret formats parse without logging secrets', async () => {
  const { parseServiceAccount } = await import(path.join(project,'worker/lib/service-account.js'));
  const raw = JSON.stringify(sample);
  assert.equal(parseServiceAccount({ FIREBASE_SERVICE_ACCOUNT_JSON:raw }).project_id, 'roamwisepro');
  assert.equal(parseServiceAccount({ FIREBASE_SERVICE_ACCOUNT_JSON:Buffer.from(raw).toString('base64') }).client_email, sample.client_email);
});

test('shared parser rejects malformed and missing credentials without breaking other Firebase consumers', async () => {
  const { parseServiceAccount } = await import(path.join(project,'worker/lib/service-account.js'));
  assert.throws(() => parseServiceAccount({}), /service_account_missing/);
  assert.throws(() => parseServiceAccount({ FIREBASE_SERVICE_ACCOUNT_JSON:'broken' }), /service_account_invalid/);
  assert.equal(parseServiceAccount({ FIREBASE_SERVICE_ACCOUNT_JSON:JSON.stringify({...sample,project_id:'other-project'}) }).project_id, 'other-project');
});

test('Cashfree handler enforces RoamWise project and separates backend from customer identity failures', () => {
  assert.match(source, /function backendUnavailable\(\)/);
  assert.match(source, /error:'payment_backend_unavailable'/);
  assert.match(source, /try \{ sa = parseServiceAccount\(env\); \}\s*catch \(_\) \{ return \{error:backendUnavailable\(\)\}; \}/);
  assert.match(source, /if\(sa\.project_id !== 'roamwisepro'\) return \{error:backendUnavailable\(\)\};/);
  assert.match(source, /try \{ accessToken = await getServiceAccountAccessToken\(env\); \}\s*catch \(_\) \{ return \{error:backendUnavailable\(\)\}; \}/);
  assert.match(source, /try \{ claims = await verifyFirebaseIdToken\(match\[1\], sa.project_id\); \}/);
});
