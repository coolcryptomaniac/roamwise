const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

function loadModule(file, globalName) {
  const context = {};
  vm.createContext(context);
  vm.runInContext(read(file), context);
  return context[globalName];
}

const RWBusinessMetrics = loadModule('js/admin/business-metrics.js', 'RWBusinessMetrics');
const RWReferralLiability = loadModule('js/admin/referral-liability.js', 'RWReferralLiability');
const RWComplianceChecklist = loadModule('js/admin/compliance-checklist.js', 'RWComplianceChecklist');
const RWStaffManager = loadModule('js/admin/staff-manager.js', 'RWStaffManager');
const RWDevRequests = loadModule('js/admin/dev-requests.js', 'RWDevRequests');
const RWInvestorSummary = loadModule('js/admin/investor-summary.js', 'RWInvestorSummary');

// A minimal stand-in for RWPricing.CONFIG so these tests don't depend on the
// live price ladder changing out from under them.
const CONFIG = {
  TIERS: [
    { id: 'free', label: 'Free', priceMonthly: 0, priceYearly: 0 },
    { id: 'plus', label: 'Plus', priceMonthly: 99, priceYearly: 999 },
    { id: 'pro', label: 'Pro', priceMonthly: 299, priceYearly: 2499 },
    { id: 'elite', label: 'Elite', priceMonthly: 499, priceYearly: 4999 }
  ],
  LONG_TERM: [
    { tier: 'pro', tierLabel: 'Pro', options: [
      { id: 'pro_life', years: 99, lifetime: true, label: 'Lifetime', priceINR: 14999 }
    ] }
  ],
  SHORT_TERM: [
    { id: 'day', days: 1, priceINR: 19, label: 'Day Pass' }
  ],
  FOUNDER_OFFER: { priceINR: 100, maxUsers: 1000, maxDays: 365, label: 'Founder Pro — ₹100 lifetime' }
};

test('business-metrics: matches a recurring monthly price to its tier', () => {
  const plan = RWBusinessMetrics.matchPlan(299, CONFIG);
  assert.equal(plan.period, 'monthly');
  assert.equal(plan.tierId, 'pro');
  assert.equal(plan.monthlyEquivalentINR, 299);
});

test('business-metrics: matches a yearly price and derives the monthly-equivalent', () => {
  const plan = RWBusinessMetrics.matchPlan(2499, CONFIG);
  assert.equal(plan.period, 'yearly');
  assert.equal(plan.tierId, 'pro');
  assert.equal(plan.monthlyEquivalentINR, 2499 / 12);
});

test('business-metrics: a Founder ₹100 payment is one-time, not recurring', () => {
  const plan = RWBusinessMetrics.matchPlan(100, CONFIG);
  assert.equal(plan.period, 'onetime');
  assert.equal(plan.monthlyEquivalentINR, 0);
});

test('business-metrics: a lifetime pass is one-time, not recurring', () => {
  const plan = RWBusinessMetrics.matchPlan(14999, CONFIG);
  assert.equal(plan.period, 'onetime');
  assert.equal(plan.tierId, 'pro');
});

test('business-metrics: an amount matching no known price is not silently guessed at', () => {
  assert.equal(RWBusinessMetrics.matchPlan(12345, CONFIG), null);
  assert.equal(RWBusinessMetrics.matchPlan(0, CONFIG), null);
  assert.equal(RWBusinessMetrics.matchPlan(-50, CONFIG), null);
});

test('business-metrics: summarizeRevenue computes real MRR/ARR and separates one-time cash', () => {
  const records = [
    { amountINR: 299 },   // Pro monthly
    { amountINR: 299 },   // Pro monthly
    { amountINR: 2499 },  // Pro yearly
    { amountINR: 100 },   // Founder one-time
    { amountINR: 0 },     // comp, no payment on file
    { amountINR: 777 }    // unclassified — doesn't match anything
  ];
  const summary = RWBusinessMetrics.summarizeRevenue(records, CONFIG);
  assert.equal(summary.subscriberCount, 6);
  assert.equal(summary.compedCount, 1);
  assert.equal(summary.unclassified.count, 1);
  assert.equal(summary.unclassified.totalINR, 777);
  assert.equal(summary.oneTime.count, 1);
  assert.equal(summary.oneTime.totalINR, 100);
  const expectedMrr = 299 + 299 + 2499 / 12;
  assert.ok(Math.abs(summary.mrrINR - expectedMrr) < 1e-9);
  assert.ok(Math.abs(summary.arrINR - expectedMrr * 12) < 1e-9);
  assert.equal(summary.byTier.pro.monthlyCount, 2);
  assert.equal(summary.byTier.pro.yearlyCount, 1);
});

