const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

function pricing(){
  const context = {};
  vm.createContext(context);
  vm.runInContext(read('js/pricing/subscription-plans.js'), context);
  vm.runInContext(read('js/pricing/one-off-plans.js'), context);
  vm.runInContext(read('js/pricing/usage-policy.js'), context);
  return context.RWPricing;
}

function economics(){
  const context = {};
  vm.createContext(context);
  vm.runInContext(read('js/admin/founder-economics.js'), context);
  return context.RWFounderEconomics;
}

test('lifetime policy preserves unlimited zero-marginal-cost paths and bounds hosted AI', () => {
  const p = pricing();
  const founder = p.usagePolicyFor('founder', 'elite');
  assert.equal(founder.managedAIRequests, 12);
  assert.match(p.usageFeatureLabels('founder', 'elite').join(' | '), /Unlimited Smart Planner/);
  assert.match(p.usageFeatureLabels('founder', 'elite').join(' | '), /own provider key/);
  assert.doesNotMatch(p.usageFeatureLabels('founder', 'elite').join(' | '), /Unlimited RoamWise-hosted/);
});

test('browser and Worker managed-AI allowances stay in sync', async () => {
  const p = pricing();
  const server = await import(path.join(root, 'worker/lib/ai-entitlements.js'));
  for(const id of ['free','plus','pro','elite','founder']){
    assert.equal(server.MANAGED_AI_LIMITS[id], p.USAGE_POLICIES[id].managedAIRequests, `${id} allowance drifted`);
  }
});

test('legacy Founder and partner entitlements get the cost-capped Founder pool', async () => {
  const { managedAITier, managedAILimit } = await import(path.join(root, 'worker/lib/ai-entitlements.js'));
  const paidFounder = {pro:true,proMethod:'manual-paid',proAmount:100,tier:'elite'};
  assert.equal(managedAITier(paidFounder), 'founder');
  assert.equal(managedAILimit(paidFounder), 12);
  assert.equal(managedAITier({pro:true,proMethod:'partner'}), 'founder');
  assert.equal(managedAITier({pro:true,tier:'pro'}), 'pro');
  assert.equal(managedAITier({pro:false,tier:'elite'}), 'free');
});

test('Worker ignores client-selected model and clamps prompt/output', async () => {
  const { managedAIRequest } = await import(path.join(root, 'worker/lib/ai-entitlements.js'));
  const out = managedAIRequest({model:'expensive-client-model',prompt:'x'.repeat(9000),max_tokens:99999}, {
    GROQ_MODEL:'founder-approved-model',AI_MAX_PROMPT_CHARS:'1200',AI_MAX_OUTPUT_TOKENS:'300'
  });
  assert.equal(out.model, 'founder-approved-model');
  assert.equal(out.prompt.length, 1200);
  assert.equal(out.maxTokens, 300);
});

test('Worker usage reservation fails closed without durable metering', async () => {
  const { reserveManagedAI } = await import(path.join(root, 'worker/lib/ai-entitlements.js'));
  const out = await reserveManagedAI({}, 'u1', 12, new Date('2026-09-17T00:00:00Z'));
  assert.equal(out.ok, false);
  assert.equal(out.reason, 'meter_not_configured');
});

test('explicit Hosted AI mode sends a Firebase bearer token to the metered Worker', async () => {
  const calls = [];
  const context = {
    window:{}, activeProv:'roamwise', isPro:true, lastAiSource:null,
    lsGet:()=>'', rwApi:(p)=>`https://worker.example/${p}`,
    firebase:{auth:()=>({currentUser:{getIdToken:async()=> 'signed-token'}})},
    fetch:async (url, options)=>{calls.push({url,options});return {status:200,json:async()=>({text:'hosted answer',remaining:11,limit:12})};},
    Promise, Error, String, JSON, setTimeout, clearTimeout, AbortController
  };
  vm.createContext(context);
  vm.runInContext(read('js/copilot/ai-providers.js'), context);
  const answer = await new Promise((resolve, reject) => context.aiCall('plan Almora', 700, (err, txt) => err ? reject(new Error(err)) : resolve(txt)));
  assert.equal(answer, 'hosted answer');
  assert.equal(calls[0].url, 'https://worker.example/ai');
  assert.equal(calls[0].options.headers.Authorization, 'Bearer signed-token');
  assert.equal(JSON.parse(calls[0].options.body).prompt, 'plan Almora');
  assert.equal(context.lastAiSource.prov, 'roamwise');
});

test('10-year model starts from measured MRR and owner costs', () => {
  const E = economics();
  const out = E.project(100000, 50000, {
    grossMrrGrowthPct:0, monthlyChurnPct:0, otherMonthlyRevenueINR:0,
    otherRevenueGrowthPct:0, variableCostPct:10, targetAnnualCrore:1
  }, 120);
  assert.equal(out.years.length, 10);
  assert.equal(out.years[0].revenue, 1200000);
  assert.equal(out.years[0].profit, 480000);
  assert.equal(out.targetMonth, null);
  assert.equal(Math.round(out.breakEvenRevenue), 55556);
});

test('public store no longer sells founder time or claims unbounded hosted AI', () => {
  const html = read('index.html');
  assert.doesNotMatch(html, /1-on-1 Trip Consultation/);
  assert.doesNotMatch(html, /am=999/);
  assert.match(html, /Instant Trip Review/);
  assert.match(html, /monthly fair-use pool/);
  assert.match(html, /data-p="roamwise"/);
});

test('admin payment reconciliation persists the server-owned allowance tier', () => {
  const html = read('admin/index.html');
  assert.match(html, /id="payTier"/);
  assert.match(html, /proTier:tier/);
  assert.match(html, /paymentPlanHint\(uid\)/);
});
