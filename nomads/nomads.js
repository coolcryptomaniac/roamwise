import {
  PERSONAS, STAY_LENGTHS, WIFI_NEEDS, MUST_HAVES, VIBES, NOMAD_TIERS, DESTINATIONS,
  cleanBrief, nomadTier, scoreSpace, scoreDestination, rank, seekerMessage, hostMessage, waLink, mailLink, liveSpaces
} from './nomad-core.mjs';

const $ = id => document.getElementById(id);
const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const cfg = window.RW_PARTNER_CONFIG || {};
const SUPPORT_EMAIL = cfg.supportEmail || 'support@roamwise.co.in';
const SUPPORT_WA = (cfg.chat && cfg.chat.supportWhatsapp) || '';
const params = new URLSearchParams(location.search);

/* Sample spaces appear only with ?preview=1 and are labelled. They are not real properties. */
const SAMPLE = [
  { id: 'sample-a', name: 'Sample · Pine Ridge Desk House', zone: 'Sample, Himachal', vibes: ['mountain', 'nature'], sample: true, nomad: { mbps: 120, backup: 'full', desk: 'ergonomic', callRoom: true, kitchen: true, laundry: true, coworking: true, community: true, verified: true, rate15: 26000, rate30: 24000, rate90: 21000, minNights: 15 } },
  { id: 'sample-b', name: 'Sample · Lakeside Studio Loft', zone: 'Sample, Uttarakhand', vibes: ['nature', 'culture'], sample: true, nomad: { mbps: 45, backup: 'router', desk: 'basic', callRoom: true, kitchen: true, verified: true, rate15: 18000, rate30: 16000, rate90: 14500, minNights: 15 } },
  { id: 'sample-c', name: 'Sample · Palm Lane Cowork Stay', zone: 'Sample, Goa', vibes: ['beach', 'city'], sample: true, nomad: { mbps: 80, backup: 'full', desk: 'ergonomic', callRoom: false, meals: true, coworking: true, community: true, verified: false, rate30: 38000, rate90: 34000, minNights: 30 } }
];
const spaces = liveSpaces(Array.isArray(window.RW_PARTNER_SEED) ? window.RW_PARTNER_SEED : []).concat(params.get('preview') === '1' ? SAMPLE : []);

const state = { persona: 'founder', stay: 30, wifi: 25, must: new Set(), vibes: new Set() };

/* ---------- builders ---------- */
function seg(el, items, key, fmt) {
  el.innerHTML = items.map(i => '<button type="button" data-v="' + i.id + '" class="' + (state[key] === i.id ? 'on' : '') + '">' + fmt(i) + '</button>').join('');
  el.onclick = e => { const b = e.target.closest('button'); if (!b) return; state[key] = Number(b.dataset.v); seg(el, items, key, fmt); };
}
function pills(el, items, set, max) {
  el.innerHTML = items.map(i => '<button type="button" data-v="' + i.id + '" class="' + (set.has(i.id) ? 'on' : '') + '"><span>' + i.icon + '</span>' + esc(i.label) + '</button>').join('');
  el.onclick = e => {
    const b = e.target.closest('button'); if (!b) return; const v = b.dataset.v;
    if (set.has(v)) set.delete(v); else if (!max || set.size < max) set.add(v);
    pills(el, items, set, max);
  };
}
function drawPersonas() {
  $('personas').innerHTML = PERSONAS.map(p => '<button type="button" data-v="' + p.id + '" class="' + (state.persona === p.id ? 'on' : '') + '"><span class="ic">' + p.icon + '</span><b>' + esc(p.label) + '</b><small>' + esc(p.blurb) + '</small></button>').join('');
}
$('personas').onclick = e => { const b = e.target.closest('button'); if (!b) return; state.persona = b.dataset.v; drawPersonas(); };
drawPersonas();
seg($('stayLen'), STAY_LENGTHS, 'stay', i => esc(i.label));
seg($('wifiNeed'), WIFI_NEEDS, 'wifi', i => '<b>' + esc(i.label) + '</b><small>' + esc(i.note) + '</small>');
pills($('musts'), MUST_HAVES, state.must, 0);
pills($('vibes'), VIBES, state.vibes, 3);
$('budget').oninput = () => { $('budgetOut').textContent = '₹' + Number($('budget').value).toLocaleString('en-IN'); };

function briefNow() {
  return cleanBrief({ persona: state.persona, stay: state.stay, wifi: state.wifi, must: [...state.must], vibes: [...state.vibes], budget: $('budget').value, people: $('people').value, start: $('start').value });
}

