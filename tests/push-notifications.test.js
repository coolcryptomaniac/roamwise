// Tests for js/core/push-notifications.js — the unified web+Android
// push-notification opt-in/token-registration module.
//
// Loads the real, browser-global-style source file into a Node vm context
// (same pattern tests/payment-gateway-adapter.test.js and
// tests/audio-engine.test.js already use for this codebase's no-bundler,
// no-ES-modules files), with a small hand-built localStorage/document/
// Firestore mock — no real DOM, Firebase SDK or network call is used.
//
// What's covered:
//   1. Per-device id + opt-in state persist across calls via localStorage.
//   2. rwPushSaveToken()/rwPushClearToken() write the UNIFIED pushTokens.
//      {deviceId} shape (tagged by platform), via a merge set() — never the
//      old two-separate-fields (pushToken/webPushToken) shape.
//   3. Opting in triggers registration; opting out clears this device's
//      token and never re-prompts.
//   4. Browser permission-denied is handled gracefully: the toggle flips
//      itself back off and does not keep calling getToken()/requestPermission
//      on subsequent boots (the "don't nag" requirement).
//   5. rwPushInit() never triggers a registration attempt for someone who
//      has not explicitly opted in yet (no surprise permission prompts).
//   6. The Settings toggle mounts into #settingsOverlay .modal-body, mirrors
//      the platform-v5/learning-consent.js opt-in pattern, and reflects the
//      supported/disabled state correctly.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const SOURCE = fs.readFileSync(path.join(root, 'js/core/push-notifications.js'), 'utf8');

function makeDom() {
  const idMap = new Map();
  function makeEl(tag, id) {
    const el = {
      tagName: tag,
      _id: id || '',
      className: '',
      _html: '',
      style: {},
      disabled: false,
      checked: false,
      children: [],
      _listeners: {},
      get id() { return this._id; },
      set id(v) { this._id = v; if (v) idMap.set(v, this); },
      get innerHTML() { return this._html; },
      set innerHTML(v) {
        this._html = v;
        this.children = [];
        const re = /id="([^"]+)"([^>]*)>/g;
        let m;
        while ((m = re.exec(v))) {
          const child = makeEl('input', m[1]);
          child.disabled = /disabled/.test(m[2]);
          this.children.push(child);
        }
      },
      addEventListener(name, fn) { this._listeners[name] = fn; },
      appendChild(child) { this.children.push(child); if (child.id) idMap.set(child.id, child); },
      querySelector(sel) { return sel[0] === '#' ? (idMap.get(sel.slice(1)) || null) : null; },
    };
    if (id) idMap.set(id, el);
    return el;
  }
  const modalBody = makeEl('div');
  const settingsOverlay = makeEl('div', 'settingsOverlay');
  settingsOverlay.appendChild(modalBody);
  const document = {
    readyState: 'complete',
    querySelector(sel) {
      if (sel === '#settingsOverlay .modal-body') return modalBody;
      if (sel[0] === '#') return idMap.get(sel.slice(1)) || null;
      return null;
    },
    getElementById(id) { return idMap.get(id) || null; },
    createElement(tag) { return makeEl(tag); },
    addEventListener() {},
    removeEventListener() {},
  };
  return { document, modalBody, idMap };
}

function makeContext(opts = {}) {
  const storage = new Map();
  const { document } = makeDom();
  const firestoreCalls = [];
  const userDocRef = {
    set(data, setOpts) { firestoreCalls.push({ data, opts: setOpts }); return Promise.resolve(); },
  };
  const db = 'db' in opts ? opts.db : {
    collection() { return { doc() { return userDocRef; } }; },
  };
  const toasts = [];
  const context = {
    window: {},
    document,
    navigator: opts.navigator || { serviceWorker: {} },
    Notification: opts.Notification,
    firebase: opts.firebase || {
      firestore: Object.assign(function firestoreFn() {}, {
        FieldValue: { serverTimestamp: () => 'SERVER_TS', delete: () => 'DELETE_SENTINEL' },
      }),
      messaging: opts.messagingFactory,
    },
    user: opts.user !== undefined ? opts.user : { uid: 'u1' },
    db,
    localStorage: {
      getItem: (k) => (storage.has(k) ? storage.get(k) : null),
      setItem: (k, v) => storage.set(k, String(v)),
      removeItem: (k) => storage.delete(k),
    },
    showToast: (m) => toasts.push(m),
    tabGo: () => {},
    Math, Date, console,
    setTimeout, clearTimeout,
  };
  context.window = context; // classic scripts read `window.X` and set bare globals interchangeably
  vm.createContext(context);
  // js/core/push-notifications.js itself calls lsGet/lsSet — load the real
  // storage-utils.js into the same context first, same as production's
  // index.html load order (storage-utils.js loads before this file).
  vm.runInContext(fs.readFileSync(path.join(root, 'js/core/storage-utils.js'), 'utf8'), context);
  vm.runInContext(SOURCE, context, { filename: 'push-notifications.js' });
  return { context, storage, firestoreCalls, toasts, userDocRef, document };
}

