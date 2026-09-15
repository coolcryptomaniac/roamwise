const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const root = `${__dirname}/..`;

test('partner page has one CSS runtime and one canonical enhancement runtime', () => {
  const html = fs.readFileSync(`${root}/partner/index.html`, 'utf8');
  assert.match(html, /href="partner\.css"/);
  assert.doesNotMatch(html, /href="(?:app|marketplace)\.css"/);
  assert.equal(fs.existsSync(`${root}/partner/app.css`), false);
  assert.equal(fs.existsSync(`${root}/partner/marketplace.css`), false);
  assert.match(html, /src="marketplace\.js"/);
  assert.doesNotMatch(html, /marketplace-v\d+/i);
});

test('experiential property seeds are unique, sourced and honestly bounded', () => {
  const source = fs.readFileSync(`${root}/admin/property-prospects-data.js`, 'utf8');
  const sandbox = { window: {} };
  vm.runInNewContext(source, sandbox);
  const rows = sandbox.window.RW_PROPERTY_PROSPECTS;
  assert.ok(rows.length >= 40 && rows.length <= 1000);
  assert.equal(new Set(rows.map((v) => `${v.name}|${v.city}`.toLowerCase())).size, rows.length);
  for (const row of rows) {
    assert.match(row.sourceUrl, /^https:\/\//);
    assert.match(row.sourceCheckedAt, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(row.fit >= 1 && row.fit <= 99);
    assert.ok(row.approachability >= 1 && row.approachability <= 99);
    assert.ok(row.evidence.length > 8);
  }
});

test('property outreach caps the CRM at 1000 and labels score as an estimate', () => {
  const js = fs.readFileSync(`${root}/admin/property-outreach.js`, 'utf8');
  assert.match(js, /MAX=1000,TOP=500/);
  assert.match(js, /not a claim that the owner will accept/i);
  assert.doesNotMatch(js, /owner will (?:definitely|certainly) approve/i);
  assert.match(js, /Nothing is auto-sent/);
});

test('payment UI has no field for Cashfree secrets or full bank numbers', () => {
  const html = fs.readFileSync(`${root}/admin/index.html`, 'utf8');
  const js = fs.readFileSync(`${root}/admin/payment-operations.js`, 'utf8');
  assert.doesNotMatch(html, /<input[^>]+(?:CASHFREE_SECRET_KEY|CASHFREE_APP_ID|client[_-]?secret)/i);
  assert.doesNotMatch(js, /fullAccount|accountNumber\s*:/i);
  assert.match(js, /Use masked details only/);
  assert.match(html, /wrangler secret put CASHFREE_SECRET_KEY/);
});

test('stay Cashfree order is server-authoritative and requires a confirmed booking', () => {
  const js = fs.readFileSync(`${root}/worker/handlers/partner-cashfree.js`, 'utf8');
  assert.match(js, /getDoc\(env, ctx\.accessToken, ctx\.projectId, `roomBookings\/\$\{id\}`\)/);
  assert.match(js, /booking\.status !== 'confirmed'/);
  assert.match(js, /booking\.guestUid !== ctx\.claims\.uid/);
  assert.match(js, /partner\.verified !== true/);
  assert.match(js, /environment_mismatch/);
  assert.match(js, /const amount = Math\.round\(Number\(booking\.amount\)/);
  assert.doesNotMatch(js, /Number\(body\s*&&\s*body\.amount/);
  assert.match(js, /data\.order_status === 'PAID'/);
  assert.match(js, /Number\(data\.order_amount\) !== found\.amount/);
});

test('partner pause and deboarding preserve history and block unsafe exit', () => {
  const admin = fs.readFileSync(`${root}/admin/partner-lifecycle.js`, 'utf8');
  const rules = fs.readFileSync(`${root}/firestore.rules`, 'utf8');
  assert.match(admin, /status==='requested'\|\|x\.status==='confirmed'/);
  assert.match(admin, /Deboarding blocked/);
  assert.match(admin, /status:'offboarded'/);
  assert.doesNotMatch(admin, /collection\('partners'\).*\.delete\(/);
  assert.match(rules, /'operationsLocked'/);
  assert.match(rules, /\.data\.operationsLocked != true/);
});
