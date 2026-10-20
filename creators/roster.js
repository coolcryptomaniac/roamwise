/* creators/roster.js - "All creator applications" panel on the creator admin page.
   Shows EVERY crm creator application (not only the ones a single offer picks), each matched to every open property,
   with search, stage filter, one-tap WhatsApp, stage updates and a CSV export. It loads on its own and prints the
   real Firestore error if something is blocked, so an empty list is never a silent failure.
   Writes only crm/{id}.stage, which the Firestore rules already allow for the admin and the marketing role. */
import { SEED_POLICIES, mergePolicies, policyFromPartner } from './property-terms-core.mjs';
import { buildRoster, rosterCounts, creatorIntro, toCsv, STAGES, canSpotlight, spotlightEntry, withSpotlight, withoutSpotlight, travelAlerts, alertMessage, NICHE_NAMES, normalizeNeeds, TIER_INFO, TIERS } from './roster-core.mjs';
import { tripOf, photoOf } from './strict-match-core.mjs';

const $ = (s) => document.querySelector(s);
const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const R = { rows: [], policies: [], filter: 'all', q: '', errors: [], spot: [], override: [] };
const db = () => { try { return firebase.firestore(); } catch (_) { return null; } };
const VERDICT = { send: ['Send the offer', 'good'], negotiate: ['Needs a chat', 'warn'], no_fit: ['No fit right now', 'bad'] };

async function load() {
  const d = db(); R.errors = [];
  if (!d) { R.errors.push('Firestore is not available on this page.'); return; }
  let override = [], partners = [], apps = [];
  try { const c = await d.collection('config').doc('creatorPolicies').get(); if (c.exists && Array.isArray((c.data() || {}).list)) override = c.data().list; } catch (e) { R.errors.push('Property terms (config/creatorPolicies): ' + (e.code || e.message)); }
  try { const ps = await d.collection('partners').where('creatorMatching.enabled', '==', true).limit(200).get(); partners = ps.docs.map((x) => policyFromPartner(x.id, x.data() || {})); } catch (e) { R.errors.push('Partner terms: ' + (e.code || e.message)); }
  try { const a = await d.collection('crm').where('seg', '==', 'creator').limit(500).get(); apps = a.docs.map((x) => ({ id: x.id, ...x.data() })); } catch (e) { R.errors.push('Creator applications (crm): ' + (e.code || e.message) + '. Sign in with the founder account that has an admins/{uid} document.'); }
  try { const sp = await d.collection('config').doc('creatorSpotlight').get(); R.spot = sp.exists && Array.isArray((sp.data() || {}).list) ? sp.data().list : []; } catch (e) { R.spot = []; }
  R.override = override;
  R.policies = mergePolicies(mergePolicies(SEED_POLICIES, override), partners);
  R.rows = buildRoster(apps, R.policies);
}

function spotBtn(r) {
  const on = R.spot.some((x) => x && x.id === r.id), c = canSpotlight(r);
  if (on) return `<button class="ca-action secondary" type="button" data-rs-spot="off" data-id="${esc(r.id)}">Remove from home page</button>`;
  return c.ok ? `<button class="ca-action" type="button" data-rs-spot="on" data-id="${esc(r.id)}">Feature on home page</button>` : `<span class="ca-tag warn">not for home page: ${esc(c.why)}</span>`;
}

