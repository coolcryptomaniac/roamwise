/* admin/hub.js - founder dashboard: creators, properties, sales and quick links on one page.
   Read-only. Sign-in uses the same Firebase project and admins/{uid} check as creators/admin.js.
   ?demo=1 shows clearly-labelled sample data so the layout can be seen without signing in. */
import { SEED_POLICIES, mergePolicies, policyFromPartner } from '../creators/property-terms-core.mjs';
import { buildRoster, rosterCounts, STAGES, TIER_INFO } from '../creators/roster-core.mjs';

const CFG = { apiKey: 'AIzaSyDlrtpzpOb1VEmVSd9tHmu7OpmvwWosYsU', authDomain: 'roamwisepro.firebaseapp.com', projectId: 'roamwisepro', storageBucket: 'roamwisepro.firebasestorage.app', messagingSenderId: '299014744987', appId: '1:299014744987:web:d5c316743e6d7a10904f3e' };
const $ = (s) => document.querySelector(s);
const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const inr = (n) => '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN');
const num = (n) => Number(n || 0).toLocaleString('en-IN');
const DEMO = new URLSearchParams(location.search).has('demo');
const TABS = { overview: 'Overview', creators: 'Creators', properties: 'Properties', sales: 'Sales', links: 'Quick links' };
const LINKS = [
  ['Admin console', 'Bookings, partners, payments and settings', '/admin/'],
  ['Creator network admin', 'Applications, activation, payouts', '/creators/admin.html'],
  ['Creator matches', 'Public matching desk', '/creators/match.html'],
  ['Finance desk', 'Costs, tax and 10-year model', '/admin/finance-desk/'],
  ['Finance operations', 'Daily money checks', '/admin/finance-ops.html'],
  ['Invoices', 'Partner commission invoices', '/admin/invoices.html'],
  ['Tax', 'GST and compliance', '/admin/tax.html'],
  ['Opportunity radar', 'Weekly opportunities', '/admin/opportunity-radar.html'],
  ['Team board', 'Staff and tasks', '/staff/'],
  ['Partner sign-up', 'What hotels see', '/partner/join/'],
  ['Local business intake', 'Cafes, shops, restaurants', '/local-business/'],
  ['Public site', 'roamwise.co.in', '/'],
];
const S = { apps: [], accounts: [], policies: SEED_POLICIES, partners: [], bookings: [], rows: [], errors: [], stage: 'all', q: '', tab: 'overview' };

function demoData() {
  const n = (i) => ['Sample Aanya', 'Sample Kabir', 'Sample Meera', 'Sample Rohan', 'Sample Ira', 'Sample Dev', 'Sample Tara', 'Sample Veer'][i];
  S.apps = Array.from({ length: 8 }, (_, i) => ({ id: 'd' + i, name: n(i), email: 'sample' + i + '@example.com', handle: 'https://www.instagram.com/sample' + i + '/', stage: STAGES[i % STAGES.length], niche: i % 2 ? 'travel,mountains' : 'food,cafe', phone: '+91 90000 0000' + i, createdAt: '2026-10-' + String(10 + i), barter: { location: { town: i % 3 ? 'Almora' : 'Delhi' }, metrics: { followers: 4000 + i * 3100 } } }));
  S.accounts = S.apps.slice(0, 5).map((a) => ({ id: a.id }));
  const m = ['2026-07', '2026-08', '2026-09', '2026-10'];
  S.bookings = Array.from({ length: 14 }, (_, i) => ({ id: 'b' + i, ref: 'RW-' + (1000 + i), property: ['Big Bro Hotel', 'Milan Heights', 'Corbett Jungle View'][i % 3], amount: 1800 + (i % 5) * 1100, status: i % 6 === 5 ? 'pending' : 'completed', completedAt: m[i % 4] + '-15T10:00:00Z', commissionPctSnapshot: 7 }));
  S.partners = [];
}

