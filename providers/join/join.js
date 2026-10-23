// providers/join/join.js - prepares the application message. Nothing leaves the browser until the person sends it.
import { CATEGORIES, ZONES, validateApplication, applicationMessage } from '../provider-core.mjs';

const WA = '919987379730'; // RoamWise business number (same as packages/catalog.mjs)
const $ = (id) => document.getElementById(id);
function el(tag, cls, text) { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
function checkbox(name, value) { const l = el('label'), i = document.createElement('input'); i.type = 'checkbox'; i.name = name; i.value = value; l.append(i, document.createTextNode(' ' + value)); return l; }

function fillCategories() {
  const sel = $('pjCat'); sel.append(new Option('Choose one', ''));
  Object.keys(CATEGORIES).forEach((k) => sel.append(new Option(CATEGORIES[k].label, k)));
  sel.addEventListener('change', fillDocs);
  ZONES.forEach((z) => $('pjZones').append(checkbox('zone', z)));
}
function fillDocs() {
  const box = $('pjDocs'); box.querySelectorAll('label').forEach((n) => n.remove());
  const c = CATEGORIES[$('pjCat').value];
  $('pjDocHint').textContent = c ? 'You can apply without these and send them later.' : 'Choose what you offer to see the documents we check.';
  if (c) c.docs.forEach((d) => box.append(checkbox('doc', d)));
}
function read(form) {
  const fd = new FormData(form), f = {};
  ['name', 'business', 'category', 'phone', 'email', 'website', 'instagram', 'price', 'about'].forEach((k) => { f[k] = fd.get(k) || ''; });
  f.zones = fd.getAll('zone'); f.docs = fd.getAll('doc'); f.consent = fd.get('consent') === 'on';
  return f;
}

function init() {
  fillCategories(); fillDocs();
  const form = $('pjForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const r = validateApplication(read(form));
    if (!r.ok) { $('pjMsg').textContent = r.errors.join(' '); $('pjOut').hidden = true; return; }
    $('pjMsg').textContent = '';
    const text = applicationMessage(r.record);
    $('pjText').textContent = text; $('pjOut').hidden = false;
    $('pjWa').href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(text);
    $('pjOut').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  $('pjCopy').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText($('pjText').textContent); $('pjCopy').textContent = 'Copied'; } catch (e) { $('pjCopy').textContent = 'Select the text above and copy'; }
  });
}
init();
