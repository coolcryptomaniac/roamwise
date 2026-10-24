// map/map.js - the Uttarakhand map: a swipeable carousel of the 13 districts drives the map. Leaflet is a classic script
// (window.L); partners-data.js provides window.RW_PARTNER_SEED. Every string from data is placed with textContent.
import { BOUNDS, REGIONS, cleanPlaces, cleanDistricts, partnerPins, searchDistricts } from './map-core.mjs';

const $ = (id) => document.getElementById(id);
function el(tag, cls, text) { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }

let places = [], districts = [], region = 'all', query = '', current = '', placeId = '';
const placeMarkers = new Map(), partnerLayer = [];
let map, ring;
const seed = () => window.RW_PARTNER_SEED || [];
const byId = (id) => districts.find((d) => d.id === id);
const pinsOf = (d) => partnerPins(seed(), d, places);
const shown = () => searchDistricts(districts, places, query).filter((d) => region === 'all' || d.region === region);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

function list(title, items) {
  const f = document.createDocumentFragment(); if (!items.length) return f;
  f.append(el('h3', '', title)); const ul = el('ul'); items.forEach((t) => ul.append(el('li', '', t))); f.append(ul); return f;
}

/* ---------- detail panel ---------- */
function partnersBlock(d) {
  const f = document.createDocumentFragment(), pins = pinsOf(d);
  f.append(el('h3', '', 'RoamWise partners here'));
  if (!pins.length) { f.append(el('div', 'mp-none', 'No RoamWise partner in this district yet. Run a stay, tour or trek here? Apply to be listed.')); return f; }
  pins.forEach((pin) => {
    const c = pin.card, box = el('div', 'mp-partner'); box.append(el('b', '', c.name));
    if (c.area) box.append(el('small', '', c.area));
    box.append(el('span', 'mp-tag' + (c.tier.enquiryOnly ? ' enq' : ''), c.tier.label), el('small', '', c.tier.note));
    const a = el('a', 'mp-link', 'Open exact location in Google Maps'); a.href = pin.maps; a.target = '_blank'; a.rel = 'noopener'; box.append(a);
    box.addEventListener('mouseenter', () => flashPartner(c.id)); f.append(box);
  });
  const stays = el('a', 'mp-cta', 'See stays and ask the owner'); stays.href = '../partner/stays/'; f.append(stays);
  f.append(el('p', 'mp-note', 'Pins sit around the town, not on the building. Use the Google Maps link for the exact spot.'));
  return f;
}

function renderDetail(d) {
  const body = $('mpBody'); body.replaceChildren();
  body.append(el('span', 'mp-region', d.region.toUpperCase() + ' · DISTRICT'), el('h2', '', d.name), el('p', 'mp-lead', d.tagline));
  body.append(list('What makes it different', d.traits), partnersBlock(d));
  const join = el('a', 'mp-cta alt', 'List your service'); join.href = '../providers/join/'; body.append(join);
  const ps = d.places.map((id) => places.find((p) => p.id === id)).filter(Boolean);
  if (ps.length) {
    body.append(el('h3', '', 'Places to explore'));
    const row = el('div', 'mp-places');
    ps.forEach((p) => { const b = el('button', 'mp-place' + (p.id === placeId ? ' on' : ''), p.name); b.type = 'button'; b.addEventListener('click', () => selectPlace(p.id)); row.append(b); });
    body.append(row);
    const p = ps.find((x) => x.id === placeId);
    if (p) {
      const box = el('div', 'mp-pl'); box.append(el('h4', '', p.name), el('p', '', p.blurb), list('Food to try', p.food), list('Culture', p.culture));
      box.append(el('h3', '', 'Getting there'));
      [p.travel.reach, p.travel.best && 'Best time: ' + p.travel.best, p.travel.tip].filter(Boolean).forEach((t) => box.append(el('p', '', t)));
      if (p.page) { const g = el('a', 'mp-cta alt', p.pageLabel || 'Read the guide'); g.href = p.page; box.append(g); }
      body.append(box);
    }
  }
}

