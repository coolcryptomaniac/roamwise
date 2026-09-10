import test from 'node:test';
import assert from 'node:assert/strict';
import { classifySupport, computeMetrics, followTheSunRegion, normalizeItem, normalizeSettings, requiresHuman, riskSweep } from '../features/global-ops/core.mjs';

test('follow-the-sun routing covers all UTC shifts', () => {
  assert.equal(followTheSunRegion(new Date('2026-09-10T02:00:00Z')), 'APAC');
  assert.equal(followTheSunRegion(new Date('2026-09-10T10:00:00Z')), 'EMEA');
  assert.equal(followTheSunRegion(new Date('2026-09-10T18:00:00Z')), 'AMER');
});

test('safety and money support always require a human', () => {
  const safety = classifySupport({ subject: 'SOS', message: 'Lost trekker and injury', aiConsent: true }, new Date('2026-09-10T02:00:00Z'));
  const refund = classifySupport({ subject: 'Refund', message: 'I need my money back', aiConsent: true });
  assert.equal(safety.priority, 'critical');
  assert.equal(safety.aiMayDraft, false);
  assert.equal(refund.humanGate, true);
  assert.equal(requiresHuman('payment'), true);
});

test('general support can be drafted only with explicit AI consent', () => {
  assert.equal(classifySupport({ subject: 'Trip ideas', message: 'Where should I go?', aiConsent: false }).aiMayDraft, false);
  assert.equal(classifySupport({ subject: 'Trip ideas', message: 'Where should I go?', aiConsent: true }).aiMayDraft, true);
});

test('settings enforce the five-to-twenty headcount policy', () => {
  assert.equal(normalizeSettings({ coreHeadcount: 5, headcountCap: 20 }).headcountCap, 20);
  assert.throws(() => normalizeSettings({ coreHeadcount: 2, headcountCap: 21 }), /between 5 and 20/);
});

test('operations records reject unsupported types and unsafe amounts', () => {
  const item = normalizeItem({ type: 'partner', name: 'Expedia Rapid', status: 'research', monthlyCostMinor: 0 });
  assert.equal(item.type, 'partner');
  assert.throws(() => normalizeItem({ type: 'server', name: 'Owned rack' }), /Unsupported/);
  assert.throws(() => normalizeItem({ type: 'partner', name: 'Bad cost', monthlyCostMinor: -1 }), /non-negative/);
});

test('metrics do not claim an asset-light healthy state when inputs disagree', () => {
  const metrics = computeMetrics(
    { coreHeadcount: 21, headcountCap: 20, ownedAssetCount: 1, recurringWorkflowCount: 2, monthlyToolBudgetMinor: 10000 },
    [{ type: 'automation', status: 'active', priority: 'normal', monthlyCostMinor: 5000 }, { type: 'support', status: 'pending', priority: 'critical', humanGate: true }]
  );
  assert.equal(metrics.headcountWithinCap, false);
  assert.equal(metrics.assetLightTargetMet, false);
  assert.equal(metrics.healthy, false);
  assert.equal(metrics.automationCoveragePct, 50);
});

test('risk sweep selects critical or due-within-72-hours work only', () => {
  const now = new Date('2026-09-10T00:00:00Z');
  const risks = riskSweep([
    { id: 'a', type: 'support', name: 'SOS', priority: 'critical', status: 'pending' },
    { id: 'b', type: 'compliance', name: 'LUT', priority: 'high', status: 'pending', due_at: '2026-09-12T00:00:00Z' },
    { id: 'c', type: 'partner', name: 'Later', priority: 'normal', status: 'research', due_at: '2026-10-01T00:00:00Z' }
  ], now);
  assert.deepEqual(risks.map(item => item.id), ['a', 'b']);
});
