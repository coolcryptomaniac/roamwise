/* admin/command.js - Admin Command Center: dashboard, insights, action queue and clean tables.
   Read-only. Reuses the admin session already signed in on /admin/ (same origin, MFA enforced there), checks admins/{uid},
   then reads Firestore. Every button opens the exact place to act (existing console, partner desk, WhatsApp);
   approvals, payments and entitlements are not written from here. ?demo=1 shows labelled sample data. */
import { buildPartners, funnel, buildActions, insights, STAGES, CONSOLE_MAP, waUrl, toMs } from './command-core.mjs';
import { buildRoster, rosterCounts } from '../creators/roster-core.mjs';
import { SEED_POLICIES } from '../creators/property-terms-core.mjs';

const CFG = { apiKey: 'AIzaSyDlrtpzpOb1VEmVSd9tHmu7OpmvwWosYsU', authDomain: 'roamwisepro.firebaseapp.com', projectId: 'roamwisepro', storageBucket: 'roamwisepro.firebasestorage.app', messagingSenderId: '299014744987', appId: '1:299014744987:web:d5c316743e6d7a10904f3e' };
const $ = (s) => document.querySelector(s);
const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const inr = (n) => '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN');
const num = (n) => Number(n || 0).toLocaleString('en-IN');
const DEMO = new URLSearchParams(location.search).has('demo');
const TABS = { today: ['TODAY', 'What needs you right now'], partners: ['PROPERTIES', 'Every property, how close it is to live'], guests: ['GUESTS & BOOKINGS', 'Requests and bookings waiting on someone'], people: ['PEOPLE', 'Users and creators'], map: ['CONSOLE MAP', 'What to keep, merge or retire in the old console'] };
const S = { partners: [], listed: [], bookings: [], leads: [], users: [], crm: [], errors: [], tab: 'today', pf: 'all', q: '' };

function demoData() {
  const now = Date.now(), ago = (h) => new Date(now - h * 36e5).toISOString(), mou = { mouVersion: 'RW-PMOU-2026-09-27-V4', mouAcceptedAt: ago(200) };
  const ok = { identity: 'verified', property: 'verified', experience: 'verified', payout: 'verified', overall: 'verified' };
  const media = { photoUrl: 'https://example.com/p.jpg' };
  S.partners = [
    { id: 'u1', name: 'Sample Hill Stay', zone: 'Almora', area: 'Ghurson', phone: '9000000001', onboarding: mou, verification: ok, status: 'pending', media, roomCount: 3 },
    { id: 'u2', name: 'Sample Cedar Homestay', zone: 'Almora', area: 'Kotyura', phone: '9000000002', onboarding: mou, verification: ok, status: 'active', verified: true, media, roomCount: 0 },
    { id: 'u3', name: 'Sample Valley House', zone: 'Tirthan Valley', phone: '9000000003', onboarding: mou, verification: ok, status: 'active', verified: true, media, roomCount: 2 },
    { id: 'u4', name: 'Sample Orchard Inn', zone: 'Manali', phone: '9000000004', onboarding: mou, verification: { identity: 'verified', property: 'pending', experience: 'pending', payout: 'pending' }, status: 'pending', media },
    { id: 'u5', name: 'Sample Ridge Lodge', zone: 'Almora', phone: '9000000005', status: 'pending' },
    { id: 'u6', name: 'Sample Pine Cottage', zone: 'Lansdowne', status: 'pending' },
  ];
  S.listed = [{ id: 'p_sample_valley_house' }];
  S.bookings = [{ id: 'b1', ref: 'RW-1001', property: 'Sample Valley House', status: 'requested', createdAt: ago(40) }, { id: 'b2', ref: 'RW-1002', property: 'Sample Valley House', status: 'completed', amount: 6400, createdAt: ago(300), completedAt: ago(250) }];
  S.leads = [{ id: 'l1', name: 'Sample Aanya', phone: '9000000011', status: 'new', createdAt: ago(5), items: [{ name: 'Sample Hill Stay' }], checkIn: '2026-11-08', guests: 2 }, { id: 'l2', name: 'Sample Kabir', phone: '9000000012', status: 'new', createdAt: ago(30), items: [{ name: 'Sample Cedar Homestay' }] }];
  S.users = Array.from({ length: 24 }, (_, i) => ({ id: 'x' + i, pro: i % 6 === 0, createdAt: ago(i * 20), lastActive: ago(i * 12) }));
  S.crm = Array.from({ length: 5 }, (_, i) => ({ id: 'c' + i, seg: 'creator', name: 'Sample Creator ' + i, email: 'sample' + i + '@example.com', handle: 'https://www.instagram.com/sample' + i + '/', stage: 'new', createdAt: ago(i * 30) }));
}

