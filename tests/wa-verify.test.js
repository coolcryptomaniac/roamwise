'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { webcrypto } = require('node:crypto');

const ROOT = path.join(__dirname, '..');
const code = fs.readFileSync(path.join(ROOT, 'js/social/wa-verify.js'), 'utf8');

function makeEnv(opts = {}) {
  const opened = [];
  const writes = [];
  const toasts = [];
  const cards = { html: '' };
  const listeners = {};
  const overlay = { classList: { contains: () => opts.overlayOpen !== false } };
  const ctx = {
    console, Uint8Array, encodeURIComponent, String, Number, Date, Math,
    AUTH_READY: opts.authReady !== false,
    crypto: webcrypto,
    RW_CONFIG: opts.config || { whatsapp: { botNumber: '919987379730' } },
    document: {
      getElementById: (id) => id === 'rwWaCard' ? { set innerHTML(v) { cards.html = v; }, get innerHTML() { return cards.html; } }
        : id === 'profOverlay' ? overlay : id === 'tripStart' ? { value: '2026-11-02' } : null,
    },
    firebase: {
      auth: () => ({ currentUser: opts.uid === null ? null : { uid: opts.uid || 'u1' } }),
      firestore: { FieldValue: { serverTimestamp: () => '__TS__' } },
    },
    db: {
      collection: (name) => ({
        doc: (id) => ({
          set: (data) => { if (opts.failWrite) return Promise.reject(new Error('denied')); writes.push({ name, id, data }); return Promise.resolve(); },
          onSnapshot: (ok, err) => { listeners[name + '/' + id] = { ok, err }; return () => { listeners[name + '/' + id] = null; }; },
        }),
      }),
    },
    showToast: (m) => toasts.push(m),
    vaultGet: () => opts.vault || [],
    track: () => {},
  };
  ctx.window = ctx;
  ctx.self = ctx;
  ctx.window.open = (u) => { opened.push(u); return {}; };
  vm.createContext(ctx);
  vm.runInContext(code, ctx);
  return { ctx, opened, writes, toasts, cards, listeners };
}

test('code: 8 chars from the unambiguous alphabet, effectively unique', () => {
  const { ctx } = makeEnv();
  const seen = new Set();
  for (let i = 0; i < 500; i++) {
    const c = ctx.rwWaMakeCode();
    assert.match(c, /^[A-HJ-NP-Z2-9]{8}$/);
    seen.add(c);
  }
  assert.equal(seen.size, 500);
});

test('link and mask helpers', () => {
  const { ctx } = makeEnv({ config: { whatsapp: { botNumber: '+91 99873-79730' } } });
  assert.equal(ctx.rwWaNumber(), '919987379730');
  assert.equal(ctx.rwWaLink('VERIFY-ABCD2345'), 'https://wa.me/919987379730?text=VERIFY-ABCD2345');
  assert.equal(ctx.rwWaLink('MY TRIP'), 'https://wa.me/919987379730?text=MY%20TRIP');
  assert.equal(ctx.rwWaMask('919987379730'), '+91 ••••• ••730');
  assert.equal(ctx.rwWaMask(''), '');
});

test('trip payload: bounded, plain strings, max 30 days, handles app itinerary shape', () => {
  const { ctx } = makeEnv();
  assert.equal(ctx.rwWaTripPayload(null), null);
  assert.equal(ctx.rwWaTripPayload({ days: [] }), null);
  const long = 'x'.repeat(2000);
  const p = ctx.rwWaTripPayload({ name: long, start: '2026-11-02', days: Array.from({ length: 45 }, (_, i) => ({ day: i + 1, title: 'T' + i, morning: long, afternoon: 'a', evening: 'e', tip: long, junk: { evil: 1 } })) });
  assert.equal(p.days.length, 30);
  assert.equal(p.name.length, 120);
  assert.equal(p.days[0].morning.length, 400);
  assert.equal(p.days[0].tip.length, 300);
  assert.equal(p.days[0].junk, undefined);
  assert.deepEqual(Object.keys(p).sort(), ['days', 'name', 'start']);
});

test('start: writes ONLY {uid,status,createdAt} to wa_verifications, then opens WhatsApp', async () => {
  const { ctx, writes, opened, cards } = makeEnv();
  ctx.rwWaStart();
  await new Promise((r) => setImmediate(r));
  assert.equal(writes.length, 1);
  const w = writes[0];
  assert.equal(w.name, 'wa_verifications');
  assert.match(w.id, /^[A-HJ-NP-Z2-9]{8}$/);
  assert.deepEqual(Object.keys(w.data).sort(), ['createdAt', 'status', 'uid']);
  assert.equal(w.data.uid, 'u1');
  assert.equal(w.data.status, 'pending');
  assert.equal(w.data.createdAt, '__TS__');
  assert.equal(opened.length, 1);
  assert.equal(opened[0], `https://wa.me/919987379730?text=VERIFY-${w.id}`);
  assert.match(cards.html, /Waiting for your message/);
  assert.ok(cards.html.includes(opened[0]), 'fallback link is shown if the popup is blocked');
});

