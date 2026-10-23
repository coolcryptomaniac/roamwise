// packages/packages.js - student package page. All maths lives in catalog / dates-core / instalment-core.
import { PACKAGES, GROUP, priceFor, transportPlan, whatsappLink, OPERATING_MODEL } from './catalog.mjs';
import { bestWindows, windowRisk, addDays, NMIMS_SAMPLE } from './dates-core.mjs';
import { instalmentPlan } from './instalment-core.mjs';
import { safetyPlan } from './safety-core.mjs';
import { makeBooking, CONSENTS } from './booking-core.mjs';

const $ = (id) => document.getElementById(id);
const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const inr = (n) => 'Rs ' + Math.round(n).toLocaleString('en-IN');
const fmt = (iso, long) => new Date(iso + 'T12:00:00Z').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', ...(long ? { year: 'numeric' } : {}), timeZone: 'UTC' });
const today = new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10); // India date

const state = { pkg: 'almora', n: GROUP.default, cohort: 'any', vehicle: 'single', kit: true, start: null };
const opts = () => ({ vehicle: state.vehicle, kit: state.kit });
const bars = (levels) => '<div class="pk-bars" aria-hidden="true">' + levels.map((l) => '<i class="l' + l + '"></i>').join('') + '</div>';

function windows() {
  const pkg = PACKAGES[state.pkg];
  return bestWindows({
    days: pkg.days, fromISO: addDays(today, 21), toISO: addDays(today, 240), todayISO: today, limit: 5,
    allowed: state.cohort === 'nmims' ? NMIMS_SAMPLE.free : null,
  });
}

function renderTabs() {
  $('pkTabs').innerHTML = Object.values(PACKAGES).map((p) => {
    const from = priceFor(p.id, GROUP.max, { vehicle: 'cheapest', kit: false });
    return '<button type="button" class="pk-tab" data-id="' + esc(p.id) + '" aria-pressed="' + (p.id === state.pkg) + '" style="--acc:' + esc(p.accent) + '"><b>' + esc(p.name) + '</b><span>'
      + esc(p.nights + ' nights from ' + p.start) + '</span><span>from ' + inr(from.totalPP) + ' per person</span>'
      + '<span class="pk-chip' + (p.status === 'open' ? '' : ' soon') + '">' + (p.status === 'open' ? 'OPEN FOR BOOKING' : 'OPENING SOON') + '</span></button>';
  }).join('');
}

function renderDates() {
  const list = windows();
  if (!list.find((w) => w.start === state.start) && !(state.custom && state.start)) state.start = list[0] ? list[0].start : null;
  $('pkDates').innerHTML = list.length ? list.map((w) => '<button type="button" role="radio" class="pk-date" data-start="' + esc(w.start) + '" aria-checked="' + (w.start === state.start) + '"><b>' + esc(fmt(w.start)) + ' to ' + esc(fmt(w.end)) + '</b>'
    + bars(w.levels) + '<span class="pk-risk ' + esc(w.label) + '">' + esc(w.label) + '</span></button>').join('')
    : '<p class="pk-fine">No calm window fits this cohort in the next eight months. Pick your own date below.</p>';
  $('pkCohortNote').textContent = state.cohort === 'nmims'
    ? NMIMS_SAMPLE.note + ' Free ranges used: ' + NMIMS_SAMPLE.free.map((r) => r.label + ' (' + fmt(r.from) + ' to ' + fmt(r.to) + ')').join(', ') + '.'
    : 'Weekends, Diwali week and Christmas to New Year jam the Kainchi Dham road, so the best windows start early in the week.';
}

function renderOwn() {
  const v = $('pkOwn').value, el = $('pkOwnRisk');
  if (!v) { el.textContent = ''; return; }
  const w = windowRisk(v, PACKAGES[state.pkg].days);
  el.className = 'pk-risk ' + w.label; el.textContent = w.label;
  state.start = v; state.custom = true;
}

