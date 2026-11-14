/* admin/people/people.js — People Hub: creators, artists and property partners in one sheet.
   Logic lives in people-core.mjs (tested). Founder/admin only (admins/{uid}), same as hub.js.
   Contact buttons open the phone, WhatsApp or mail app with a RoamWise-branded message and
   stamp lastContactAt on the CRM record. Nothing is sent automatically from this page. */
import { SEED_POLICIES, mergePolicies, policyFromPartner } from '../../creators/property-terms-core.mjs';
import { buildRoster } from '../../creators/roster-core.mjs';
import { TYPES, STAGES, PERFECT_SCORE, fromCreatorRow, fromPartner, fromCrmLead, fromArtist, mergePeople, peopleKpis, toCsv, phoneKey, messageTier } from './people-core.mjs';

const CFG = { apiKey: 'AIzaSyDlrtpzpOb1VEmVSd9tHmu7OpmvwWosYsU', authDomain: 'roamwisepro.firebaseapp.com', projectId: 'roamwisepro', storageBucket: 'roamwisepro.firebasestorage.app', messagingSenderId: '299014744987', appId: '1:299014744987:web:d5c316743e6d7a10904f3e' };
const $ = (q) => document.querySelector(q);
const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = (n) => Number(n || 0).toLocaleString('en-IN');
const inr = (n) => '₹' + num(Math.round(n));
const DEMO = new URLSearchParams(location.search).has('demo');
const S = { people: [], raw: 0, kpis: null, errors: [], tab: 'sheet', q: '', type: 'all', stage: 'all', focus: 'all', outbox: [], db: null };

/* ---------- data ---------- */
function demo(){
  const rows = [
    { id: 'd1', name: 'Asha (sample)', email: 'asha@example.com', phone: '+91 90000 00001', handle: 'https://www.instagram.com/asha.sample', location: { town: 'nainital' }, niches: ['travel', 'food'], stage: 'new', flags: [], metrics: { metricsVerified: true }, best: { name: 'Sample Cottage', verdict: 'send', score: 91 } },
    { id: 'd2', name: 'Asha S (sample)', email: 'ASHA@example.com', location: { town: '' }, niches: ['food'], stage: 'contacted', flags: [], metrics: {} },
    { id: 'd3', name: 'Ravi (sample)', email: 'ravi@example.com', location: { town: '' }, niches: ['trek'], stage: 'new', flags: ['no phone / WhatsApp'], metrics: {}, best: { name: 'Sample Camp', verdict: 'negotiate', score: 58 } },
  ];
  const list = rows.map(fromCreatorRow).concat([fromPartner({ id: 'p', name: 'Sample Cottage', email: 'stay@example.com', city: 'nainital', status: 'live' }), fromArtist({ id: 'a', name: 'Sample Artist', instagram: 'https://www.instagram.com/sample.art', themes: ['aipan'] })]);
  S.raw = list.length; S.people = mergePeople(list);
}

async function load(){
  firebase.apps.length || firebase.initializeApp(CFG);
  const db = S.db = firebase.firestore(); S.errors = [];
  const safe = async (label, fn) => { try { return await fn(); } catch (e) { S.errors.push(label + ': ' + (e.code || e.message)); return null; } };
  const [apps, leads, parts, pol, artists] = await Promise.all([
    safe('Creator applications', () => db.collection('crm').where('seg', '==', 'creator').limit(500).get()),
    safe('Property and other leads', () => db.collection('crm').where('seg', 'in', ['property', 'trek-company', 'yogapreneur']).limit(1000).get()),
    safe('Property partners', () => db.collection('partners').limit(500).get()),
    safe('Property terms', () => db.collection('config').doc('creatorPolicies').get()),
    safe('Artists', async () => { const r = await fetch('../../creators/artists-data.json', { cache: 'no-store' }); if (!r.ok) throw Error('HTTP ' + r.status); return r.json(); }),
  ]);
  const docs = (q) => (q ? q.docs.map((d) => ({ id: d.id, ...d.data() })) : []);
  const partners = docs(parts);
  const override = pol && pol.exists && Array.isArray((pol.data() || {}).list) ? pol.data().list : [];
  const policies = mergePolicies(mergePolicies(SEED_POLICIES, override), partners.filter((p) => p.creatorMatching && p.creatorMatching.enabled).map((p) => policyFromPartner(p.id, p)));
  const list = buildRoster(docs(apps), policies).map(fromCreatorRow)
    .concat(partners.map(fromPartner), docs(leads).map(fromCrmLead).filter(Boolean), ((artists && artists.artists) || []).map(fromArtist));
  S.raw = list.length; S.people = mergePeople(list);
  S.outbox = []; /* filled by the auto-inform engine (next PR, with its admin-read Firestore rule) */
}

