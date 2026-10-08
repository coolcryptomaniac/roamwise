import assert from 'node:assert/strict';
import test from 'node:test';
import { checkUser, selectRecipients, buildEmail, signUnsub, verifyUnsub, mergeContent } from '../worker/lib/reminder-core.js';

const DAY = 86400000, NOW = Date.parse('2026-10-08T05:30:00Z');
const u = (o) => ({ id: 'u1', email: 'a@b.com', lastActive: new Date(NOW - 10 * DAY).toISOString(), ...o });

test('inactive 8+ days, valid email, not opted out -> eligible', () => {
  assert.equal(checkUser(u(), NOW).ok, true);
  assert.equal(checkUser(u({ lastActive: new Date(NOW - 8 * DAY).toISOString() }), NOW).ok, true);
});
test('active within 7 days is skipped', () => {
  assert.equal(checkUser(u({ lastActive: new Date(NOW - 6 * DAY).toISOString() }), NOW).reason, 'recently_active');
});
test('missing email, uid-as-email, opt-out, no activity record are skipped', () => {
  assert.equal(checkUser(u({ email: '' }), NOW).reason, 'no_channel');
  assert.equal(checkUser(u({ email: 'u1' }), NOW).reason, 'no_channel');
  assert.equal(checkUser(u({ emailOptOut: true }), NOW).reason, 'opted_out');
  assert.equal(checkUser(u({ lastActive: null }), NOW).reason, 'no_activity_record');
});
test('cooldown and max-in-a-row, with reset after the user returns', () => {
  const sent = new Date(NOW - 5 * DAY).toISOString();
  assert.equal(checkUser(u({ reminderLastSentAt: sent, reminderCount: 1 }), NOW).reason, 'cooldown');
  const old = new Date(NOW - 20 * DAY).toISOString();
  assert.equal(checkUser(u({ lastActive: new Date(NOW - 30 * DAY).toISOString(), reminderLastSentAt: old, reminderCount: 3 }), NOW).reason, 'max_reached');
  /* came back after the 3rd email (lastActive newer than send) and lapsed again -> count resets */
  const r = checkUser(u({ lastActive: new Date(NOW - 15 * DAY).toISOString(), reminderLastSentAt: new Date(NOW - 25 * DAY).toISOString(), reminderCount: 3 }), NOW);
  assert.equal(r.ok, true); assert.equal(r.count, 0);
});
test('selectRecipients sorts longest-inactive first and caps the run', () => {
  const users = [1, 2, 3, 4].map((i) => u({ id: 'x' + i, email: `x${i}@b.com`, lastActive: new Date(NOW - (8 + i) * DAY).toISOString() }));
  const r = selectRecipients(users, NOW, { maxPerRun: 2 });
  assert.deepEqual(r.picked.map((p) => p.user.id), ['x4', 'x3']);
  assert.equal(r.eligible, 4);
});
test('unsubscribe tokens verify only for the right uid and secret', async () => {
  const t = await signUnsub('s3cret', 'u1');
  assert.equal(await verifyUnsub('s3cret', 'u1', t), true);
  assert.equal(await verifyUnsub('s3cret', 'u2', t), false);
  assert.equal(await verifyUnsub('other', 'u1', t), false);
  assert.equal(await verifyUnsub('', 'u1', t), false);
});
test('email has unsubscribe link, escapes names, ignores non-https content URLs', () => {
  const m = buildEmail({ id: 'u1', name: '<b>Mo</b>' }, { items: [{ title: 'T<script>', text: 'x', url: 'javascript:alert(1)' }] }, 'https://api.example/email/unsubscribe?u=u1&t=abc');
  assert.match(m.html, /Unsubscribe/);
  assert.match(m.text, /Unsubscribe: https:\/\/api\.example/);
  assert.doesNotMatch(m.html, /<script>|javascript:/);
  assert.match(m.text, /support@roamwise\.co\.in/);
  assert.equal(mergeContent(null).items.length, 2);
});

test('personalised by last searched destination, generic otherwise, rejects odd destination strings', async () => {
  const { cleanDestination } = await import('../worker/lib/reminder-core.js');
  const a = buildEmail({ id: 'u', lastDestination: 'Manali' }, null, 'https://x/u');
  assert.equal(a.subject, 'Still waiting for your next trip to Manali?');
  assert.match(a.html, /destination=Manali/);
  assert.equal(buildEmail({ id: 'u' }, null, 'https://x/u').subject, 'Planning a trip anytime soon?');
  assert.equal(cleanDestination('<script>x</script>'), '');
  assert.match(buildEmail({ id: 'u', lastDestination: 'Bad<b>' }, null, 'https://x/u').subject, /anytime soon/);
});

test('push preferred when enabled and a device token exists; email fallback; both off -> no channel', async () => {
  const { parseSettings } = await import('../worker/lib/reminder-core.js');
  const withPush = u({ pushTokens: { d1: { token: 'tok' } } });
  assert.equal(checkUser(withPush, NOW, { pushEnabled: true }).channel, 'push');
  assert.equal(checkUser(withPush, NOW, { pushEnabled: false }).channel, 'email');
  assert.equal(checkUser(u({ email: '', pushTokens: { d1: { token: 'tok' } } }), NOW, { pushEnabled: true }).channel, 'push');
  assert.equal(checkUser(u(), NOW, { emailEnabled: false, pushEnabled: false }).reason, 'no_channel');
  assert.equal(checkUser(u({ emailOptOut: true, pushTokens: { d1: { token: 'tok' } } }), NOW, { pushEnabled: true }).channel, 'push');
  const s = parseSettings({ emailEnabled: true, inactiveDays: 1, cooldownDays: 'x' });
  assert.deepEqual(s, { emailEnabled: true, pushEnabled: false, inactiveDays: 3, cooldownDays: 14 });
  assert.deepEqual(parseSettings(null), { emailEnabled: false, pushEnabled: false, inactiveDays: 7, cooldownDays: 14 });
});
test('push text is personalised and short', async () => {
  const { buildPush } = await import('../worker/lib/reminder-core.js');
  assert.equal(buildPush({ id: 'u', lastDestination: 'Manali' }, null).title, 'Still waiting for your next trip to Manali?');
  assert.equal(buildPush({ id: 'u' }, null).title, 'Planning a trip anytime soon?');
});
