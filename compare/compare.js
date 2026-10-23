// compare/compare.js - renders offers.json through compare-core.mjs. All text is set with textContent (no innerHTML).
import { CRITERIA, DEFAULT_WEIGHTS, SELLER_LABEL, cleanOffers, filterOffers, rank, verdict, ageDays } from './compare-core.mjs';

const $ = (id) => document.getElementById(id);
const weights = { ...DEFAULT_WEIGHTS };
let offers = [];

function el(tag, cls, text) { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
const inr = (n) => '₹' + n.toLocaleString('en-IN');

function tag(parent, label, state) { const t = el('span', state === 'y' ? 'y' : state === 'w' ? 'w' : '', label); parent.appendChild(t); }

function card(r, i) {
  const o = r.offer, c = el('article', 'cp-card' + (i === 0 ? ' top' : ''));
  const head = el('div', 'cp-head'), left = el('div');
  left.append(el('h3', '', o.seller + ' — ' + o.title));
  left.append(el('small', '', SELLER_LABEL[o.type] + (o.from ? ' · from ' + o.from : '')));
  const sc = el('div', 'cp-score'); sc.append(el('b', '', String(r.score)), el('span', '', 'OUT OF 100'));
  head.append(left, sc); c.append(head);

  const price = el('div', 'cp-price');
  if (o.pricePP) price.textContent = (o.currency === 'USD' ? '$' : '₹') + o.pricePP.toLocaleString('en-IN');
  else price.textContent = 'Price not stated';
  price.append(el('small', '', (o.nights ? o.nights + ' nights' : 'nights not stated') + (r.comparable ? ' · ' + inr(r.perNight) + ' per night' : ' · not price-compared')));
  c.append(price);

  const bars = el('div', 'cp-bars');
  CRITERIA.forEach((k) => {
    const row = el('div', 'cp-bar'); row.append(el('span', '', k.label.replace(' per person per night', '')));
    const track = el('i'), fill = el('s'); fill.style.width = Math.round(r.parts[k.id] * 100) + '%'; track.append(fill); row.append(track); bars.append(row);
  });
  c.append(bars);

  const tags = el('div', 'cp-tags');
  tag(tags, 'Meals', o.has.meals ? 'y' : ''); tag(tags, 'Guide', o.has.guide ? 'y' : ''); tag(tags, 'Transport', o.has.transport ? 'y' : '');
  tag(tags, 'Insurance', o.has.insurance ? 'y' : ''); tag(tags, 'Pay in parts', o.flex.payInParts ? 'y' : '');
  if (o.suspect) tag(tags, 'Price looks wrong', 'w');
  if (o.currency === 'USD') tag(tags, 'Priced in USD', 'w');
  c.append(tags);

  if (o.note) c.append(el('p', 'cp-note', o.note));
  const age = ageDays(o.checked);
  const src = el('p', 'cp-src');
  src.append(document.createTextNode(o.checked ? 'Checked ' + o.checked + (age > 30 ? ' (over 30 days old: confirm before booking)' : '') : 'Check date missing'));
  if (o.url) { src.append(document.createTextNode(' · ')); const a = el('a', '', 'Source'); a.href = o.url; a.rel = 'noopener noreferrer'; a.target = '_blank'; src.append(a); }
  else src.append(document.createTextNode(' · no direct link saved, which lowers the clarity score'));
  c.append(src);
  return c;
}

function render() {
  const list = filterOffers(offers, { type: $('cpType').value, q: $('cpQ').value });
  const ranked = rank(list, weights);
  $('cpVerdict').textContent = verdict(ranked);
  const host = $('cpList'); host.replaceChildren(...ranked.map(card));
}

function buildControls() {
  const sel = $('cpType'); sel.append(new Option('All sellers', 'all'));
  Object.keys(SELLER_LABEL).forEach((k) => sel.append(new Option(SELLER_LABEL[k], k)));
  const host = $('cpWeights');
  CRITERIA.forEach((k) => {
    const w = el('label', 'cp-w'), b = el('b'); const out = el('span', '', String(weights[k.id]));
    b.append(el('span', '', k.label), out);
    const r = document.createElement('input'); r.type = 'range'; r.min = 0; r.max = 100; r.step = 5; r.value = weights[k.id];
    r.setAttribute('aria-label', k.label + ' weight');
    r.addEventListener('input', () => { weights[k.id] = Number(r.value); out.textContent = r.value; render(); });
    w.append(b, r, el('span', '', k.hint)); host.append(w);
  });
  sel.addEventListener('change', render); $('cpQ').addEventListener('input', render);
}

async function init() {
  buildControls();
  try {
    const res = await fetch('offers.json', { cache: 'no-cache' });
    offers = cleanOffers(await res.json());
  } catch (e) { $('cpVerdict').textContent = 'Could not load the offers. Please refresh.'; return; }
  $('cpFine').textContent = 'The list starts small on purpose: every offer was read from the seller’s own public page on the date shown. Prices change by date. Know a package we should add, or spot a mistake? Tell us on WhatsApp via the main site.';
  render();
}
init();
