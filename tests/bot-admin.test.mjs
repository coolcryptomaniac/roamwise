import assert from 'node:assert/strict';
import test from 'node:test';
import { handleBot } from '../worker/handlers/bot.js';
import { sendAdminDigest } from '../worker/handlers/bot-admin.js';
import { parseJoin } from '../worker/lib/bot-core.js';

const ENV = { TELEGRAM_BOT_TOKEN: 't', TELEGRAM_WEBHOOK_SECRET: 'sec', BOT_ADMIN_TELEGRAM: '111', BOT_ADMIN_WHATSAPP: '919800000001', WHATSAPP_TOKEN: 'w', WHATSAPP_PHONE_NUMBER_ID: '9' };
function deps() {
  const ledger = new Map(), leads = new Map(), sent = [];
  ledger.set('RW-AAAAAA', { code: 'RW-AAAAAA', partnerId: 'p_milan_heights', status: 'enquired', guestStayed: 'yes', createdAt: new Date().toISOString() });
  return {
    ledger, leads, sent, configured: () => true, partners: async () => [],
    getCode: async (c) => ledger.get(c) || null,
    createCode: async (c, v) => { ledger.set(c, v); return true; },
    updateCode: async (c, v) => { ledger.set(c, { ...ledger.get(c), ...v }); return true; },
    list: async (col) => (col === 'stayLedger' ? [...ledger.values()] : [...leads.values()]),
    createLead: async (id, v) => { if (leads.has(id)) return false; leads.set(id, v); return true; },
    fetch: async (url, init) => { sent.push({ url, body: JSON.parse(init.body) }); return new Response('{}'); },
  };
}
const tg = (text, chat) => new Request('https://w/bot/telegram', { method: 'POST', headers: { 'x-telegram-bot-api-secret-token': 'sec' }, body: JSON.stringify({ message: { chat: { id: chat }, text } }) });
const say = async (d, text, chat) => { await handleBot(tg(text, chat), ENV, 'bot/telegram', d); return d.sent.at(-1).body.text; };

test('parseJoin validates GSTIN checksum, UPI and rooms', () => {
  assert.ok(parseJoin('/join Sunrise Homestay, Almora, 6, 27AAPFU0939F1ZV, owner@okhdfc, 9876543210').value.gstin === '27AAPFU0939F1ZV');
  assert.match(parseJoin('/join Sunrise, Almora, 6, 27AAPFU0939F1ZX, none').error, /GSTIN/);
  assert.match(parseJoin('/join Sunrise, Almora, 6, none, bad upi').error, /UPI/);
  assert.match(parseJoin('/join Sunrise, Almora, zero, none, none').error, /Rooms/);
  assert.equal(parseJoin('/join Sunrise Stay, Almora, 6, none, none').value.gstin, '');
});

test('/join on Telegram needs a phone; saves a lead without any raw chat id', async () => {
  const d = deps();
  assert.match(await say(d, '/join Sunrise Stay, Almora, 6, none, none', 5), /WhatsApp number/);
  assert.match(await say(d, '/join Sunrise Stay, Almora, 6, none, none, 9876543210', 5), /saved your property/);
  const lead = [...d.leads.values()][0];
  assert.equal(lead.contact, '9876543210'); assert.equal(lead.status, 'new');
  assert.doesNotMatch(JSON.stringify(lead), /"5"/);
});

test('admin commands work only for whitelisted chats and look like unknown commands to others', async () => {
  const d = deps();
  assert.match(await say(d, '/admin leads', 222), /did not understand/);
  assert.match(await say(d, '/admin leads', 111), /No open property leads/);
  assert.equal(d.ledger.get('RW-AAAAAA').status, 'enquired');
  await say(d, '/admin settle RW-AAAAAA completed 4500', 222);
  assert.equal(d.ledger.get('RW-AAAAAA').status, 'enquired');           // refused for non-admin
  assert.match(await say(d, '/admin settle RW-AAAAAA completed 4500', 111), /Recorded RW-AAAAAA as completed/);
  const rec = d.ledger.get('RW-AAAAAA');
  assert.deepEqual([rec.status, rec.amount, rec.settledBy, rec.commissionPct], ['completed', 4500, 'admin', 7]);
  assert.match(await say(d, '/admin statement ' + new Date().toISOString().slice(0, 7), 111), /Total fee Rs 315/);   // 7% of 4500, no GST (not registered)
});

test('daily digest goes to every configured admin chat', async () => {
  const d = deps();
  const r = await sendAdminDigest(ENV, d, new Date('2026-10-07T00:00:00Z'));
  assert.equal(r.sent, 2);
  assert.ok(d.sent.some((s) => /telegram/.test(s.url) && s.body.chat_id === '111'));
  assert.ok(d.sent.some((s) => /graph\.facebook/.test(s.url) && s.body.to === '919800000001'));
  assert.match(r.text, /daily digest/);
});
