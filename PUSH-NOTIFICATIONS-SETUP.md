# Push notifications — setup guide

This is the literal, step-by-step guide for turning on push notifications
(web/PWA + Android), and for sending one. It changes **nothing** for live
users until you complete the Firebase Console + `wrangler secret` steps
below — until then the Settings toggle stays disabled ("Not supported in
this browser/app right now") and no permission prompt is ever shown.

See `ARCHITECTURE.md`'s `js/core/` and `worker/` entries for the module map,
and the header comments in `js/core/push-notifications.js` and
`worker/handlers/push.js` for the full design rationale (per-user opt-in,
the unified `pushTokens` schema, and the auth-gating/input-validation model).

## What shipped

- **Web push**: `firebase-messaging-sw.js` (already present at the repo
  root, pre-dating this change — see `js/boot/init.js`'s original
  `navigator.serviceWorker.register('/firebase-messaging-sw.js')` call,
  which this pass left untouched) + `js/core/push-notifications.js`, which
  now owns the browser-permission/FCM-token registration that used to live
  in `js/boot/init.js` as `rwInitWebPush()`.
- **Android push**: `@capacitor/push-notifications` added to
  `package.json` (was referenced by the pre-existing `rwInitPush()` code
  but never actually installed as a dependency — that's a real gap this
  pass fixes) + the registration logic, relocated from `js/boot/init.js`'s
  `rwInitPush()`/`rwSaveDeviceToken()` into the same
  `js/core/push-notifications.js` module. `capacitor.config.json` gained a
  `PushNotifications` plugin config block (foreground presentation
  options).
- **Unified token storage**: both platforms now write to ONE
  `users/{uid}.pushTokens.{deviceId}` map field (`{token, platform,
  updatedAt}`), tagged `'web'` or `'android'`, replacing the old code's two
  separate top-level fields (`pushToken` for native, `webPushToken` for
  web). **No `firestore.rules` change is needed** — `pushTokens` isn't in
  `users/{uid}`'s Pro-field write blocklist, so it rides the existing
  generic self-write rule.
- **Per-user opt-in**: a Settings toggle ("Push notifications — Trip
  reminders & alerts"), mounted the same way
  `platform-v5/learning-consent.js` mounts its AI-learning-consent
  checkbox. Off by default. If the browser itself reports permission as
  `denied`, the toggle flips itself back off and the app never re-prompts.
  The deployment-wide `RW_CONFIG.features.webPush` + `RW_CONFIG.vapidKey`
  in `rw-config.js` remain a separate admin kill switch — both the
  deployment flag AND the per-user opt-in must be on for web push to
  register.
- **Send path**: `worker/handlers/push.js` — a new admin-only
  `POST /push/send` route on the existing `roamwise-api` Worker. Verifies
  the caller's Firebase ID token (`worker/lib/firebase-verify.js`, no
  Admin SDK needed — verifies against Google's published JWKS using native
  Web Crypto), confirms `admins/{uid}` exists (via a service-account-
  authenticated Firestore REST read — `worker/lib/firestore-rest.js` +
  `worker/lib/service-account.js`), looks up the target user's registered
  tokens **from Firestore itself** (never trusts a client-supplied device
  token), sends via FCM's HTTP v1 API per token, and prunes any token FCM
  reports as dead (`UNREGISTERED`/`NOT_FOUND`).

## What's stubbed / left for later (explicitly out of scope this pass)

- No admin UI button to actually call `/push/send` yet — this pass is
  infrastructure, not the admin console's "compose and send" screen. Until
  that's built, send a request directly (see "Test end-to-end" below) or
  use the Firebase Console's own Notification composer (works today,
  independent of this Worker route, since both write to the same FCM
  project — see "Two ways to send" below).
- No per-trigger content (trip reminders, streak reminders, price-drop/
  crowd-calendar alerts, new-guide-published, referral/founder-offer
  milestones — see `REVENUE-GROWTH-STRATEGY.md`). This pass builds the
  pipe; wiring each trigger to call `/push/send` with the right copy is
  separate, later work.
- No topic/broadcast send (e.g. "notify everyone") — `/push/send` targets
  one `uid` at a time by design (see the input-validation note below).
  Broadcasting to a topic is a reasonable future extension of the same
  endpoint, not added here to keep the admin-auth/input-validation surface
  small and reviewable.
- Dead-token pruning only runs for the tokens actually touched by a given
  send — there's no scheduled sweep of the whole `users` collection.

## 1. Enable Cloud Messaging in the Firebase Console