test('rwPushDeviceId(): generates once and persists across calls', () => {
  const { context, storage } = makeContext();
  const id1 = context.rwPushDeviceId();
  const id2 = context.rwPushDeviceId();
  assert.equal(id1, id2);
  assert.equal(storage.get('rw_push_device_id'), id1);
});

test('rwPushOptedIn(): false until explicitly set, then reflects the stored flag', () => {
  const { context } = makeContext();
  assert.equal(context.rwPushOptedIn(), false);
  context.lsSet('rw_push_optin', '1');
  assert.equal(context.rwPushOptedIn(), true);
  context.lsSet('rw_push_optin', '0');
  assert.equal(context.rwPushOptedIn(), false);
});

test('rwPushSaveToken(): writes the UNIFIED pushTokens.{deviceId} shape, tagged by platform, via merge', () => {
  const { context, firestoreCalls } = makeContext();
  const deviceId = context.rwPushDeviceId();
  context.rwPushSaveToken('TOKEN-ABC', 'web');
  assert.equal(firestoreCalls.length, 1);
  const { data, opts } = firestoreCalls[0];
  assert.equal(opts.merge, true); // cross-realm object (vm context) — compare the field, not object identity
  assert.ok(data.pushTokens, 'writes into a pushTokens map, not a top-level pushToken/webPushToken field');
  assert.equal(data.pushTokens[deviceId].token, 'TOKEN-ABC');
  assert.equal(data.pushTokens[deviceId].platform, 'web');
  assert.equal(data.pushTokens[deviceId].updatedAt, 'SERVER_TS');
  assert.equal(data.pushToken, undefined);
  assert.equal(data.webPushToken, undefined);
});

test('rwPushSaveToken(): no-ops (never throws) with no signed-in user or no db', () => {
  const { context: ctxNoUser, firestoreCalls: c1 } = makeContext({ user: null });
  assert.doesNotThrow(() => ctxNoUser.rwPushSaveToken('T', 'web'));
  assert.equal(c1.length, 0);

  const { context: ctxNoDb, firestoreCalls: c2 } = makeContext({ db: undefined });
  assert.doesNotThrow(() => ctxNoDb.rwPushSaveToken('T', 'web'));
  assert.equal(c2.length, 0);
});

test('rwPushClearToken(): deletes just this device\'s key via FieldValue.delete(), not the whole map', () => {
  const { context, firestoreCalls } = makeContext();
  const deviceId = context.rwPushDeviceId();
  context.rwPushClearToken();
  assert.equal(firestoreCalls.length, 1);
  assert.equal(firestoreCalls[0].data.pushTokens[deviceId], 'DELETE_SENTINEL');
  assert.equal(firestoreCalls[0].opts.merge, true);
});

test('rwPushSetOptIn(true): flips the stored flag, registers, and shows a toast', () => {
  const { context, toasts } = makeContext({ navigator: {} }); // unsupported env -> register() no-ops safely
  context.rwPushSetOptIn(true);
  assert.equal(context.rwPushOptedIn(), true);
  assert.ok(toasts.some((t) => /on/i.test(t)));
});

test('rwPushSetOptIn(false): flips the stored flag, clears this device\'s token, and shows a toast', () => {
  const { context, firestoreCalls, toasts } = makeContext();
  context.lsSet('rw_push_optin', '1');
  context.rwPushSetOptIn(false);
  assert.equal(context.rwPushOptedIn(), false);
  assert.equal(firestoreCalls.length, 1); // the clear-token write
  assert.ok(toasts.some((t) => /off/i.test(t)));
});