test('business-metrics: sumMonthlyExpenses only totals expense-type accounts, using owner-entered values', () => {
  const accounts = {
    rev_pro: { type: 'income', label: 'Pro subscriptions' },
    exp_infra: { type: 'expense', label: 'Hosting & software' },
    exp_marketing: { type: 'expense', label: 'Marketing & partnerships' }
  };
  const costs = { rev_pro: 999999, exp_infra: 5000, exp_marketing: 2000 };
  const result = RWBusinessMetrics.sumMonthlyExpenses(costs, accounts);
  assert.equal(result.totalINR, 7000);
  assert.equal(Object.keys(result.byCategory).length, 2);
  assert.ok(!('rev_pro' in result.byCategory));
});

test('business-metrics: computeEbitda is exactly revenue minus expenses, both directions', () => {
  const profitable = RWBusinessMetrics.computeEbitda(50000, 20000);
  assert.equal(profitable.monthlyEbitdaINR, 30000);
  assert.equal(profitable.annualEbitdaINR, 360000);
  assert.equal(profitable.marginPct, 60);

  const lossMaking = RWBusinessMetrics.computeEbitda(10000, 25000);
  assert.equal(lossMaking.monthlyEbitdaINR, -15000);

  const noRevenue = RWBusinessMetrics.computeEbitda(0, 5000);
  assert.equal(noRevenue.marginPct, null);
});

test('business-metrics: renderBusinessMetricsHtml surfaces unclassified amounts instead of hiding them', () => {
  const summary = RWBusinessMetrics.summarizeRevenue([{ amountINR: 777 }], CONFIG);
  const ebitda = RWBusinessMetrics.computeEbitda(summary.mrrINR, 0);
  const html = RWBusinessMetrics.renderBusinessMetricsHtml(summary, ebitda, {});
  assert.match(html, /did not match any current price/);
});

// ---------------------------------------------------------------------------
// Referral liability
// ---------------------------------------------------------------------------
const REFERRERS = [
  { code: 'RW-S01-FEBIN', name: 'Febin', type: 'staff', rate: 0.30, active: true },
  { code: 'RW-S02-DEEPA', name: 'Deepanshi', type: 'staff', rate: 0.30, active: true }
];
const TERMS = { ratePct: 30 };

test('referral-liability: computes commission owed per referrer from approved, attributed claims', () => {
  const records = [
    { amountINR: 2499, refCode: 'RW-S01-FEBIN', refRate: 0.30 },
    { amountINR: 299, refCode: 'RW-S01-FEBIN', refRate: 0.30 },
    { amountINR: 999, refCode: 'RW-S02-DEEPA', refRate: 0.30 }
  ];
  const liability = RWReferralLiability.computeReferralLiability(records, REFERRERS, TERMS);
  assert.equal(liability.byCode['RW-S01-FEBIN'].salesCount, 2);
  assert.ok(Math.abs(liability.byCode['RW-S01-FEBIN'].commissionOwedINR - (2499 + 299) * 0.30) < 1e-9);
  assert.equal(liability.byCode['RW-S02-DEEPA'].salesCount, 1);
  assert.ok(Math.abs(liability.totalCommissionOwedINR - ((2499 + 299 + 999) * 0.30)) < 1e-9);
});

test('referral-liability: self-referrals never count toward commission owed', () => {
  const records = [{ amountINR: 2499, refCode: 'RW-S01-FEBIN', refRate: 0.30, refSelf: true }];
  const liability = RWReferralLiability.computeReferralLiability(records, REFERRERS, TERMS);
  assert.equal(Object.keys(liability.byCode).length, 0);
  assert.equal(liability.totalCommissionOwedINR, 0);
});