1. [Firebase Console](https://console.firebase.google.com/) → your project
   (`roamwisepro`) → **Project settings** → **Cloud Messaging** tab.
2. Confirm the **Firebase Cloud Messaging API (V1)** is enabled (it is by
   default for any project with Cloud Messaging turned on; if you see a
   prompt to enable it, do so).

## 2. Generate a VAPID key pair (for web push)

1. Same **Cloud Messaging** tab → **Web configuration** → **Web Push
   certificates** → **Generate key pair** (skip if one already exists).
2. Copy the key string shown (starts with a letter, ~87 chars).
3. Paste it into `rw-config.js`:
   ```js
   vapidKey: 'PASTE_YOUR_VAPID_KEY_HERE',
   ```
4. Flip the deployment-wide kill switch on in the same file:
   ```js
   features: {
     ...
     webPush: true,
   },
   ```
5. Deploy the static site as usual (this repo has no build step — see
   `ARCHITECTURE.md`'s Overview). The Settings toggle becomes usable for
   any visitor whose browser supports the Push API once this is live;
   nobody gets a permission prompt until they tap it themselves.

## 3. Generate a service-account key (for the Worker's send endpoint)

This is a **separate, more sensitive** credential — it's what lets the
Worker call FCM's send API and read `admins/{uid}` for the auth check. It
must never reach the browser.

1. Firebase Console → **Project settings** → **Service accounts** tab.
2. **Generate new private key** → confirm → a `.json` file downloads.
   Treat this file like a password: don't commit it, don't paste its
   contents anywhere but the `wrangler secret put` prompt below.
3. From the `worker/` directory, set it as a Worker secret (pass the
   **entire file's contents** as one value):
   ```sh
   cd worker
   npx wrangler secret put FIREBASE_SERVICE_ACCOUNT_JSON
   # paste the full contents of the downloaded .json file, then Enter
   ```
4. Delete the local `.json` file once the secret is set (or store it
   somewhere access-controlled outside this repo — it should never be
   committed).
5. Confirm it took effect:
   ```sh
   curl https://<your-worker-subdomain>.workers.dev/health
   # {"ok":true,...,"configured":{...,"push":true}}
   ```

## 4. Grant yourself admin access (if you haven't already)

`/push/send` only accepts callers whose Firebase uid has a document at
`admins/{uid}` — the same allow-list every other admin surface in this app
uses (see `firestore.rules`, and `admin/index.html`'s own login screen
copy: "Access is granted only when your UID exists in `admins/{uid}`").
If you already use the admin console, you already have this. Otherwise:
Firebase Console → **Firestore Database** → create a document at
`admins/<your-uid>` (any fields; the document's existence is what matters).

## 5. Android — sync the new Capacitor plugin

No `android/` project exists in this repo yet (it's generated on demand —
see `HOW-TO-BUILD-ON-PHONE.md`/`BUILD-STEPS.md`). Once you generate/open
the Android project as usual:

```sh
npm install                 # picks up @capacitor/push-notifications
npx cap sync android        # wires the native plugin into the Android project
```

No AndroidManifest.xml edits are required for `@capacitor/push-notifications`
itself — Capacitor's Gradle integration handles the FCM plugin registration.
If you haven't already added `google-services.json` (Firebase Console →
Project settings → your Android app → download `google-services.json`) to
`android/app/`, do that now — it's required for FCM to work in the native
app at all, independent of this change.

## Two ways to send a push

**A. Firebase Console (works today, no admin auth needed on your end since
you're already the project owner):** Console → **Cloud Messaging** →
**Send your first message**. Targets by topic or single token (find a
token by inspecting a `users/{uid}` document's `pushTokens` map). Good for
one-off manual sends and testing.

**B. `POST /push/send` (this Worker route, for building admin-triggered or
future automated sends):**

```sh
# 1. Get a fresh Firebase ID token for your own signed-in admin account —
#    easiest from the browser console while signed into the app:
#      await firebase.auth().currentUser.getIdToken()

curl -X POST https://<your-worker-subdomain>.workers.dev/push/send \
  -H "Authorization: Bearer <paste the ID token>" \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "<the target users uid>",
    "title": "Your trip starts tomorrow!",
    "body": "Tap for your itinerary and packing list.",
    "url": "https://roamwise.co.in/",
    "data": { "kind": "trip_reminder" }
  }'
```

Response shape:
```json
{ "ok": true, "sent": 1, "failed": 0, "prunedDeadTokens": 0, "results": [...] }
```

- `401` — missing/invalid/expired Bearer token.
- `403` — valid token, but that uid has no `admins/{uid}` document.
- `400` — malformed body (missing/oversized `title`/`body`/`data`, or
  invalid `url`).
- `404` — `uid` not found or has no registered devices in `pushTokens`.

The endpoint only ever sends to token(s) it looks up itself from
`users/{uid}.pushTokens` — the request body carries a target `uid`, never a
raw device token, so a caller can't aim a send at an arbitrary token they
happen to have (see the header comment in `worker/handlers/push.js` for
the full rationale, referencing the PR #152 price-tampering lesson).

## Test end-to-end

1. Complete steps 1-4 above (or at minimum 2-4 for a web-only test).
2. Open the app in a real browser (not the Android WebView), sign in, open
   **Settings**, find **Push notifications** near the top of the modal,
   and check the box. The browser's native permission prompt should
   appear immediately (a direct result of your tap, not an unprompted page
   load).
3. Allow it. Check Firestore: `users/{your-uid}.pushTokens` should now
   have one entry tagged `platform: 'web'`.
4. Send yourself a test push using method A or B above, targeting your own
   `uid`/token. You should see a real OS notification within seconds.
5. Toggle Settings → Push notifications off. Confirm the `pushTokens` entry
   for your device is removed from Firestore (the toggle calls
   `rwPushClearToken()`), and that reloading the page does not silently
   re-prompt you.