function renderSummary() {
  const pkg = PACKAGES[state.pkg], price = priceFor(state.pkg, state.n, opts());
  if (!price || !state.start) { $('pkPrice').innerHTML = '<h2>Choose a date</h2>'; $('pkParts').innerHTML = ''; return; }
  const open = pkg.status === 'open';
  const link = whatsappLink({ pkgId: state.pkg, n: state.n, startISO: state.start, total: price.totalPP });
  $('pkPrice').style.setProperty('--acc', pkg.accent);
  $('pkPrice').innerHTML = '<h2>' + esc(pkg.name) + '</h2><div class="big">' + esc(inr(price.totalPP)) + ' <small>per person, GST included</small></div>'
    + '<p>' + esc(state.n) + ' friends: ' + esc(inr(price.groupTotal)) + ' in total. ' + esc(fmt(state.start, true)) + ' for ' + esc(pkg.days) + ' days and ' + esc(pkg.nights) + ' nights.</p>'
    + '<p>' + esc(price.rooms) + ' twin-sharing rooms. ' + esc(pkg.statusNote) + '</p>'
    + (open ? '<button type="button" class="pk-cta" id="pkReserve">Reserve these dates</button>' : '')
    + '<a class="pk-cta pk-alt" target="_blank" rel="noopener noreferrer" href="' + esc(link) + '">' + (open ? 'Ask a question on WhatsApp' : 'Register interest on WhatsApp') + '</a>';
  const plan = instalmentPlan({ totalPerPerson: price.totalPP, departISO: state.start, todayISO: today, groupSize: state.n });
  $('pkParts').innerHTML = '<h2>' + (plan.mode === 'parts' ? 'Pay in parts, no interest' : 'Pay in full') + '</h2>'
    + '<table><thead><tr><th>When</th><th>What</th><th>Each person</th></tr></thead><tbody>'
    + plan.perPerson.map((r) => '<tr><td>' + esc(fmt(r.due)) + '</td><td>' + esc(r.label) + '</td><td>' + esc(inr(r.amount)) + '</td></tr>').join('') + '</tbody></table>'
    + '<p class="pk-fine">' + esc(plan.mode === 'parts' ? plan.departureRule : plan.reason + '. ' + plan.departureRule) + ' This is not a loan: we never lend, and the trip only runs when paid.</p>'
    + '<p class="pk-fine">Each friend can pay their own part by UPI. Card and cardless EMI may follow later.</p>';
}

function renderPlan() {
  const pkg = PACKAGES[state.pkg];
  $('pkDays').innerHTML = pkg.itinerary.map((d) => '<li><b>' + esc(d.title) + '</b><p>' + esc(d.plan) + '</p><em>Yaadein: ' + esc(d.memory) + '</em></li>').join('');
  $('pkDays').parentNode.style.setProperty('--acc', pkg.accent);
  $('pkDays').style.setProperty('--acc', pkg.accent);
  if (state.start) {
    const t = transportPlan(state.pkg, state.n, state.start, opts());
    $('pkTransport').innerHTML = '<h2>Getting around</h2>' + t.legs.map((l) => '<div class="pk-leg"><b>Day ' + esc(l.day) + '</b> ' + esc(l.from) + ' to ' + esc(l.to) + '<span>' + esc(l.by) + ' &middot; ' + esc(l.depart) + '. ' + esc(l.note) + '</span></div>').join('')
      + '<h3>Your own legs</h3><ul>' + t.studentLegs.map((s) => '<li>' + esc(s) + '</li>').join('') + '</ul>'
      + '<h3>Every driver has</h3><ul>' + t.driverNeeds.map((s) => '<li>' + esc(s) + '</li>').join('') + '</ul><p class="pk-fine">' + esc(t.advice) + (t.risk.fog ? ' Winter fog can delay trains: leave a buffer day.' : '') + '</p>';
  }
  $('pkIncludes').innerHTML = '<h2>What is included</h2><ul>' + pkg.includes.map((s) => '<li>' + esc(s) + '</li>').join('') + '</ul><h3>Not included</h3><ul>' + pkg.notIncluded.map((s) => '<li>' + esc(s) + '</li>').join('') + '</ul>';
  $('pkHow').innerHTML = '<h2>How we run it</h2><div class="pk-who"><div><h3>RoamWise</h3><ul>' + OPERATING_MODEL.roamwise.map((s) => '<li>' + esc(s) + '</li>').join('') + '</ul></div>'
    + '<div><h3>Our local partners</h3><ul>' + Object.values(OPERATING_MODEL.partners).map((s) => '<li>' + esc(s) + '</li>').join('') + '</ul></div></div>'
    + '<h3>The timeline</h3><ul>' + OPERATING_MODEL.timeline.map((s) => '<li><b>' + esc(s.t) + ':</b> ' + esc(s.do) + '</li>').join('') + '</ul>';
}