async function loadLive() {
  firebase.apps.length || firebase.initializeApp(CFG);
  const db = firebase.firestore(); S.errors = [];
  const safe = async (label, fn) => { try { return await fn(); } catch (e) { S.errors.push(label + ': ' + (e.code || e.message)); return null; } };
  const rows = (s) => (s ? s.docs.map((d) => ({ id: d.id, ...d.data() })) : []);
  const [p, cfg, b, l, u, c] = await Promise.all([
    safe('Partners', () => db.collection('partners').limit(300).get()),
    safe('Public partner list', () => db.collection('config').doc('partners').get()),
    safe('Bookings', () => db.collection('roomBookings').limit(500).get()),
    safe('Guest requests', () => db.collection('stayLeads').orderBy('createdAt', 'desc').limit(200).get()),
    safe('Users', () => db.collection('users').limit(1000).get()),
    safe('Creator applications', () => db.collection('crm').where('seg', '==', 'creator').limit(500).get()),
  ]);
  S.partners = rows(p); S.bookings = rows(b); S.leads = rows(l); S.users = rows(u); S.crm = rows(c);
  S.listed = cfg && cfg.exists && Array.isArray((cfg.data() || {}).list) ? cfg.data().list : [];
}

function derive() {
  S.rows = buildPartners(S.partners, S.listed);
  S.fun = funnel(S.rows);
  S.creators = (() => { try { const r = buildRoster(S.crm, SEED_POLICIES), c = rosterCounts(r); return { total: r.length, needsReview: c.needs_review || 0, ready: c.send || 0 }; } catch (_) { return { total: S.crm.length, needsReview: 0, ready: 0 }; } })();
  S.actions = buildActions({ partners: S.rows, leads: S.leads, bookings: S.bookings, creators: S.creators });
  S.ins = insights({ partners: S.rows, bookings: S.bookings, users: S.users, leads: S.leads });
}

const kpi = (v, l, href, sub) => `<a class="hb-kpi" href="${esc(href)}"><b>${esc(v)}</b><span>${esc(l)}</span>${sub ? `<small>${esc(sub)}</small>` : ''}</a>`;
const bars = (items) => { const max = Math.max(1, ...items.map((i) => i[1])); return '<div class="hb-bars">' + items.map(([l, v]) => `<div class="hb-bar"><span>${esc(l)}</span><i><u style="width:${Math.round(v / max * 100)}%"></u></i><em>${num(v)}</em></div>`).join('') + '</div>'; };
const btn = (a, primary) => a && a.href ? `<a class="cm-btn${primary ? ' primary' : ''}" href="${esc(a.href)}"${a.external ? ' target="_blank" rel="noopener"' : ''}>${esc(a.label)}</a>` : '';

function actionRow(a) {
  return `<div class="cm-act ${esc(a.tone)}"><div><div class="cm-area">${esc(a.area)}</div><b>${esc(a.title)}</b><span class="hb-sub">${esc(a.detail)}</span></div>
    <div class="cm-act-btns">${btn({ label: a.cta, href: a.href, external: a.external }, true)}${btn(a.alt)}</div></div>`;
}

