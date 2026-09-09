const test = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const core = require('../core/node.cjs');
const example = require('../contracts/example-report.json');
const profile = require('../contracts/agent-profile.json');
const token = 'rw_biz_' + 'z'.repeat(43);
const tenant = {
  id: 'agent-pilot', enabled: true,
  keyHashes: [createHash('sha256').update(token).digest('hex')],
  scopes: ['reconcile', 'export'], expiresAt: '2099-01-01', policyVersion: 'v1',
  policy: example.report.policy, webhookUrl: 'https://finance.acme.com/export',
  webhookSecret: 't'.repeat(40)
};
const env = { BUSINESS_ENABLED: 'true', BUSINESS_TENANTS_JSON: JSON.stringify([tenant]), BUSINESS_RATE_LIMITER: { limit: async () => ({ success: true }) } };
async function call(report, responseMode, operation = 'reconcile', reviewed, authorization = 'Bearer ' + token) {
  const { handleBusiness } = await import('../api/handler.js');
  return handleBusiness(new Request('https://api.roamwise.co.in/v1/business/' + operation, {
    method: 'POST', headers: { Authorization: authorization, 'Content-Type': 'application/json' },
    body: JSON.stringify({ report, responseMode, reviewed })
  }), env, operation);
}
test('agent summary retains exact totals and full flag counts while bounding returned detail', async () => {
  const report = structuredClone(example.report);
  report.trip.title = 'PRIVATE-TRIP-DESCRIPTION';
  report.expenses = Array.from({ length: 200 }, (_, i) => ({ ...report.expenses[0], id: 'e-' + i, description: 'PRIVATE-EXPENSE-' + i, receiptRef: '' }));
  const full = await (await call(report, 'full')).json();
  const summaryResponse = await call(report, profile.defaultArguments.responseMode);
  const small = await summaryResponse.json();
  assert.equal(small.responseMode, 'summary');
  assert.equal(small.tenantId, full.tenantId);
  for (const field of ['status', 'currency', 'total', 'remaining']) assert.equal(small.summary[field], full.reconciliation[field]);
  assert.equal(small.summary.expenseCount, 200);
  assert.equal(small.summary.flagCount, full.reconciliation.flags.length);
  assert.equal(small.summary.flagCounts.receipt_missing, 200);
  assert.equal(small.summary.flags.length, 20);
  assert.equal(small.summary.flagsTruncated, true);
  assert.equal(small.reconciliation, undefined);
  assert.ok(!JSON.stringify(small).includes('PRIVATE-'));
  assert.equal(summaryResponse.headers.get('cache-control'), 'no-store');
  const fullBytes = Buffer.byteLength(JSON.stringify(full)), summaryBytes = Buffer.byteLength(JSON.stringify(small));
  assert.ok(summaryBytes < fullBytes * 0.1, '200-row summary should omit the duplicated full report');
  console.log(`Agent fixture payload: ${fullBytes} full bytes; ${summaryBytes} summary bytes.`);
});
test('full is the backwards-compatible default; empty and valid summaries are explicit drafts', async () => {
  const original = await (await call(example.report)).json();
  assert.equal(original.responseMode, 'full'); assert.ok(original.reconciliation); assert.equal(original.summary, undefined);
  const { summarize } = await import('../api/summary.js');
  const empty = summarize(core.evaluate({ ...example.report, expenses: [] }));
  assert.equal(empty.status, 'empty'); assert.equal(empty.flagCount, 0); assert.equal(empty.flagsTruncated, false);
  assert.equal(summarize(core.evaluate(example.report)).status, 'ready_for_review');
});
test('invalid agent response modes do not weaken authentication or validation', async () => {
  assert.equal((await call(example.report, 'verbose')).status, 400);
  assert.equal((await call(example.report, 'verbose', 'reconcile', undefined, 'bad')).status, 401);
  const report = structuredClone(example.report); report.expenses[0].amount = '-1';
  assert.equal((await call(report, 'summary')).status, 400);
});
test('summary mode cannot shortcut export review or trim the signed finance payload', async () => {
  assert.equal((await call(example.report, 'summary', 'export')).status, 400);
  const realFetch = global.fetch; let delivery;
  global.fetch = async (_, init) => { delivery = JSON.parse(init.body); return new Response(null, { status: 204 }); };
  try {
    const response = await call(example.report, 'summary', 'export', true);
    assert.equal(response.status, 200);
    assert.equal(delivery.reconciliation.report.expenses.length, 1);
    assert.equal(delivery.reconciliation.rows[0].receiptRef, 'example-ticket.pdf');
    assert.equal(delivery.summary, undefined);
  } finally { global.fetch = realFetch; }
});