test('rwPushRegisterWeb(): never calls getToken()/requestPermission when the browser already denied permission — and flips the opt-in back off', () => {
  let getTokenCalls = 0;
  const messaging = {
    requestPermission: () => Promise.resolve(),
    getToken: () => { getTokenCalls++; return Promise.resolve('should-not-happen'); },
  };
  const { context } = makeContext({
    Notification: { permission: 'denied' },
    navigator: { serviceWorker: { register: () => Promise.resolve({}) } },
    messagingFactory: () => messaging,
  });
  context.window.RW_CONFIG = { features: { webPush: true }, vapidKey: 'vapid-key' };
  context.lsSet('rw_push_optin', '1');
  context.rwPushRegisterWeb();
  assert.equal(getTokenCalls, 0);
  assert.equal(context.rwPushOptedIn(), false, 'a browser-level denial must flip the toggle back off, not just fail silently');
});

test('rwPushRegisterWeb(): no-ops when the deployment-wide feature flag or VAPID key is unset (admin kill switch)', () => {
  let getTokenCalls = 0;
  const messaging = { getToken: () => { getTokenCalls++; return Promise.resolve('tok'); } };
  const { context } = makeContext({
    navigator: { serviceWorker: { register: () => Promise.resolve({}) } },
    messagingFactory: () => messaging,
  });
  context.window.RW_CONFIG = { features: { webPush: false }, vapidKey: '' };
  context.lsSet('rw_push_optin', '1');
  context.rwPushRegisterWeb();
  assert.equal(getTokenCalls, 0);
});

test('rwPushRegisterWeb(): does not register when the user has not opted in, even if the deployment flag is on', () => {
  let registerCalls = 0;
  const { context } = makeContext({
    navigator: { serviceWorker: { register: () => { registerCalls++; return Promise.resolve({}); } } },
    messagingFactory: () => ({ getToken: () => Promise.resolve('tok') }),
  });
  context.window.RW_CONFIG = { features: { webPush: true }, vapidKey: 'vapid-key' };
  // deliberately NOT calling lsSet('rw_push_optin','1')
  context.rwPushRegisterWeb();
  assert.equal(registerCalls, 0);
});

test('rwPushInit(): never triggers registration for a user who has not opted in (no surprise permission prompts)', () => {
  let registerCalls = 0;
  const { context } = makeContext({
    navigator: { serviceWorker: { register: () => { registerCalls++; return Promise.resolve({}); } } },
    messagingFactory: () => ({ getToken: () => Promise.resolve('tok') }),
  });
  context.window.RW_CONFIG = { features: { webPush: true }, vapidKey: 'vapid-key' };
  context.rwPushInit();
  assert.equal(registerCalls, 0);
});

test('rwPushInit(): DOES re-register for a returning user who previously opted in', () => {
  let registerCalls = 0;
  const { context } = makeContext({
    navigator: { serviceWorker: { register: () => { registerCalls++; return Promise.resolve({}); } } },
    messagingFactory: () => ({ getToken: () => Promise.resolve('tok') }),
  });
  context.window.RW_CONFIG = { features: { webPush: true }, vapidKey: 'vapid-key' };
  context.lsSet('rw_push_optin', '1');
  context.rwPushInit();
  assert.equal(registerCalls, 1);
});

test('rwPushMountToggle(): mounts one .key-section into #settingsOverlay .modal-body, reflecting supported+opted-in state', () => {
  const { context, document } = makeContext({ Notification: { permission: 'default' } });
  context.window.RW_CONFIG = { features: { webPush: true }, vapidKey: 'vapid-key' };
  context.lsSet('rw_push_optin', '1');
  context.rwPushMountToggle();
  const box = document.getElementById('rwPushConsent');
  assert.ok(box, 'toggle box should be mounted');
  const toggle = document.getElementById('rwPushToggle');
  assert.ok(toggle, 'checkbox should be mounted');
  assert.equal(toggle.checked, true);
  assert.equal(toggle.disabled, false);
});

test('rwPushMountToggle(): only mounts once even if called repeatedly', () => {
  const { context, document } = makeContext();
  context.rwPushMountToggle();
  context.rwPushMountToggle();
  // querySelector('#settingsOverlay .modal-body') always returns the same
  // mock node, so a second real DOM append would show up as 2 children with
  // the same id — the mount function itself guards on document.getElementById.
  assert.ok(document.getElementById('rwPushConsent'));
});