test('start: failed write never opens WhatsApp and tells the user', async () => {
  const { ctx, opened, toasts } = makeEnv({ failWrite: true });
  ctx.rwWaStart();
  await new Promise((r) => setImmediate(r));
  assert.equal(opened.length, 0);
  assert.match(toasts[0], /Could not start verification/);
});

test('render: signed out, unavailable, not verified, verified, and blocked are all distinct', () => {
  let e = makeEnv({ uid: null });
  e.ctx.rwWaRender();
  assert.match(e.cards.html, /Sign in first/);

  e = makeEnv({ authReady: false });
  e.ctx.rwWaRender();
  assert.match(e.cards.html, /isn.t available/);

  e = makeEnv();
  e.ctx.rwWaRender();
  e.listeners['wa_links/u1'].ok({ exists: false, data: () => null });
  assert.match(e.cards.html, /Verify via WhatsApp/);

  e.listeners['wa_links/u1'].ok({ exists: true, data: () => ({ phone: '919987379730' }) });
  assert.match(e.cards.html, /Verified/);
  assert.ok(!e.cards.html.includes('919987379730'), 'full number is never shown');
  assert.match(e.cards.html, /Send my latest trip/);

  e.listeners['wa_links/u1'].err(new Error('permission-denied'));
  assert.match(e.cards.html, /isn.t available/, 'denied rules must not look like "not verified"');
});

test('render: listener detaches once the profile sheet is closed', () => {
  const e = makeEnv({ overlayOpen: false });
  e.ctx.rwWaRender();
  e.listeners['wa_links/u1'].ok({ exists: false, data: () => null });
  assert.equal(e.listeners['wa_links/u1'], null);
});

test('send trip: writes wa_trips/{uid} within rules limits, then opens MY TRIP', async () => {
  const { ctx, writes, opened } = makeEnv();
  ctx.window._lastItin = { name: 'Spiti', days: [{ day: 1, title: 'Shimla', morning: 'Leave 6am' }] };
  ctx.rwWaSendTrip();
  await new Promise((r) => setImmediate(r));
  assert.equal(writes[0].name, 'wa_trips');
  assert.equal(writes[0].id, 'u1');
  assert.deepEqual(Object.keys(writes[0].data).sort(), ['days', 'name', 'start', 'updatedAt']);
  assert.equal(writes[0].data.start, '2026-11-02');
  assert.equal(opened[0], 'https://wa.me/919987379730?text=MY%20TRIP');
});

test('send trip: nothing to send => toast, no write', async () => {
  const { ctx, writes, toasts } = makeEnv({ vault: [] });
  ctx.rwWaSendTrip();
  await new Promise((r) => setImmediate(r));
  assert.equal(writes.length, 0);
  assert.match(toasts[0], /itinerary first/);
});

test('wiring: script loads before profile.js; profile hosts the card; config + rules are in place', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const i = html.indexOf('js/social/wa-verify.js');
  const j = html.indexOf('js/misc/profile.js');
  assert.ok(i > 0 && j > i, 'wa-verify.js must be loaded before profile.js');
  const profile = fs.readFileSync(path.join(ROOT, 'js/misc/profile.js'), 'utf8');
  assert.match(profile, /id="rwWaCard"/);
  assert.match(profile, /rwWaRender\(\)/);
  assert.match(fs.readFileSync(path.join(ROOT, 'rw-config.js'), 'utf8'), /botNumber:\s*'919987379730'/);
});

test('rules contract: client alphabet and rules regex agree; no client write to wa_links', () => {
  const rules = fs.readFileSync(path.join(ROOT, 'firestore.rules'), 'utf8');
  assert.ok(rules.includes("code.matches('^[A-HJ-NP-Z2-9]{8}$')"));
  assert.match(code, /RW_WA_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'/);
  const block = rules.slice(rules.indexOf('match /wa_links/'), rules.indexOf('match /wa_trips/'));
  assert.match(block, /allow write: if false/);
  assert.match(rules.slice(rules.indexOf('match /wa_verifications/')), /request\.resource\.data\.uid == request\.auth\.uid/);
  assert.equal((rules.match(/{/g) || []).length, (rules.match(/}/g) || []).length, 'braces balanced');
});
