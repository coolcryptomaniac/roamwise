// Tests for the admin-only push-send Worker endpoint (worker/handlers/push.js
// + worker/lib/firebase-verify.js, service-account.js, firestore-rest.js).
//
// A real ES module, imported directly via dynamic import() (same pattern
// tests/cashfree-payment.test.js already uses for worker/handlers/cashfree.js)
// and exercised against a mocked global `fetch` (Node 22 provides a global
// fetch/Response/crypto.subtle, same as the Workers runtime) — no real
// Firebase project or network call is used or required.
//
// The RS256 signature checks are exercised for real: a throwaway RSA keypair
// is generated per test run with Node's `crypto.generateKeyPairSync`, used to
// both (a) sign fake "Firebase ID tokens" the same way Google's securetoken
// service would, verified here against worker/lib/firebase-verify.js's real
// Web Crypto verification code, and (b) stand in for the Worker's own
// service-account private key. This is not a rubber-stamped mock: a token
// signed with the WRONG key is asserted to be rejected (see the "signature
// doesn't verify" test below), proving the verification path is real.
//
// What's covered:
//   1. Auth gating: missing/malformed/wrong-project/badly-signed bearer
//      tokens are all rejected with 401 before any admin/business logic
//      runs; a validly-authenticated but non-admin caller gets 403.
//   2. Server-side input validation: an admin caller still gets 400 for a
//      missing/oversized field — proven by asserting FCM is never called.
//   3. The price-tampering-lesson check (PR #152): the endpoint fetches the
//      target's FCM tokens from Firestore itself — nothing resembling a raw
//      device token in the request body is what's actually sent to FCM.
//   4. Dead-token pruning after a failed send.

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const PROJECT_ID = 'rw-test-project';

function b64url(input) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function makeKeyPair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { format: 'jwk' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  return { publicJwk: publicKey, privateKeyPem: privateKey };
}

function signRS256(privateKeyPem, header, payload) {
  const signingInput = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signingInput);
  signer.end();
  return `${signingInput}.${b64url(signer.sign(privateKeyPem))}`;
}

function makeIdToken(privateKeyPem, kid, overrides) {
  const now = Math.floor(Date.now() / 1000);
  const payload = Object.assign(
    { aud: PROJECT_ID, iss: `https://securetoken.google.com/${PROJECT_ID}`, sub: 'user-123', iat: now, exp: now + 3600 },
    overrides
  );
  return signRS256(privateKeyPem, { alg: 'RS256', typ: 'JWT', kid }, payload);
}