function today() {
  const i = S.ins, live = S.rows.filter((r) => r.st.bookable).length, ready = S.rows.filter((r) => r.st.complete && !r.st.approved).length;
  const top = S.actions.slice(0, 8);
  return `<div class="hb-kpis">
    ${kpi(num(S.actions.length), 'Actions waiting', '#today', S.actions.filter((a) => a.tone === 'bad').length + ' urgent')}
    ${kpi(live + ' / ' + S.rows.length, 'Properties bookable', '#partners', ready ? ready + ' only need your approval' : '')}
    ${kpi(num(S.leads.filter((l) => l.status !== 'contacted').length), 'Guest requests open', '#guests')}
    ${kpi(num(i.users), 'Users', '#people', num(i.pro) + ' Pro · ' + num(i.week) + ' new this week')}
    ${kpi(inr(i.gross), 'Booking value', '#guests', num(i.done) + ' completed')}
    ${kpi(inr(i.comm), 'Commission earned', '#guests')}
  </div>
  <div class="hb-grid2">
    <div class="hb-card"><div class="cm-section-h"><h2>Do next</h2><span class="cm-count">${S.actions.length > 8 ? 'top 8 of ' + S.actions.length : S.actions.length + ' item' + (S.actions.length === 1 ? '' : 's')}</span></div>
      <div class="cm-queue">${top.length ? top.map(actionRow).join('') : '<p class="hb-empty">Nothing needs you. Enjoy the quiet.</p>'}</div></div>
    <div class="hb-card"><h2>Insights</h2><div class="cm-notes">${i.notes.map((n) => `<div class="cm-note ${esc(n.tone)}">${esc(n.text)}</div>`).join('')}</div>
      <h3 style="margin-top:8px">Supply by city</h3>${i.zones.length ? bars(i.zones.map((z) => [z.zone + ' (' + z.live + ' live)', z.total])) : '<p class="hb-empty">No properties yet.</p>'}</div>
  </div>
  <div class="hb-card"><h2>Property road to bookable</h2><div class="cm-funnel">${S.fun.map(([label, n], k) => `<div class="cm-step${k === S.fun.length - 1 ? ' last' : ''}"><b>${num(n)}</b><span>${esc(label)}</span></div>`).join('')}</div>
    <p class="hb-sub">Each box counts properties that reached that step or further. A big drop between two boxes is where applications get stuck.</p></div>`;
}