function renderSafety() {
  const sp = state.start ? safetyPlan({ pkgId: state.pkg, n: state.n, startISO: state.start }) : null;
  if (!sp) { $('pkSafety').innerHTML = ''; return; }
  state.chatMsg = sp.chatMessage;
  $('pkSafety').innerHTML = '<h2>Plan it safely</h2>'
    + sp.watch.map((w) => '<p class="pk-watch">' + esc(w) + '</p>').join('')
    + sp.checks.map((c) => '<h3>' + esc(c.when) + '</h3><ul>' + c.items.map((i) => '<li>' + esc(i) + '</li>').join('') + '</ul>').join('')
    + '<div class="pk-actions"><a class="pk-cta pk-alt" href="../?ask=' + encodeURIComponent(sp.tuskPrompt) + '">Ask Ailon Tusk about the safety side</a>'
    + '<button type="button" class="pk-cta pk-alt" id="pkCopyChat">Copy first message for your trip chat</button></div>'
    + '<p class="pk-fine" id="pkCopyNote" aria-live="polite">Ailon Tusk opens with the question typed in; you press send. For the group chat, open RoamWise, start a trip chat, add your friends and paste the message. Tusk gives advice, not a guarantee that a road is open.</p>';
}

function fixPremium() { // a premium van seats 10 guests plus the guide: step the group down and say so
  const prem = state.vehicle === 'premium';
  if (prem && state.n > 10) state.n = 10;
  $('pkPlus').disabled = prem && state.n >= 10;
}

