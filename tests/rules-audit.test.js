'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { audit } = require('../tools/ai-ops/rules-audit.cjs');

const RULES = `rules_version='2';
service cloud.firestore { match /databases/{d}/documents {
  function statsKeys() { return ['a', 'b']; }
  function statsBump(k) { return true; }
  match /users/{u} { allow read: if true; allow write: if request.auth != null; }
  match /stats/{day} { allow create: if statsBump('a'); }
  match /openbox/{id} { allow create, update: if true; }
} }`;
function files(txt){
  const dir = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'ra-'));
  const f = path.join(dir, 'x.js'); fs.writeFileSync(f, txt); return [f];
}
const ids = f => f.map(x => x.id).sort();

test('flags collections with no rule, untracked counters, counters without a bump, and open writes', () => {
  const r = audit(RULES, files("db.collection('users').get(); db.collection('ghost').add({}); track('zzz'); track('a');"));
  assert.deepEqual(ids(r), ['no-rule:ghost', 'open-write:/openbox/{id}:create,update', 'stats-nobump:b', 'stats-unknown:zzz']);
  assert.equal(r.find(x => x.id === 'no-rule:ghost').level, 'error');
  assert.equal(r.find(x => x.id === 'stats-unknown:zzz').level, 'warn');
});

test('nested collections and dynamic event names are not false alarms', () => {
  const r = audit(RULES, files("db.collection('users').doc(u).collection('anything').get(); track('prefix_' + x); ref.collection('nope');"));
  assert.ok(!ids(r).some(i => /no-rule|stats-unknown/.test(i)), ids(r).join());
});

test('unbalanced braces are an error', () => {
  assert.ok(ids(audit(RULES + '{', [])).includes('braces'));
});

test('the real repo has no NEW drift beyond the accepted baseline', () => {
  const root = path.join(__dirname, '..');
  const base = JSON.parse(fs.readFileSync(path.join(root, 'tools/ai-ops/rules-audit.baseline.json'), 'utf8')).accepted;
  const { execFileSync } = require('node:child_process');
  const out = execFileSync('node', [path.join(root, 'tools/ai-ops/rules-audit.cjs')], { cwd: root }).toString();
  assert.match(out, /0 new error\(s\), 0 new warning\(s\)/);
  assert.ok(base.every(x => /^no-rule:/.test(x)), 'baseline only holds known missing-rule items');
});

test('rules carry the Tusk memory bound and the tuskMisses shape', () => {
  const rules = fs.readFileSync(path.join(__dirname, '..', 'firestore.rules'), 'utf8');
  assert.match(rules, /function tuskMemoryOk\(\)/);
  assert.equal((rules.match(/&& tuskMemoryOk\(\)/g) || []).length, 2, 'create and self-update both check it');
  assert.match(rules, /match \/tuskMisses\/\{slug\}/);
});

test('admin card wires the trip notification switches to the right document and route', () => {
  const root = path.join(__dirname, '..');
  const html = fs.readFileSync(path.join(root, 'admin/index.html'), 'utf8');
  const js = fs.readFileSync(path.join(root, 'js/admin/trip-notify-panel.js'), 'utf8');
  for(const id of ['tnAck', 'tnRem', 'tnMax', 'tnSave', 'tnPreview', 'tnSend']) assert.ok(html.includes('id="' + id + '"'), id);
  assert.match(html, /trip-notify-panel\.js/);
  assert.match(js, /collection\('config'\)\.doc\('tripNotifySettings'\)/);
  assert.match(js, /\/admin\/trip-notify\/run/);
});