/* ---------- map layers ---------- */
function flashPartner(id) { partnerLayer.forEach((m) => { const n = m.getElement(); if (n) n.firstChild.classList.toggle('on', m.options.pid === id); }); document.querySelectorAll('.mp-pc').forEach((x) => x.classList.toggle('on', x.dataset.pid === id)); }

function addPin(pin, all) {
  const r = pin.of > 1 ? (all ? 16 : 28) : 0, a = (2 * Math.PI * pin.slot) / pin.of - Math.PI / 2, dx = r * Math.cos(a), dy = r * Math.sin(a), sz = all ? 30 : 36;
  const icon = L.divIcon({ className: 'mp-pinwrap' + (all ? ' mp-all' : ''), html: '<span class="mp-ppin">&#8962;</span>', iconSize: [sz, sz], iconAnchor: [sz / 2 - dx, sz / 2 - dy] });
  const m = L.marker([pin.lat, pin.lng], { icon, title: pin.card.name, alt: pin.card.name + ', ' + pin.card.tier.label, pid: pin.card.id, zIndexOffset: 500 }).addTo(map);
  const dir = dx > 5 ? 'right' : dx < -5 ? 'left' : 'top', off = dir === 'right' ? [dx + sz / 2, dy] : dir === 'left' ? [dx - sz / 2, dy] : [dx, dy - sz / 2];
  m.bindTooltip(pin.card.name, { direction: dir, offset: off, permanent: !all && pin.of <= 3, className: 'mp-plabel' });
  m.on('click', () => { flashPartner(pin.card.id); if (all) { const d = districts.find((x) => pinsOf(x).some((q) => q.card.id === pin.card.id)); if (d) select(d.id, { scroll: true }); } setPanel(true); });
  partnerLayer.push(m); return m;
}

function strip(pins) {
  const box = $('mpPartners'); box.replaceChildren();
  pins.forEach((pin) => {
    const c = pin.card, b = el('button', 'mp-pc'); b.type = 'button'; b.dataset.pid = c.id;
    if (c.photo) { const im = el('img'); im.src = '../' + c.photo.src; im.alt = c.photo.alt || c.name; im.loading = 'lazy'; b.append(im); } else b.append(el('span', 'ph', '\u2302'));
    const t = el('div'); t.append(el('b', '', c.name), el('small', '', c.area), el('em', c.tier.enquiryOnly ? 'enq' : '', c.tier.label)); b.append(t);
    b.addEventListener('click', () => { flashPartner(c.id); map.flyTo([pin.lat, pin.lng], 14, { duration: reduce ? 0 : 0.8 }); box.querySelectorAll('.mp-pc').forEach((x) => x.classList.toggle('on', x === b)); });
    box.append(b);
  });
}

function drawPartners(d) {
  partnerLayer.splice(0).forEach((m) => m.remove());
  const pins = pinsOf(d); pins.forEach((pin) => addPin(pin, false)); strip(pins);
}

/* Every public partner in the state at once, one pin per town fan. */
function showAll() {
  partnerLayer.splice(0).forEach((m) => m.remove()); if (ring) { ring.remove(); ring = null; }
  const all = []; districts.forEach((d) => pinsOf(d).forEach((p) => all.push(p)));
  all.forEach((pin) => addPin(pin, true)); strip(all);
  placeMarkers.forEach((m) => { const n = m.getElement(); if (n) n.firstChild.classList.remove('dim'); });
  const pts = all.map((p) => [p.lat, p.lng]);
  if (pts.length) map.flyToBounds(pts, { padding: [70, 120], maxZoom: 9, duration: reduce ? 0 : 1 });
}

function focus(d) {
  if (!map) return;
  if (ring) ring.remove();
  ring = L.circle([d.lat, d.lng], { radius: 22000, className: 'mp-ring', color: '#E8BA6C', weight: 1.5, dashArray: '4 6', fillColor: '#E8BA6C', fillOpacity: 0.07, interactive: false }).addTo(map);
  map.flyTo([d.lat, d.lng], pinsOf(d).length ? Math.min(d.zoom + 1, 12) : d.zoom, { duration: reduce ? 0 : 0.9 });
  placeMarkers.forEach((m, id) => { const p = places.find((x) => x.id === id), n = m.getElement(); if (n) n.firstChild.classList.toggle('dim', p.district !== d.id); });
  drawPartners(d);
}

