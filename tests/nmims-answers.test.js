'use strict';
const test = require('node:test'), assert = require('node:assert');
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
function load() {
  const ctx = { window: {} }; ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(root, 'js/copilot/nmims-answers.js'), 'utf8'), ctx);
  return ctx.rwNmimsAnswer;
}
test('nmims answers route NMIMS and creator questions, ignore trip planning', () => {
  const a = load();
  assert.ok(a('how do I redeem my nmims pass'));
  assert.ok(a('what is startup garage'));
  assert.ok(a('tell me something about nmims'));
  assert.ok(a('I am a travel creator, how do I join'));
  assert.ok(a('I own a homestay and want to list it with creators'));
  assert.strictEqual(a('plan 4 days in goa'), null);
});
test('nmims answers carry no invented numbers', () => {
  const a = load(), h = a('how do I redeem my nmims pass');
  assert.ok(/500/.test(h) || /pass/i.test(h));
});
test('index.html loads new scripts before they are needed', () => {
  const h = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const i = s => h.indexOf('src="' + s + '"');
  assert.ok(i('js/copilot/nmims-answers.js') > 0);
  assert.ok(i('js/copilot/nmims-answers.js') < i('js/copilot/core.js?v=rw-route-quiet-1'));
  assert.ok(i('js/ui/rave-card.js') > 0);
  assert.ok(fs.existsSync(path.join(root, 'assets/audio/rave-to-hell-full.mp3')));
});
test('nmims answer renders into the bubble without cpFinish (regression: bubble stuck on the loading dots)', () => {
  const core = fs.readFileSync(path.join(root, 'js/copilot/core.js'), 'utf8');
  const hook = core.split('\n').find(l => l.includes('rwNmimsAnswer(t)') || l.includes('rwNmimsShow('));
  assert.ok(/rwNmimsShow\(_nmb,_nm\)/.test(core), 'hook uses rwNmimsShow');
  assert.ok(!/cpFinish\(_nmb,_nm/.test(core), 'hook must not use cpFinish with partial intents');
  const ctx = { window: {} }; ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(root, 'js/copilot/nmims-answers.js'), 'utf8'), ctx);
  const bubble = { style: {}, innerHTML: '…', offsetTop: 0, parentNode: { scrollTop: 5 } };
  ctx.rwNmimsShow(bubble, ctx.rwNmimsAnswer('how do I redeem my nmims pass'));
  assert.ok(/NMIMS2026|pass code/i.test(bubble.innerHTML));
  assert.strictEqual(bubble.parentNode.scrollTop, 0);
  assert.ok(hook);
});
test('pass answer and redeem page say no registration is needed and never ask for a pre-registered email', () => {
  const a = load()('how do I redeem my nmims pass');
  assert.ok(/No registration with E-Cell first/i.test(a));
  assert.ok(!/same email/i.test(a));
  const page = fs.readFileSync(path.join(root, 'nmims/redeem/index.html'), 'utf8');
  assert.ok(/No registration first/.test(page));
  assert.ok(!/same email|E-Cell registered/i.test(page));
});