/* ---------- actions ---------- */
const first = (p) => String(p.name || '').split(/\s+/)[0] || 'there';
function message(p){
  const hi = 'Hi ' + first(p) + ', Mohit here from RoamWise (roamwise.co.in).';
  if (p.bestMatch && p.bestMatch.verdict === 'send') return hi + ' We have a stay collaboration at ' + p.bestMatch.name + ' that fits your content. Can I share the details?';
  if (!p.town) return hi + ' Thanks for joining us! Which town are you based in? We match partners nearby first.';
  if (p.types.includes('property')) return hi + ' Quick check-in on your listing: anything you need from us this week?';
  return hi + ' Thanks for being part of the RoamWise network. Are you travelling anywhere in the next few weeks? We can line up stays and collaborations on your route.';
}
async function stamp(p, patch){
  if (DEMO || !S.db) return;
  const ids = p.sources.filter((x) => /^(creator|lead|trek|yoga):/.test(x)).map((x) => x.split(':')[1]);
  await Promise.all(ids.map((id) => S.db.collection('crm').doc(id).update(patch).catch((e) => S.errors.push('Save ' + id + ': ' + (e.code || e.message)))));
}
window.ppContact = async (i, how) => {
  const p = S.view[i]; if (!p) return;
  const text = message(p), ph = phoneKey(p.phone);
  const url = how === 'call' ? 'tel:+91' + ph
    : how === 'wa' ? 'https://wa.me/91' + ph + '?text=' + encodeURIComponent(text)
    : 'mailto:' + encodeURIComponent(p.email) + '?subject=' + encodeURIComponent('RoamWise: ' + (p.bestMatch && p.bestMatch.verdict === 'send' ? 'a stay collaboration for you' : 'checking in')) + '&body=' + encodeURIComponent(text + '\n\nRegards,\nMohit Pandey\nFounder, RoamWise\nroamwise.co.in');
  const at = new Date().toISOString();
  stamp(p, { lastContactAt: at, ...(p.stage === 'new' ? { stage: 'contacted' } : {}) });
  p.lastContactAt = at; if (p.stage === 'new') p.stage = 'contacted';
  window.open(url, how === 'call' ? '_self' : '_blank', 'noopener');
};
window.ppStage = async (i, stage) => { const p = S.view[i]; if (!p || !STAGES.includes(stage)) return; p.stage = stage; await stamp(p, { stage }); render(); };

async function askTusk(){
  const out = $('#pAskOut'); out.hidden = false; out.textContent = 'Asking Tusk…';
  const k = S.kpis; /* aggregates only: no names, emails or phone numbers leave this page */
  const prompt = 'You are helping the founder of RoamWise (travel startup) run his partner network. Numbers: ' + JSON.stringify({ people: k.people, merged: k.merged, types: k.types, funnel: k.funnel, reachable: k.reachable, optedIn: k.optedIn, verified: k.verified, missingTown: k.missingTown, readyOffers: k.readyOffers, avgCompleteness: k.avgCompleteness }) + '. Give the 3 highest-impact actions for this week, one line each, most important first.';
  if (DEMO) { out.textContent = '1. Send the ready offers today.\n2. Ask everyone without a town for it.\n3. Verify Instagram numbers for the top 10.'; return; }
  try {
    const tok = await firebase.auth().currentUser.getIdToken();
    const r = await fetch('https://roamwise-api.founder-f53.workers.dev/ai', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + tok }, body: JSON.stringify({ prompt, expanded: true }) });
    const j = await r.json(); out.textContent = j.text || j.message || 'Tusk is not available right now.';
  } catch (e) { out.textContent = 'Tusk is not available right now.'; }
}

