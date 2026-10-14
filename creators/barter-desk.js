/* creators/barter-desk.js — founder-only "who gets this barter offer" desk on the creator admin page.
   Picks an open property offer (e.g. Milan Heights: stay + food, no cash), ranks creator applications
   nearest-and-best first, and gives one-tap WhatsApp messages to both sides with a Google Maps route.
   Nothing is sent by itself: each message opens WhatsApp for a person to press send.
   Writes only to crm/{id}.barter (admin-only collection) to record offers and deal stages. */
import { SEED_POLICIES, mergePolicies, barterOfferFromPolicy, policyFromPartner } from './property-terms-core.mjs';
import { rankForOffer, buildDeal, confirmationMessage, waLink, DEAL_STAGES } from './local-barter-core.mjs';
import { recommendDeal, barterValue } from './rate-guide-core.mjs';
import { rateCreator, conversionHistory, igUsername } from './ig-rating-core.mjs';

const API = 'https://roamwise-api.founder-f53.workers.dev';

const $ = (s) => document.querySelector(s);
const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const S = { policies: [], partnerPolicies: [], override: [], creators: [], deals: {}, ready: false };
const db = () => { try { return firebase.firestore(); } catch (_) { return null; } };

function phoneFrom(app) {
  if (app.phone) return String(app.phone);
  const m = /WhatsApp:\s*([+\d][\d\s-]{8,})/.exec(String(app.note || ''));
  return m ? m[1] : '';
}

/* One creator in the shape rankForOffer expects. The rating folds in Instagram data (when the
   official API has been used), what RoamWise's ledger has verified, and past collaborations. */
export function creatorFromCrm(app, ledgerByEmail = {}) {
  const b = app.barter || {}, l = ledgerByEmail[String(app.email || '').trim().toLowerCase()] || {};
  const ig = b.instagram || null;
  const history = conversionHistory(b.deals || {}, l);
  const metrics = { ...(b.metrics || {}), ...(ig && ig.metrics ? ig.metrics : {}) };
  metrics.followers = Number(metrics.followers || (app.matchProfile && app.matchProfile.claimedFollowers) || 0);
  metrics.verifiedBookings = history.bookings;
  metrics.verifiedClicks = Number(l.verifiedClicks || 0);
  const rating = rateCreator({ metrics, signals: (ig && ig.signals) || {}, followers: metrics.followers, postsSampled: (ig && ig.postsSampled) || 0 }, history);
  return {
    id: app.id, name: app.name || app.email || 'Creator', handle: app.handle || '', phone: phoneFrom(app),
    location: b.location || { town: ((app.matchProfile && app.matchProfile.destinations) || [])[0] || '' },
    ask: b.ask || { guests: 2, food: 'all', cashMin: Number(app.creatorMinimum || 0) },
    metrics, rating, history, igRatedAt: ig && ig.ratedAt || '',
    niches: String(app.niche || '').split(',').map((x) => x.trim()).filter(Boolean),
    lastOfferAt: b.lastOfferAt || '', deals: b.deals || {},
  };
}

async function load() {
  const d = db(); if (!d) return;
  let override = [];
  try { const c = await d.collection('config').doc('creatorPolicies').get(); if (c.exists && Array.isArray((c.data() || {}).list)) override = c.data().list; } catch (_) {}
  S.override = override;
  /* Properties that opted in on the join form, with their own full terms. */
  try { const ps = await d.collection('partners').where('creatorMatching.enabled', '==', true).limit(200).get(); S.partnerPolicies = ps.docs.map((x) => policyFromPartner(x.id, x.data() || {})); } catch (_) { S.partnerPolicies = []; }
  S.policies = mergePolicies(mergePolicies(SEED_POLICIES, override), S.partnerPolicies).filter((p) => p.status === 'open');
  const [apps, earn] = await Promise.all([
    d.collection('crm').where('seg', '==', 'creator').limit(250).get(),
    d.collection('creatorEarnings').limit(250).get().catch(() => ({ docs: [] })),
  ]);
  const ledger = {};
  earn.docs.forEach((x) => { const v = x.data() || {}; if (v.email) ledger[String(v.email).toLowerCase()] = v; });
  S.creators = apps.docs.map((x) => creatorFromCrm({ id: x.id, ...x.data() }, ledger));
}

function offerFromForm() {
  const p = S.policies.find((x) => x.propertyId === $('#bdProperty').value);
  if (!p) return null;
  const base = barterOfferFromPolicy(p);
  base.offer = { ...base.offer, guests: Number($('#bdGuests').value), nights: Number($('#bdNights').value), food: $('#bdFood').value, travel: $('#bdTravel').value, cashMax: 0 };
  return base;
}