/* ---------- animation helpers ---------- */
function countUp(el, to, ms) {
  const suffix = el.dataset.suffix || '';
  if (reduced) { el.textContent = to + suffix; return; }
  const t0 = performance.now();
  (function tick(t) { const k = Math.min(1, (t - t0) / ms); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))) + suffix; if (k < 1) requestAnimationFrame(tick); })(t0);
}
document.querySelectorAll('[data-count]').forEach(el => countUp(el, el.dataset.count === '15' ? DESTINATIONS.length : Number(el.dataset.count), 1400));
if (!reduced) {
  const orb = $('orbMbps'); let n = 214;
  setInterval(() => { n = 180 + Math.round(Math.random() * 60); orb.textContent = n; }, 1800);
}
const ring = score => {
  const C = 2 * Math.PI * 26;
  return '<svg viewBox="0 0 64 64" class="nm-score"><circle cx="32" cy="32" r="26" class="bg"/><circle cx="32" cy="32" r="26" class="fg" style="--C:' + C.toFixed(1) + ';--to:' + (C * (1 - score / 100)).toFixed(1) + '"/></svg><b>' + score + '</b>';
};

/* ---------- results ---------- */
function spaceCard(r) {
  const s = r.item, b = briefNow(), t = r.tier;
  const msg = seekerMessage(b, { name: s.name });
  const wa = waLink(s.bookingWhatsapp, msg) || (SUPPORT_WA ? waLink(SUPPORT_WA, 'Nomad Match enquiry for ' + s.name + '\n' + msg) : '');
  const href = s.sample ? '' : (wa || mailLink(SUPPORT_EMAIL, 'Nomad stay enquiry: ' + s.name, msg));
  return '<article class="nm-card" style="--tier:' + t.tier.color + '"><div class="nm-card-top"><div class="nm-ring-wrap">' + ring(r.score) + '</div><div><span class="nm-badge">' + esc(t.tier.label) + (t.verified ? ' · verified' : ' · self-declared') + '</span><h3>' + esc(s.name) + '</h3><p class="nm-where">' + esc(s.zone || '') + (s.sample ? ' · <em>sample, not a real property</em>' : '') + '</p></div></div>' +
    '<div class="nm-price">' + (r.monthly ? '₹' + r.monthly.toLocaleString('en-IN') + '<small>/month</small>' + (r.total ? '<span>about ₹' + r.total.toLocaleString('en-IN') + ' for the stay</span>' : '') : '<small>Rate on request</small>') + '</div>' +
    '<ul class="nm-why">' + r.reasons.map(x => '<li>' + esc(x) + '</li>').join('') + r.gaps.map(x => '<li class="gap">' + esc(x) + '</li>').join('') + '</ul>' +
    (href ? '<a class="nm-btn" target="_blank" rel="noopener noreferrer" href="' + esc(href) + '">Chat with host</a>' : '<span class="nm-btn off">Preview only</span>') + '</article>';
}
function destCard(r) {
  const d = r.item, b = briefNow();
  const msg = seekerMessage(b, { name: '' }) + '\nI am interested in ' + d.name + '. Please suggest verified work stays there.';
  const href = SUPPORT_WA ? waLink(SUPPORT_WA, msg) : mailLink(SUPPORT_EMAIL, 'Nomad stay in ' + d.name, msg);
  return '<article class="nm-card dest"><div class="nm-card-top"><div class="nm-ring-wrap">' + ring(r.score) + '</div><div><span class="nm-badge muted">' + esc(d.state) + '</span><h3>' + esc(d.name) + '</h3></div></div>' +
    '<p class="nm-note">' + esc(d.note) + ' <a href="' + esc(d.src) + '" target="_blank" rel="noopener noreferrer">Source ↗</a></p>' +
    '<ul class="nm-why">' + r.reasons.map(x => '<li>' + esc(x) + '</li>').join('') + r.gaps.map(x => '<li class="gap">' + esc(x) + '</li>').join('') + '</ul>' +
    '<a class="nm-btn ghost" target="_blank" rel="noopener noreferrer" href="' + esc(href) + '">Ask RoamWise to find a stay here</a></article>';
}
function showResults() {
  const b = briefNow();
  const sp = rank(spaces, scoreSpace, b, 4), ds = rank(DESTINATIONS, scoreDestination, b, 6);
  const top = (sp[0] || ds[0] || {}).score || 0;
  $('results').innerHTML = '<header class="nm-res-head"><span class="nm-kicker">YOUR MATCHES</span><h2>' + (top >= 75 ? 'Strong matches found.' : 'Here is where you fit best.') + '</h2><p>Scored on budget, Wi-Fi, must-haves, mood and stay length. Destination costs are about, from cited sources; Wi-Fi and vibe ratings are editorial until a host proves their numbers.</p><button type="button" class="nm-link" id="again">Change answers</button></header>' +
    (sp.length ? '<h3 class="nm-sub">Verified work stays</h3><div class="nm-grid">' + sp.map(spaceCard).join('') + '</div>' : '<div class="nm-empty"><b>No verified nomad stays are live yet.</b><span>RoamWise is onboarding the first spaces. Tell us your brief on WhatsApp and we will hand-match you.</span></div>') +
    '<h3 class="nm-sub">Best places for how you work</h3><div class="nm-grid">' + ds.map(destCard).join('') + '</div>';
  $('results').hidden = false;
  $('results').querySelectorAll('.nm-card').forEach((c, i) => { c.style.animationDelay = (reduced ? 0 : i * 90) + 'ms'; });
  $('again').onclick = () => { $('results').hidden = true; $('seekerForm').hidden = false; $('seekerForm').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }); };
  $('results').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
}
$('seekerForm').onsubmit = e => {
  e.preventDefault();
  const b = briefNow();
  const steps = ['Reading your brief', 'Checking Wi-Fi against ' + b.wifi + ' Mbps', 'Weighing ₹' + b.budget.toLocaleString('en-IN') + ' a month', 'Matching your mood', 'Ranking spaces and places'];
  $('seekerForm').hidden = true; $('results').hidden = true; $('scan').hidden = false;
  $('scanSteps').innerHTML = steps.map(s => '<li>' + esc(s) + '</li>').join('');
  const items = [...$('scanSteps').children];
  items.forEach((li, i) => setTimeout(() => li.classList.add('done'), reduced ? 0 : 380 * (i + 1)));
  setTimeout(() => { $('scan').hidden = true; showResults(); }, reduced ? 0 : 380 * (steps.length + 1));
};