async function loadLive() {
  firebase.apps.length || firebase.initializeApp(CFG);
  const db = firebase.firestore(); S.errors = [];
  const safe = async (label, fn) => { try { return await fn(); } catch (e) { S.errors.push(label + ': ' + (e.code || e.message)); return null; } };
  const [apps, accts, parts, books, pol] = await Promise.all([
    safe('Creator applications', () => db.collection('crm').where('seg', '==', 'creator').limit(500).get()),
    safe('Creator accounts', () => db.collection('creatorAccounts').limit(500).get()),
    safe('Partners', () => db.collection('partners').limit(300).get()),
    safe('Bookings', () => db.collection('roomBookings').limit(1000).get()),
    safe('Property terms', () => db.collection('config').doc('creatorPolicies').get()),
  ]);
  S.apps = apps ? apps.docs.map((d) => ({ id: d.id, ...d.data() })) : [];
  S.accounts = accts ? accts.docs.map((d) => ({ id: d.id })) : [];
  S.partners = parts ? parts.docs.map((d) => ({ id: d.id, ...d.data() })) : [];
  S.bookings = books ? books.docs.map((d) => ({ id: d.id, ...d.data() })) : [];
  const override = pol && pol.exists && Array.isArray((pol.data() || {}).list) ? pol.data().list : [];
  const fromPartners = S.partners.filter((p) => p.creatorMatching && p.creatorMatching.enabled).map((p) => policyFromPartner(p.id, p));
  S.policies = mergePolicies(mergePolicies(SEED_POLICIES, override), fromPartners);
}

function derive() {
  S.rows = buildRoster(S.apps, S.policies);
  const done = S.bookings.filter((b) => ['completed', 'checked_out'].includes(String(b.status || '')));
  let gross = 0, comm = 0; const byMonth = {}, byProp = {};
  done.forEach((b) => {
    const amt = Math.max(0, Number(b.amount || b.gross || 0)), pct = Math.max(0, Math.min(30, Number(b.commissionPctSnapshot || b.commissionPct || 7))), fee = amt * pct / 100;
    gross += amt; comm += fee;
    const when = String(b.completedAt || b.createdAt || b.at || '').slice(0, 7) || 'unknown';
    byMonth[when] = (byMonth[when] || 0) + amt;
    const pn = String(b.property || b.propertyName || b.propertyId || 'Unknown'); byProp[pn] = byProp[pn] || { n: 0, gross: 0, fee: 0 }; byProp[pn].n++; byProp[pn].gross += amt; byProp[pn].fee += fee;
  });
  S.sales = { done: done.length, gross, comm, byMonth, byProp, open: S.bookings.length - done.length };
}

const bars = (items) => { const max = Math.max(1, ...items.map((i) => i[1])); return '<div class="hb-bars">' + items.map(([l, v]) => `<div class="hb-bar"><span>${esc(l)}</span><i><u style="width:${Math.round(v / max * 100)}%"></u></i><em>${num(v)}</em></div>`).join('') + '</div>'; };
const kpi = (v, l, href, sub) => `<a class="hb-kpi" href="${esc(href)}"><b>${esc(v)}</b><span>${esc(l)}</span>${sub ? `<small>${esc(sub)}</small>` : ''}</a>`;

