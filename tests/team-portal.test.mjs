import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { handleTeam } from '../worker/handlers/team-portal.js';

/* A D1-shaped wrapper over in-memory SQLite, with the real migration applied. */
function d1() {
  const db = new DatabaseSync(':memory:');
  db.exec(fs.readFileSync(new URL('../worker/migrations/0002_team.sql', import.meta.url), 'utf8'));
  return { prepare(sql) { const st = db.prepare(sql); let args = []; const api = {
    bind(...a) { args = a.map((x) => (x === undefined ? null : x)); return api; },
    async run() { const r = st.run(...args); return { meta: { changes: r.changes } }; },
    async first() { return st.get(...args) || null; },
    async all() { return { results: st.all(...args) }; } }; return api; } };
}
const people = { a: { uid: 'u-saumya', email: 'saumya@example.com', name: 'Saumya' }, b: { uid: 'u-other', email: 'other@example.com', name: 'Other' } };
const deps = (admin = false) => ({ verifyIdToken: async (t) => ({ uid: people[t].uid, email: people[t].email, email_verified: true, name: people[t].name }), isAdmin: async () => admin, sendMail: async () => {} });
const req = (path, who, body) => new Request('https://x/' + path, { method: body ? 'POST' : 'GET', headers: Object.assign(who ? { authorization: 'Bearer ' + who } : {}, body ? { 'content-type': 'application/json' } : {}), body: body ? JSON.stringify(body) : undefined });
async function call(env, path, who, body, admin) { const r = await handleTeam(req(path, who, body), env, path, deps(admin)); return { status: r.status, body: await r.json() }; }

test('offer -> onboarding -> active -> pay -> exit, end to end', async () => {
  const env = { DB: d1() };
  assert.equal((await call(env, 'team/me', null)).status, 401);
  assert.equal((await call(env, 'team/me', 'a')).body.error, 'not_member');

  const inv = await call(env, 'team/admin/invite', null, { email: 'Saumya@example.com', name: 'Saumya', role_title: 'Finance & Strategy Intern', kind: 'intern', track: 'finance', stipend_monthly: '', start_date: '2026-12-01', end_date: '2027-02-28' }, true);
  assert.equal(inv.status, 200);
  let me = await call(env, 'team/me', 'a');
  assert.equal(me.body.member.status, 'offered');
  assert.equal(me.body.member.uid, 'u-saumya', 'invite is linked on first sign-in by email');

  await call(env, 'team/accept', 'a', { what: 'offer' });
  await call(env, 'team/accept', 'a', { what: 'nda' });
  await call(env, 'team/accept', 'a', { what: 'policy' });
  assert.equal((await call(env, 'team/upi', 'a', { upi: 'not a upi' })).status, 400);
  me = await call(env, 'team/upi', 'a', { upi: 'saumya@okaxis' });
  assert.equal(me.body.member.status, 'active', 'all four onboarding steps make the member active');

  const id = me.body.member.id;
  await call(env, 'team/admin/task', null, { member_id: id, title: 'Build a 12-month budget model', due: '2026-12-10' }, true);
  await call(env, 'team/admin/pay', null, { member_id: id, kind: 'bonus', amount: 1500, period: '2026-12', status: 'paid', utr: 'UTR123' }, true);
  me = await call(env, 'team/me', 'a');
  assert.equal(me.body.totals.paid, 1500);
  const task = me.body.tasks[0];
  me = await call(env, 'team/task', 'a', { id: task.id });
  assert.equal(me.body.tasks[0].status, 'done');
  me = await call(env, 'team/log', 'a', { day: '2026-12-02', hours: 3, summary: 'Competitor pricing sheet' });
  assert.equal(me.body.logs.length, 1);

  me = await call(env, 'team/exit', 'a', { lastDay: '2027-02-28', reason: 'Exams' });
  assert.equal(me.body.member.status, 'exiting');
  assert.ok(me.body.events.length >= 6, 'every step is on the timeline');
});

test('members cannot touch pay, status or other people, and need the founder for admin routes', async () => {
  const env = { DB: d1() };
  await call(env, 'team/apply', 'b', { name: 'Other', track: 'marketing' });
  assert.equal((await call(env, 'team/admin/list', 'b', null, false)).status, 403);
  assert.equal((await call(env, 'team/admin/pay', 'b', { member_id: 'x', kind: 'bonus', amount: 9999 }, false)).status, 403);
  const me = await call(env, 'team/me', 'b');
  assert.equal(me.body.member.status, 'applied');
  assert.equal(me.body.member.note, undefined, 'private founder notes are not returned to members');
  assert.equal((await call(env, 'team/accept', 'b', { what: 'offer' })).status, 409, 'no offer to accept yet');
  assert.equal((await call(env, 'team/log', 'b', { day: '2026-12-02', summary: 'x' })).status, 409, 'applicants cannot log work');
  const list = await call(env, 'team/admin/list', null, null, true);
  assert.equal(list.body.members.length, 1);
});

test('without D1 the portal says so instead of failing', async () => {
  const r = await handleTeam(req('team/me', 'a'), {}, 'team/me', deps());
  assert.equal(r.status, 503);
});
