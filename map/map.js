// map/map.js - the interactive Uttarakhand map. Leaflet is loaded as a classic script (window.L) and partners-data.js as
// window.RW_PARTNER_SEED. Every string from data is placed with textContent, never innerHTML.
import { BOUNDS, REGIONS, cleanPlaces, partnersForPlace, partnerCard, searchPlaces } from './map-core.mjs';

const $ = (id) => document.getElementById(id);
function el(tag, cls, text) { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }

let places = [], region = 'all', query = '', current = '';
const markers = new Map();
let map;

function partnersOf(p) { return partnersForPlace(window.RW_PARTNER_SEED || [], p).map(partnerCard); }

function section(title, items) {
  const f = document.createDocumentFragment();
  if (!items.length) return f;
  f.append(el('h3', '', title));
  const ul = el('ul'); items.forEach((t) => ul.append(el('li', '', t))); f.append(ul);
  return f;
}

function renderSheet(p) {
  const body = $('mpBody'); body.replaceChildren();
  body.append(el('span', 'mp-region', p.region.toUpperCase()), el('h2', '', p.name), el('p', '', p.blurb));

  body.append(el('h3', '', 'Where to stay with RoamWise'));
  const partners = partnersOf(p);
  if (partners.length) {
    partners.forEach((c) => {
      const box = el('div', 'mp-partner'); box.append(el('b', '', c.name));
      if (c.area) box.append(el('small', '', c.area));
      box.append(el('span', 'mp-tag' + (c.tier.enquiryOnly ? ' enq' : ''), c.tier.label), el('small', '', c.tier.note));
      body.append(box);
    });
    const a = el('a', 'mp-cta', 'See stays and ask the owner'); a.href = '../partner/stays/'; body.append(a);
  } else {
    body.append(el('div', 'mp-none', 'No RoamWise partner here yet. Run a stay, tour or trek here? Apply to be listed.'));
  }
  const join = el('a', 'mp-cta alt', 'List your service'); join.href = '../providers/join/'; body.append(join);

  body.append(section('Food to try', p.food), section('Culture', p.culture));
  body.append(el('h3', '', 'Getting there'));
  if (p.travel.reach) body.append(el('p', '', p.travel.reach));
  if (p.travel.best) body.append(el('p', '', 'Best time: ' + p.travel.best));
  if (p.travel.tip) body.append(el('p', '', p.travel.tip));
  if (p.page) { const g = el('a', 'mp-cta alt', p.pageLabel || 'Read the guide'); g.href = p.page; body.append(g); }
  setSheet(true); $('mpSheet').scrollTop = 0;
}

function setSheet(open) { $('mpSheet').classList.toggle('open', open); $('mpGrab').setAttribute('aria-expanded', String(open)); }

function select(id, pan) {
  const p = places.find((x) => x.id === id); if (!p) return;
  current = id; renderSheet(p);
  markers.forEach((m, k) => { const n = m.getElement(); if (n) n.firstChild.classList.toggle('on', k === id); });
  if (pan) map.flyTo([p.lat, p.lng], Math.max(map.getZoom(), 9), { duration: 0.8 });
  history.replaceState(null, '', '#' + id);
}

function visible() { return searchPlaces(places, query).filter((p) => region === 'all' || p.region === region); }

function refresh() {
  const show = new Set(visible().map((p) => p.id));
  markers.forEach((m, id) => { if (show.has(id)) m.addTo(map); else m.remove(); });
  const ul = $('mpList'); ul.replaceChildren();
  visible().forEach((p) => { const li = el('li'), b = el('button', '', p.name); b.type = 'button'; b.addEventListener('click', () => select(p.id, true)); li.append(b); ul.append(li); });
}

function build() {
  map = L.map('mpMap', { zoomControl: true, minZoom: 6, maxBounds: [[BOUNDS.south - 1, BOUNDS.west - 1], [BOUNDS.north + 1, BOUNDS.east + 1]] });
  map.fitBounds([[BOUNDS.south + 0.2, BOUNDS.west + 0.2], [BOUNDS.north - 0.2, BOUNDS.east - 0.2]]);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 15, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
  places.forEach((p) => {
    const n = partnersOf(p).length;
    const icon = L.divIcon({ className: 'mp-pinwrap', html: '<span class="mp-pin' + (n ? ' has' : '') + '">' + (n || '') + '</span>', iconSize: [34, 34], iconAnchor: [17, 17] });
    const m = L.marker([p.lat, p.lng], { icon, title: p.name, keyboard: true, alt: p.name + (n ? ', ' + n + ' partner' + (n > 1 ? 's' : '') : '') });
    m.on('click', () => select(p.id, false)); markers.set(p.id, m);
  });
  const chips = $('mpChips');
  ['all'].concat(REGIONS).forEach((r) => {
    const b = el('button', '', r === 'all' ? 'All' : r); b.type = 'button'; b.setAttribute('aria-pressed', String(r === region));
    b.addEventListener('click', () => { region = r; chips.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); refresh(); });
    chips.append(b);
  });
  $('mpGrab').addEventListener('click', () => setSheet(!$('mpSheet').classList.contains('open')));
  map.on('click', () => setSheet(false));
  $('mpQ').addEventListener('input', (e) => { query = e.target.value; refresh(); });
  refresh();
  const start = location.hash.slice(1); if (start && places.some((p) => p.id === start)) select(start, true);
}

async function init() {
  if (typeof L === 'undefined') { $('mpBody').textContent = 'The map could not load. Use the place list below.'; }
  try { places = cleanPlaces(await (await fetch('places.json')).json()); } catch (e) { $('mpBody').textContent = 'Could not load places. Please refresh.'; return; }
  if (typeof L === 'undefined') { places.forEach((p) => { const li = el('li'), b = el('button', '', p.name); b.type = 'button'; b.addEventListener('click', () => renderSheet(p)); li.append(b); $('mpList').append(li); }); return; }
  build();
}
init();