function overview() {
  const c = rosterCounts(S.rows), openProps = S.policies.filter((p) => p.status === 'open');
  const stage = STAGES.map((s) => [s, S.rows.filter((r) => r.stage === s).length]);
  const tiers = Object.keys(TIER_INFO).map((t) => [TIER_INFO[t].name, S.rows.filter((r) => r.rating && r.rating.tier === t).length]);
  const towns = {}; S.rows.forEach((r) => { const t = (r.location && r.location.town) || 'Unknown'; towns[t] = (towns[t] || 0) + 1; });
  const topTowns = Object.entries(towns).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const recent = [...S.rows].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 6);
  return `<div class="hb-kpis">
    ${kpi(num(S.accounts.length), 'Registered creators', '#creators', 'with a studio account')}
    ${kpi(num(S.rows.length), 'Applications', '#creators', num(c.needs_review) + ' need review')}
    ${kpi(num(c.send), 'Ready for an offer', '#creators', 'matched to a property')}
    ${kpi(num(openProps.length), 'Properties taking creators', '#properties')}
    ${kpi(num(S.sales.done), 'Completed bookings', '#sales', S.sales.open ? num(S.sales.open) + ' not completed' : '')}
    ${kpi(inr(S.sales.gross), 'Booking value', '#sales')}
    ${kpi(inr(S.sales.comm), 'Commission earned', '#sales')}
  </div>
  <div class="hb-grid2">
    <div class="hb-card"><h2>Creator pipeline</h2>${bars(stage)}</div>
    <div class="hb-card"><h2>Rating mix</h2>${bars(tiers)}</div>
    <div class="hb-card"><h2>Where creators are based</h2>${topTowns.length ? bars(topTowns) : '<p class="hb-empty">No locations yet.</p>'}</div>
    <div class="hb-card"><h2>Newest applications</h2>${recent.length ? recent.map((r) => `<div><b>${esc(r.name)}</b> <span class="hb-sub">${esc((r.location && r.location.town) || '')} · ${esc(r.stage)}</span></div>`).join('') : '<p class="hb-empty">No applications yet.</p>'}</div>
  </div>`;
}

function creators() {
  const chips = ['all', ...STAGES].map((s) => `<button type="button" class="hb-chip${S.stage === s ? ' on' : ''}" data-stage="${s}">${esc(s === 'all' ? 'All' : s)} ${s === 'all' ? S.rows.length : S.rows.filter((r) => r.stage === s).length}</button>`).join('');
  const q = S.q.trim().toLowerCase();
  const rows = S.rows.filter((r) => (S.stage === 'all' || r.stage === S.stage) && (!q || [r.name, r.email, r.handle, r.location && r.location.town, r.niches.join(' ')].join(' ').toLowerCase().includes(q)));
  const reg = new Set(S.accounts.map((a) => a.id));
  const body = rows.map((r) => {
    const v = r.best ? { send: ['Offer ready', 'good'], negotiate: ['Needs a chat', 'warn'], no_fit: ['No fit yet', 'bad'] }[r.best.verdict] : null;
    const wa = r.phone ? `https://wa.me/${String(r.phone).replace(/\D/g, '')}` : '';
    return `<tr><td><b>${esc(r.name)}</b><div class="hb-sub">${esc(r.email)}</div></td>
      <td>${/^https:\/\//.test(r.handle) ? `<a href="${esc(r.handle)}" target="_blank" rel="noopener">Profile</a>` : '<span class="hb-sub">no link</span>'}</td>
      <td class="num">${num(r.metrics && r.metrics.followers)}</td>
      <td>${r.rating ? esc((TIER_INFO[r.rating.tier] || {}).name || r.rating.tier) : ''}</td>
      <td>${esc((r.location && r.location.town) || '')}</td>
      <td><span class="hb-pill">${esc(r.stage)}</span>${reg.has(r.id) ? ' <span class="hb-pill good">registered</span>' : ''}</td>
      <td>${v ? `<span class="hb-pill ${v[1]}">${esc(v[0])}</span><div class="hb-sub">${esc(r.best.name)}</div>` : ''}</td>
      <td>${wa ? `<a class="hb-btn" href="${esc(wa)}" target="_blank" rel="noopener">WhatsApp</a>` : ''}${r.flags.length ? `<div class="hb-sub">${esc(r.flags.join('; '))}</div>` : ''}</td></tr>`;
  }).join('');
  return `<div class="hb-chips">${chips}</div><input id="hubQ" class="hb-search" type="search" placeholder="Search name, email, town, niche" aria-label="Search creators" value="${esc(S.q)}">
  <div class="hb-table-wrap"><table><thead><tr><th>Creator</th><th>Profile</th><th class="num">Followers</th><th>Rating</th><th>Town</th><th>Stage</th><th>Best match</th><th>Contact</th></tr></thead><tbody>${body || '<tr><td colspan="8" class="hb-empty">No creators match.</td></tr>'}</tbody></table></div>`;
}

