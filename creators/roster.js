/* creators/roster.js - "All creator applications" panel on the creator admin page.
   Shows EVERY crm creator application (not only the ones a single offer picks), each matched to every open property,
   with search, stage filter, one-tap WhatsApp, stage updates and a CSV export. It loads on its own and prints the
   real Firestore error if something is blocked, so an empty list is never a silent failure.
   Writes only crm/{id}.stage, which the Firestore rules already allow for the admin and the marketing role. */
import { SEED_POLICIES, mergePolicies, policyFromPartner } from './property-terms-core.mjs';
import { buildRoster, rosterCounts, creatorIntro, toCsv, STAGES, canSpotlight, spotlightEntry, withSpotlight, withoutSpotlight } from './roster-core.mjs';

const $ = (s) => document.querySelector(s);
const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const R = { rows: [], policies: [], filter: 'all', q: '', errors: [], spot: [] };
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
  return `<div class="ca-row"><div><h3>${esc(r.name)} <small>${r.handle ? `<a href="${esc(r.handle)}" target="_blank" rel="noopener">profile ↗</a>` : 'no link'}</small></h3>
    <p>${esc(((r.location && r.location.town) || 'location not set').replace(/\b[a-z]/g, (m) => m.toUpperCase()))} · ${esc(r.email || 'no email')} · ${esc(r.phone || 'no phone')} · ${esc((r.createdAt || '').slice(0, 10) || 'date unknown')}</p>
    ${r.niches.length ? `<p>${esc(r.niches.join(', '))}</p>` : ''}
    <div class="ca-tags">${r.flags.map((f) => `<span class="ca-tag warn">${esc(f)}</span>`).join('')}</div>
    ${b ? `<p><b>Best match: ${esc(b.name)}</b> · <span class="ca-tag ${v[1]}">${esc(v[0])}</span> · ${esc(b.proximity.label)}${b.proximity.km != null ? ` · ~${b.proximity.roadKm} km by road` : ''} · score ${b.score}${b.why.length ? ` · ${esc(b.why.join(', '))}` : ''}</p>${lines ? `<p class="bd-hint">To agree: ${lines}</p>` : ''}<div class="ca-tags">${others}</div>` : '<p class="bd-hint">No property is open to creators yet.</p>'}
    <div class="ca-actions">${wa ? `<a class="ca-action green" target="_blank" rel="noopener" href="${esc(wa)}">WhatsApp creator</a>` : '<span class="ca-tag warn">no phone: use email</span>'}
    ${spotBtn(r)}<select data-rs-stage="${esc(r.id)}" aria-label="Stage for ${esc(r.name)}">${STAGES.map((s) => `<option value="${s}"${s === r.stage ? ' selected' : ''}>${s}</option>`).join('')}</select></div></div></div>`;
}

function visible() {
  const q = R.q.toLowerCase();
  return R.rows.filter((r) => (R.filter === 'all' || (R.filter === 'review' ? r.flags.length : R.filter === 'send' ? r.best && r.best.verdict === 'send' : r.stage === R.filter))
    && (!q || [r.name, r.handle, r.email, r.phone, ((r.location && r.location.town) || '')].join(' ').toLowerCase().includes(q)));
}

function paint() {
  const host = $('#rsList'); if (!host) return;
  const c = rosterCounts(R.rows), rows = visible();
  $('#rsCounts').innerHTML = `<b>${c.total}</b> applications · <b>${c.send}</b> ready to offer · <b>${c.negotiate}</b> need a chat · <b>${c.no_match}</b> no match yet · <b>${c.needs_review}</b> need a check`;
  $('#rsErr').innerHTML = R.errors.map((e) => `<div class="ca-error">${esc(e)}</div>`).join('');
  host.innerHTML = rows.map(card).join('') || `<div class="ca-empty">${R.rows.length ? 'Nothing matches this filter.' : 'No creator applications were returned. If you expect some, read the message above; otherwise none have been saved.'}</div>`;
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
    <div id="rsErr"></div>
    <div class="ca-actions" style="margin:10px 0"><input id="rsSearch" type="search" placeholder="Search name, email, phone, town" aria-label="Search creators" style="min-width:220px;padding:9px 11px">
    <select id="rsFilter" aria-label="Filter"><option value="all">All</option><option value="send">Ready to offer</option><option value="review">Need a check</option>${STAGES.map((x) => `<option value="${x}">Stage: ${x}</option>`).join('')}</select></div>
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