function recFor(r, offer) {
  return recommendDeal({ followers: r.source.metrics.followers, grade: r.quality.grade, pkg: offer.package, offer: offer.offer, roomRate: offer.roomRate, cashBudget: offer.cashBudget });
}
function row(r, offer, kind) {
  const rec = recFor(r, offer);
  const deal = buildDeal(offer, r, { recommendation: rec });
  S.deals[r.id] = deal;
  const prior = (r.source.deals || {})[deal.id] || {};
  const q = r.quality, p = r.proximity;
  const stage = prior.status || '';
  const confirm = stage === 'dates_locked' ? confirmationMessage(deal, prior) : '';
  return `<div class="ca-row"><div><h3>${esc(r.name)} <small>${esc(r.handle)}</small></h3>
    <p>${esc((r.town || 'location not set').replace(/\b[a-z]/g, (m) => m.toUpperCase()))} · ${p.km != null ? `~${p.roadKm} km by road · ` : ''}${esc(p.label)} · grade ${esc(q.grade)} (${q.score})${q.engagementPct ? ` · ${q.engagementPct}% ER` : ''}${r.source.metrics.followers ? ` · ${Number(r.source.metrics.followers).toLocaleString('en-IN')} followers` : ''}</p>
    <div class="ca-tags">${q.verified ? '<span class="ca-tag good">numbers verified</span>' : '<span class="ca-tag warn">self-reported</span>'}${q.flags.filter((f) => f !== 'self_reported').map((f) => `<span class="ca-tag warn">${esc(f.replace(/_/g, ' '))}</span>`).join('')}${r.terms.lines.filter((l) => l.status !== 'ok').map((l) => `<span class="ca-tag">${esc(l.text)}</span>`).join('')}${stage ? `<span class="ca-tag good">${esc(stage.replace(/_/g, ' '))}</span>` : ''}</div>
    <p class="bd-fair"><b>${esc({ barter: 'Barter as offered', hybrid: 'Barter + ₹' + rec.topUp.toLocaleString('en-IN') + ' top-up', lighter: 'Offer the lighter Story brief', negotiate: 'Needs a cash conversation' }[rec.verdict])}</b> · fair ₹${rec.fair.low.toLocaleString('en-IN')}–₹${rec.fair.high.toLocaleString('en-IN')} (${esc(rec.fair.tier)}) · ${offer.roomRate ? `stay worth ≈₹${rec.value.total.toLocaleString('en-IN')}${offer.roomRateMax > offer.roomRate ? ` (rooms ₹${offer.roomRate.toLocaleString('en-IN')}–₹${offer.roomRateMax.toLocaleString('en-IN')}; priced at the low end)` : ''}` : 'room rate not set, so the stay is unpriced'}${r.source.history && r.source.history.collabs ? ` · past: ${r.source.history.collabs} collab${r.source.history.collabs > 1 ? 's' : ''}, ${r.source.history.bookings} booking${r.source.history.bookings === 1 ? '' : 's'}${r.source.history.roi != null ? `, ${r.source.history.roi}× return` : ''}` : ''}</p></div>
    <div class="ca-actions">${deal.creatorWa ? `<a class="ca-action green" target="_blank" rel="noopener" href="${esc(deal.creatorWa)}" data-offered="${esc(r.id)}">WhatsApp creator</a>` : '<span class="ca-tag warn">no phone</span>'}${deal.propertyWa ? `<a class="ca-action secondary" target="_blank" rel="noopener" href="${esc(deal.propertyWa)}">WhatsApp property</a>` : ''}${deal.directions ? `<a class="ca-action secondary" target="_blank" rel="noopener" href="${esc(deal.directions)}">Route</a>` : ''}
    <select data-stage="${esc(r.id)}" aria-label="Deal stage"><option value="">Stage…</option>${DEAL_STAGES.map((s) => `<option value="${s}"${s === stage ? ' selected' : ''}>${s.replace(/_/g, ' ')}</option>`).join('')}</select>
    ${stage === 'dates_locked' ? `<input type="date" data-checkin="${esc(r.id)}" value="${esc(prior.checkIn || '')}"><a class="ca-action green" target="_blank" rel="noopener" href="${esc(waLink(r.phone, confirm))}">Confirm to creator</a><a class="ca-action green" target="_blank" rel="noopener" href="${esc(waLink(offer.whatsapp, confirm))}">Confirm to property</a>` : ''}
    ${!q.verified ? `<button class="ca-action secondary" data-verify="${esc(r.id)}">Numbers checked</button>` : ''}${igUsername(r.handle) ? `<button class="ca-action secondary" data-ig="${esc(r.id)}">${r.source.igRatedAt ? 'Re-rate' : 'Rate'} from Instagram</button>` : ''}</div></div>`;
}