test('referral-liability: a code missing from the current referrer directory is still counted, and flagged', () => {
  const records = [{ amountINR: 1000, refCode: 'RW-A99-GHOST', refRate: 0.30 }];
  const liability = RWReferralLiability.computeReferralLiability(records, REFERRERS, TERMS);
  assert.equal(liability.byCode['RW-A99-GHOST'].commissionOwedINR, 300);
  assert.equal(liability.unmatchedCodes['RW-A99-GHOST'], 1);
});

test('referral-liability: falls back to the referrer directory rate, then the flat terms rate, when a claim lacks refRate', () => {
  const records = [{ amountINR: 1000, refCode: 'RW-S01-FEBIN' }];
  const liability = RWReferralLiability.computeReferralLiability(records, REFERRERS, TERMS);
  assert.equal(liability.byCode['RW-S01-FEBIN'].commissionOwedINR, 300);
});

test('referral-liability: tdsFlagsForReferrers flags only referrers over the Section 194H threshold', () => {
  const records = [
    { amountINR: 14999, refCode: 'RW-S01-FEBIN', refRate: 0.30 }, // commission ~4499.70, over 20k? no
    { amountINR: 14999, refCode: 'RW-S01-FEBIN', refRate: 0.30 },
    { amountINR: 14999, refCode: 'RW-S01-FEBIN', refRate: 0.30 },
    { amountINR: 14999, refCode: 'RW-S01-FEBIN', refRate: 0.30 },
    { amountINR: 14999, refCode: 'RW-S01-FEBIN', refRate: 0.30 } // 5 lifetime sales crosses ~20k per PRICING-REFERRAL-MATH.md §6
  ];
  const liability = RWReferralLiability.computeReferralLiability(records, REFERRERS, TERMS);
  const flags = RWReferralLiability.tdsFlagsForReferrers(liability, 20000);
  assert.equal(flags.length, 1);
  assert.equal(flags[0].code, 'RW-S01-FEBIN');

  const underThreshold = RWReferralLiability.computeReferralLiability(records.slice(0, 1), REFERRERS, TERMS);
  assert.equal(RWReferralLiability.tdsFlagsForReferrers(underThreshold, 20000).length, 0);
});

// ---------------------------------------------------------------------------
// Compliance checklist
// ---------------------------------------------------------------------------
test('compliance-checklist: mergeChecklist applies owner overrides on top of real defaults', () => {
  const merged = RWComplianceChecklist.mergeChecklist({ udyam_registration: 'done' });
  const item = merged.find(i => i.id === 'udyam_registration');
  assert.equal(item.status, 'done');
  // an item with no override keeps its documented default
  const kyc = merged.find(i => i.id === 'razorpay_kyc_pages');
  assert.equal(kyc.status, 'done');
});

test('compliance-checklist: mergeChecklist ignores an invalid stored status rather than crashing', () => {
  const merged = RWComplianceChecklist.mergeChecklist({ udyam_registration: 'not-a-real-status' });
  const item = merged.find(i => i.id === 'udyam_registration');
  assert.equal(item.status, item.defaultStatus);
});

test('compliance-checklist: summarize returns plain counts, not a synthesized score', () => {
  const items = RWComplianceChecklist.mergeChecklist({});
  const counts = RWComplianceChecklist.summarize(items);
  const total = counts.open + counts.in_progress + counts.done + counts.not_yet_required;
  assert.equal(total, items.length);
});

// ---------------------------------------------------------------------------
// Staff / referrer manager
// ---------------------------------------------------------------------------
test('staff-manager: normalizeReferrer requires a code and a name', () => {
  assert.equal(RWStaffManager.normalizeReferrer({ name: 'Someone' }).ok, false);
  assert.equal(RWStaffManager.normalizeReferrer({ code: 'RW-A01-X' }).ok, false);
  const good = RWStaffManager.normalizeReferrer({ code: 'rw-a01-x', name: 'Someone', rate: 0.3 });
  assert.equal(good.ok, true);
  assert.equal(good.referrer.code, 'RW-A01-X'); // sanitized/uppercased
});

test('staff-manager: normalizeReferrer rejects an out-of-range rate by falling back to 30%', () => {
  const r = RWStaffManager.normalizeReferrer({ code: 'RW-A02-Y', name: 'Y', rate: 5 });
  assert.equal(r.referrer.rate, 0.30);
});

