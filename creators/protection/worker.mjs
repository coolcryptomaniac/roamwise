import { authenticate, requireActor } from './auth.mjs';
import { buildMilestones, canSeeCampaign, fundingBadge, normalizeCampaign, transitionCampaign } from './core.mjs';
import { createFundingOrder, providerCatalog, releaseToCreator, resolveProvider } from './providers.mjs';
import { campaignById, event, listCampaigns, updateStatus } from './store.mjs';
import { verifyCashfree } from '../../payments/webhook-verify.mjs';

const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' };

function allowedOrigin(request, env) {
  const origin = request.headers.get('origin') || '';
  const allowed = String(env.ALLOWED_ORIGINS || 'https://roamwise.co.in,https://www.roamwise.co.in').split(',').map(v => v.trim());
  return allowed.includes(origin) ? origin : '';
}

function cors(request, env) {
  const origin = allowedOrigin(request, env);
  return origin ? {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'authorization,content-type,x-idempotency-key,x-webhook-signature,x-webhook-timestamp',
    'access-control-max-age': '86400', vary: 'Origin'
  } : {};
}

function reply(request, env, body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...JSON_HEADERS, ...cors(request, env) } });
}

async function body(request) {
  try { return await request.json(); }
  catch { throw Object.assign(new Error('Invalid JSON body'), { status: 400 }); }
}

function idempotency(request) {
  const raw = request.headers.get('x-idempotency-key') || crypto.randomUUID();
  return raw.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 45) || crypto.randomUUID();
}

function ownCampaign(actor, campaign) {
  if (actor.role === 'admin') return;
  if (actor.role === 'brand' && campaign.brand_uid === actor.uid) return;
  if (actor.role === 'creator' && campaign.creator_uid === actor.uid) return;
  throw Object.assign(new Error('Campaign does not belong to this account'), { status: 403 });
}

async function onboard(request, env, actor) {
  const input = await body(request);
  const role = String(input.role || '').toLowerCase();
  if (!['creator', 'brand'].includes(role)) throw Object.assign(new Error('role must be creator or brand'), { status: 400 });
  const name = String(input.displayName || actor.name || '').trim().slice(0, 120);
  const phone = String(input.phone || '').replace(/\D/g, '').slice(-10);
  if (!name || !phone) throw Object.assign(new Error('Display name and 10-digit phone are required'), { status: 400 });
  const stamp = new Date().toISOString();
  await env.CREATOR_DB.prepare(`INSERT INTO cp_actors(uid,role,status,email,display_name,phone,minimum_paid_minor,accepts_barter,created_at,updated_at)
    VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(uid) DO UPDATE SET email=excluded.email,display_name=excluded.display_name,phone=excluded.phone,
    minimum_paid_minor=excluded.minimum_paid_minor,accepts_barter=excluded.accepts_barter,updated_at=excluded.updated_at`)
    .bind(actor.uid, role, 'pending', actor.email, name, phone, Math.max(0, Math.round(Number(input.minimumPaidMinor || 0))), input.acceptsBarter ? 1 : 0, stamp, stamp).run();
  return reply(request, env, { status: 'pending', message: 'Identity saved. RoamWise approval and provider KYC are required before money can move.' }, 202);
}

async function approveActor(request, env, actor, uid) {
  requireActor(actor, ['admin']);
  const input = await body(request);
  const status = input.approved === false ? 'suspended' : 'active';
  const result = await env.CREATOR_DB.prepare('UPDATE cp_actors SET status=?,provider_vendor_id=?,updated_at=? WHERE uid=?')
    .bind(status, String(input.providerVendorId || '').slice(0, 100), new Date().toISOString(), uid).run();
  if (!Number(result.meta?.changes || 0)) throw Object.assign(new Error('Actor not found'), { status: 404 });
  return reply(request, env, { uid, status });
}

async function listActors(request, env, actor, url) {
  requireActor(actor, ['admin']);
  const requested = String(url.searchParams.get('status') || 'pending');
  const status = ['pending', 'active', 'suspended'].includes(requested) ? requested : 'pending';
  const result = await env.CREATOR_DB.prepare(`SELECT uid,role,status,email,display_name,phone,provider_vendor_id,minimum_paid_minor,accepts_barter,created_at,updated_at
    FROM cp_actors WHERE status=? ORDER BY updated_at DESC LIMIT 250`).bind(status).all();
  return reply(request, env, { actors: result.results || [], status });
}

