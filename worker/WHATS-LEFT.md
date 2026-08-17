# Worker — exactly what's left to do

## What I just fixed (a real bug you'd have hit)

There were **two worker files** — `worker.js` and `events-refresh.js` — each with its
own `export default` and its own `scheduled()` handler. Cloudflare runs **one**
`main` file, and `wrangler.toml` pointed only at `worker.js`.

**Result: the event refresh would never have run.** No error, no warning — it
simply wouldn't have existed on the deployed Worker.

Both are now merged into a single `worker.js` with one router and one cron
handler. `events-refresh.js` has been deleted so it can't cause confusion later.

---

## Current state

| Piece | Status |
|---|---|
| `worker.js` | ✅ merged, 5 routes, one cron handler, syntax-checked |
| `wrangler.toml` | ✅ single `main`, single `[triggers]`, KV commented out |
| `rw-config.js` | ⚠️ `backend:'firebase'`, `workerUrl:''` — app is NOT using the Worker yet |
| KV namespace | ❌ not created — `/news` and `/events` will return empty without it |
| Secrets | ❌ none set |

**Nothing is broken.** The app runs fine as-is. Everything below is opt-in.

---

## Step by step

### 1. Deploy (5 min)
```bash
npm install -g wrangler
wrangler login
cd worker
wrangler deploy
```
Copy the URL it prints: `https://roamwise-api.<you>.workers.dev`

### 2. Check what it thinks is configured
Open `https://roamwise-api.<you>.workers.dev/health`

```json
{ "ok": true, "configured": { "ai": false, "kv": false, "events": false, "refreshProtected": false } }
```
Everything `false` is normal at this point. This endpoint is your source of truth —
it never lies about what's actually wired up.

### 3. Create the KV store — **required for events and news**
```bash
npx wrangler kv namespace create RW_KV
```
It prints an `id`. Paste it into `wrangler.toml` and **uncomment all three lines**:
```toml
[[kv_namespaces]]
binding = "RW_KV"
id = "the-id-it-printed"
```
Then `wrangler deploy` again.

Without this, `/events` and `/news` return empty every time — they have nowhere to cache.

### 4. Add the secrets you actually want

| Secret | Enables | Where to get it | Needed? |
|---|---|---|---|
| `TICKETMASTER_KEY` | `/events` live refresh | developer.ticketmaster.com — free, instant | for live events |
| `REFRESH_TOKEN` | protects manual refresh | invent any long random string | **yes, if TICKETMASTER_KEY is set** |
| `GROQ_API_KEY` | `/ai` proxy (hides your key from browsers) | console.groq.com | optional |

```bash
npx wrangler secret put TICKETMASTER_KEY
npx wrangler secret put REFRESH_TOKEN
npx wrangler secret put GROQ_API_KEY     # only if you want the AI proxy
```

Re-check `/health` — the flags should flip to `true`.

### 5. Fill the cache once, immediately
Don't wait a week for the first cron:
```
https://roamwise-api.<you>.workers.dev/events/refresh?token=YOUR_REFRESH_TOKEN
```
Then check `/events` — you should see real events with a count.

### 6. Turn it on in the app
Edit **`rw-config.js`** in your site root:
```js
backend: 'auto',                                       // was 'firebase'
workerUrl: 'https://roamwise-api.<you>.workers.dev',   // your URL
```
Deploy the site. Open Event radar — you should see a green
**"↻ N live events synced"** line under the list.

---

## Rolling back

Set `backend: 'firebase'` and redeploy the site. That's it. The Worker is a
router, not a database — nothing lives only there, so nothing is lost.

---

## Honest cautions

- **`/ai` is unauthenticated as written.** Fine while nobody knows the URL, but
  add a Cloudflare rate-limiting rule before you promote it, or someone could
  drain your Groq quota.
- **Ticketmaster's free tier has daily call limits.** The cron makes 4 calls a
  week, which is nothing — but don't hammer `/events/refresh` manually in a loop.
- **`REFRESH_TOKEN` is genuinely worth setting.** Without it, anyone who finds
  the URL can trigger refreshes and burn your quota.
- **Cron does not run on `wrangler dev`** — only on a deployed Worker. Test with
  `/events/refresh` instead.