function partnerRows() {
  const q = S.q.trim().toLowerCase();
  return S.rows.filter((r) => {
    const s = r.st, f = S.pf;
    if (f === 'ready' && !(s.complete && !s.approved)) return false;
    if (f === 'owner' && !(!s.mou || s.basics.length)) return false;
    if (f === 'live' && !s.bookable) return false;
    if (f === 'notlive' && s.bookable) return false;
    return !q || [r.name, r.zone, r.area, r.phone, r.email].join(' ').toLowerCase().includes(q);
  });
}
function partners() {
  const c = { all: S.rows.length, notlive: S.rows.filter((r) => !r.st.bookable).length, ready: S.rows.filter((r) => r.st.complete && !r.st.approved).length, owner: S.rows.filter((r) => !r.st.mou || r.st.basics.length).length, live: S.rows.filter((r) => r.st.bookable).length };
  const chip = (k, l) => `<button type="button" class="hb-chip${S.pf === k ? ' on' : ''}" data-pf="${k}">${l} ${c[k]}</button>`;
  const rows = partnerRows().map((r) => {
    const s = r.st, label = (STAGES.find((x) => x[0] === s.stage) || [])[1] || s.stage, tone = s.bookable ? 'good' : (s.stage === 'applied' ? 'bad' : 'warn');
    const wa = waUrl(r.phone || r.ownerWa, 'Hi, this is RoamWise about ' + (r.name || 'your property') + '.');
    const next = s.mou && s.verified && !s.approved ? { label: 'Approve', href: 'index.html#operations' } : s.mou && !s.verified ? { label: 'Verify', href: 'index.html#operations' } : s.approved && !s.published ? { label: 'Publish', href: '../partner/' } : s.published && s.rooms < 1 ? { label: 'Add rooms', href: '../partner/' } : null;
    return `<tr><td><b>${esc(r.name || 'Unnamed')}</b><div class="hb-sub">${esc([r.area, r.zone].filter(Boolean).join(', '))}</div>${s.complete && !s.approved ? '<div class="cm-ready">All owner details in</div>' : ''}</td>
      <td><span class="hb-pill ${tone}">${esc(label)}</span></td>
      <td>${s.missing.length ? `<ul class="cm-miss">${s.missing.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>` : '<span class="hb-sub">Nothing missing</span>'}</td>
      <td class="num">${num(s.rooms)}</td>
      <td><div class="cm-btnrow">${btn(next, true)}${wa ? btn({ label: 'WhatsApp', href: wa, external: true }) : ''}</div></td></tr>`;
  }).join('');
  return `<div class="hb-chips">${chip('all', 'All')}${chip('notlive', 'Not live yet')}${chip('ready', 'Details in, awaiting you')}${chip('owner', 'Waiting on owner')}${chip('live', 'Bookable')}</div>
    <input id="cmQ" class="hb-search" type="search" placeholder="Search name, city, phone" value="${esc(S.q)}">
    <div class="hb-table-wrap"><table><thead><tr><th>Property</th><th>Stage</th><th>What is missing</th><th class="num">Rooms</th><th>Act</th></tr></thead><tbody>${rows || '<tr><td colspan="5" class="hb-empty">No properties match.</td></tr>'}</tbody></table></div>
    <p class="hb-sub">Approving and publishing happen in the existing console and partner desk so every step keeps its checks and audit log.</p>`;
}

function guests() {
  const open = S.leads.filter((l) => l.status !== 'contacted'), now = Date.now();
  const leadRows = S.leads.slice(0, 60).map((l) => {
    const age = Math.round((now - toMs(l.createdAt)) / 36e5), wa = waUrl(l.phone, 'Hi ' + (l.name || '') + ', this is RoamWise about your stay request.');
    return `<tr><td><b>${esc(l.name)}</b><div class="hb-sub">${esc(l.phone)}</div></td><td>${esc((l.items || []).map((x) => x.name || x.partnerId).join(', '))}<div class="hb-sub">${esc(l.checkIn || l.dates || 'dates not given')}${l.guests ? ' · ' + esc(l.guests) + ' guests' : ''}</div></td>
      <td><span class="hb-pill ${l.status === 'contacted' ? 'good' : age > 3 ? 'bad' : 'warn'}">${l.status === 'contacted' ? 'contacted' : age + 'h waiting'}</span></td><td><div class="cm-btnrow">${wa ? btn({ label: 'WhatsApp', href: wa, external: true }, l.status !== 'contacted') : ''}${btn({ label: 'Mark contacted', href: 'index.html#stayreq' })}</div></td></tr>`;
  }).join('');
  const bk = [...S.bookings].sort((a, b) => toMs(b.createdAt || b.at) - toMs(a.createdAt || a.at)).slice(0, 40).map((b) => `<tr><td><b>${esc(b.ref || b.id)}</b><div class="hb-sub">${esc(String(b.createdAt || b.at || '').slice(0, 10))}</div></td><td>${esc(b.property || b.propertyName || b.propertyId || '')}</td><td><span class="hb-pill ${b.status === 'completed' ? 'good' : b.status === 'requested' ? 'warn' : ''}">${esc(b.status || '')}</span></td><td class="num">${b.amount ? inr(b.amount) : ''}</td></tr>`).join('');
  return `<div class="hb-card"><div class="cm-section-h"><h2>Guest requests</h2><span class="cm-count">${open.length} open of ${S.leads.length}</span></div>
    <div class="hb-table-wrap"><table><thead><tr><th>Guest</th><th>Asked about</th><th>Status</th><th>Act</th></tr></thead><tbody>${leadRows || '<tr><td colspan="4" class="hb-empty">No requests yet.</td></tr>'}</tbody></table></div></div>
    <div class="hb-card"><div class="cm-section-h"><h2>Bookings</h2><span class="cm-count">${S.bookings.length} total · ${S.ins.done} completed · ${inr(S.ins.gross)}</span></div>
    <div class="hb-table-wrap"><table><thead><tr><th>Reference</th><th>Property</th><th>Status</th><th class="num">Amount</th></tr></thead><tbody>${bk || '<tr><td colspan="4" class="hb-empty">No bookings yet.</td></tr>'}</tbody></table></div></div>`;
}

function people() {
  const i = S.ins, c = S.creators, mix = [['Free', i.users - i.pro], ['Pro', i.pro]];
  const recent = S.crm.slice().sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt)).slice(0, 8);
  return `<div class="hb-kpis">${kpi(num(i.users), 'Users', 'index.html#users')}${kpi(num(i.pro), 'Pro accounts', 'index.html#money')}${kpi(num(i.week), 'Joined this week', 'index.html#activity')}${kpi(num(i.active7), 'Active last 7 days', 'index.html#activity')}${kpi(num(c.total), 'Creator applications', '../creators/admin.html', c.needsReview + ' to review')}</div>
  <div class="hb-grid2"><div class="hb-card"><h2>Free vs Pro</h2>${bars(mix)}<div class="cm-btnrow">${btn({ label: 'Search users', href: 'index.html#users' }, true)}${btn({ label: 'Fix Pro records', href: 'index.html#money' })}</div></div>
  <div class="hb-card"><h2>Newest creator applications</h2>${recent.length ? recent.map((r) => `<div><b>${esc(r.name)}</b> <span class="hb-sub">${esc(r.email || '')}</span></div>`).join('') : '<p class="hb-empty">None yet.</p>'}<div class="cm-btnrow">${btn({ label: 'Open creator desk', href: '../creators/admin.html' }, true)}</div></div></div>`;
}