test('staff-manager: upsertReferrer replaces an existing code rather than duplicating it', () => {
  const list = [{ code: 'RW-S01-FEBIN', name: 'Febin', rate: 0.30 }];
  const updated = RWStaffManager.upsertReferrer(list, { code: 'RW-S01-FEBIN', name: 'Febin K', rate: 0.35 });
  assert.equal(updated.length, 1);
  assert.equal(updated[0].name, 'Febin K');
});

test('staff-manager: removeReferrer removes only the matching code', () => {
  const list = [{ code: 'RW-S01-FEBIN' }, { code: 'RW-S02-DEEPA' }];
  const updated = RWStaffManager.removeReferrer(list, 'rw-s01-febin');
  assert.equal(updated.length, 1);
  assert.equal(updated[0].code, 'RW-S02-DEEPA');
});

// ---------------------------------------------------------------------------
// Dev/AI requests
// ---------------------------------------------------------------------------
test('dev-requests: normalizeRequest requires a title', () => {
  assert.equal(RWDevRequests.normalizeRequest({ detail: 'no title' }).ok, false);
  const good = RWDevRequests.normalizeRequest({ title: 'Fix the thing' });
  assert.equal(good.ok, true);
  assert.equal(good.request.status, 'open');
  assert.equal(good.request.priority, 'normal');
});

test('dev-requests: createGithubIssue never claims to control an AI session, it only calls the GitHub REST API', () => {
  let capturedUrl, capturedBody;
  const fakeFetch = (url, opts) => {
    capturedUrl = url;
    capturedBody = JSON.parse(opts.body);
    return Promise.resolve({ ok: true, status: 201, json: () => Promise.resolve({ html_url: 'https://github.com/x/y/issues/1', number: 1 }) });
  };
  return RWDevRequests.createGithubIssue('coolcryptomaniac/roamwise', 'tok_123', { title: 'Fix X', detail: 'Details', priority: 'high' }, fakeFetch)
    .then(issue => {
      assert.equal(issue.number, 1);
      assert.equal(capturedUrl, 'https://api.github.com/repos/coolcryptomaniac/roamwise/issues');
      assert.equal(capturedBody.title, 'Fix X');
      assert.ok(capturedBody.labels.includes('dev-request'));
    });
});

test('dev-requests: createGithubIssue rejects cleanly without a token or repo, instead of calling fetch', () => {
  return assert.rejects(() => RWDevRequests.createGithubIssue('', '', { title: 'x' }, () => Promise.resolve()));
});

test('dev-requests: createGithubIssue surfaces the GitHub API error message on failure', () => {
  const fakeFetch = () => Promise.resolve({ ok: false, status: 422, json: () => Promise.resolve({ message: 'Validation Failed' }) });
  return assert.rejects(
    () => RWDevRequests.createGithubIssue('owner/repo', 'tok', { title: 'x' }, fakeFetch),
    /Validation Failed/
  );
});

// ---------------------------------------------------------------------------
// Investor summary
// ---------------------------------------------------------------------------
test('investor-summary: buildSummary computes conversion rate from real user counts, no fabrication', () => {
  const revenueSummary = { mrrINR: 10000, arrINR: 120000, oneTime: { totalINR: 5000 } };
  const ebitda = { monthlyEbitdaINR: 3000, marginPct: 30 };
  const summary = RWInvestorSummary.buildSummary({ totalUsers: 200, proUsers: 20, totalApprovedRevenueINR: 50000 }, revenueSummary, ebitda);
  assert.equal(summary.conversionPct, 10);
  assert.equal(summary.freeUsers, 180);
  assert.equal(summary.mrrINR, 10000);
});

test('investor-summary: buildSummary never divides by zero users', () => {
  const revenueSummary = { mrrINR: 0, arrINR: 0, oneTime: { totalINR: 0 } };
  const ebitda = { monthlyEbitdaINR: 0, marginPct: null };
  const summary = RWInvestorSummary.buildSummary({ totalUsers: 0, proUsers: 0, totalApprovedRevenueINR: 0 }, revenueSummary, ebitda);
  assert.equal(summary.conversionPct, null);
});