/* ---------- views ---------- */
function filtered(){
  const q = S.q.toLowerCase();
  return S.people.filter((p) => (S.type === 'all' || p.types.includes(S.type)) && (S.stage === 'all' || p.stage === S.stage)
    && (S.focus === 'all' || (S.focus === 'ready' && p.bestMatch && p.bestMatch.verdict === 'send') || (S.focus === 'fix' && p.flags.length) || (S.focus === 'nocontact' && !p.email && !phoneKey(p.phone)) || (S.focus === 'stale' && (!p.lastContactAt || Date.now() - Date.parse(p.lastContactAt) > 21 * 864e5)))
    && (!q || [p.name, p.email, p.town, p.state, p.instagram, p.niches.join(' ')].join(' ').toLowerCase().includes(q)));
}
const chip = (key, val, label) => `<button class="pp-chip" aria-pressed="${S[key] === val}" onclick="ppSet('${key}','${val}')">${esc(label)}</button>`;
window.ppSet = (k, v) => { S[k] = v; render(); };

function card(p, i){
  const ph = phoneKey(p.phone), perfect = p.bestMatch && p.bestMatch.score >= PERFECT_SCORE && p.bestMatch.verdict === 'send';
  return `<article class="pp-card${perfect ? ' pp-perfect' : ''}">
    <div class="pp-top"><div><div class="pp-name">${esc(p.name)}</div>
      <div class="pp-sub">${esc([p.town || 'Town not set', p.state].filter(Boolean).join(', '))}${p.lastContactAt ? ' · contacted ' + esc(p.lastContactAt.slice(0, 10)) : ''}</div></div>
      <div class="pp-next">${esc(p.nextAction)}</div></div>
    <div class="pp-tags">${p.types.map((t) => `<span class="pp-tag t-${t}">${esc(TYPES[t] || t)}</span>`).join('')}${p.verified ? '<span class="pp-tag">verified</span>' : ''}${p.niches.slice(0, 3).map((n) => `<span class="pp-tag">${esc(n)}</span>`).join('')}${p.flags.slice(0, 3).map((f) => `<span class="pp-tag warn">${esc(f)}</span>`).join('')}</div>
    ${p.bestMatch ? `<div class="pp-sub">Best match: <b>${esc(p.bestMatch.name)}</b> · ${esc(p.bestMatch.verdict === 'send' ? 'ready to offer' : 'needs a chat')} · score ${esc(p.bestMatch.score)}${perfect ? ' · perfect' : ''}</div>` : ''}
    <div class="pp-meter" title="Profile ${p.completeness}% complete"><u style="width:${p.completeness}%"></u></div>
    <div class="pp-acts">
      ${ph ? `<button onclick="ppContact(${i},'call')">Call</button><button class="wa" onclick="ppContact(${i},'wa')">WhatsApp</button>` : ''}
      ${p.email ? `<button onclick="ppContact(${i},'mail')">Email</button>` : ''}
      ${p.instagram ? `<a href="https://www.instagram.com/${esc(p.instagram)}/" target="_blank" rel="noopener">Instagram</a>` : p.profileUrl ? `<a href="${esc(p.profileUrl)}" target="_blank" rel="noopener">Profile</a>` : ''}
      ${p.sources.some((x) => /^(creator|lead|trek|yoga):/.test(x)) ? `<select aria-label="Stage" onchange="ppStage(${i},this.value)">${STAGES.map((s) => `<option${s === p.stage ? ' selected' : ''}>${s}</option>`).join('')}</select>` : `<span class="pp-tag">${esc(p.stage)}</span>`}
    </div></article>`;
}