/* ---------- carousel ---------- */
const track = () => $('mpTrack');
function card(d) {
  const a = el('article', 'mp-card'); a.dataset.id = d.id; a.tabIndex = 0; a.setAttribute('role', 'group'); a.setAttribute('aria-label', d.name + ' district');
  const n = pinsOf(d).length;
  a.append(el('span', 'mp-card-r', d.region.toUpperCase()), el('h2', '', d.name), el('p', '', d.tagline));
  const ul = el('ul', 'mp-chipset'); d.traits.slice(0, 3).forEach((t) => ul.append(el('li', '', t))); a.append(ul);
  a.append(el('span', 'mp-badge' + (n ? ' has' : ''), n ? n + ' RoamWise partner' + (n > 1 ? 's' : '') : 'No partner yet'));
  a.addEventListener('click', () => { select(d.id, { scroll: true }); setPanel(true); });
  a.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(d.id, { scroll: true }); setPanel(true); } });
  return a;
}

function renderCarousel() {
  const t = track(); t.replaceChildren(); const ds = shown();
  ds.forEach((d) => t.append(card(d)));
  $('mpEmpty').hidden = ds.length > 0;
  const list2 = $('mpList'); list2.replaceChildren();
  ds.forEach((d) => { const li = el('li'), b = el('button', '', d.name); b.type = 'button'; b.addEventListener('click', () => { select(d.id, { scroll: true }); setPanel(true); }); li.append(b); list2.append(li); });
  if (ds.length && !ds.some((d) => d.id === current)) select(ds[0].id, { scroll: true }); else markCards();
}

function markCards() {
  const ds = shown(), i = ds.findIndex((d) => d.id === current);
  track().querySelectorAll('.mp-card').forEach((c) => c.classList.toggle('on', c.dataset.id === current));
  $('mpCount').textContent = i >= 0 ? (i + 1) + ' of ' + ds.length : '';
  $('mpPrev').disabled = i <= 0; $('mpNext').disabled = i < 0 || i >= ds.length - 1;
}

function select(id, opt = {}) {
  const d = byId(id); if (!d) return;
  const changed = current !== id; current = id; if (changed) placeId = '';
  markCards(); renderDetail(d); focus(d);
  if (opt.scroll) { const t = track(), c = t.querySelector('[data-id="' + id + '"]'); if (c) t.scrollTo({ left: c.offsetLeft - (t.clientWidth - c.offsetWidth) / 2, behavior: reduce ? 'auto' : 'smooth' }); }
  history.replaceState(null, '', '#' + (placeId || id));
}

function selectPlace(pid) {
  const p = places.find((x) => x.id === pid); if (!p) return;
  const d = byId(p.district); if (!d) return;
  placeId = pid; select(d.id, { scroll: true }); placeId = pid; renderDetail(d);
  map.flyTo([p.lat, p.lng], Math.max(d.zoom, 11), { duration: reduce ? 0 : 0.8 });
  placeMarkers.forEach((m, id) => { const n = m.getElement(); if (n) n.firstChild.classList.toggle('sel', id === pid); });
  history.replaceState(null, '', '#' + pid);
}

/* The card nearest the middle of the track becomes the selected district once scrolling settles. */
let settle = 0;
function onScroll() {
  clearTimeout(settle);
  settle = setTimeout(() => {
    const t = track(), mid = t.getBoundingClientRect().left + t.clientWidth / 2; let best = null, dist = 1e9;
    t.querySelectorAll('.mp-card').forEach((c) => { const r = c.getBoundingClientRect(), dd = Math.abs(r.left + r.width / 2 - mid); if (dd < dist) { dist = dd; best = c; } });
    if (best && best.dataset.id !== current) select(best.dataset.id);
  }, 140);
}

