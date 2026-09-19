const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');

test('admin operations screen retains UPI and requires confirmed Worker readiness to enable', () => {
  const html = read('admin/finance-ops.html');
  assert.match(html, /Kill Cashfree · keep UPI/);
  assert.match(html, /PAYMENT_PROVIDER:'manual_upi'/);
  assert.match(html, /PAYMENT_PROVIDER:'cashfree',CASHFREE_ENVIRONMENT:env/);
  assert.match(html, /health\.configured\.cashfree!==true/);
  assert.match(html, /config\/app/);
  assert.match(html, /adminAuditLog/);
  assert.match(html, /await batch\.commit\(\)/);
  assert.match(html, /This controls NEW Cashfree orders only/);
});

test('operations screen cannot collect payment secrets or change bank details', () => {
  const html = read('admin/finance-ops.html');
  assert.doesNotMatch(html, /<input[^>]+(cashfree[_-]secret|bank[_-]account|api[_-]secret)/i);
  assert.doesNotMatch(html, /\/payouts\/|\/bank\/update|\/transfers\//i);
  assert.match(html, /merchant\.cashfree\.com/);
  assert.match(html, /do not send salaries/i);
  assert.match(html, /queued does <strong>not<\/strong> mean delivered/i);
});

test('admin link is external to audited section buttons and control-plane pure audit still works', () => {
  const context = { globalThis: {} };
  vm.runInNewContext(read('js/admin/control-plane.js'), context);
  const api = context.globalThis.RWAdminControlPlane;
  assert.equal(api.audit(['money'], ['money']).ok, true);
  assert.equal(api.audit(['money'], []).ok, false);
  assert.equal(typeof api.installFinanceLink, 'function');
  assert.match(read('js/admin/control-plane.js'), /link\.href = '\.\/finance-ops\.html'/);
});

test('Worker Cashfree readiness also requires Firebase service account for authenticated order writes', async () => {
  const source = read('worker/handlers/health.js')
    .replace("import { json } from '../lib/http.js';", 'const json = x => x;');
  const mod = await import('data:text/javascript,' + encodeURIComponent(source));
  const credentials = { CASHFREE_APP_ID: 'id', CASHFREE_SECRET_KEY: 'secret' };
  assert.equal(mod.handleHealth(credentials).configured.cashfree, false);
  assert.equal(mod.handleHealth({ ...credentials, FIREBASE_SERVICE_ACCOUNT_JSON: 'fixture' }).configured.cashfree, true);
});
