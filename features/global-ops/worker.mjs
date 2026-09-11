import { authenticate, requireActor } from '../../creators/protection/auth.mjs';
import { classifySupport, computeMetrics, normalizeItem, normalizeSettings, riskSweep } from './core.mjs';

const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' };

function allowedOrigin(request, env) {
  const origin = request.headers.get('origin') || '';
  const allowed = String(env.ALLOWED_ORIGINS || 'https://roamwise.co.in,https://www.roamwise.co.in').split(',').map(value => value.trim());
  return allowed.includes(origin) ? origin : '';
}

function headers(request, env) {
  const origin = allowedOrigin(request, env);
  return origin ? {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'GET,POST,PATCH,PUT,OPTIONS',
    'access-control-allow-headers': 'authorization,content-type,x-idempotency-key',
    'access-control-max-age': '86400',
    vary: 'Origin'
  } : {};
}

function reply(request, env, body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...JSON_HEADERS, ...headers(request, env) } });
}

async function jsonBody(request) {
  const length = Number(request.headers.get('content-length') || 0);
  if (length > 20000) throw Object.assign(new Error('Request body is too large'), { status: 413 });
  try { return await request.json(); }
  catch { throw Object.assign(new Error('Invalid JSON body'), { status: 400 }); }
}

async function adminActor(request, env) {
  const actor = await authenticate(request, {
    FIREBASE_PROJECT_ID: env.FIREBASE_PROJECT_ID,
    CREATOR_PROTECTION_ADMIN_UIDS: env.GLOBAL_OPS_ADMIN_UIDS || env.CREATOR_PROTECTION_ADMIN_UIDS
  });
  requireActor(actor, ['admin']);
  return actor;
}

async function audit(env, type, actorUid, itemId = '', payload = {}) {
  await env.GLOBAL_OPS_DB.prepare('INSERT INTO go_events(id,event_type,actor_uid,item_id,payload_json,created_at) VALUES(?,?,?,?,?,?)')
    .bind(crypto.randomUUID(), type, actorUid, itemId, JSON.stringify(payload).slice(0, 30000), new Date().toISOString()).run();
}

async function ensureSettings(env) {
  const now = new Date().toISOString();
  await env.GLOBAL_OPS_DB.prepare("INSERT OR IGNORE INTO go_settings(id,core_headcount,contractor_count,headcount_cap,owned_asset_count,recurring_workflow_count,monthly_tool_budget_minor,updated_at) VALUES('control',0,0,20,0,0,0,?)").bind(now).run();
  return env.GLOBAL_OPS_DB.prepare("SELECT * FROM go_settings WHERE id='control'").first();
}

async function listItems(env) {
  const result = await env.GLOBAL_OPS_DB.prepare('SELECT * FROM go_items ORDER BY CASE priority WHEN \'critical\' THEN 0 WHEN \'high\' THEN 1 WHEN \'normal\' THEN 2 ELSE 3 END, updated_at DESC LIMIT 500').all();
  return result.results || [];
}

async function dashboard(request, env) {
  const actor = await adminActor(request, env);
  const [settings, items] = await Promise.all([ensureSettings(env), listItems(env)]);
  return reply(request, env, { actor: { uid: actor.uid, email: actor.email }, settings, items, metrics: computeMetrics(settings, items) });
}

async function saveSettings(request, env) {
  const actor = await adminActor(request, env);
  const input = normalizeSettings(await jsonBody(request));
  await env.GLOBAL_OPS_DB.prepare("INSERT INTO go_settings(id,core_headcount,contractor_count,headcount_cap,owned_asset_count,recurring_workflow_count,monthly_tool_budget_minor,updated_at) VALUES('control',?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET core_headcount=excluded.core_headcount,contractor_count=excluded.contractor_count,headcount_cap=excluded.headcount_cap,owned_asset_count=excluded.owned_asset_count,recurring_workflow_count=excluded.recurring_workflow_count,monthly_tool_budget_minor=excluded.monthly_tool_budget_minor,updated_at=excluded.updated_at")
    .bind(input.coreHeadcount, input.contractorCount, input.headcountCap, input.ownedAssetCount, input.recurringWorkflowCount, input.monthlyToolBudgetMinor, input.updatedAt).run();
  await audit(env, 'settings.updated', actor.uid, '', input);
  return reply(request, env, { settings: input });
}

function toDatabaseItem(item, id) {
  return {
    id,
    type: item.type,
    name: item.name,
    detail: item.detail,
    contact: item.contact,
    provider: item.provider,
    owner: item.owner,
    region: item.region,
    status: item.status,
    priority: item.priority,
    humanGate: item.humanGate ? 1 : 0,
    monthlyCostMinor: item.monthlyCostMinor,
    dueAt: item.dueAt,
    evidenceUrl: item.evidenceUrl,
    sourceUrl: item.sourceUrl,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    expiresAt: item.type === 'support' ? new Date(Date.now() + 180 * 86400000).toISOString() : ''
  };
}