function consoleMap() {
  return `<p class="hb-sub">The old console has 27 tabs. This is a suggested sort. Nothing is removed until you decide.</p>
  <div class="hb-table-wrap"><table><thead><tr><th>Verdict</th><th>Tab</th><th>Why</th><th>Open</th></tr></thead><tbody>${CONSOLE_MAP.map(([v, t, w, h]) => `<tr><td><b class="cm-map-${v.toLowerCase()}">${esc(v)}</b></td><td>${esc(t)}</td><td class="hb-sub">${esc(w)}</td><td>${btn({ label: 'Open', href: h })}</td></tr>`).join('')}</tbody></table></div>`;
}

const VIEWS = { today, partners, guests, people, map: consoleMap };
function render() {
  $('#cmErrors').innerHTML = S.errors.map((e) => `<div class="hb-error">${esc(e)}</div>`).join('');
  const t = S.tab; $('#cmKicker').textContent = TABS[t][0]; $('#cmTitle').textContent = TABS[t][1];
  document.querySelectorAll('#cmNav a').forEach((a) => a.classList.toggle('on', a.dataset.tab === t));
  Object.keys(VIEWS).forEach((k) => { const el = $('#tab-' + k); el.hidden = k !== t; });
  if (S.rows) $('#tab-' + t).innerHTML = VIEWS[t]();
  const q = $('#cmQ'); if (q) q.addEventListener('input', () => { S.q = q.value; const pos = q.selectionStart; render(); const n = $('#cmQ'); n.focus(); n.setSelectionRange(pos, pos); });
}
function show(h) { S.tab = TABS[h] ? h : 'today'; render(); }
async function refresh() { $('#cmStamp').textContent = 'Loading…'; if (!DEMO) await loadLive(); derive(); $('#cmStamp').textContent = 'Updated ' + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }); render(); }
document.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('[data-pf]'); if (b) { S.pf = b.dataset.pf; render(); } });
window.addEventListener('hashchange', () => show(location.hash.slice(1)));
$('#cmRefresh').addEventListener('click', refresh);

function enter() { $('#cmAuth').hidden = true; $('#cmApp').hidden = false; $('#cmDemo').hidden = !DEMO; show(location.hash.slice(1)); return refresh(); }
if (DEMO) { demoData(); enter(); }
else {
  firebase.apps.length || firebase.initializeApp(CFG);
  const auth = firebase.auth(), db = firebase.firestore();
  const isAdmin = async (u) => { try { return !!u && (await db.collection('admins').doc(u.uid).get()).exists; } catch (_) { return false; } };
  auth.onAuthStateChanged(async (u) => {
    if (u && await isAdmin(u)) return enter();
    $('#cmApp').hidden = true; $('#cmAuth').hidden = false;
    if (u) $('#cmAuthMsg').textContent = 'This account is not an admin account.';
  });
}