async function createCampaign(request, env, actor) {
  requireActor(actor, ['brand']);
  const input = normalizeCampaign(await body(request), {
    serviceFeeBps: Number(env.CREATOR_PLATFORM_FEE_BPS || 1500),
    serviceTaxBps: Number(env.CREATOR_SERVICE_TAX_BPS || 1800)
  });
  const id = `camp_${crypto.randomUUID().replace(/-/g, '')}`;
  const stamp = new Date().toISOString();
  const milestones = buildMilestones(input);
  await env.CREATOR_DB.prepare(`INSERT INTO cp_campaigns(id,brand_uid,title,destination,description,kind,status,creator_slots,deliverables_json,milestones_json,usage_rights,exclusivity_days,accommodation_nights,meals_included,application_deadline,travel_start,creator_minimum_minor,creator_fee_minor,travel_reimbursement_minor,creator_receives_minor,service_fee_minor,service_tax_minor,total_payable_minor,created_at,updated_at)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .bind(id, actor.uid, input.title, input.destination, input.description, input.kind, 'draft', input.creatorSlots, JSON.stringify(input.deliverables), JSON.stringify(milestones), input.usageRights, input.exclusivityDays, input.accommodationNights, input.mealsIncluded ? 1 : 0, input.applicationDeadline, input.travelStart, input.creatorMinimumMinor, input.creatorFeeMinor, input.travelReimbursementMinor, input.creatorReceivesMinor, input.serviceFeeMinor, input.serviceTaxMinor, input.totalPayableMinor, stamp, stamp).run();
  await event(env, id, 'campaign.created', actor.uid, { quote: input });
  return reply(request, env, { id, status: 'draft', quote: input, milestones }, 201);
}

async function campaignAction(request, env, actor, id, action) {
  const campaign = await campaignById(env, id);
  if (!campaign) throw Object.assign(new Error('Campaign not found'), { status: 404 });
  ownCampaign(actor, campaign);
  const next = transitionCampaign(campaign.status, action, actor.role);
  return reply(request, env, await updateStatus(env, campaign, next, actor.uid, `campaign.${action}`));
}

async function applyCampaign(request, env, actor, id) {
  requireActor(actor, ['creator']);
  const campaign = await campaignById(env, id);
  if (!campaign || !canSeeCampaign(campaign, actor)) throw Object.assign(new Error('Campaign is unavailable for this creator profile'), { status: 404 });
  const input = await body(request);
  const proposed = Math.max(0, Math.round(Number(input.proposedFeeMinor || campaign.creatorFeeMinor || 0)));
  const minimum = Number(actor.minimumPaidCampaignMinor || 0);
  if (campaign.kind !== 'barter' && proposed < minimum) throw Object.assign(new Error('Offer is below your saved Creator Minimum'), { status: 422 });
  const applicationId = `app_${crypto.randomUUID().replace(/-/g, '')}`;
  const stamp = new Date().toISOString();
  await env.CREATOR_DB.prepare(`INSERT INTO cp_applications(id,campaign_id,creator_uid,status,note,proposed_fee_minor,created_at,updated_at)
    VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(campaign_id,creator_uid) DO UPDATE SET note=excluded.note,proposed_fee_minor=excluded.proposed_fee_minor,updated_at=excluded.updated_at`)
    .bind(applicationId, id, actor.uid, 'submitted', String(input.note || '').slice(0, 1000), proposed, stamp, stamp).run();
  await event(env, id, 'application.submitted', actor.uid, { proposedFeeMinor: proposed });
  return reply(request, env, { status: 'submitted' }, 201);
}

async function listApplications(request, env, actor, id) {
  requireActor(actor, ['brand', 'admin']);
  const campaign = await campaignById(env, id);
  if (!campaign) throw Object.assign(new Error('Campaign not found'), { status: 404 });
  ownCampaign(actor, campaign);
  const result = await env.CREATOR_DB.prepare(`SELECT a.creator_uid,a.status,a.note,a.proposed_fee_minor,a.created_at,p.display_name,p.email
    FROM cp_applications a JOIN cp_actors p ON p.uid=a.creator_uid WHERE a.campaign_id=? ORDER BY a.created_at ASC`).bind(id).all();
  return reply(request, env, { applications: result.results || [] });
}

async function acceptApplication(request, env, actor, id) {
  requireActor(actor, ['brand']);
  const campaign = await campaignById(env, id);
  if (!campaign) throw Object.assign(new Error('Campaign not found'), { status: 404 });
  ownCampaign(actor, campaign);
  const input = await body(request);
  const application = await env.CREATOR_DB.prepare("SELECT * FROM cp_applications WHERE campaign_id=? AND creator_uid=? AND status='submitted'").bind(id, String(input.creatorUid || '')).first();
  if (!application) throw Object.assign(new Error('Creator application not found'), { status: 404 });
  const next = transitionCampaign(campaign.status, 'accept_offer', actor.role);
  await env.CREATOR_DB.batch([
    env.CREATOR_DB.prepare("UPDATE cp_applications SET status='accepted',updated_at=? WHERE id=?").bind(new Date().toISOString(), application.id),
    env.CREATOR_DB.prepare("UPDATE cp_applications SET status='declined',updated_at=? WHERE campaign_id=? AND id!=?").bind(new Date().toISOString(), id, application.id)
  ]);
  return reply(request, env, await updateStatus(env, campaign, next, actor.uid, 'application.accepted', { creatorUid: application.creator_uid }));
}

async function fundCampaign(request, env, actor, id) {
  requireActor(actor, ['brand']);
  const campaign = await campaignById(env, id);
  if (!campaign) throw Object.assign(new Error('Campaign not found'), { status: 404 });
  ownCampaign(actor, campaign);
  if (campaign.kind === 'barter') throw Object.assign(new Error('Barter campaigns have no protected cash payment'), { status: 422 });
  transitionCampaign(campaign.status, 'start_funding', actor.role);
  const provider = resolveProvider(env);
  const result = await createFundingOrder(campaign, actor, env, idempotency(request));
  await env.CREATOR_DB.prepare('UPDATE cp_campaigns SET status=?,provider=?,provider_ref=?,updated_at=? WHERE id=? AND status=?')
    .bind('funding_pending', provider.id, result.providerRef, new Date().toISOString(), id, campaign.status).run();
  await event(env, id, 'funding.started', actor.uid, { provider: provider.id, providerRef: result.providerRef });
  return reply(request, env, { campaignId: id, status: 'funding_pending', ...result });
}

async function releaseCampaign(request, env, actor, id) {
  requireActor(actor, ['brand', 'admin']);
  const campaign = await campaignById(env, id);
  if (!campaign) throw Object.assign(new Error('Campaign not found'), { status: 404 });
  ownCampaign(actor, campaign);
  transitionCampaign(campaign.status, 'request_release', actor.role);
  const creator = await env.CREATOR_DB.prepare('SELECT * FROM cp_actors WHERE uid=?').bind(campaign.creator_uid).first();
  if (!creator || creator.status !== 'active') throw Object.assign(new Error('Creator payout KYC is not active'), { status: 422 });
  const providerResult = await releaseToCreator(campaign, { providerVendorId: creator.provider_vendor_id }, env, idempotency(request));
  const updated = await updateStatus(env, campaign, 'release_pending', actor.uid, 'release.requested', { providerResult });
  return reply(request, env, updated, 202);
}

async function openDispute(request, env, actor, id) {
  requireActor(actor, ['creator', 'brand', 'admin']);
  const campaign = await campaignById(env, id);
  if (!campaign) throw Object.assign(new Error('Campaign not found'), { status: 404 });
  ownCampaign(actor, campaign);
  const input = await body(request);
  const reason = String(input.reason || '').trim().slice(0, 2000);
  if (!reason) throw Object.assign(new Error('A dispute reason is required'), { status: 400 });
  const next = transitionCampaign(campaign.status, 'open_dispute', actor.role);
  const disputeId = `disp_${crypto.randomUUID().replace(/-/g, '')}`;
  const stamp = new Date().toISOString();
  await env.CREATOR_DB.prepare('INSERT INTO cp_disputes(id,campaign_id,opened_by,status,reason,evidence_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)')
    .bind(disputeId, id, actor.uid, 'open', reason, JSON.stringify((input.evidence || []).slice(0, 20)), stamp, stamp).run();
  await updateStatus(env, campaign, next, actor.uid, 'dispute.opened', { disputeId });
  return reply(request, env, { disputeId, status: 'open', campaignStatus: next }, 201);
}

async function cashfreeWebhook(request, env) {
  const raw = await request.text();
  if (!await verifyCashfree(raw, request.headers, env)) return reply(request, env, { error: 'invalid_signature' }, 401);
  const payload = JSON.parse(raw);
  const eventId = String(payload.data?.payment?.cf_payment_id || payload.data?.transfer?.transfer_id || payload.event_time || crypto.randomUUID());
  const inserted = await env.CREATOR_DB.prepare('INSERT OR IGNORE INTO cp_webhook_events(provider,event_id,received_at) VALUES(?,?,?)').bind('cashfree_easy_split', eventId, new Date().toISOString()).run();
  if (!Number(inserted.meta?.changes || 0)) return reply(request, env, { ok: true, duplicate: true });
  const providerRef = String(payload.data?.order?.order_id || payload.data?.transfer?.order_id || '');
  const campaign = await env.CREATOR_DB.prepare('SELECT id,status FROM cp_campaigns WHERE provider_ref=?').bind(providerRef).first();
  if (!campaign) return reply(request, env, { ok: true, ignored: true });
  const type = String(payload.type || payload.event_type || '');
  if (type.includes('PAYMENT_SUCCESS') && campaign.status === 'funding_pending') {
    await env.CREATOR_DB.prepare("UPDATE cp_campaigns SET status='funded',updated_at=? WHERE id=? AND status='funding_pending'").bind(new Date().toISOString(), campaign.id).run();
    await event(env, campaign.id, 'funding.confirmed', 'system', { providerEventId: eventId });
  } else if ((type.includes('TRANSFER_SUCCESS') || type.includes('SETTLEMENT_SUCCESS')) && campaign.status === 'release_pending') {
    await env.CREATOR_DB.prepare("UPDATE cp_campaigns SET status='paid',updated_at=? WHERE id=? AND status='release_pending'").bind(new Date().toISOString(), campaign.id).run();
    await event(env, campaign.id, 'release.confirmed', 'system', { providerEventId: eventId });
  }
  return reply(request, env, { ok: true, eventId });
}

async function route(request, env) {
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(request, env) });
  if (request.method === 'GET' && url.pathname === '/health') return reply(request, env, { status: 'ok', service: 'roamwise-creator-protection-v1' });
  if (request.method === 'GET' && url.pathname === '/v1/creator-protection/config') {
    let selected = null; try { selected = resolveProvider(env); } catch {}
    return reply(request, env, { selectedProvider: selected?.id || null, providers: providerCatalog(), protectedHoldActive: Boolean(selected) });
  }
  if (request.method === 'POST' && url.pathname === '/v1/creator-protection/webhooks/cashfree') return cashfreeWebhook(request, env);
  const actor = await authenticate(request, env);
  if (request.method === 'GET' && url.pathname === '/v1/creator-protection/me') return reply(request, env, actor);
  if (request.method === 'POST' && url.pathname === '/v1/creator-protection/onboard') return onboard(request, env, actor);
  if (request.method === 'GET' && url.pathname === '/v1/creator-protection/actors') return listActors(request, env, actor, url);
  const actorApproval = url.pathname.match(/^\/v1\/creator-protection\/actors\/([^/]+)\/approve$/);
  if (request.method === 'POST' && actorApproval) return approveActor(request, env, actor, actorApproval[1]);
  if (request.method === 'GET' && url.pathname === '/v1/creator-protection/campaigns') return reply(request, env, { campaigns: await listCampaigns(env, actor, url.searchParams.get('funded') === 'true') });
  if (request.method === 'POST' && url.pathname === '/v1/creator-protection/campaigns') return createCampaign(request, env, actor);
  const applicationList = url.pathname.match(/^\/v1\/creator-protection\/campaigns\/([^/]+)\/applications$/);
  if (request.method === 'GET' && applicationList) return listApplications(request, env, actor, applicationList[1]);
  const match = url.pathname.match(/^\/v1\/creator-protection\/campaigns\/([^/]+)\/(publish|cancel|start|submit|approve|apply|accept|fund|release|dispute)$/);
  if (!match || request.method !== 'POST') return reply(request, env, { error: 'not_found' }, 404);
  const [, id, action] = match;
  if (action === 'apply') return applyCampaign(request, env, actor, id);
  if (action === 'accept') return acceptApplication(request, env, actor, id);
  if (action === 'fund') return fundCampaign(request, env, actor, id);
  if (action === 'release') return releaseCampaign(request, env, actor, id);
  if (action === 'dispute') return openDispute(request, env, actor, id);
  const map = { publish: 'publish', cancel: 'cancel', start: 'start_work', submit: 'submit_work', approve: 'approve_work' };
  return campaignAction(request, env, actor, id, map[action]);
}

export default {
  async fetch(request, env) {
    try {
      if (!env.CREATOR_DB) throw Object.assign(new Error('CREATOR_DB is not configured'), { status: 503 });
      return await route(request, env);
    } catch (error) {
      return reply(request, env, { error: error.message || 'Request failed' }, Number(error.status || 500));
    }
  }
};
