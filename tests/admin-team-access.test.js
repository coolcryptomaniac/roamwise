const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const context = {};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'js/admin/team-access.js'), 'utf8'), context);
const Team = context.RWTeamAccess;

test('team access requires the real Firebase UID and a name', () => {
  assert.equal(Team.normalise({ name: 'A' }).ok, false);
  assert.equal(Team.normalise({ uid: 'uid-1' }).ok, false);
});

test('team access normalises a live least-privilege record', () => {
  const out = Team.normalise({ uid: ' uid-1 ', name: ' Person ', email: 'A@EXAMPLE.COM', role: 'finance' });
  assert.equal(out.ok, true);
  assert.equal(out.member.uid, 'uid-1');
  assert.equal(out.member.email, 'a@example.com');
  assert.equal(out.member.role, 'finance');
  assert.equal(out.member.accessActive, true);
});

test('unknown roles fail closed to none', () => {
  const out = Team.normalise({ uid: 'uid-1', name: 'Person', role: 'superuser' });
  assert.equal(out.member.role, 'none');
  assert.equal(out.member.accessActive, false);
});

test('offboarding retires only matching referral identities and preserves rows', () => {
  const refs = [
    { code: 'A', name: 'Adarsh', active: true, note: 'Engineering intern' },
    { code: 'B', name: 'Someone else', active: true }
  ];
  const out = Team.retireMatchingReferrers(refs, { name: 'Adarsh', email: 'adarsh@example.com' });
  assert.equal(out.changed, true);
  assert.equal(out.list.length, 2);
  assert.equal(out.list[0].active, false);
  assert.equal(out.list[1].active, true);
});

test('admin page writes an immutable audit event and never deletes employment history', () => {
  const html = fs.readFileSync(path.join(root, 'admin/index.html'), 'utf8');
  assert.match(html, /action:'staff_offboarded'/);
  assert.match(html, /role:'none',roles:\[\],status:'offboarded',accessActive:false/);
  assert.doesNotMatch(html, /collection\('staff'\)\.doc\(uid\)\.delete/);
});