function step(dir) { const ds = shown(), i = ds.findIndex((d) => d.id === current), n = ds[i + dir]; if (n) select(n.id, { scroll: true }); }
function setPanel(open) { const s = $('mpSheet'); if (open && window.innerWidth < 860) s.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); }

/* ---------- build ---------- */
function build() {
  map = L.map('mpMap', { zoomControl: true, minZoom: 6, maxBounds: [[BOUNDS.south - 1, BOUNDS.west - 1], [BOUNDS.north + 1, BOUNDS.east + 1]] });
  map.fitBounds([[BOUNDS.south + 0.2, BOUNDS.west + 0.2], [BOUNDS.north - 0.2, BOUNDS.east - 0.2]]);
  const osm = '&copy; OpenStreetMap contributors';
  const bases = {
    'Terrain': L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', { maxZoom: 15, attribution: osm + ', SRTM | &copy; OpenTopoMap' }),
    'Satellite': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 17, attribution: 'Imagery &copy; Esri' }),
    'Streets': L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 17, attribution: osm }),
    'Dark': L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 17, attribution: osm, className: 'mp-darktiles' }),
  };
  bases.Terrain.addTo(map); L.control.layers(bases, null, { position: 'topleft', collapsed: true }).addTo(map);
  $('mpFull').addEventListener('click', () => {
    const w = $('mpWrap'), on = w.classList.toggle('full'); $('mpFull').setAttribute('aria-pressed', String(on)); $('mpFull').textContent = on ? '\u2715 Close' : '\u26F6 Expand';
    document.body.style.overflow = on ? 'hidden' : ''; setTimeout(() => map.invalidateSize(), 60);
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && $('mpWrap').classList.contains('full')) $('mpFull').click(); });
  $('mpAll').addEventListener('click', showAll);
  places.forEach((p) => {
    const icon = L.divIcon({ className: 'mp-pinwrap', html: '<span class="mp-pin"></span>', iconSize: [16, 16], iconAnchor: [8, 8] });
    const m = L.marker([p.lat, p.lng], { icon, title: p.name, keyboard: true, alt: p.name }).addTo(map);
    m.bindTooltip(p.name, { direction: 'top', offset: [0, -8] }); m.on('click', () => { selectPlace(p.id); setPanel(true); }); placeMarkers.set(p.id, m);
  });
  const chips = $('mpChips');
  ['all'].concat(REGIONS).forEach((r) => {
    const b = el('button', '', r === 'all' ? 'All' : r); b.type = 'button'; b.setAttribute('aria-pressed', String(r === region));
    b.addEventListener('click', () => { region = r; chips.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); renderCarousel(); });
    chips.append(b);
  });
  track().addEventListener('scroll', onScroll, { passive: true });
  $('mpPrev').addEventListener('click', () => step(-1)); $('mpNext').addEventListener('click', () => step(1));
  $('mpQ').addEventListener('input', (e) => { query = e.target.value; renderCarousel(); });
  window.addEventListener('hashchange', () => {
    const h = location.hash.slice(1), pl = places.find((p) => p.id === h);
    if (pl && !(h === placeId)) selectPlace(pl.id); else if (byId(h) && h !== current) select(h, { scroll: true });
  });
}

async function init() {
  const get = async (u) => (await fetch(u)).json();
  try { places = cleanPlaces(await get('places.json')); districts = cleanDistricts(await get('districts.json'), places); } catch (e) { $('mpBody').textContent = 'Could not load the map data. Please refresh.'; return; }
  const noMap = typeof L === 'undefined';
  if (!noMap) build(); else $('mpBody').textContent = 'The map could not load. The district cards below still work.';
  const hash = location.hash.slice(1), pl = places.find((p) => p.id === hash);
  current = pl ? pl.district : (byId(hash) ? hash : '');
  if (!noMap) renderCarousel(); else { districts.forEach((d) => track().append(card(d))); }
  if (!noMap) { if (pl) selectPlace(pl.id); else if (current) select(current, { scroll: true }); }
}
init();
