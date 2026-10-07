import assert from 'node:assert/strict';
import test from 'node:test';
import { createHmac } from 'node:crypto';
import { handleBot, hmacSha256Hex } from '../worker/handlers/bot.js';
import { parseCommand, staysReply, splitReply, parseEnquiry, usableStays } from '../worker/lib/bot-core.js';

const PARTNERS = [
  { id: 'p_milan_heights', name: 'Hotel Milan Heights', zone: 'Almora', area: 'Milan Chowk', verified: 'signed', listingReady: true, bookingMode: 'whatsapp', bookingWhatsapp: '919876543210' },
  { id: 'p_site_stay', name: 'Site Stay', zone: 'Almora', verified: 'signed', listingReady: true, bookingMode: 'website', bookingUrl: 'https://site.example/book' },
  { id: 'p_no_route', name: 'No Route', zone: 'Almora', verified: 'signed', listingReady: true },
  { id: 'p_pending', name: 'Pending', zone: 'Almora', verified: 'researched', listingReady: false, bookingMode: 'whatsapp', bookingWhatsapp: '919876543211' },
];
const ENV = { TELEGRAM_BOT_TOKEN: 't', TELEGRAM_WEBHOOK_SECRET: 'sec', WHATSAPP_TOKEN: 'w', WHATSAPP_PHONE_NUMBER_ID: '123', WHATSAPP_VERIFY_TOKEN: 'ver', WHATSAPP_APP_SECRET: 'appsecret' };

function mkDeps() {
  const ledger = new Map(), sent = [];
  return {
    ledger, sent,
    configured: () => true,
    partners: async () => PARTNERS,
    getCode: async (c) => ledger.get(c) || null,
    createCode: async (c, v) => { if (ledger.has(c)) return false; ledger.set(c, v); return true; },
    updateCode: async (c, v) => { ledger.set(c, { ...ledger.get(c), ...v }); return true; },
    fetch: async (url, init) => { sent.push({ url, body: JSON.parse(init.body), headers: init.headers }); return new Response('{}'); },
  };
}
const tg = (text, chat = 42, secret = 'sec') => new Request('https://w/bot/telegram', { method: 'POST', headers: { 'x-telegram-bot-api-secret-token': secret }, body: JSON.stringify({ message: { chat: { id: chat }, text } }) });

test('only verified stays with a working route are listed, and no number leaks in the list', () => {
  assert.deepEqual(usableStays(PARTNERS).map((p) => p.id), ['p_milan_heights', 'p_site_stay']);
  const r = staysReply(PARTNERS, 'almora');
  assert.match(r, /Hotel Milan Heights/);
  assert.doesNotMatch(r, /9876543210|No Route|Pending/);
  assert.match(staysReply(PARTNERS, 'Delhi'), /No verified stays/);
});

test('command parsing, split and enquiry validation', () => {
  assert.deepEqual(parseCommand('/stays@RoamBot Almora'), { cmd: 'stays', args: ['Almora'], raw: '/stays@RoamBot Almora' });
  assert.match(splitReply(['1000', '3']), /334 each/);
  assert.match(splitReply(['x', '3']), /Use:/);
  assert.ok(parseEnquiry(['p_milan_heights', '2026-11-10', '2', '3']).value);
  assert.ok(parseEnquiry(['p_milan_heights', '2026-13-40', '2', '3']).error);
  assert.ok(parseEnquiry(['p_milan_heights', '2026-11-10', '0', '3']).error);
});

test('telegram: wrong secret is refused, unset secrets mean 501', async () => {
  assert.equal((await handleBot(tg('/help', 1, 'nope'), ENV, 'bot/telegram', mkDeps())).status, 403);
  assert.equal((await handleBot(tg('/help'), {}, 'bot/telegram', mkDeps())).status, 501);
});

test('telegram: enquire registers a code, reply carries the WhatsApp link, /stayed works only from the same chat', async () => {
  const d = mkDeps();
  assert.equal((await handleBot(tg('/enquire p_milan_heights 2026-11-10 2 3', 7), ENV, 'bot/telegram', d)).status, 200);
  const out = d.sent[0];
  assert.match(out.url, /api\.telegram\.org\/bott\/sendMessage/);
  const code = /RW-[A-Z2-9]{6}/.exec(out.body.text)[0];
  assert.match(out.body.text, /https:\/\/wa\.me\/919876543210\?text=/);
  const rec = d.ledger.get(code);
  assert.equal(rec.partnerId, 'p_milan_heights'); assert.equal(rec.source, 'bot'); assert.equal(rec.status, 'enquired');
  assert.doesNotMatch(JSON.stringify(rec), /"7"|chat/);   // no raw chat id stored

  await handleBot(tg('/stayed ' + code + ' yes', 8), ENV, 'bot/telegram', d);      // different chat
  assert.match(d.sent[1].body.text, /could not find/);
  assert.equal(d.ledger.get(code).guestStayed, '');
  await handleBot(tg('/stayed ' + code + ' yes', 7), ENV, 'bot/telegram', d);      // same chat
  assert.match(d.sent[2].body.text, /Recorded that you stayed/);
  assert.equal(d.ledger.get(code).guestStayed, 'yes');
});

test('enquire refuses a stay that is not verified or has no route', async () => {
  const d = mkDeps();
  for (const ref of ['p_pending', 'p_no_route', 'p_unknown']) {
    await handleBot(tg('/enquire ' + ref + ' 2026-11-10 2 3', 99), ENV, 'bot/telegram', d);
    assert.match(d.sent.at(-1).body.text, /not a verified, bookable stay/);
  }
  assert.equal(d.ledger.size, 0);
});

test('whatsapp: handshake, signature check and reply', async () => {
  const d = mkDeps();
  const ok = await handleBot(new Request('https://w/bot/whatsapp?hub.mode=subscribe&hub.verify_token=ver&hub.challenge=abc'), ENV, 'bot/whatsapp', d);
  assert.equal(await ok.text(), 'abc');
  assert.equal((await handleBot(new Request('https://w/bot/whatsapp?hub.mode=subscribe&hub.verify_token=bad&hub.challenge=abc'), ENV, 'bot/whatsapp', d)).status, 403);

  const body = JSON.stringify({ entry: [{ changes: [{ value: { messages: [{ from: '919800000001', type: 'text', text: { body: '/split 900 3' } }] } }] }] });
  const sig = 'sha256=' + createHmac('sha256', 'appsecret').update(body).digest('hex');
  assert.equal(await hmacSha256Hex('appsecret', body), sig.slice(7));
  const bad = await handleBot(new Request('https://w/bot/whatsapp', { method: 'POST', headers: { 'x-hub-signature-256': 'sha256=00' }, body }), ENV, 'bot/whatsapp', d);
  assert.equal(bad.status, 403); assert.equal(d.sent.length, 0);
  const good = await handleBot(new Request('https://w/bot/whatsapp', { method: 'POST', headers: { 'x-hub-signature-256': sig }, body }), ENV, 'bot/whatsapp', d);
  assert.equal(good.status, 200);
  assert.equal(d.sent[0].body.to, '919800000001');
  assert.match(d.sent[0].body.text.body, /300 each/);
  assert.equal(d.sent[0].headers.authorization, 'Bearer w');
});