function properties() {
  const open = S.policies.filter((p) => p.status === 'open');
  const cards = S.policies.map((p) => {
    const matched = S.rows.filter((r) => r.matches.some((m) => m.propertyId === p.propertyId && m.verdict === 'send')).length;
    const fs = p.freeStay || {}, tone = p.status === 'open' ? 'good' : p.status === 'closed' ? 'bad' : 'warn';
    return `<div class="hb-card"><div><span class="hb-pill ${tone}">${esc(p.status)}</span></div><h3>${esc(p.name)}</h3><p class="hb-sub">${esc((p.location && p.location.town) || '')}</p>
      ${p.status === 'open' ? `<p>${fs.nights ? esc(fs.nights + ' night' + (fs.nights > 1 ? 's' : '') + ' free, up to ' + fs.guests + ' guests') : 'No free stay'}${fs.weekdaysOnly ? ', non-weekend' : ''}${fs.offSeasonOnly ? ', off-season' : ''}</p><p class="hb-sub">${p.performanceCash && p.performanceCash.max ? 'Performance cash up to ' + inr(p.performanceCash.max) : 'No upfront cash'} · ${esc(matched)} creators ready</p>${p.unconfirmed && p.unconfirmed.length ? `<p class="hb-sub">Unconfirmed: ${esc(p.unconfirmed.join(', '))}</p>` : ''}` : `<p class="hb-sub">${esc(p.reason || '')}</p>`}</div>`;
  }).join('');
  const seed = Array.isArray(window.RW_PARTNERS) ? window.RW_PARTNERS : [];
  const zones = {}; seed.forEach((p) => { zones[p.zone || 'Other'] = (zones[p.zone || 'Other'] || 0) + 1; });
  return `<div class="hb-kpis">${kpi(num(open.length), 'Taking creators', '#properties')}${kpi(num(seed.length || S.partners.length), 'Listed partners', '#properties', S.partners.length ? num(S.partners.length) + ' in database' : '')}${kpi(num(Object.keys(zones).length), 'Destinations', '#properties')}</div>
  <h2>Creator terms by property</h2><div class="hb-props">${cards}</div>
  <div class="hb-card"><h2>Listings by destination</h2>${Object.keys(zones).length ? bars(Object.entries(zones).sort((a, b) => b[1] - a[1])) : '<p class="hb-empty">No listings loaded.</p>'}</div>`;
}

function sales() {
  const s = S.sales, months = Object.keys(s.byMonth).sort().slice(-8), max = Math.max(1, ...months.map((m) => s.byMonth[m]));
  const props = Object.entries(s.byProp).sort((a, b) => b[1].gross - a[1].gross);
  const recent = [...S.bookings].sort((a, b) => String(b.completedAt || b.createdAt || '').localeCompare(String(a.completedAt || a.createdAt || ''))).slice(0, 8);
  return `<div class="hb-kpis">${kpi(num(s.done), 'Completed bookings', '#sales')}${kpi(inr(s.gross), 'Booking value', '#sales')}${kpi(inr(s.comm), 'Commission earned', '#sales', s.done ? 'avg ' + inr(s.gross / s.done) + ' a booking' : '')}${kpi(num(s.open), 'Not completed', '#sales')}</div>
  <div class="hb-card"><h2>Booking value by month</h2>${months.length ? `<div class="hb-month">${months.map((m) => `<div><span>${esc(inr(s.byMonth[m]))}</span><i style="height:${Math.round(s.byMonth[m] / max * 100)}%"></i>${esc(m)}</div>`).join('')}</div>` : '<p class="hb-empty">No completed bookings yet.</p>'}</div>
  <div class="hb-table-wrap"><table><thead><tr><th>Property</th><th class="num">Bookings</th><th class="num">Value</th><th class="num">Commission</th></tr></thead><tbody>${props.map(([n, v]) => `<tr><td>${esc(n)}</td><td class="num">${num(v.n)}</td><td class="num">${inr(v.gross)}</td><td class="num">${inr(v.fee)}</td></tr>`).join('') || '<tr><td colspan="4" class="hb-empty">Nothing to show yet.</td></tr>'}</tbody></table></div>
  <div class="hb-table-wrap"><table><thead><tr><th>Booking</th><th>Property</th><th class="num">Amount</th><th>Status</th></tr></thead><tbody>${recent.map((b) => `<tr><td>${esc(b.ref || b.id)}</td><td>${esc(b.property || b.propertyName || '')}</td><td class="num">${inr(b.amount || b.gross)}</td><td><span class="hb-pill">${esc(b.status || '')}</span></td></tr>`).join('') || '<tr><td colspan="4" class="hb-empty">No bookings yet.</td></tr>'}</tbody></table></div>
  <p class="hb-sub">Commission uses each booking's saved rate, or 7% when none is saved. Amounts are what the database holds, not bank-reconciled money.</p>`;
}

