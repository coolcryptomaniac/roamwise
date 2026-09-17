const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

function load(file, name) {
  const context = { TextEncoder };
  vm.createContext(context);
  vm.runInContext(read(file), context);
  return context[name];
}

const Rules = load('js/admin/rules-center.js', 'RWRulesCenter');
const ControlPlane = load('js/admin/control-plane.js', 'RWAdminControlPlane');

test('Rules Center accepts the canonical full-replacement v17 policy', () => {
  const info = Rules.inspect(read('firestore.rules'));
  assert.equal(info.ok, true);
  assert.equal(info.version, 'v17.0');
  assert.ok(info.lineCount > 1500);
  assert.equal(info.missing.length, 0);
  assert.equal(Rules.downloadName(info), 'roamwise-firestore-rules-v17.0.txt');
});

test('Rules Center fails closed when a privileged block is missing', () => {
  const text = read('firestore.rules').replace('match /admins/{uid}', 'match /removedAdmins/{uid}');
  const info = Rules.inspect(text);
  assert.equal(info.ok, false);
  assert.deepEqual(Array.from(info.missing), ['match /admins/{uid}']);
});

test('admin page displays complete read-only text with mobile copy and txt download controls', () => {
  const html = read('admin/index.html');
  assert.match(html, /id="rulesSource"[^>]*readonly/);
  assert.match(html, /onclick="copyRules\(\)"[^>]*>Copy all/);
  assert.match(html, /onclick="selectRulesText\(\)"[^>]*>Select all/);
  assert.match(html, /onclick="downloadRulesText\(\)"[^>]*>Download \.txt/);
  assert.match(html, /RWRulesCenter\.inspect\(text\)/);
  assert.match(html, /blob=new Blob\(\[text\],\{type:"text\/plain;charset=utf-8"\}\)/);
  assert.doesNotMatch(html, /firebase\.deploy|publishFirestoreRules|setFirestoreRules/);
});

test('every admin navigation action maps to one canonical panel', () => {
  const html = read('admin/index.html');
  const nav = [...html.matchAll(/<button[^>]+data-page="([^"]+)"/g)].map(match => match[1]);
  const sections = [...html.matchAll(/<section id="([^"]+)" class="section(?: on)?"/g)].map(match => match[1]);
  const result = ControlPlane.audit(nav, sections);
  assert.equal(result.ok, true);
  assert.equal(result.capabilityCount, nav.length);
  assert.ok(result.capabilityCount >= 20);
});

test('Android launcher is self-admin-gated and points to the canonical web control plane', () => {
  const shell = read('js/ui/adaptive-shell.js');
  assert.equal(ControlPlane.CANONICAL_URL, 'https://www.roamwise.co.in/admin/');
  assert.match(shell, /collection\('admins'\)\.doc\(u\.uid\)\.get\(\)/);
  assert.match(shell, /if\(!snapshot\.exists\|\|!active\|\|active\.uid!==u\.uid\)return/);
  assert.match(shell, /link\.href=RW_CANONICAL_ADMIN_URL/);
  assert.match(shell, /link\.rel='noopener'/);
});
