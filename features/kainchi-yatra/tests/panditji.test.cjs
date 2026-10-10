const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');
const repo = path.resolve(__dirname, '../../..');
const feature = path.join(repo, 'features/kainchi-yatra');
const read = file => fs.readFileSync(path.join(feature, file), 'utf8');
function rigFactory(seed = 7) {
  const sandbox = { window: { RWKainchiUI: {} }, Math };
  vm.runInNewContext(read('ui/panditji-physics.js'), sandbox);
  let n = seed; const rnd = () => (n = (n * 16807) % 2147483647) / 2147483647;
  return sandbox.window.RWKainchiUI.panditRig(rnd);
}
function run(rig, seconds, input) { let peak = 0; for (let i = 0; i < seconds * 60; i += 1) { rig.update(1 / 60, input); peak = Math.max(peak, Math.abs(rig.state.beard.x)); } return peak; }
test('rig: idle is subtle, pokes swing the beard and mala, motion settles, speech opens the jaw and shifts the chin', () => {
  const rig = rigFactory(), out = [0, 0];
  assert.ok(run(rig, 20, { attn: 0 }) < 0.2);
  rig.impulse('beard'); const swing = run(rig, 2, { attn: 0 }); assert.ok(swing > 0.5 && swing <= 1.6);
  rig.impulse('mala'); run(rig, 6, { attn: 0 }); assert.ok(Math.abs(rig.state.tassel.x) < 0.2, 'tassel settles');
  rig.displace(386, 240, out); const before = out[1];
  let jaw = 0; for (let i = 0; i < 180; i += 1) { rig.update(1 / 60, { speaking: true, attn: 0 }); jaw = Math.max(jaw, rig.state.jaw.x); }
  assert.ok(jaw > 0.6, 'jaw opens while speaking');
  rig.state.jaw.x = 1; rig.displace(386, 240, out); assert.ok(out[1] - before > 5, 'chin moves down');
  rig.state.jaw.x = 0; rig.state.lid.x = 0; rig.displace(425, 148, out); const open = out[1]; rig.state.lid.x = 1; rig.displace(425, 148, out); assert.ok(out[1] > open, 'blink lowers the upper lid');
  rig.displace(100, 780, out); assert.ok(Math.abs(out[0]) < 0.01, 'lap stays planted');
});
test('rig: gaze turns the head, flowers phase throws bounded marigold petals that fall away', () => {
  const rig = rigFactory(); for (let i = 0; i < 120; i += 1) rig.update(1 / 60, { gx: 1, attn: 1 });
  assert.ok(rig.state.yaw.x > 0.7);
  let peak = 0; for (let i = 0; i < 240; i += 1) { rig.update(1 / 60, { running: true, phase: 'flowers' }); peak = Math.max(peak, rig.petals.length); }
  assert.ok(peak > 5 && peak <= 40);
  for (let i = 0; i < 900; i += 1) rig.update(1 / 60, { running: false }); assert.equal(rig.petals.length, 0);
});
test('brain strings keep English/Hindi parity, cover every intent, phase and action, and never state live facts', () => {
  const sandbox = { globalThis: null }; sandbox.globalThis = sandbox; vm.runInNewContext(read('data/strings-panditji.js'), sandbox);
  const data = sandbox.RWKainchiPandit, en = data.en, hi = data.hi;
  assert.deepEqual(Object.keys(en).sort(), Object.keys(hi).sort());
  for (const key of Object.keys(en)) { assert.equal(typeof en[key], typeof hi[key]); if (Array.isArray(en[key])) assert.equal(en[key].length, hi[key].length, key); assert.ok(JSON.stringify(hi[key]).length > 4); }
  for (const it of data.intents) { assert.ok(it.id === 'joke' ? en.jokes.length >= 6 : en['r_' + it.id], it.id); for (const act of it.acts || []) assert.ok(en['act_' + act], act); assert.ok(it.words.length >= 4); }
  assert.ok(en.r_fallback && en.r_empty); data.chips.forEach(c => assert.ok(en['chip_' + c]));
  for (const phase of ['welcome', 'sankalp', 'invocation', 'flowers', 'dhoop', 'diya', 'mantra', 'aarti', 'prasad', 'shanti', 'blessing']) assert.ok(en['phase_' + phase] && hi['phase_' + phase], phase);
  for (const id of ['crowd', 'rates', 'dates', 'weather']) for (const lang of [en, hi]) assert.doesNotMatch(lang['r_' + id].join(' '), /[0-9०-९]/, id + ' must not invent figures');
  assert.match(en.r_emergency[0], /112/); assert.match(en.r_emergency[0], /108/); assert.equal(data.intents[0].id, 'emergency');
});
function boot(lang) {
  const html = fs.readFileSync(path.join(repo, 'kainchi/index.html'), 'utf8');
  const dom = new JSDOM(html, { url: 'https://roamwise.co.in/kainchi/', runScripts: 'outside-only' }), w = dom.window;
  Object.defineProperty(w.navigator, 'language', { value: lang || 'en-IN' });
  w.fetch = async () => ({ ok: true, text: async () => fs.readFileSync(path.join(feature, 'data/daily.json'), 'utf8') });
  w.setInterval = () => 0; w.print = () => {}; w.localStorage.setItem('rwPro', '1');
  for (const tag of w.document.querySelectorAll('script[src]')) w.eval(fs.readFileSync(path.resolve(repo, 'kainchi', tag.getAttribute('src')), 'utf8'));
  return dom;
}
function ask(d, text) {
  const doc = d.window.document, root = doc.querySelector('#standard-ritual .pandit-ask'), input = root.querySelector('input');
  input.value = text; root.querySelector('form').dispatchEvent(new d.window.Event('submit', { cancelable: true })); return root.querySelector('.pandit-bubble');
}
test('Ask Panditji answers offline, defers live facts to official notices, offers emergency calls and treats input as text', () => {
  const d = boot(), doc = d.window.document;
  d.window.document.getElementById('aarti-toggle').click();
  const panel = doc.querySelector('#standard-ritual .pandit-ask'); assert.ok(panel); assert.match(panel.querySelector('.pandit-bubble').textContent, /Namaste|Early start|late|Shubh|slow breath/);
  assert.equal(panel.querySelector('.pandit-bubble').getAttribute('role'), 'status');
  let bubble = ask(d, 'How crowded is it and is parking full?'); assert.match(bubble.textContent, /cannot see live crowds/); assert.ok(bubble.querySelector('a[href="#plan"]')); assert.ok(bubble.querySelector('a[href="#today"]'));
  bubble = ask(d, 'what is the ticket price?'); assert.match(bubble.textContent, /do not quote prices/); assert.ok(bubble.querySelector('a[href="#help"]'));
  bubble = ask(d, 'someone had an accident, call ambulance'); assert.ok(bubble.querySelector('a[href="tel:112"]')); assert.ok(bubble.querySelector('a[href="tel:108"]'));
  bubble = ask(d, 'tell me a joke'); assert.ok(bubble.textContent.length > 20);
  bubble = ask(d, '<img src=x onerror=alert(1)> xyzzy'); assert.equal(doc.querySelector('#standard-ritual img[src=x]'), null); assert.match(bubble.textContent, /beyond my little brain|knows only a few/);
  bubble = ask(d, '   '); assert.match(bubble.textContent, /Type a few words/);
  bubble = ask(d, 'is this a real priest?'); assert.match(bubble.textContent, /not a real priest/);
  assert.doesNotMatch(JSON.stringify(d.window.localStorage), /ambulance|joke/);
  d.window.close();
});
test('Ask Panditji speaks Hindi, reacts to pokes and ritual phases, and the portrait falls back to the photo without WebGL', () => {
  const d = boot('hi-IN'), doc = d.window.document; d.window.document.getElementById('aarti-toggle').click();
  const fig = doc.querySelector('#standard-ritual .pandit-figure'); assert.equal(fig.getAttribute('data-mode'), 'static'); assert.equal(fig.querySelector('canvas'), null);
  assert.match(doc.querySelector('#standard-ritual .pandit-ask-title').textContent, /पंडित जी/);
  assert.match(ask(d, 'भीड़ कितनी है').textContent, /लाइव भीड़/);
  const bubble = doc.querySelector('#standard-ritual .pandit-bubble'); fig.dispatchEvent(new d.window.MouseEvent('pointerdown', { bubbles: true, clientX: 1, clientY: 1 }));
  assert.ok(bubble.textContent.length > 8); assert.ok(['body', 'face'].some(r => fig.panditji.region(390, 100) === 'face' && r));
  assert.equal(fig.panditji.region(390, 100), 'face'); assert.equal(fig.panditji.region(388, 260), 'beard'); assert.equal(fig.panditji.region(335, 380), 'mala'); assert.equal(fig.panditji.region(390, 400), 'hands'); assert.equal(fig.panditji.region(60, 700), 'body');
  doc.getElementById('standard-ritual').querySelector('[data-ritual-action="start"]').click();
  assert.match(bubble.textContent, /साँस/); d.window.close();
});