function links() { return `<div class="hb-links">${LINKS.map(([t, d, h]) => `<a class="hb-link-card" href="${esc(h)}"><b>${esc(t)}</b><span>${esc(d)}</span></a>`).join('')}</div>`; }

function render() {
  derive();
  $('#tab-overview').innerHTML = overview(); $('#tab-creators').innerHTML = creators(); $('#tab-properties').innerHTML = properties(); $('#tab-sales').innerHTML = sales(); $('#tab-links').innerHTML = links();
  $('#hubErrors').innerHTML = S.errors.map((e) => `<div class="hb-error">Could not read ${esc(e)}. Check you are signed in with the founder account.</div>`).join('');
  $('#hubStamp').textContent = 'Updated ' + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}
function show(tab) {
  S.tab = TABS[tab] ? tab : 'overview';
  document.querySelectorAll('.hb-tab').forEach((t) => { t.hidden = t.id !== 'tab-' + S.tab; });
  document.querySelectorAll('#hubNav a').forEach((a) => a.classList.toggle('on', a.dataset.tab === S.tab));
  $('#hubTitle').textContent = TABS[S.tab]; $('#hubKicker').textContent = S.tab === 'overview' ? 'ROAMWISE' : 'ROAMWISE / ' + TABS[S.tab].toUpperCase();
}
async function refresh() { if (!DEMO) await loadLive(); render(); }

document.addEventListener('click', (e) => {
  const c = e.target.closest('[data-stage]'); if (c) { S.stage = c.dataset.stage; $('#tab-creators').innerHTML = creators(); }
});
document.addEventListener('input', (e) => { if (e.target.id === 'hubQ') { S.q = e.target.value; const pos = e.target.selectionStart; $('#tab-creators').innerHTML = creators(); const q = $('#hubQ'); q.focus(); q.setSelectionRange(pos, pos); } });
window.addEventListener('hashchange', () => show(location.hash.slice(1)));
$('#hubRefresh').addEventListener('click', refresh);

function enter() { $('#hubAuth').hidden = true; $('#hubApp').hidden = false; $('#hubDemo').hidden = !DEMO; show(location.hash.slice(1)); return refresh(); }
if (DEMO) { demoData(); enter(); }
else {
  firebase.apps.length || firebase.initializeApp(CFG);
  const auth = firebase.auth(), db = firebase.firestore();
  const isAdmin = async (u) => { try { return !!u && u.emailVerified && (await db.collection('admins').doc(u.uid).get()).exists; } catch (_) { return false; } };
  auth.onAuthStateChanged(async (u) => {
    if (u && await isAdmin(u)) return enter();
    $('#hubApp').hidden = true; $('#hubAuth').hidden = false;
    if (u) { $('#hubAuthMsg').textContent = 'This account is not a founder/admin account.'; auth.signOut(); }
  });
  $('#hubLogin').addEventListener('submit', async (e) => {
    e.preventDefault(); $('#hubAuthMsg').textContent = '';
    try { await auth.signInWithEmailAndPassword($('#hubEmail').value.trim(), $('#hubPass').value); } catch (err) { $('#hubAuthMsg').textContent = 'Sign-in failed: ' + (err.code || err.message); }
  });
  $('#hubOut').addEventListener('click', () => auth.signOut());
}