/* ---------- host side ---------- */
const HOST_CHECKS = [['callRoom', 'Quiet spot for calls'], ['kitchen', 'Kitchen access'], ['meals', 'Meals available'], ['laundry', 'Laundry'], ['coworking', 'Shared work area on site'], ['community', 'Community or events'], ['verified', 'I can send a speed-test screenshot']];
$('hChecks').innerHTML = HOST_CHECKS.map(([id, label]) => '<label class="nm-check"><input type="checkbox" id="h_' + id + '"' + (id === 'callRoom' || id === 'verified' ? ' checked' : '') + '><span>' + esc(label) + '</span></label>').join('');
function hostSpace() {
  const o = { mbps: $('hMbps').value, backup: $('hBackup').value, desk: $('hDesk').value, rate15: $('hR15').value, rate30: $('hR30').value, name: $('hName').value, place: $('hPlace').value, owner: $('hOwner').value, phone: $('hPhone').value, rooms: $('hRooms').value };
  HOST_CHECKS.forEach(([id]) => { o[id] = $('h_' + id).checked; });
  return o;
}
function drawMeter() {
  const t = nomadTier({ nomad: hostSpace() });
  const C = 2 * Math.PI * 52, g = $('hGauge');
  g.style.strokeDasharray = C.toFixed(1); g.style.strokeDashoffset = (C * (1 - t.score / 100)).toFixed(1); g.style.stroke = t.tier.color;
  $('hScore').textContent = t.score; $('hTier').textContent = t.tier.label + (t.verified ? '' : ' (self-declared)'); $('hTier').style.color = t.tier.color; $('hLine').textContent = t.tier.line;
  $('hMissing').innerHTML = t.missing.slice(0, 5).map(m => '<li>' + esc(m) + '</li>').join('') || '<li class="ok">Nothing missing. Send us your proof.</li>';
}
$('hostForm').addEventListener('input', drawMeter); $('hostForm').addEventListener('change', drawMeter); drawMeter();
$('hostForm').onsubmit = e => {
  e.preventDefault();
  const msg = hostMessage(hostSpace());
  const href = SUPPORT_WA ? waLink(SUPPORT_WA, msg) : mailLink(SUPPORT_EMAIL, 'List my space on Nomad Match', msg);
  window.open(href, '_blank', 'noopener,noreferrer');
};

/* ---------- tiers + mode ---------- */
$('tierCards').innerHTML = NOMAD_TIERS.filter(t => t.id !== 'none').reverse().map((t, i) => '<article class="nm-tier" style="--tier:' + t.color + ';--d:' + i * 120 + 'ms"><b>' + esc(t.label) + '</b><span>' + t.min + '+ points</span><p>' + esc(t.line) + '</p></article>').join('');
function setMode(m) {
  document.querySelectorAll('.nm-mode button').forEach(b => { const on = b.dataset.mode === m; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
  const host = m === 'host';
  $('hostForm').hidden = !host; $('seekerForm').hidden = host || !$('results').hidden || !$('scan').hidden; if (host) { $('results').hidden = true; $('scan').hidden = true; }
  if (!host && $('results').hidden && $('scan').hidden) $('seekerForm').hidden = false;
}
document.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));
if (params.get('role') === 'host') setMode('host');
if (!reduced && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { threshold: .2 });
  document.querySelectorAll('.nm-tier,.nm-trust>div,.nm-flow>div').forEach(el => io.observe(el));
} else document.querySelectorAll('.nm-tier,.nm-trust>div,.nm-flow>div').forEach(el => el.classList.add('in'));