function paint() {
  const host = $('#bdList'); if (!host) return;
  const offer = offerFromForm();
  if (!offer) { host.innerHTML = '<div class="ca-empty">No property is open to creators. Set one to open in config/creatorPolicies.</div>'; return; }
  const r = rankForOffer(offer, S.creators, { limit: Number($('#bdLimit').value) || 8 });
  const section = (title, list, kind, hint) => `<h3 class="bd-h">${title} <small>${list.length}</small></h3><p class="bd-hint">${hint}</p>${list.map((x) => row(x, offer, kind)).join('') || '<div class="ca-empty">Nobody here yet.</div>'}`;
  host.innerHTML = (r.active.length ? section('Deals in progress', r.active, 'active', 'Offered already. Move the stage along; at "dates locked" send the same confirmation to both sides.') : '')
    + section('Send the offer now', r.notify, 'notify', 'Nearest good creators whose ask the offer already covers. Each tap opens WhatsApp with the message filled in.')
    + section('Negotiate full terms', r.negotiate, 'negotiate', 'Further away, other states or countries, or asks the offer does not fully cover (travel, cash, food). The message lists what is left to agree.')
    + `<details><summary>Not offered (${r.skipped.length})</summary>${r.skipped.map((x) => `<div class="ca-row"><div><h3>${esc(x.name)}</h3><p>${esc(x.why)} · grade ${esc(x.quality.grade)} · ${esc(x.proximity.label)}</p></div></div>`).join('')}</details>`;
  host.querySelectorAll('[data-offered]').forEach((a) => a.addEventListener('click', () => record(a.dataset.offered, 'offered')));
  host.querySelectorAll('[data-stage]').forEach((s) => s.addEventListener('change', () => {
    if (!s.value) return;
    if (s.value !== 'closed') return record(s.dataset.stage, s.value);
    /* Closing a deal records what it produced: this is the conversion history future ratings use. */
    const bookings = Math.max(0, Math.round(Number(prompt('Guest bookings this creator brought (0 if none):', '0')) || 0));
    const bookingValue = Math.max(0, Math.round(Number(prompt('Total value of those bookings (₹):', '0')) || 0));
    record(s.dataset.stage, 'closed', { bookings, bookingValue, stayValue: barterValue(offer.offer, offer.roomRate).total });
  }));
  host.querySelectorAll('[data-ig]').forEach((b) => b.addEventListener('click', () => rateFromInstagram(b.dataset.ig, b)));
  host.querySelectorAll('[data-checkin]').forEach((i) => i.addEventListener('change', () => record(i.dataset.checkin, 'dates_locked', { checkIn: i.value, nights: offer.offer.nights })));
  host.querySelectorAll('[data-verify]').forEach((b) => b.addEventListener('click', () => verify(b.dataset.verify)));
}

async function record(id, status, extra = {}) {
  const d = db(), deal = S.deals[id]; if (!d || !deal) return;
  const at = new Date().toISOString(), patch = { 'barter.lastOfferAt': at };
  patch[`barter.deals.${deal.id}`] = { propertyId: deal.property.id, status, at, ...extra };
  try { await d.collection('crm').doc(id).update(patch); const c = S.creators.find((x) => x.id === id); if (c) { c.lastOfferAt = at; c.deals = { ...c.deals, [deal.id]: patch[`barter.deals.${deal.id}`] }; } paint(); } catch (e) { alert('Could not save the deal stage: ' + (e.message || e)); }
}
async function rateFromInstagram(id, btn) {
  const c = S.creators.find((x) => x.id === id), d = db(); if (!c || !d) return;
  const user = firebase.auth().currentUser; if (!user) return alert('Sign in again.');
  btn.disabled = true; btn.textContent = 'Rating…';
  try {
    const res = await fetch(API + '/admin/creator/ig-rating', { method: 'POST', headers: { authorization: 'Bearer ' + await user.getIdToken(), 'content-type': 'application/json' }, body: JSON.stringify({ username: c.handle, history: c.history }) });
    const out = await res.json().catch(() => ({}));
    if (res.status === 503) { alert('Instagram rating is not switched on yet. Until it is, ask the creator for an Insights screenshot, type the numbers in, and press "Numbers checked".'); return; }
    if (!res.ok || !out.analysis) { alert(out.error || ('Rating failed: HTTP ' + res.status)); return; }
    const a = out.analysis, ig = { metrics: a.metrics, signals: a.signals, postsSampled: a.postsSampled, ratedAt: new Date().toISOString(), grade: out.rating.grade, score: out.rating.score };
    await d.collection('crm').doc(id).update({ 'barter.instagram': ig });
    Object.assign(c, creatorFromCrm({ id, name: c.name, handle: c.handle, phone: c.phone, barter: { location: c.location, ask: c.ask, metrics: c.metrics, instagram: ig, deals: c.deals, lastOfferAt: c.lastOfferAt } }));
    paint();
  } catch (e) { alert('Rating failed: ' + (e.message || e)); } finally { btn.disabled = false; }
}
async function publishTerms(btn) {
  const d = db(); if (!d) return;
  const open = S.partnerPolicies.filter((p) => p.status === 'open');
  if (!open.length) return alert('No property has filled in full creator terms on the join form yet.');
  if (!confirm(`Show ${open.length} propert${open.length > 1 ? 'ies' : 'y'} and their own terms on the public creators page?`)) return;
  btn.disabled = true;
  try { await d.collection('config').doc('creatorPolicies').set({ list: mergePolicies(S.override, open), updatedAt: new Date().toISOString() }, { merge: true }); btn.textContent = 'Published ✓'; }
  catch (e) { alert('Could not publish: ' + (e.message || e)); btn.disabled = false; }
}
async function verify(id) {
  const d = db(); if (!d) return;
  try { await d.collection('crm').doc(id).update({ 'barter.metrics.metricsVerified': true, 'barter.metrics.verifiedAt': new Date().toISOString() }); const c = S.creators.find((x) => x.id === id); if (c) c.metrics.metricsVerified = true; paint(); } catch (e) { alert('Could not mark verified: ' + (e.message || e)); }
}