async function insertItem(env, item, id = 'go_' + crypto.randomUUID().replaceAll('-', '')) {
  const row = toDatabaseItem(item, id);
  await env.GLOBAL_OPS_DB.prepare('INSERT INTO go_items(id,type,name,detail,contact,provider,owner,region,status,priority,human_gate,monthly_cost_minor,due_at,evidence_url,source_url,created_at,updated_at,expires_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
    .bind(row.id, row.type, row.name, row.detail, row.contact, row.provider, row.owner, row.region, row.status, row.priority, row.humanGate, row.monthlyCostMinor, row.dueAt, row.evidenceUrl, row.sourceUrl, row.createdAt, row.updatedAt, row.expiresAt).run();
  return row;
}

async function createItem(request, env) {
  const actor = await adminActor(request, env);
  const item = normalizeItem(await jsonBody(request));
  const row = await insertItem(env, item);
  await audit(env, 'item.created', actor.uid, row.id, { type: row.type, status: row.status });
  return reply(request, env, { item: row }, 201);
}

function rowAsInput(row, patch) {
  return {
    type: row.type,
    name: patch.name ?? row.name,
    detail: patch.detail ?? row.detail,
    contact: patch.contact ?? row.contact,
    provider: patch.provider ?? row.provider,
    owner: patch.owner ?? row.owner,
    region: patch.region ?? row.region,
    status: patch.status ?? row.status,
    priority: patch.priority ?? row.priority,
    humanGate: patch.humanGate ?? Boolean(row.human_gate),
    monthlyCostMinor: patch.monthlyCostMinor ?? Number(row.monthly_cost_minor || 0),
    dueAt: patch.dueAt ?? row.due_at,
    evidenceUrl: patch.evidenceUrl ?? row.evidence_url,
    sourceUrl: patch.sourceUrl ?? row.source_url
  };
}

async function updateItem(request, env, id) {
  const actor = await adminActor(request, env);
  const current = await env.GLOBAL_OPS_DB.prepare('SELECT * FROM go_items WHERE id=?').bind(id).first();
  if (!current) throw Object.assign(new Error('Operations item not found'), { status: 404 });
  const patch = await jsonBody(request);
  const next = normalizeItem(rowAsInput(current, patch));
  const stamp = new Date().toISOString();
  const result = await env.GLOBAL_OPS_DB.prepare('UPDATE go_items SET name=?,detail=?,contact=?,provider=?,owner=?,region=?,status=?,priority=?,human_gate=?,monthly_cost_minor=?,due_at=?,evidence_url=?,source_url=?,updated_at=? WHERE id=? AND updated_at=?')
    .bind(next.name, next.detail, next.contact, next.provider, next.owner, next.region, next.status, next.priority, next.humanGate ? 1 : 0, next.monthlyCostMinor, next.dueAt, next.evidenceUrl, next.sourceUrl, stamp, id, current.updated_at).run();
  if (Number(result.meta?.changes || 0) !== 1) throw Object.assign(new Error('Item changed; refresh and retry'), { status: 409 });
  await audit(env, 'item.updated', actor.uid, id, { from: current.status, to: next.status });
  return reply(request, env, { id, status: next.status, updatedAt: stamp });
}

async function verifyTurnstile(request, env, token) {
  if (!env.TURNSTILE_SECRET_KEY) return false;
  const form = new FormData();
  form.set('secret', env.TURNSTILE_SECRET_KEY);
  form.set('response', String(token || ''));
  form.set('remoteip', request.headers.get('cf-connecting-ip') || '');
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form });
  const result = await response.json().catch(() => ({}));
  return result.success === true;
}

async function aiDraft(env, input, triage) {
  if (!input.aiConsent || !env.AI || !env.OPS_AI_MODEL || !triage.aiMayDraft) return '';
  const result = await env.AI.run(env.OPS_AI_MODEL, {
    messages: [
      { role: 'system', content: 'Draft a concise travel support acknowledgement. Never promise refunds, payments, bookings, legal outcomes, safety rescue, account changes, or deadlines. Tell the customer a human will review when appropriate.' },
      { role: 'user', content: String(input.subject || '').slice(0, 180) + '\n' + String(input.message || '').slice(0, 3000) }
    ],
    max_tokens: 220
  });
  return String(result?.response || '').slice(0, 1500);
}

async function publicSupport(request, env) {
  if (String(env.SUPPORT_PUBLIC_ENABLED || '').toLowerCase() !== 'true') throw Object.assign(new Error('Public support intake is not enabled'), { status: 503 });
  if (!env.SUPPORT_RATE_LIMITER) throw Object.assign(new Error('Support rate limiter is not configured'), { status: 503 });
  const key = request.headers.get('cf-connecting-ip') || 'unknown';
  const limit = await env.SUPPORT_RATE_LIMITER.limit({ key });
  if (!limit.success) throw Object.assign(new Error('Too many support requests'), { status: 429 });
  const input = await jsonBody(request);
  if (!await verifyTurnstile(request, env, input.turnstileToken)) throw Object.assign(new Error('Human verification failed'), { status: 403 });
  const triage = classifySupport(input);
  const draft = await aiDraft(env, input, triage).catch(() => '');
  const item = normalizeItem({
    type: 'support',
    name: input.subject,
    detail: input.message,
    contact: input.email,
    provider: draft ? 'AI draft prepared' : 'Rule triage',
    owner: 'Follow-the-sun queue',
    region: triage.queueRegion,
    status: 'pending',
    priority: triage.priority,
    humanGate: triage.humanGate
  });
  const row = await insertItem(env, item);
  await audit(env, 'support.intake', 'public', row.id, { category: triage.category, priority: triage.priority, aiDrafted: Boolean(draft) });
  if (env.GLOBAL_OPS_QUEUE) await env.GLOBAL_OPS_QUEUE.send({ kind: 'support', itemId: row.id, priority: triage.priority, region: triage.queueRegion });
  return reply(request, env, { ticketId: row.id, triage, suggestedResponse: draft, message: triage.acknowledgement }, 202);
}

