import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMilestones, canSeeCampaign, fundingBadge, normalizeCampaign, quoteCampaign, transitionCampaign } from '../creators/protection/core.mjs';
import { createCashfreeFundingOrder, releaseCashfreeToCreator, resolveProvider } from '../creators/protection/providers.mjs';

test('paid quote charges brand fee without reducing creator amount', () => {
  const quote = quoteCampaign({ kind: 'paid', creatorFeeMinor: 2_500_000, travelReimbursementMinor: 800_000 }, { serviceFeeBps: 1500, serviceTaxBps: 1800 });
  assert.equal(quote.creatorReceivesMinor, 3_300_000);
  assert.equal(quote.serviceFeeMinor, 495_000);
  assert.equal(quote.serviceTaxMinor, 89_100);
  assert.equal(quote.totalPayableMinor, 3_884_100);
});

test('barter is explicit and cannot hide cash fields', () => {
  assert.deepEqual(quoteCampaign({ kind: 'barter' }), { creatorFeeMinor: 0, travelReimbursementMinor: 0, protectedMinor: 0, serviceFeeMinor: 0, serviceTaxMinor: 0, totalPayableMinor: 0, creatorReceivesMinor: 0, currency: 'INR' });
  assert.throws(() => quoteCampaign({ kind: 'barter', creatorFeeMinor: 100 }), /cannot contain/);
});

test('campaign normalization requires deliverables and one creator contract', () => {
  const input = { kind: 'hybrid', title: 'Jaipur launch', destination: 'Jaipur', creatorFeeMinor: 1_500_000, travelReimbursementMinor: 300_000, deliverables: [{ label: '2 Reels', quantity: 2 }] };
  assert.equal(normalizeCampaign(input).deliverables[0].label, '2 Reels');
  assert.throws(() => normalizeCampaign({ ...input, creatorSlots: 3 }), /one protected contract/);
});

test('state machine prevents creators from inventing funded status', () => {
  assert.equal(transitionCampaign('funding_pending', 'confirm_funding', 'system'), 'funded');
  assert.equal(transitionCampaign('approved', 'request_release', 'brand'), 'release_pending');
  assert.throws(() => transitionCampaign('funding_pending', 'confirm_funding', 'creator'), /cannot/);
  assert.throws(() => transitionCampaign('approved', 'request_release', 'creator'), /cannot/);
  assert.throws(() => transitionCampaign('published', 'start_work', 'creator'), /Cannot/);
});

test('funding badge is granted only to provider-confirmed lifecycle states', () => {
  assert.equal(fundingBadge({ kind: 'paid', status: 'funding_pending' }).funded, false);
  assert.equal(fundingBadge({ kind: 'paid', status: 'funded' }).funded, true);
  assert.equal(fundingBadge({ kind: 'barter', status: 'published' }).code, 'BARTER');
});

test('creator minimum and barter opt-in filter campaigns', () => {
  const creator = { minimumPaidCampaignMinor: 1_500_000, acceptsBarter: false };
  assert.equal(canSeeCampaign({ status: 'published', kind: 'paid', creatorFeeMinor: 1_499_999 }, creator), false);
  assert.equal(canSeeCampaign({ status: 'published', kind: 'paid', creatorFeeMinor: 1_500_000 }, creator), true);
  assert.equal(canSeeCampaign({ status: 'published', kind: 'barter' }, creator), false);
});

test('milestones preserve the full creator amount', () => {
  const rows = buildMilestones({ protectedMinor: 3_300_000, travelReimbursementMinor: 800_000 });
  assert.equal(rows.reduce((sum, row) => sum + row.amountMinor, 0), 3_300_000);
  assert.equal(rows[0].key, 'travel_advance');
});

test('provider stays disabled until protected hold is contractually approved', () => {
  assert.throws(() => resolveProvider({ CREATOR_PROTECTION_PROVIDER: 'cashfree_easy_split' }), /not contractually approved/);
  assert.equal(resolveProvider({ CREATOR_PROTECTION_PROVIDER: 'cashfree_easy_split', CREATOR_PROTECTED_HOLD_APPROVED: 'true' }).id, 'cashfree_easy_split');
});

test('Cashfree funding request uses server amount and current idempotent API contract', async () => {
  const original = globalThis.fetch;
  let request;
  globalThis.fetch = async (url, init) => { request = { url, init, body: JSON.parse(init.body) }; return new Response(JSON.stringify({ order_id: 'rwcc_camp1', payment_session_id: 'session1' }), { status: 200, headers: { 'content-type': 'application/json' } }); };
  try {
    const result = await createCashfreeFundingOrder({ id: 'camp1', totalPayableMinor: 3_795_000 }, { uid: 'brand1', email: 'brand@example.com', phone: '9876543210' }, { CASHFREE_APP_ID: 'id', CASHFREE_SECRET_KEY: 'secret' }, 'idem1');
    assert.equal(request.url, 'https://sandbox.cashfree.com/pg/orders');
    assert.equal(request.body.order_amount, 37950);
    assert.equal(request.init.headers['x-api-version'], '2026-01-01');
    assert.equal(result.checkout.paymentSessionId, 'session1');
  } finally { globalThis.fetch = original; }
});

test('Cashfree release uses documented split-after-payment endpoint and percentage', async () => {
  const original = globalThis.fetch;
  let request;
  globalThis.fetch = async (url, init) => { request = { url, body: JSON.parse(init.body) }; return new Response('{}', { status: 200 }); };
  try {
    await releaseCashfreeToCreator({ id: 'camp1', providerRef: 'rwcc_camp1', creatorReceivesMinor: 3_300_000, totalPayableMinor: 3_795_000 }, { providerVendorId: 'creator_1' }, { CASHFREE_APP_ID: 'id', CASHFREE_SECRET_KEY: 'secret', CASHFREE_DELAYED_SPLIT_APPROVED: 'true' }, 'idem2');
    assert.equal(request.url, 'https://sandbox.cashfree.com/pg/easy-split/orders/rwcc_camp1/split');
    assert.equal(request.body.split[0].vendor_id, 'creator_1');
    assert.equal(request.body.disable_split, true);
  } finally { globalThis.fetch = original; }
});
