import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { scan, checkOutreach, checkTeamUpdate } from '../tools/outreach/mail-guard.mjs';
import { pickNext } from '../tools/outreach/rings.mjs';

const { campaigns } = JSON.parse(readFileSync(new URL('../outreach/campaigns.json', import.meta.url), 'utf8'));
const milan = campaigns.find((c) => c.id === 'milan-heights');
const sig = '\n\nRegards,\nMohit Pandey\nFounder, RoamWise\nroamwise.co.in | support@roamwise.co.in\nAlmora, Uttarakhand, India';
const good = () => ({ to: ['creator@example.com'], subject: 'Collab with Milan Heights, Milan Chowk, Almora (via RoamWise)',
  body: 'Hi Asha,\n\nI am Mohit Pandey, Founder of RoamWise. We are partnering with Milan Heights, a hotel with restaurant in Milan Chowk, Almora.\n\nI liked your video on bhatt ki churkani. If you are interested, message the Milan Heights team on WhatsApp at +91 73023 15845 and write "food vlogger collab through RoamWise".\n\nRegister here: https://www.roamwise.co.in/creators/match.html?role=creator&invite=founding\n\nIf this is not relevant, just reply "no" and I will not write again.' + sig });
const team = () => ({ to: ['support@roamwise.co.in'], subject: 'RoamWise Daily Update | 24 Oct 2026',
  body: 'Team,\n\nPlease find today\'s update.\n\nSHIPPED\n- The Uttarakhand map now has a district carousel.\n\nOPEN ITEMS\n- Deepanshi: share the MOU status.\n\nRegards,\nRoamWise Operations\nOn behalf of Mohit Pandey, Founder\nInternal: for the RoamWise team only. Please do not forward.' });
const rules = (r) => r.problems.map((x) => x.rule);

test('guard: a well-formed outreach email passes', () => { const r = checkOutreach(good(), milan); assert.deepEqual(r.problems, []); assert.equal(r.ok, true); });

test('guard: outreach blocks extra recipients, CC/BCC, wrong subject, missing opt-out and signature', () => {
  const m = good(); m.to.push('b@x.com'); m.cc = ['c@x.com']; m.subject = 'Hello'; m.body = m.body.replace(/If this is not relevant[^\n]*/, '').replace('Founder, RoamWise', 'RoamWise');
  const r = rules(checkOutreach(m, milan)); ['recipients', 'cc-bcc', 'subject-format', 'opt-out', 'signature'].forEach((x) => assert.ok(r.includes(x), x));
});

test('guard: outreach blocks money, promises, funding talk, other phone numbers, other emails and external links', () => {
  const m = good(); m.body = m.body.replace('I liked', 'We pay Rs 5000 and offer a free stay. Our investors and burn are healthy. Call 9876543210 or mail boss@gmail.com, see https://evil.example/x. I liked');
  const r = rules(checkOutreach(m, milan)); ['money', 'promise', 'confidential-word', 'phone-number', 'email-address', 'external-link'].forEach((x) => assert.ok(r.includes(x), x));
});

test('guard: an inactive draft campaign with no WhatsApp can never send', () => {
  const art = campaigns.find((c) => c.id === 'natasha-art');
  assert.equal(art.active, false); assert.ok(rules(checkOutreach(good(), art)).includes('campaign-whatsapp'));
});

test('guard: team update passes when clean and is blocked for money, funding, salaries, contacts and wrong recipients', () => {
  assert.deepEqual(checkTeamUpdate(team()).problems, []);
  const m = team(); m.to = ['support@roamwise.co.in', 'intern@gmail.com']; m.cc = ['x@y.com'];
  m.body = m.body.replace('SHIPPED', 'Revenue is Rs 600, intern burn is 14K, 2 investor commitments, Rs 15L angel. WhatsApp 9876543210.\nSHIPPED');
  const r = rules(checkTeamUpdate(m)); ['recipients', 'cc-bcc', 'money', 'confidential-word', 'phone-number'].forEach((x) => assert.ok(r.includes(x), x));
  const bad = team(); bad.subject = 'update'; bad.body = bad.body.replace('Team,', 'Hi all,').replace('On behalf of Mohit Pandey, Founder', '');
  ['subject-format', 'greeting', 'signature'].forEach((x) => assert.ok(rules(checkTeamUpdate(bad)).includes(x), x));
});

test('guard: secrets and ID numbers are caught', () => {
  const found = scan('key AIzaSyDlrtpzpOb1VEmVSd9tHmu7OpmvwWosYsU and ghp_abcdefghijklmnopqrstuvwxyz123456 and ABCDE1234F').map((x) => x.rule);
  assert.ok(found.includes('api key') && found.includes('github token') && found.includes('pan'));
  assert.deepEqual(scan('Plan the trip to Almora with 90 km of hills.'), []);
});

test('outreach: maxKm 90 keeps food-vlogger and painting promotions within 90 km, straight line', () => {
  const mk = (id, city) => ({ id, baseCity: city, baseConfirmed: true, email: id + '@x.com', status: 'pending', niches: ['food'], sentFor: [] });
  const camp = { ...milan, niches: ['food'] };
  assert.equal(camp.maxKm, 90);
  const r = pickNext([mk('kausani', 'kausani'), mk('haldwani', 'haldwani'), mk('dehradun', 'dehradun'), mk('delhi', 'delhi'), mk('unknown', 'atlantis')], 10, camp);
  assert.deepEqual(r.map((x) => x.id), ['kausani', 'haldwani']);
  r.forEach((x) => assert.ok(x.km <= 90));
  assert.equal(pickNext([mk('delhi', 'delhi')], 3, { ...camp, maxKm: 0 }).length, 1);
  campaigns.filter((c) => c.id === 'natasha-art' || c.id === 'milan-heights').forEach((c) => assert.equal(c.maxKm, 90));
});

test('guard CLI: exit 0 for a clean message, 1 when blocked, 2 on bad input (relative path works)', async () => {
  const { spawnSync } = await import('node:child_process'); const { writeFileSync, mkdtempSync } = await import('node:fs'); const { tmpdir } = await import('node:os'); const { join } = await import('node:path');
  const d = mkdtempSync(join(tmpdir(), 'mg-')), ok = join(d, 'ok.json'), no = join(d, 'no.json'); const root = new URL('..', import.meta.url).pathname;
  writeFileSync(ok, JSON.stringify(good())); const bad = good(); bad.body += '\nOur revenue is Rs 600.'; writeFileSync(no, JSON.stringify(bad));
  const run = (f) => spawnSync('node', ['tools/outreach/mail-guard.mjs', 'outreach', f, 'milan-heights'], { cwd: root });
  assert.equal(run(ok).status, 0); assert.equal(run(no).status, 1); assert.equal(run(join(d, 'missing.json')).status, 2);
  assert.equal(spawnSync('node', ['tools/outreach/mail-guard.mjs', 'wat', ok], { cwd: root }).status, 2);
});
