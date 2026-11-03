/* Sends PAID merchandise orders to Qikink. Off unless config/shop.qikinkEnabled === true AND the Worker has
 * QIKINK_CLIENT_ID / QIKINK_CLIENT_SECRET AND config/shop.qikinkEnvironment matches QIKINK_ENV (default sandbox).
 * A sandbox-paid order is never sent to live Qikink. Qikink's unique order_number is the duplicate guard:
 * if a submission is ever interrupted we do NOT blindly resend; the order goes to `needs_attention`.
 *
 * fulfilmentState: not_started -> queued (paid) -> submitting -> submitted | queued (retry) | needs_attention */
import { createQikinkClient, qikinkConfigured, qikinkEnvName } from './qikink-client.js';
import { buildQikinkOrder } from './qikink-core.js';

export const MAX_ATTEMPTS = 24;
export const STALE_SUBMIT_MS = 15 * 60 * 1000;

export function createFulfilment(deps) {
  const { getDoc, updateDoc, queryEqualsString, fetchImpl, now, catalogue } = deps;

  function skuFor(line) {
    const p = catalogue.products.find((x) => x.id === line.id);
    const v = p && p.variants.find((x) => x.id === line.variant);
    return v && v.qikinkSku ? v.qikinkSku : null;
  }

  const tokenStore = (env, ctx) => {
    const path = `shopSecrets/qikinkToken_${qikinkEnvName(env)}`;
    return {
      read: () => getDoc(env, ctx.accessToken, ctx.projectId, path),
      write: (entry) => updateDoc(env, ctx.accessToken, ctx.projectId, path, entry),
    };
  };

  async function patch(env, ctx, id, values) {
    await updateDoc(env, ctx.accessToken, ctx.projectId, `shopOrders/${id}`, { ...values, updatedAt: now().toISOString() });
  }

  /* Returns { state }: submitted | queued | needs_attention | skipped. Never throws. */
  async function fulfilOrder(env, ctx, id, order) {
    try {
      if (!order || order.status !== 'paid' || order.fulfilmentState !== 'queued') return { state: 'skipped', reason: 'not_queued' };
      if (!qikinkConfigured(env)) return { state: 'skipped', reason: 'not_configured' };
      const cfg = await getDoc(env, ctx.accessToken, ctx.projectId, 'config/shop');
      const envName = qikinkEnvName(env);
      if (!cfg || cfg.qikinkEnabled !== true || String(cfg.qikinkEnvironment || 'sandbox').toLowerCase() !== envName) return { state: 'skipped', reason: 'disabled' };
      if (envName === 'live' && order.environment !== 'live') {
        await patch(env, ctx, id, { fulfilmentState: 'needs_attention', fulfilmentNote: 'Paid in sandbox; not sent to live Qikink.' });
        return { state: 'needs_attention' };
      }
      const built = buildQikinkOrder(order, skuFor);
      if (built.error === 'missing_sku') return { state: 'skipped', reason: 'missing_sku' };
      if (built.error) {
        await patch(env, ctx, id, { fulfilmentState: 'needs_attention', fulfilmentNote: 'Cannot build Qikink order: ' + built.error });
        return { state: 'needs_attention' };
      }
      const attempts = (Number(order.fulfilmentAttempts) || 0) + 1;
      await patch(env, ctx, id, { fulfilmentState: 'submitting', fulfilmentAttempts: attempts, fulfilmentAt: now().toISOString() });
      const client = createQikinkClient({ env, fetchImpl, now: () => now().getTime(), store: tokenStore(env, ctx) });
      const r = await client.createOrder(built.body);
      if (r.ok) {
        await patch(env, ctx, id, { fulfilmentState: 'submitted', qikinkOrderId: r.qikinkOrderId, qikinkEnvironment: envName, qikinkOrderNumber: built.body.order_number, fulfilmentNote: '' });
        return { state: 'submitted' };
      }
      if (r.retryable && attempts < MAX_ATTEMPTS) {
        await patch(env, ctx, id, { fulfilmentState: 'queued', fulfilmentNote: 'Will retry: ' + r.reason });
        return { state: 'queued' };
      }
      await patch(env, ctx, id, { fulfilmentState: 'needs_attention', fulfilmentNote: (r.retryable ? 'Gave up retrying: ' : 'Qikink rejected: ') + r.reason });
      return { state: 'needs_attention' };
    } catch (_) {
      return { state: 'skipped', reason: 'error' };
    }
  }

  /* Hourly cron: retry queued paid orders; park interrupted submissions for a human. */
  async function runFulfilmentCron(env, ctx) {
    const out = { submitted: 0, queued: 0, needsAttention: 0, skipped: 0 };
    const stale = await queryEqualsString(env, ctx.accessToken, ctx.projectId, 'shopOrders', 'fulfilmentState', 'submitting', 20);
    for (const o of stale) {
      if (now().getTime() - Date.parse(o.fulfilmentAt || 0) < STALE_SUBMIT_MS) continue;
      await patch(env, ctx, o.id, { fulfilmentState: 'needs_attention', fulfilmentNote: 'Submission was interrupted. Check the Qikink dashboard for this order number before resubmitting.' });
      out.needsAttention += 1;
    }
    const queued = await queryEqualsString(env, ctx.accessToken, ctx.projectId, 'shopOrders', 'fulfilmentState', 'queued', 20);
    for (const o of queued) {
      const r = await fulfilOrder(env, ctx, o.id, o);
      if (r.state === 'submitted') out.submitted += 1;
      else if (r.state === 'queued') out.queued += 1;
      else if (r.state === 'needs_attention') out.needsAttention += 1;
      else out.skipped += 1;
    }
    return out;
  }

  return { fulfilOrder, runFulfilmentCron };
}