function renderBookForm(errors) {
  const pkg = PACKAGES[state.pkg], price = priceFor(state.pkg, state.n, opts());
  $('pkBook').hidden = false;
  $('pkBook').innerHTML = '<h2>Reserve ' + esc(pkg.name) + '</h2><p class="pk-fine">' + esc(state.n) + ' travellers from ' + esc(fmt(state.start, true)) + ', ' + esc(inr(price.totalPP)) + ' per person. Nothing is charged here: we check dates first, then send payment details.</p>'
    + (errors && errors.length ? '<ul class="pk-errors" role="alert">' + errors.map((e) => '<li>' + esc(e) + '</li>').join('') + '</ul>' : '')
    + '<form id="pkBookForm" novalidate><div class="pk-form">'
    + '<label>Lead traveller name<input name="leadName" autocomplete="name" required></label>'
    + '<label>Mobile number<input name="leadPhone" type="tel" inputmode="tel" autocomplete="tel" required></label>'
    + '<label>Email (optional)<input name="leadEmail" type="email" autocomplete="email"></label>'
    + '<label>College or group (optional)<input name="group"></label></div>'
    + '<label class="pk-wide">All ' + esc(state.n) + ' travellers, one per line, with an emergency contact phone: <em>Asha Rao, 9876543210</em><textarea name="guestsText" rows="' + (state.n + 1) + '" required></textarea></label>'
    + '<label class="pk-wide">Medical or allergy notes (optional)<textarea name="medical" rows="2" maxlength="400"></textarea></label>'
    + CONSENTS.map((c) => '<label class="pk-consent"><input type="checkbox" name="consent" value="' + esc(c.id) + '"> ' + esc(c.text) + '</label>').join('')
    + '<button type="submit" class="pk-cta">Review my request</button></form>';
  $('pkBook').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderBookDone(b) {
  $('pkBook').innerHTML = '<h2>Request ready: ' + esc(b.ref) + '</h2><p class="pk-fine">Save this reference. Nothing is booked until we confirm.</p>'
    + '<ol class="pk-next">' + b.next.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ol>'
    + '<table><thead><tr><th>When</th><th>What</th><th>Each person</th></tr></thead><tbody>' + b.plan.perPerson.map((r) => '<tr><td>' + esc(fmt(r.due)) + '</td><td>' + esc(r.label) + '</td><td>' + esc(inr(r.amount)) + '</td></tr>').join('') + '</tbody></table>'
    + '<a class="pk-cta" target="_blank" rel="noopener noreferrer" href="' + esc(b.whatsapp) + '">Send request on WhatsApp</a>'
    + '<button type="button" class="pk-cta pk-alt" id="pkBookEdit">Change details</button>';
}

function renderAll() { fixPremium(); $('pkBook').hidden = true; renderTabs(); renderDates(); renderSummary(); renderPlan(); renderSafety(); $('pkSize').textContent = state.n; }

document.addEventListener('click', (e) => {
  if (e.target.id === 'pkReserve') { renderBookForm(); return; }
  if (e.target.id === 'pkBookEdit') { renderBookForm(); return; }
  if (e.target.id === 'pkCopyChat') {
    const note = $('pkCopyNote');
    (navigator.clipboard ? navigator.clipboard.writeText(state.chatMsg) : Promise.reject()).then(
      () => { note.textContent = 'Copied. Paste it into your trip chat.'; },
      () => { note.textContent = 'Could not copy automatically. Select this message and copy it: ' + state.chatMsg; });
    return;
  }
  const tab = e.target.closest('.pk-tab'); if (tab) { state.pkg = tab.dataset.id; state.start = null; state.custom = false; $('pkOwn').value = ''; $('pkOwnRisk').textContent = ''; renderAll(); return; }
  const d = e.target.closest('.pk-date'); if (d) { state.start = d.dataset.start; state.custom = false; $('pkOwn').value = ''; $('pkOwnRisk').textContent = ''; renderAll(); return; }
  if (e.target.id === 'pkMinus' && state.n > GROUP.min) { state.n--; renderAll(); }
  if (e.target.id === 'pkPlus' && state.n < GROUP.max) { state.n++; renderAll(); }
});
$('pkCohort').addEventListener('change', (e) => { state.cohort = e.target.value; state.start = null; state.custom = false; renderAll(); });
document.querySelectorAll('input[name=veh]').forEach((r) => r.addEventListener('change', () => { state.vehicle = r.value; renderAll(); }));
$('pkKit').addEventListener('change', (e) => { state.kit = e.target.checked; renderAll(); });
$('pkOwn').addEventListener('change', () => { renderOwn(); renderTabs(); renderDates(); renderSummary(); renderPlan(); renderSafety(); });
document.addEventListener('submit', (e) => {
  if (e.target.id !== 'pkBookForm') return;
  e.preventDefault();
  const f = new FormData(e.target);
  const b = makeBooking({ pkgId: state.pkg, startISO: state.start, n: state.n, vehicle: state.vehicle, kit: state.kit,
    leadName: f.get('leadName'), leadPhone: f.get('leadPhone'), leadEmail: f.get('leadEmail'), group: f.get('group'),
    guestsText: f.get('guestsText'), medical: f.get('medical'), consents: f.getAll('consent') }, today);
  if (!b.ok) { renderBookForm(b.problems); return; }
  renderBookDone(b); $('pkBook').scrollIntoView({ behavior: 'smooth', block: 'start' });
});
$('pkOwn').min = addDays(today, 21);
renderAll();