function sheet(){
  S.view = filtered();
  return `<div class="pp-bar"><input placeholder="Search name, town, niche, email" value="${esc(S.q)}" oninput="ppSet('q',this.value)">
    <select onchange="ppSet('stage',this.value)"><option value="all">All stages</option>${STAGES.map((s) => `<option${S.stage === s ? ' selected' : ''}>${s}</option>`).join('')}</select></div>
    <div class="pp-chips">${chip('type', 'all', 'Everyone')}${Object.keys(TYPES).filter((t) => S.kpis.types[t]).map((t) => chip('type', t, TYPES[t] + ' ' + S.kpis.types[t])).join('')}</div>
    <div class="pp-chips">${chip('focus', 'all', 'All')}${chip('focus', 'ready', 'Ready to offer')}${chip('focus', 'fix', 'Needs fixing')}${chip('focus', 'stale', 'Not contacted 3+ weeks')}${chip('focus', 'nocontact', 'No contact')}</div>
    <p class="pp-note">${num(S.view.length)} shown · ${num(S.kpis.people)} people from ${num(S.kpis.records)} records (${num(S.kpis.merged)} duplicates merged).</p>
    <div class="pp-list">${S.view.map(card).join('') || '<div class="pp-empty">Nobody matches these filters.</div>'}</div>`;
}

function matches(){
  S.view = S.people.filter((p) => p.bestMatch).sort((a, b) => b.bestMatch.score - a.bestMatch.score);
  return `<p class="pp-note">Best property for each creator from the strict matcher (niche, distance, terms, rating). Gold border = perfect match (score ${PERFECT_SCORE}+ and ready): these will auto-inform first once the outbox engine is on.</p>
    <div class="pp-list">${S.view.map(card).join('') || '<div class="pp-empty">No matches yet. Open more property offers in Creator admin, or ask creators for their home town.</div>'}</div>`;
}

const kpi = (v, l, sub) => `<div class="hb-kpi"><b>${esc(v)}</b><span>${esc(l)}</span>${sub ? `<small>${esc(sub)}</small>` : ''}</div>`;
const bars = (items) => { const max = Math.max(1, ...items.map((i) => i[1])); return '<div class="hb-bars">' + items.map(([l, v]) => `<div class="hb-bar"><span>${esc(l)}</span><i><u style="width:${Math.round(v / max * 100)}%"></u></i><em>${num(v)}</em></div>`).join('') + '</div>'; };
function kpis(){
  const k = S.kpis;
  const towns = {}; S.people.forEach((p) => { if (p.town) towns[p.town] = (towns[p.town] || 0) + 1; });
  return `<div class="hb-kpis">${kpi(num(k.people), 'People', num(k.merged) + ' duplicates merged')}${kpi(num(k.reachable), 'Reachable', 'email or phone')}${kpi(num(k.optedIn), 'Opted in to contact')}${kpi(num(k.verified), 'Verified')}${kpi(num(k.active), 'Active')}${kpi(num(k.readyOffers), 'Offers ready to send')}${kpi(k.avgCompleteness + '%', 'Avg profile complete')}${kpi(num(k.missingTown), 'Missing town')}</div>
    <h2>Pipeline</h2>${bars(k.funnel)}
    <h2>By type</h2>${bars(Object.entries(k.types).map(([t, n]) => [TYPES[t] || t, n]))}
    <h2>Top towns</h2>${bars(Object.entries(towns).sort((a, b) => b[1] - a[1]).slice(0, 8))}
    <h2>Network data worth</h2><div class="hb-kpis">${kpi(inr(k.dataWorth), 'Estimated replacement cost')}</div><p class="pp-note">${esc(k.worthNote)}</p>`;
}