function jsonRes(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

// worker/lib/firebase-verify.js caches the fetched JWKS at MODULE scope
// (deliberately — see its header comment, this saves a real fetch per
// request in production). Since Node's dynamic import() cache means every
// test in this file shares that same module instance/cache, every test
// must publish the SAME "legit" key under the SAME kid — otherwise a later
// test's fetch mock is simply never consulted (the cache is still "fresh")
// and it gets verified against a stale, different test's key by accident.
// One shared keypair for the whole file avoids that entirely; the
// signature-mismatch test below still gets real coverage by signing with a
// deliberately DIFFERENT, one-off key while the shared JWKS mock keeps
// advertising the legit one.
const SHARED_ID_TOKEN_KEYS = makeKeyPair();
const SHARED_KID = 'kid-1';

/** Builds a fetch mock + env for one test, plus a log of every call made. */
function makeHarness({ kid = SHARED_KID, adminExists = true, userDoc, fcmHandler } = {}) {
  const idTokenKeyPem = SHARED_ID_TOKEN_KEYS.privateKeyPem;
  const jwksPublicJwk = SHARED_ID_TOKEN_KEYS.publicJwk;

  const calls = [];
  const env = {
    FIREBASE_SERVICE_ACCOUNT_JSON: JSON.stringify({
      client_email: 'worker@rw-test-project.iam.gserviceaccount.com',
      private_key: makeKeyPair().privateKeyPem, // separate key for the service-account OAuth flow
      project_id: PROJECT_ID,
    }),
  };

  global.fetch = async (url, opts) => {
    const u = String(url);
    calls.push({ url: u, opts });
    if (u.includes('googleapis.com/service_accounts/v1/jwk/')) {
      return jsonRes({ keys: [{ ...jwksPublicJwk, kid, alg: 'RS256', use: 'sig' }] });
    }
    if (u.includes('oauth2.googleapis.com/token')) {
      return jsonRes({ access_token: 'fake-access-token', expires_in: 3600 });
    }
    if (u.includes('firestore.googleapis.com') && u.includes('/admins/')) {
      return adminExists ? jsonRes({ fields: {} }) : new Response('', { status: 404 });
    }
    if (u.includes('firestore.googleapis.com') && u.includes('/users/') && opts && opts.method === 'PATCH') {
      calls.push({ patch: u });
      return jsonRes({ fields: {} });
    }
    if (u.includes('firestore.googleapis.com') && u.includes('/users/')) {
      return userDoc === null ? new Response('', { status: 404 }) : jsonRes(userDoc || { fields: {} });
    }
    if (u.includes('fcm.googleapis.com')) {
      const body = JSON.parse(opts.body);
      return fcmHandler ? fcmHandler(body, u) : jsonRes({ name: 'projects/x/messages/1' });
    }
    throw new Error('unexpected fetch: ' + u);
  };

  return { env, idTokenKeyPem, kid, calls };
}

function req(body, token) {
  return {
    headers: { get: (h) => (h.toLowerCase() === 'authorization' && token ? `Bearer ${token}` : null) },
    json: async () => body,
  };
}

async function loadHandler() {
  return import(path.join(root, 'worker/handlers/push.js'));
}

test('handlePushSend: 501s cleanly when FIREBASE_SERVICE_ACCOUNT_JSON is not configured', async () => {
  const { handlePushSend } = await loadHandler();
  global.fetch = async () => { throw new Error('must not call fetch'); };
  const res = await handlePushSend(req({}, 'whatever'), {});
  assert.equal(res.status, 501);
});

test('handlePushSend: rejects a missing Authorization header (401), before any network call', async () => {
  const { handlePushSend } = await loadHandler();
  const { env, calls } = makeHarness();
  const res = await handlePushSend(req({ uid: 'x', title: 't', body: 'b' }, null), env);
  assert.equal(res.status, 401);
  assert.equal(calls.length, 0);
});

test('handlePushSend: rejects a malformed bearer token (401), before any network call', async () => {
  const { handlePushSend } = await loadHandler();
  const { env, calls } = makeHarness();
  const res = await handlePushSend(req({ uid: 'x', title: 't', body: 'b' }, 'not-a-jwt'), env);
  assert.equal(res.status, 401);
  assert.equal(calls.length, 0);
});

test('handlePushSend: rejects a well-formed token issued for the wrong Firebase project (401), before any network call', async () => {
  const { handlePushSend } = await loadHandler();
  const { env, idTokenKeyPem, kid, calls } = makeHarness();
  const token = makeIdToken(idTokenKeyPem, kid, { aud: 'some-other-project', iss: 'https://securetoken.google.com/some-other-project' });
  const res = await handlePushSend(req({ uid: 'x', title: 't', body: 'b' }, token), env);
  assert.equal(res.status, 401);
  assert.equal(calls.length, 0); // rejected on claim checks alone, never even fetches the JWKS
});

test('handlePushSend: rejects a token whose signature does not verify against the published key (401)', async () => {
  const { handlePushSend } = await loadHandler();
  // The harness's mocked JWKS endpoint always advertises the key paired with
  // idTokenKeyPem. Signing with a totally different (forged) private key,
  // but the SAME kid, proves the handler actually checks the signature
  // rather than trusting a token just because its shape/claims look right.
  const { env, kid } = makeHarness();
  const forgedKeyPair = makeKeyPair();
  const token = makeIdToken(forgedKeyPair.privateKeyPem, kid);
  const res = await handlePushSend(req({ uid: 'x', title: 't', body: 'b' }, token), env);
  assert.equal(res.status, 401);
});

test('handlePushSend: rejects a validly-authenticated caller who is not in admins/{uid} (403)', async () => {
  const { handlePushSend } = await loadHandler();
  const { env, idTokenKeyPem, kid } = makeHarness({ adminExists: false });
  const token = makeIdToken(idTokenKeyPem, kid);
  const res = await handlePushSend(req({ uid: 'target', title: 't', body: 'b' }, token), env);
  assert.equal(res.status, 403);
});

test('handlePushSend: validates the request body server-side even for a real admin (400), never reaching FCM', async () => {
  const { handlePushSend } = await loadHandler();
  const { env, idTokenKeyPem, kid, calls } = makeHarness({ adminExists: true });
  const token = makeIdToken(idTokenKeyPem, kid);
  const res = await handlePushSend(req({ uid: 'target', title: '', body: 'b' }, token), env); // empty title
  assert.equal(res.status, 400);
  assert.ok(!calls.some((c) => c.url && c.url.includes('fcm.googleapis.com')));
});

test('handlePushSend: rejects an oversized data payload server-side (400)', async () => {
  const { handlePushSend } = await loadHandler();
  const { env, idTokenKeyPem, kid } = makeHarness({ adminExists: true });
  const token = makeIdToken(idTokenKeyPem, kid);
  const tooMany = {};
  for (let i = 0; i < 20; i++) tooMany['k' + i] = 'v';
  const res = await handlePushSend(req({ uid: 'target', title: 't', body: 'b', data: tooMany }, token), env);
  assert.equal(res.status, 400);
});

test('handlePushSend: 404s when the target user has no registered devices', async () => {
  const { handlePushSend } = await loadHandler();
  const { env, idTokenKeyPem, kid } = makeHarness({ adminExists: true, userDoc: { fields: {} } });
  const token = makeIdToken(idTokenKeyPem, kid);
  const res = await handlePushSend(req({ uid: 'target', title: 't', body: 'b' }, token), env);
  assert.equal(res.status, 404);
});

test('handlePushSend: sends to the tokens looked up server-side from Firestore — never a client-supplied token', async () => {
  const { handlePushSend } = await loadHandler();
  const userDoc = {
    fields: {
      pushTokens: {
        mapValue: {
          fields: {
            dev1: { mapValue: { fields: { token: { stringValue: 'REAL-FCM-TOKEN-1' }, platform: { stringValue: 'web' } } } },
            dev2: { mapValue: { fields: { token: { stringValue: 'REAL-FCM-TOKEN-2' }, platform: { stringValue: 'android' } } } },
          },
        },
      },
    },
  };
  const sentTokens = [];
  const { env, idTokenKeyPem, kid } = makeHarness({
    adminExists: true,
    userDoc,
    fcmHandler: (body) => { sentTokens.push(body.message.token); return jsonRes({ name: 'ok' }); },
  });
  const token = makeIdToken(idTokenKeyPem, kid);
  // The request body carries NO token field at all — only a target uid — this
  // is the point of the test (per the PR #152 price-tampering lesson: never
  // trust a client-supplied value that should be server-authoritative).
  const res = await handlePushSend(req({ uid: 'target', title: 'Trip reminder', body: 'Your trip starts tomorrow!' }, token), env);
  assert.equal(res.status, 200);
  const out = await res.json();
  assert.equal(out.sent, 2);
  assert.equal(out.failed, 0);
  assert.deepEqual(sentTokens.sort(), ['REAL-FCM-TOKEN-1', 'REAL-FCM-TOKEN-2']);
});

test('handlePushSend: prunes a dead (UNREGISTERED) token after a failed send', async () => {
  const { handlePushSend } = await loadHandler();
  const userDoc = {
    fields: {
      pushTokens: {
        mapValue: {
          fields: {
            dead: { mapValue: { fields: { token: { stringValue: 'DEAD-TOKEN' }, platform: { stringValue: 'web' } } } },
          },
        },
      },
    },
  };
  const { env, idTokenKeyPem, kid, calls } = makeHarness({
    adminExists: true,
    userDoc,
    fcmHandler: () => new Response(JSON.stringify({ error: { status: 'UNREGISTERED' } }), { status: 404 }),
  });
  const token = makeIdToken(idTokenKeyPem, kid);
  const res = await handlePushSend(req({ uid: 'target', title: 't', body: 'b' }, token), env);
  const out = await res.json();
  assert.equal(out.sent, 0);
  assert.equal(out.failed, 1);
  assert.equal(out.prunedDeadTokens, 1);
  assert.ok(calls.some((c) => c.patch && c.patch.includes('pushTokens.dead')));
});