async function adminTriage(request, env) {
  const actor = await adminActor(request, env);
  const input = await jsonBody(request);
  const triage = classifySupport(input);
  const draft = await aiDraft(env, input, triage).catch(() => '');
  const item = normalizeItem({
    type: 'support',
    name: input.subject,
    detail: input.message,
    contact: input.email,
    provider: draft ? 'AI draft prepared' : 'Rule triage',
    owner: 'Follow-the-sun queue',
    region: triage.queueRegion,
    status: 'pending',
    priority: triage.priority,
    humanGate: triage.humanGate
  });
  const row = await insertItem(env, item);
  await audit(env, 'support.admin_triage', actor.uid, row.id, { category: triage.category, priority: triage.priority, aiDrafted: Boolean(draft) });
  if (env.GLOBAL_OPS_QUEUE) await env.GLOBAL_OPS_QUEUE.send({ kind: 'support', itemId: row.id, priority: triage.priority, region: triage.queueRegion });
  return reply(request, env, { ticketId: row.id, triage, suggestedResponse: draft, message: triage.acknowledgement }, 201);
}

async function sweep(env, actorUid = 'system') {
  const items = await listItems(env);
  const risks = riskSweep(items);
  for (const risk of risks) await audit(env, 'risk.detected', actorUid, risk.id, risk);
  if (env.GLOBAL_OPS_QUEUE && risks.length) {
    await env.GLOBAL_OPS_QUEUE.sendBatch(risks.slice(0, 100).map(risk => ({ body: { kind: 'risk', ...risk } })));
  }
  const now = new Date().toISOString();
  await env.GLOBAL_OPS_DB.prepare("UPDATE go_items SET contact='',detail='[support data removed after retention window]',updated_at=? WHERE type='support' AND status IN ('resolved','retired') AND expires_at!='' AND expires_at<?").bind(now, now).run();
  return risks;
}

async function manualSweep(request, env) {
  const actor = await adminActor(request, env);
  const risks = await sweep(env, actor.uid);
  return reply(request, env, { risks, count: risks.length });
}

async function route(request, env) {
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: headers(request, env) });
  if (request.method === 'GET' && url.pathname === '/health') return reply(request, env, { status: 'ok', service: 'roamwise-global-ops-v1' });
  if (request.method === 'POST' && url.pathname === '/v1/global-ops/support') return publicSupport(request, env);
  if (request.method === 'POST' && url.pathname === '/v1/global-ops/triage') return adminTriage(request, env);
  if (request.method === 'GET' && url.pathname === '/v1/global-ops/dashboard') return dashboard(request, env);
  if (request.method === 'PUT' && url.pathname === '/v1/global-ops/settings') return saveSettings(request, env);
  if (request.method === 'POST' && url.pathname === '/v1/global-ops/items') return createItem(request, env);
  if (request.method === 'POST' && url.pathname === '/v1/global-ops/sweep') return manualSweep(request, env);
  const item = url.pathname.match(/^\/v1\/global-ops\/items\/([^/]+)$/);
  if (request.method === 'PATCH' && item) return updateItem(request, env, item[1]);
  return reply(request, env, { error: 'not_found' }, 404);
}

export default {
  async fetch(request, env) {
    try {
      if (!env.GLOBAL_OPS_DB) throw Object.assign(new Error('GLOBAL_OPS_DB is not configured'), { status: 503 });
      return await route(request, env);
    } catch (error) {
      return reply(request, env, { error: error.message || 'Request failed' }, Number(error.status || 500));
    }
  },
  async scheduled(_controller, env, ctx) {
    ctx.waitUntil(sweep(env));
  },
  async queue(batch, env) {
    for (const message of batch.messages) {
      const payload = message.body || {};
      try {
        if (env.OPS_ALERT_WEBHOOK_URL) {
          await fetch(env.OPS_ALERT_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'content-type': 'application/json', authorization: env.OPS_ALERT_WEBHOOK_TOKEN ? 'Bearer ' + env.OPS_ALERT_WEBHOOK_TOKEN : '' },
            body: JSON.stringify({ source: 'roamwise-global-ops', ...payload })
          });
        }
        await audit(env, 'notification.processed', 'system', payload.itemId || payload.id || '', { kind: payload.kind || 'unknown' });
        message.ack();
      } catch (error) {
        message.retry();
      }
    }
  }
};