function outbox(){
  const tiers = { perfect: 0, routine: 0, review: 0, skip: 0 };
  S.people.forEach((p) => { if (p.bestMatch) tiers[messageTier(p, { kind: 'match', score: p.bestMatch.score, verdict: p.bestMatch.verdict })]++; });
  const rows = S.outbox.map((m) => `<div class="pp-card"><div class="pp-top"><div><div class="pp-name">${esc(m.subject || m.kind || 'Message')}</div><div class="pp-sub">${esc(m.toName || '')} · ${esc(m.channel || 'email')} · ${esc(String(m.createdAt || '').slice(0, 16))}</div></div><div class="pp-next">${esc(m.status || '')}</div></div></div>`).join('');
  return `<p class="pp-note">Auto-inform rules: people who opted in get <b>perfect</b> matches straight away (even past the daily cap), <b>routine</b> updates within the daily cap, and anything about money, refunds, payouts, contracts or disputes waits here as a <b>draft for you</b>. Every message is RoamWise-branded HTML.</p>
    <div class="hb-kpis">${kpi(tiers.perfect, 'Perfect: send now')}${kpi(tiers.routine, 'Routine: within cap')}${kpi(tiers.review, 'Drafts for you')}${kpi(tiers.skip, 'Skipped: no consent or contact')}</div>
    <h2>Recent messages</h2><div class="pp-list">${rows || '<div class="pp-empty">The sending engine comes in the next update; messages will appear here.</div>'}</div>`;
}

const VIEWS = { sheet, matches, kpis, outbox };
function render(){
  S.kpis = peopleKpis(S.people, S.raw);
  $('#pErrors').innerHTML = S.errors.map((e) => `<div class="hb-err">${esc(e)}</div>`).join('');
  document.querySelectorAll('#pNav a').forEach((a) => a.classList.toggle('on', a.dataset.tab === S.tab));
  Object.keys(VIEWS).forEach((t) => { $('#tab-' + t).hidden = t !== S.tab; });
  const keep = document.activeElement && document.activeElement.tagName === 'INPUT' ? document.activeElement.selectionStart : null;
  $('#tab-' + S.tab).innerHTML = VIEWS[S.tab]();
  if (keep != null) { const inp = $('#tab-' + S.tab + ' input'); if (inp) { inp.focus(); inp.setSelectionRange(keep, keep); } }
  $('#pStamp').textContent = 'Updated ' + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}
async function enter(){
  $('#pAuth').hidden = true; $('#pApp').hidden = false; $('#pDemo').hidden = !DEMO;
  if (!DEMO) await load();
  S.tab = (location.hash || '#sheet').slice(1); if (!VIEWS[S.tab]) S.tab = 'sheet';
  render();
}
window.addEventListener('hashchange', () => { const t = location.hash.slice(1); if (VIEWS[t]) { S.tab = t; render(); } });
$('#pRefresh').addEventListener('click', async () => { if (!DEMO) await load(); render(); });
$('#pAsk').addEventListener('click', askTusk);
$('#pCsv').addEventListener('click', () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([toCsv(filtered())], { type: 'text/csv' })); a.download = 'roamwise-people-' + new Date().toISOString().slice(0, 10) + '.csv'; a.click(); });

if (DEMO) { demo(); enter(); }
else {
  firebase.apps.length || firebase.initializeApp(CFG);
  const auth = firebase.auth(), db = firebase.firestore();
  const isAdmin = async (u) => { try { return !!u && u.emailVerified && (await db.collection('admins').doc(u.uid).get()).exists; } catch (_) { return false; } };
  auth.onAuthStateChanged(async (u) => {
    if (u && await isAdmin(u)) return enter();
    $('#pApp').hidden = true; $('#pAuth').hidden = false;
    if (u) { $('#pAuthMsg').textContent = 'This account is not a founder/admin account.'; auth.signOut(); }
  });
  $('#pLogin').addEventListener('submit', async (e) => {
    e.preventDefault(); $('#pAuthMsg').textContent = '';
    try { await auth.signInWithEmailAndPassword($('#pEmail').value.trim(), $('#pPass').value); } catch (err) { $('#pAuthMsg').textContent = 'Sign-in failed: ' + (err.code || err.message); }
  });
  $('#pOut').addEventListener('click', () => auth.signOut());
}