function mount() {
  const dash = $('#caDash'); if (!dash || dash.hidden || $('#bdPanel')) return false;
  const s = document.createElement('section');
  s.className = 'ca-panel'; s.id = 'bdPanel';
  s.innerHTML = `<style>.bd-form{display:flex;flex-wrap:wrap;gap:10px;margin:10px 0}.bd-form label{display:grid;gap:4px;font-size:12px}.bd-form select,.bd-form input,#bdList select,#bdList input{padding:8px;border-radius:10px;border:1px solid #3e3f58;background:#090a12;color:#fff}.bd-h{margin:18px 0 4px}#bdList .ca-actions{flex-wrap:wrap;align-items:center;max-width:620px;justify-content:flex-end}#bdList .ca-action{display:inline-flex;align-items:center;text-decoration:none;height:auto}#bdList .ca-row p{text-transform:none}.bd-hint{font-size:12px;opacity:.75;margin:0 0 8px}.bd-fair{font-size:12px;margin:8px 0 0;color:#cfe9d9}</style>
    <div class="ca-head"><div><small>LOCAL-FIRST BARTER DESK</small><h2>Who gets this offer</h2><p>Nearest creators with real engagement first, so a stay-and-food barter costs them nothing to accept. Far-off creators get a negotiation, not an auto-offer.</p></div><div><button class="ca-action secondary" id="bdPublish" title="Show join-form terms on the public creators page">Publish property terms</button> <button class="ca-action secondary" id="bdReload">↻</button></div></div>
    <div class="bd-form"><label>Property<select id="bdProperty"></select></label><label>Stay for<select id="bdGuests"><option value="2">2 guests</option><option value="1">1 guest</option></select></label><label>Nights<select id="bdNights"><option>1</option><option selected>2</option><option>3</option></select></label><label>Food<select id="bdFood"><option value="all">All meals</option><option value="breakfast">Breakfast</option><option value="none">No meals</option></select></label><label>Travel<select id="bdTravel"><option value="none">Creator's own</option><option value="pickup">Local pickup</option><option value="full">Covered</option></select></label><label>Show<select id="bdLimit"><option>8</option><option>15</option><option>30</option></select></label></div>
    <div id="bdList"><div class="ca-empty">Loading creators…</div></div>`;
  dash.appendChild(s);
  const sync = () => { const p = S.policies.find((x) => x.propertyId === $('#bdProperty').value); if (p) { $('#bdGuests').value = String(p.freeStay.guests); $('#bdNights').value = String(p.freeStay.nights || 1); $('#bdFood').value = p.freeStay.food; $('#bdTravel').value = p.freeStay.travel; } paint(); };
  const go = () => load().then(() => { $('#bdProperty').innerHTML = S.policies.map((p) => `<option value="${esc(p.propertyId)}">${esc(p.name)}${p.location.town ? ' · ' + esc(p.location.town) : ''}</option>`).join(''); sync(); }).catch((e) => { $('#bdList').innerHTML = `<div class="ca-error">${esc(e.message || e)}</div>`; });
  $('#bdProperty').onchange = sync;
  ['#bdGuests', '#bdNights', '#bdFood', '#bdTravel', '#bdLimit'].forEach((x) => { $(x).onchange = paint; });
  $('#bdReload').onclick = go;
  $('#bdPublish').onclick = (e) => publishTerms(e.currentTarget);
  go();
  return true;
}

if (typeof document !== 'undefined' && typeof firebase !== 'undefined') {
  const t = setInterval(() => { if (mount()) clearInterval(t); }, 1200);
}
