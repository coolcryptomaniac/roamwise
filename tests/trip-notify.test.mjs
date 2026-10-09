import assert from 'node:assert/strict';
import test from 'node:test';
import { parseTripSettings, needsAck, reminderDue, buildAckEmail, buildReminder, dateOnlyDay } from '../worker/lib/trip-notify-core.js';
import { sendMail, mailerKind } from '../worker/lib/mailer.js';

const NOW = Date.parse('2026-10-09T05:30:00Z'); /* 11:00 IST on 9 Oct */
const bk = (o) => ({ id: 'b1', status: 'requested', guestEmail: 'g@x.com', guestName: 'Asha Rawat', guestUid: 'u1', property: 'Binsar Ridge', room: 'Valley', checkIn: '2026-10-12', checkOut: '2026-10-14', guests: 2, amount: 6400, ref: 'RW-1', createdAt: new Date(NOW - 3600000).toISOString(), ...o });

test('settings default OFF and clamp the email budget', () => {
  assert.deepEqual(parseTripSettings(null), { ackEmail: false, reminders: false, maxEmailsPerRun: 40 });
  assert.equal(parseTripSettings({ ackEmail: true, maxEmailsPerRun: 5000 }).maxEmailsPerRun, 90);
  assert.equal(parseTripSettings({ ackEmail: 'yes' }).ackEmail, false);
});
test('ack: only fresh requested bookings with a valid email, once', () => {
  assert.equal(needsAck(bk(), NOW), true);
  assert.equal(needsAck(bk({ ackEmailAt: 'x' }), NOW), false);
  assert.equal(needsAck(bk({ guestEmail: 'nope' }), NOW), false);
  assert.equal(needsAck(bk({ status: 'confirmed' }), NOW), false);
  assert.equal(needsAck(bk({ createdAt: new Date(NOW - 5 * 86400000).toISOString() }), NOW), false, 'no mass-mail of old bookings');
});
test('reminders: 3 days and 1 day before check-in (India date), once each, confirmed only', () => {
  assert.equal(reminderDue(bk({ status: 'confirmed' }), NOW), 'r3');
  assert.equal(reminderDue(bk({ status: 'confirmed', checkIn: '2026-10-10' }), NOW), 'r1');
  assert.equal(reminderDue(bk({ status: 'confirmed', remind3At: 'x' }), NOW), null);
  assert.equal(reminderDue(bk({ status: 'confirmed', checkIn: '2026-10-10', remind1At: 'x' }), NOW), null);
  assert.equal(reminderDue(bk({ status: 'confirmed', checkIn: '2026-10-20' }), NOW), null);
  assert.equal(reminderDue(bk({ status: 'confirmed', checkIn: '2026-10-08' }), NOW), null, 'past stay');
  assert.equal(reminderDue(bk({ status: 'declined' }), NOW), null);
  assert.equal(reminderDue(bk({ status: 'confirmed', guestUid: '' }), NOW), null);
  assert.equal(dateOnlyDay('garbage'), null);
});
test('IST day boundary: 23:30 UTC on 8 Oct is already 9 Oct in India', () => {
  const late = Date.parse('2026-10-08T23:30:00Z');
  assert.equal(reminderDue(bk({ status: 'confirmed', checkIn: '2026-10-12' }), late), 'r3');
});
test('ack email says request-not-confirmation and escapes HTML', () => {
  const m = buildAckEmail(bk({ guestName: '<b>Evil</b>', property: '<script>x</script>' }));
  assert.match(m.text, /not a confirmed booking/);
  assert.match(m.html, /not a confirmed booking/);
  assert.ok(!m.html.includes('<script>') && !m.html.includes('<b>Evil</b>'));
  assert.match(m.subject, /RW-1/);
});
test('reminder copy differs for r3 and r1 and stays short for push', () => {
  const a = buildReminder(bk(), 'r3'), b = buildReminder(bk(), 'r1');
  assert.match(a.push.body, /in 3 days/); assert.match(b.push.body, /tomorrow/);
  assert.ok(a.push.body.length <= 200 && a.push.url.startsWith('https://'));
  assert.notEqual(a.email.subject, b.email.subject);
});

test('mailer: gmail relay preferred, cap and errors reported, secret sent in body only', async () => {
  const real = globalThis.fetch; let seen;
  try {
    const env = { GMAIL_RELAY_URL: 'https://script.google.com/x/exec', GMAIL_RELAY_SECRET: 's', RESEND_API_KEY: 'r' };
    assert.equal(mailerKind(env), 'gmail');
    assert.equal(mailerKind({ RESEND_API_KEY: 'r' }), 'resend');
    assert.equal(mailerKind({}), null);
    globalThis.fetch = async (u, init) => { seen = { u, init }; return new Response(JSON.stringify({ ok: true })); };
    assert.deepEqual(await sendMail(env, { to: 'a@b.com', subject: 's', html: 'h', text: 't' }), { ok: true });
    assert.equal(seen.u, env.GMAIL_RELAY_URL);
    assert.ok(!JSON.stringify(seen.init.headers).includes('"s"'));
    globalThis.fetch = async () => new Response(JSON.stringify({ ok: false, reason: 'cap' }));
    assert.deepEqual(await sendMail(env, { to: 'a@b.com', subject: 's' }), { ok: false, reason: 'cap' });
    globalThis.fetch = async () => { throw new Error('net'); };
    assert.deepEqual(await sendMail(env, { to: 'a@b.com', subject: 's' }), { ok: false, reason: 'error' });
    assert.deepEqual(await sendMail({}, { to: 'a@b.com', subject: 's' }), { ok: false, reason: 'not_configured' });
  } finally { globalThis.fetch = real; }
});
