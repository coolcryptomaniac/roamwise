'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

function fakeKV(){
  const m = new Map();
  return { m, get: async (k) => (m.has(k) ? m.get(k) : null), put: async (k, v) => { m.set(k, v); } };
}

test('prompt normalisation ignores case and whitespace but not content', async () => {
  const { normalizePrompt, answerCacheKey } = await import(path.join(root, 'worker/lib/ai-cache.js'));
  assert.equal(normalizePrompt('  Plan  3 days\nin KASAR Devi '), 'plan 3 days in kasar devi');
  const env = { WORKERS_AI_MODEL: 'm1', GROQ_MODEL: 'g1' };
  const a = await answerCacheKey({ prompt: 'Plan 3 days in Kasar Devi', maxTokens: 700, locale: 'en' }, env);
  const b = await answerCacheKey({ prompt: 'plan 3  days in kasar devi', maxTokens: 700, locale: 'EN' }, env);
  const c = await answerCacheKey({ prompt: 'plan 4 days in kasar devi', maxTokens: 700, locale: 'en' }, env);
  const d = await answerCacheKey({ prompt: 'plan 3 days in kasar devi', maxTokens: 700, locale: 'en' }, { WORKERS_AI_MODEL: 'm2', GROQ_MODEL: 'g1' });
  assert.equal(a, b);
  assert.notEqual(a, c);
  assert.notEqual(a, d, 'a model change must invalidate cached answers');
});

test('answer cache round trip, and no-op without the KV binding', async () => {
  const c = await import(path.join(root, 'worker/lib/ai-cache.js'));
  const env = { AI_USAGE: fakeKV() };
  assert.equal(await c.getCachedAnswer(env, 'k'), null);
  await c.putCachedAnswer(env, 'k', { text: 'hello', provider: 'workers-ai', model: 'm' });
  assert.deepEqual(await c.getCachedAnswer(env, 'k'), { text: 'hello', provider: 'workers-ai', model: 'm' });
  await c.putCachedAnswer(env, 'big', { text: 'x'.repeat(30000) });
  assert.equal(await c.getCachedAnswer(env, 'big'), null);
  await c.putCachedAnswer({}, 'k', { text: 'x' });
  assert.equal(await c.getCachedAnswer({}, 'k'), null);
});

test('tier cache honours proUntil expiry and ignores corrupt values', async () => {
  const c = await import(path.join(root, 'worker/lib/ai-cache.js'));
  const env = { AI_USAGE: fakeKV() };
  assert.equal(await c.getCachedLimit(env, 'u1'), null);
  await c.putCachedLimit(env, 'u1', 40, { proUntil: Date.now() + 60000 });
  assert.equal(await c.getCachedLimit(env, 'u1'), 40);
  assert.equal(await c.getCachedLimit(env, 'u1', Date.now() + 120000), null, 'expired plan must not use cached allowance');
  env.AI_USAGE.m.set('ai-tier:u2', 'not json');
  assert.equal(await c.getCachedLimit(env, 'u2'), null);
});

test('peekManagedAI never consumes allowance and respects the limit', async () => {
  const { peekManagedAI, reserveManagedAI } = await import(path.join(root, 'worker/lib/ai-entitlements.js'));
  const env = { AI_USAGE: fakeKV() };
  const d = new Date('2026-10-10T00:00:00Z');
  assert.equal((await peekManagedAI(env, 'u1', 0, d)).ok, false, 'free tier gets no cached answers');
  assert.equal((await peekManagedAI(env, 'u1', 2, d)).ok, true);
  assert.equal((await peekManagedAI(env, 'u1', 2, d)).used, 0);
  await reserveManagedAI(env, 'u1', 2, d);
  await reserveManagedAI(env, 'u1', 2, d);
  assert.equal((await peekManagedAI(env, 'u1', 2, d)).ok, false);
  assert.equal((await peekManagedAI({}, 'u1', 2, d)).reason, 'meter_not_configured');
});