function card(r) {
  const b = r.best, v = b ? VERDICT[b.verdict] : null, pol = b && R.policies.find((p) => p.propertyId === b.propertyId);
  const wa = b ? creatorIntro(r, b, pol) : '';
  const others = r.matches.slice(1).map((m) => `<span class="ca-tag ${VERDICT[m.verdict][1]}">${esc(m.name)}: ${esc(VERDICT[m.verdict][0].toLowerCase())}</span>`).join('');
  const lines = b ? b.terms.lines.filter((l) => l.status !== 'ok').map((l) => esc(l.text)).join(' · ') : '';
  const av = r.photoUrl ? `<img class="rs-av" src="${esc(r.photoUrl)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : `<span class="rs-av rs-av0">${esc((r.name || '?').slice(0, 1).toUpperCase())}</span>`;
  const rt = r.rating, tierTag = `<span class="ca-tag ${rt.tier === 'summit' || rt.tier === 'ridge' ? 'good' : rt.tier === 'mirage' ? 'bad' : 'warn'}" title="${esc(rt.blurb)}">${rt.icon} ${esc(rt.name)}${rt.overridden ? ' · set by founder' : ''}</span>`;
  const ratingLine = `<p class="bd-hint">${esc(rt.evidence === 'checked' ? 'Numbers checked' : 'Numbers self-reported')}${rt.reasons.length ? ' · ' + esc(rt.reasons.join('; ')) : ''}. To move up: ${esc(rt.next)}</p>`;
  const tags = r.nicheTags.length ? r.nicheTags.map((n) => `<span class="ca-tag good">${esc(n)}</span>`).join('') : '<span class="ca-tag warn">content type not stated</span>';
  const bandLine = b ? `<p><span class="ca-tag ${b.band === 'local' ? 'good' : b.band === 'far' ? 'warn' : 'bad'}">${esc(b.bandLabel)}${b.proximity.km != null ? ' · ~' + Math.round(b.proximity.km) + ' km' : ''}</span> <span class="bd-hint">${esc(b.bandNote)}</span></p>` : '';
  const needLine = b && b.needs && b.needs.niches.length ? `<p class="bd-hint">${esc(b.name)} needs: ${esc(b.needs.niches.join(', '))}${b.needs.strict ? ' (strict)' : ''}${b.nicheMatched.length ? ' · this creator matches: ' + esc(b.nicheMatched.join(', ')) : ''}</p>` : '';
  const trip = r.trip ? `<p class="bd-hint">Trip: ${esc(r.trip.town)} ${esc(r.trip.from)} to ${esc(r.trip.to)}</p>` : '';
  return `<div class="ca-row rs-row">${av}<div><h3>${esc(r.name)} <small>${r.handle ? `<a href="${esc(r.handle)}" target="_blank" rel="noopener">profile ↗</a>` : 'no link'}</small></h3>
    <p>${esc(((r.location && r.location.town) || 'location not set').replace(/\b[a-z]/g, (m) => m.toUpperCase()))} · ${esc(r.email || 'no email')} · ${esc(r.phone || 'no phone')} · ${esc((r.createdAt || '').slice(0, 10) || 'date unknown')}</p>
    <div class="ca-tags">${tierTag}${tags}</div>${ratingLine}${bandLine}${needLine}${trip}
    <div class="ca-tags">${r.flags.map((f) => `<span class="ca-tag warn">${esc(f)}</span>`).join('')}</div>
    ${b ? `<p><b>Best match: ${esc(b.name)}</b> · <span class="ca-tag ${v[1]}">${esc(v[0])}</span> · ${esc(b.proximity.label)}${b.proximity.km != null ? ` · ~${b.proximity.roadKm} km by road` : ''} · score ${b.score}${b.why.length ? ` · ${esc(b.why.join(', '))}` : ''}</p>${lines ? `<p class="bd-hint">To agree: ${lines}</p>` : ''}<div class="ca-tags">${others}</div>` : '<p class="bd-hint">No property is open to creators yet.</p>'}
    <div class="ca-actions">${wa ? `<a class="ca-action green" target="_blank" rel="noopener" href="${esc(wa)}">WhatsApp creator</a>` : '<span class="ca-tag warn">no phone: use email</span>'}
    <button class="ca-action secondary" type="button" data-rs-edit="verify" data-id="${esc(r.id)}">${r.metrics.metricsVerified ? 'Numbers checked ✓' : 'Mark numbers checked'}</button><button class="ca-action secondary" type="button" data-rs-edit="tier" data-id="${esc(r.id)}">Set rating</button><button class="ca-action secondary" type="button" data-rs-edit="trip" data-id="${esc(r.id)}">${r.trip ? 'Change trip' : 'Add trip'}</button><button class="ca-action secondary" type="button" data-rs-edit="photo" data-id="${esc(r.id)}">${r.photoUrl ? 'Change photo link' : 'Add photo link'}</button>
    ${spotBtn(r)}<select data-rs-stage="${esc(r.id)}" aria-label="Stage for ${esc(r.name)}">${STAGES.map((s) => `<option value="${s}"${s === r.stage ? ' selected' : ''}>${s}</option>`).join('')}</select></div></div></div>`;
}

function visible() {
  const q = R.q.toLowerCase();
  return R.rows.filter((r) => (R.filter === 'all' || (R.filter === 'review' ? r.flags.length : R.filter.startsWith('tier:') ? r.rating.tier === R.filter.slice(5) : R.filter.startsWith('band:') ? r.best && r.best.band === R.filter.slice(5) : R.filter === 'fits' ? r.matches.some((m) => m.verdict !== 'no_fit') : R.filter === 'send' ? r.best && r.best.verdict === 'send' : r.stage === R.filter))
    && (!q || [r.name, r.handle, r.email, r.phone, ((r.location && r.location.town) || '')].join(' ').toLowerCase().includes(q)));
}

function paint() {
  const host = $('#rsList'); if (!host) return;
  const c = rosterCounts(R.rows), rows = visible();
  $('#rsCounts').innerHTML = `<b>${c.total}</b> applications · <b>${c.send}</b> ready to offer · <b>${c.negotiate}</b> need a chat · <b>${c.no_match}</b> no match yet · <b>${c.needs_review}</b> need a check`;
  const today = new Date(Date.now() + 5.5 * 3600000).toISOString().slice(0, 10), al = travelAlerts(R.rows, R.policies, today);
  $('#rsAlerts').innerHTML = al.length ? `<div class="rs-alerts"><b>Travelling near an opportunity (${al.length})</b>${al.map((a) => {
    const r = R.rows.find((x) => x.id === a.creatorId), link = r && r.phone ? 'https://wa.me/' + String(r.phone).replace(/\D/g, '') + '?text=' + encodeURIComponent(alertMessage(a, (a.creator || '').split(' ')[0])) : '';
    return `<div class="rs-al"><span>${esc(a.creator)} will be near ${esc(a.tripTown)} (${esc(a.from)} to ${esc(a.to)}), ${a.km} km from <b>${esc(a.property)}</b>${a.near ? ' · right there' : ''}</span>${link ? `<a class="ca-action green" target="_blank" rel="noopener" href="${esc(link)}">WhatsApp alert</a>` : '<span class="ca-tag warn">no phone</span>'}</div>`;
  }).join('')}</div>` : '';
  $('#rsNeeds').innerHTML = `<details class="rs-needs"><summary>What each property needs (content type)</summary>${R.policies.filter((p) => p.status === 'open').map((p) => `<div class="rs-need"><b>${esc(p.name)}</b>
    <input data-rs-need="${esc(p.propertyId)}" value="${esc(p.needs.niches.join(', '))}" placeholder="${esc(NICHE_NAMES.join(', '))}" aria-label="Content needed by ${esc(p.name)}">
    <label><input type="checkbox" data-rs-strict="${esc(p.propertyId)}"${p.needs.strict ? ' checked' : ''}> only these</label>
    <button class="ca-action" type="button" data-rs-saveneed="${esc(p.propertyId)}">Save</button></div>`).join('') || '<p class="bd-hint">No property is open to creators.</p>'}</details>`;
  $('#rsErr').innerHTML = R.errors.map((e) => `<div class="ca-error">${esc(e)}</div>`).join('');
  host.innerHTML = rows.map(card).join('') || `<div class="ca-empty">${R.rows.length ? 'Nothing matches this filter.' : 'No creator applications were returned. If you expect some, read the message above; otherwise none have been saved.'}</div>`;
  document.querySelectorAll('[data-rs-saveneed]').forEach((b) => b.addEventListener('click', async () => {
    const id = b.dataset.rsSaveneed, d = db(), cur = R.policies.find((p) => p.propertyId === id); if (!d || !cur) return;
    const q = (a) => document.querySelector('[' + a + '="' + id + '"]');
    const needs = normalizeNeeds({ niches: q('data-rs-need').value.split(/[,\s]+/).filter(Boolean), strict: q('data-rs-strict').checked });
    const list = [{ ...cur, needs }, ...R.override.filter((o) => o && o.propertyId !== id)];
    try { await d.collection('config').doc('creatorPolicies').set({ list, updatedAt: new Date().toISOString() }); R.override = list; await load(); paint(); }
    catch (e) { alert('Could not save: ' + (e.code || e.message) + '. Only the founder/admin account can do this.'); }
  }));
  host.querySelectorAll('[data-rs-edit]').forEach((b) => b.addEventListener('click', async () => {
    const d = db(), r = R.rows.find((x) => x.id === b.dataset.id); if (!d || !r) return;
    let patch;
    if (b.dataset.rsEdit === 'verify') { if (!confirm('Mark ' + r.name + "'s Insights numbers as checked by you? Only do this after seeing their real Insights screenshots.")) return; patch = { 'barter.metrics.metricsVerified': !r.metrics.metricsVerified }; }
    else if (b.dataset.rsEdit === 'tier') { const v = prompt('Set rating: ' + TIERS.join(', ') + ' (blank to use the automatic rating):', r.tierOverride || ''); if (v == null) return; const t = v.trim().toLowerCase(); if (t && !TIERS.includes(t)) { alert('Pick one of: ' + TIERS.join(', ')); return; } patch = { tierOverride: t }; }
    else if (b.dataset.rsEdit === 'photo') { const u = prompt('Public photo link (https image link the creator gave you):', r.photoUrl || ''); if (u == null) return; if (u && !photoOf({ photoUrl: u })) { alert('That is not a valid https link.'); return; } patch = { 'barter.photoUrl': u.trim() }; }
    else { const t = prompt('Trip town (blank to clear):', r.trip ? r.trip.town : ''); if (t == null) return; if (!t.trim()) patch = { 'barter.trip': null }; else { const f = prompt('From date YYYY-MM-DD:', r.trip ? r.trip.from : ''), to = prompt('To date YYYY-MM-DD:', r.trip ? r.trip.to : ''); const trip = tripOf({ trip: { town: t, from: f || to, to } }); if (!trip) { alert('Trip needs a town and an end date like 2026-11-05.'); return; } patch = { 'barter.trip': trip }; } }
    try { await d.collection('crm').doc(r.id).update(patch); await load(); paint(); }
    catch (e) { alert('Could not save: ' + (e.code || e.message) + '. Only the founder/admin account can do this.'); }
  }));
  host.querySelectorAll('[data-rs-spot]').forEach((b) => b.addEventListener('click', async () => {
    const d = db(), r = R.rows.find((x) => x.id === b.dataset.id); if (!d || !r) return;
    const next = b.dataset.rsSpot === 'on' ? withSpotlight(R.spot, spotlightEntry(r)) : withoutSpotlight(R.spot, r.id);
    if (b.dataset.rsSpot === 'on' && !confirm('Show ' + r.name + ' (public Instagram link and best-match property only, no phone or email) on the RoamWise home page?')) return;
    try { await d.collection('config').doc('creatorSpotlight').set({ list: next, updatedAt: new Date().toISOString() }); R.spot = next; paint(); }
    catch (e) { alert('Could not save: ' + (e.code || e.message) + '. Only the founder/admin account can do this.'); }
  }));
  host.querySelectorAll('[data-rs-stage]').forEach((s) => s.addEventListener('change', async () => {
    const id = s.dataset.rsStage, d = db(); if (!d) return;
    try { await d.collection('crm').doc(id).update({ stage: s.value }); const r = R.rows.find((x) => x.id === id); if (r) r.stage = s.value; paint(); }
    catch (e) { alert('Could not save the stage: ' + (e.code || e.message)); }
  }));
}

function mount() {
  const dash = $('#caDash'); if (!dash || dash.hidden || $('#rsPanel')) return !!$('#rsPanel');
  const s = document.createElement('section'); s.className = 'ca-panel'; s.id = 'rsPanel';
  s.innerHTML = `<div class="ca-head"><div><small>ALL APPLICATIONS</small><h2>Creator roster</h2><p id="rsCounts">Loading…</p></div>
    <div class="ca-actions"><button class="ca-action secondary" id="rsReload" type="button">↻ Reload</button><button class="ca-action secondary" id="rsCsv" type="button">Download CSV</button></div></div>
    <div id="rsErr"></div><div id="rsAlerts"></div><div id="rsNeeds"></div>
    <div class="ca-actions" style="margin:10px 0"><input id="rsSearch" type="search" placeholder="Search name, email, phone, town" aria-label="Search creators" style="min-width:220px;padding:9px 11px">
    <select id="rsFilter" aria-label="Filter"><option value="all">All</option><option value="send">Ready to offer</option><option value="review">Need a check</option><option value="band:local">Local (up to 150 km)</option><option value="band:far">Far (150 to 500 km)</option><option value="band:very_far">Very far (over 500 km)</option><option value="fits">Fits a property's needs</option>${TIERS.slice().reverse().map((t) => `<option value="tier:${t}">Rating: ${TIER_INFO[t].name}</option>`).join('')}${STAGES.map((x) => `<option value="${x}">Stage: ${x}</option>`).join('')}</select></div>
    <div id="rsList"><div class="ca-empty">Loading creators…</div></div>`;
  const first = dash.querySelector('.ca-panel, section'); dash.insertBefore(s, first && first.nextSibling ? first.nextSibling : null);
  const go = () => load().then(paint).catch((e) => { R.errors.push(String(e && (e.code || e.message) || e)); paint(); });
  $('#rsReload').onclick = go;
  $('#rsSearch').oninput = (e) => { R.q = e.target.value; paint(); };
  $('#rsFilter').onchange = (e) => { R.filter = e.target.value; paint(); };
  $('#rsCsv').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([toCsv(R.rows)], { type: 'text/csv' })); a.download = 'roamwise-creators.csv'; a.click(); };
  go();
  return true;
}

if (typeof document !== 'undefined' && typeof firebase !== 'undefined') {
  const t = setInterval(() => { if (mount()) clearInterval(t); }, 1200);
}
