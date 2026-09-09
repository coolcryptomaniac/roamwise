const test = require('node:test');
const assert = require('node:assert/strict');
const { createHash, createHmac } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const core = require('../business/core.js');
const token = 'rw_biz_' + 'a'.repeat(43);
const keyHash = createHash('sha256').update(token).digest('hex');
function report() {
  return { schemaVersion: 1,
    trip: { id: 'trip-1', title: 'Client visit', costCenter: 'SALES', route: 'Delhi → Jaipur', startDate: '2026-09-10', endDate: '2026-09-12' },
    policy: { baseCurrency: 'INR', budget: '25000', dailyLimit: '8000', receiptThreshold: '500', requireReceipt: true },
    expenses: [{ id: 'e1', date: '2026-09-10', category: 'transport', description: 'Train', amount: '1200', currency: 'INR', fxRate: '1', fxDate: '2026-09-10', fxSource: 'Same currency', receiptRef: 'ticket-1' }]
  };
}
function tenant() {
  return { id: 'acme', enabled: true, keyHashes: [keyHash], scopes: ['reconcile', 'export'], expiresAt: '2099-01-01T00:00:00Z', policyVersion: 'v1', policy: report().policy, webhookUrl: 'https://finance.acme.com/roamwise', webhookSecret: 's'.repeat(40) };
}
function env(t = tenant()) { return { BUSINESS_ENABLED: 'true', BUSINESS_TENANTS_JSON: JSON.stringify([t]), BUSINESS_RATE_LIMITER: { limit: async () => ({ success: true }) } }; }
function request(body = { report: report() }, headers = {}) {
  return new Request('https://api.roamwise.co.in/v1/business/reconcile', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token, ...headers }, body: JSON.stringify(body) });
}
async function call(req = request(), config = env(), action = 'reconcile') {
  const { handleBusiness } = await import('../worker/handlers/business.js');
  return handleBusiness(req, config, action);
}
test('INR totals and CSV preserve paise exactly', () => {
  const r = report(); r.expenses[0].amount = '0.10'; r.expenses.push({ ...r.expenses[0], id: 'e2', amount: '0.20' });
  const out = core.evaluate(r); assert.equal(out.total, '0.30'); assert.equal(out.remaining, '24999.70');
  assert.match(core.csv(r), /"0.10","INR","1.000000"/);
});
test('FX conversion rounds once half up; JPY uses zero minor units', () => {
  const r = report(); Object.assign(r.expenses[0], { amount: '1', currency: 'JPY', fxRate: '0.555', fxSource: 'Statement' });
  assert.equal(core.evaluate(r).total, '0.56');
  r.policy.baseCurrency = 'JPY'; r.expenses[0].currency = 'USD'; r.expenses[0].amount = '1.01'; r.expenses[0].fxRate = '150';
  assert.equal(core.evaluate(r).total, '152');
  r.expenses[0].currency = 'JPY'; r.expenses[0].amount = '1.5'; assert.throws(() => core.evaluate(r), /decimal places/);
});
test('policy violations include receipts, daily cap, total budget and possible duplicates', () => {
  const r = report(); r.policy.budget = '1000'; r.policy.dailyLimit = '1000'; r.expenses[0].receiptRef = '';
  r.expenses.push({ ...r.expenses[0], id: 'e2' });
  const result = core.evaluate(r);
  assert.equal(result.status, 'needs_review');
  for (const code of ['receipt_missing', 'budget_exceeded', 'daily_limit_exceeded', 'possible_duplicate']) assert.ok(result.flags.some(f => f.code === code));
});
test('empty and valid reports are never described as approved', () => {
  const r = report(); assert.equal(core.evaluate(r).status, 'ready_for_review'); r.expenses = [];
  assert.equal(core.evaluate(r).status, 'empty');
});
test('invalid dates, out-of-trip spending, duplicate IDs and >200 rows fail closed', () => {
  for (const change of [r => r.trip.startDate = '2026-02-30', r => r.expenses[0].date = '2026-09-09', r => r.trip.endDate = '2028-09-10', r => r.expenses.push({ ...r.expenses[0] }), r => r.expenses = Array(201).fill(r.expenses[0])]) {
    const r = report(); change(r); assert.throws(() => core.evaluate(r));
  }
});
test('malformed money, negative, non-finite and unsafe amounts are rejected', () => {
  for (const value of ['1e3', '-3', 'NaN', 'Infinity', 12, '1,000', '0', '12.123', '99999999999999999999']) {
    const r = report(); r.expenses[0].amount = value; assert.throws(() => core.evaluate(r), String(value));
  }
});
test('unsupported currency, forged same-currency FX and missing FX provenance are rejected', () => {
  for (const change of [r => r.expenses[0].currency = '__proto__', r => r.expenses[0].fxRate = '2', r => r.expenses[0].fxSource = '', r => r.expenses[0].fxDate = 'bad']) {
    const r = report(); change(r); assert.throws(() => core.evaluate(r));
  }
});
test('CSV neutralizes formula injection and escapes quotes/commas', () => {
  const r = report(); r.trip.title = '=HYPERLINK("bad")'; r.trip.costCenter = '@command'; r.expenses[0].description = 'Taxi, "station"';
  const csv = core.csv(r); assert.ok(csv.includes('"\'=HYPERLINK(""bad"")"')); assert.ok(csv.includes('"\'@command"')); assert.ok(csv.includes('"Taxi, ""station"""'));
});
test('normalization excludes arbitrary location/account fields', () => {
  const r = report(); r.location = { lat: 1 }; r.trip.email = 'private@example.com'; r.expenses[0].cardNumber = 'private';
  const out = JSON.stringify(core.evaluate(r)); assert.ok(!out.includes('private')); assert.ok(!out.includes('location'));
});
test('API is disabled by default and requires a working limiter', async () => {
  assert.equal((await call(request(), {})).status, 503);
  const config = env(); delete config.BUSINESS_RATE_LIMITER; assert.equal((await call(request(), config)).status, 503);
  config.BUSINESS_RATE_LIMITER = { limit: async () => { throw new Error('offline'); } }; assert.equal((await call(request(), config)).status, 503);
});
test('API rejects unauthenticated, revoked, expired and wrong-scope credentials', async () => {
  assert.equal((await call(request(undefined, { Authorization: '' }))).status, 401);
  assert.equal((await call(request(undefined, { Authorization: 'Bearer rw_biz_' + 'b'.repeat(43) }))).status, 401);
  for (const change of [t => t.enabled = false, t => t.expiresAt = '2000-01-01']) { const t = tenant(); change(t); assert.equal((await call(request(), env(t))).status, 401); }
  const t = tenant(); t.scopes = ['reconcile']; assert.equal((await call(request(), env(t), 'export')).status, 403);
});
test('API rejects browser Origin, methods, malformed config and cross-tenant shared keys', async () => {
  assert.equal((await call(request(undefined, { Origin: 'https://roamwise.co.in' }))).status, 403);
  assert.equal((await call(new Request('https://api.roamwise.co.in', { method: 'OPTIONS' }))).status, 405);
  assert.equal((await call(request(), { ...env(), BUSINESS_TENANTS_JSON: '{' })).status, 503);
  const t = tenant(); assert.equal((await call(request(), { ...env(), BUSINESS_TENANTS_JSON: JSON.stringify([t, { ...t, id: 'other' }]) })).status, 503);
});
test('API rate limits by authenticated tenant, never client-supplied tenant ID', async () => {
  let limitedKey; const config = env(); config.BUSINESS_RATE_LIMITER.limit = async ({ key }) => { limitedKey = key; return { success: false }; };
  const response = await call(request({ tenantId: 'victim', report: report() }), config);
  assert.equal(limitedKey, 'business:acme'); assert.equal(response.status, 429); assert.equal(response.headers.get('retry-after'), '60');
});
test('server policy overrides client budgets and rejects currency reinterpretation', async () => {
  const r = report(); r.policy.budget = '999999'; const t = tenant(); t.policy.budget = '100';
  const response = await call(request({ tenantId: 'victim', report: r }), env(t));
  const out = await response.json(); assert.equal(out.tenantId, 'acme'); assert.equal(out.reconciliation.report.policy.budget, '100.00'); assert.equal(out.reconciliation.status, 'needs_review');
  assert.equal(response.headers.get('cache-control'), 'no-store'); assert.equal(response.headers.get('access-control-allow-origin'), null);
  r.policy.baseCurrency = 'USD'; assert.equal((await call(request({ report: r }), env(t))).status, 400);
});
test('API enforces bounded streamed bodies, JSON type and valid JSON', async () => {
  assert.equal((await call(request(undefined, { 'Content-Type': 'text/plain' }))).status, 415);
  assert.equal((await call(request({ report: report(), padding: 'a'.repeat(131073) }))).status, 413);
  assert.equal((await call(new Request('https://api.roamwise.co.in', { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: '{' }))).status, 400);
});
test('export requires review and a nonempty report without unresolved policy flags', async () => {
  assert.equal((await call(request(), env(), 'export')).status, 400);
  const r = report(); r.expenses[0].receiptRef = '';
  assert.equal((await call(request({ report: r, reviewed: true }), env(), 'export')).status, 422);
  r.expenses = []; assert.equal((await call(request({ report: r, reviewed: true }), env(), 'export')).status, 422);
});
test('export signs actual bytes, fixes the tenant destination and repeats a stable event ID', async () => {
  const original = global.fetch, deliveries = [];
  global.fetch = async (url, init) => { deliveries.push({ url, ...init }); return new Response(null, { status: 204 }); };
  try {
    const body = { report: report(), reviewed: true, webhookUrl: 'https://attacker.com', tenantId: 'victim' };
    const a = await (await call(request(body), env(), 'export')).json();
    const b = await (await call(request(body), env(), 'export')).json();
    assert.equal(a.status, 'receiver_accepted'); assert.equal(a.eventId, b.eventId);
    const sent = deliveries[0]; assert.equal(sent.url, tenant().webhookUrl); assert.equal(sent.redirect, 'manual');
    const expected = createHmac('sha256', tenant().webhookSecret).update(sent.headers['X-RoamWise-Timestamp'] + '.' + sent.body).digest('hex');
    assert.equal(sent.headers['X-RoamWise-Signature'], 'v1=' + expected);
    assert.equal(JSON.parse(sent.body).tenantId, 'acme'); assert.ok(!sent.body.includes(token));
  } finally { global.fetch = original; }
});
test('webhook failure and redirects never masquerade as success or leak receiver responses', async () => {
  const original = global.fetch;
  try {
    for (const status of [302, 400, 429, 500]) {
      global.fetch = async () => new Response('secret upstream details', { status });
      const response = await call(request({ report: report(), reviewed: true }), env(), 'export');
      assert.equal(response.status, 502); assert.ok(!(await response.text()).includes('secret upstream'));
    }
    global.fetch = async () => { throw new Error('socket'); };
    assert.equal((await (await call(request({ report: report(), reviewed: true }), env(), 'export')).json()).error, 'delivery_unknown');
  } finally { global.fetch = original; }
});
test('unsafe provisioned destinations are rejected before network use', async () => {
  const original = global.fetch; let calls = 0; global.fetch = async () => { calls++; return new Response(''); };
  try {
    for (const url of ['http://finance.acme.com', 'https://127.0.0.1', 'https://localhost', 'https://user:pass@finance.acme.com', 'https://finance.acme.com:444']) {
      const t = tenant(); t.webhookUrl = url; assert.equal((await call(request({ report: report(), reviewed: true }), env(t), 'export')).status, 503);
    }
    assert.equal(calls, 0);
  } finally { global.fetch = original; }
});
test('existing Worker routing keeps business OPTIONS away from wildcard CORS', async () => {
  const worker = (await import('../worker/worker.js')).default;
  const response = await worker.fetch(new Request('https://api.roamwise.co.in/v1/business/reconcile', { method: 'OPTIONS' }), {}, {});
  assert.equal(response.status, 405); assert.equal(response.headers.get('access-control-allow-origin'), null);
  assert.equal((await worker.fetch(new Request('https://api.roamwise.co.in/health'), {}, {})).status, 200);
});
test('business page assets stay within a 25 KiB gzip budget and never load in the main app', () => {
  const root = path.join(__dirname, '..');
  const files = ['business/index.html', 'business/business.css', 'business/core.js', 'business/workspace.js'];
  const bytes = files.reduce((sum, file) => sum + zlib.gzipSync(fs.readFileSync(path.join(root, file))).length, 0);
  assert.ok(bytes < 25 * 1024, `Business assets: ${bytes} gzip bytes`);
  const main = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.ok(main.includes('href="business/"')); assert.doesNotMatch(main, /<script[^>]+business\//);
  const html = fs.readFileSync(path.join(root, files[0]), 'utf8');
  assert.match(html, /connect-src 'none'/); assert.doesNotMatch(html, /https:\/\//);
});
