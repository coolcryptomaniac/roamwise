# Cloudflare Worker — setup, step by step

**Time: about 15 minutes. Cost: ₹0, and it stays ₹0 even if the site blows up.**

You need a computer with Node.js installed. Everything is copy-paste.

---

## Why this stays free even with a million users

This is the part worth understanding, because it's a design choice, not luck.

**Cloudflare's CDN sits in front of your Worker.** When a response carries a
`Cache-Control` header, the CDN answers repeat requests *itself* — your Worker
is never woken up, and nothing counts against your daily quota.

Your `/events` response is cached for **1 hour**. So in any given hour, in any
given city, **one** request reaches the Worker and every other request is served
free from the edge.

| Users/day | Worker requests/day (roughly) | Free limit |
|---|---|---|
| 1,000 | ~50 | 100,000 |
| 100,000 | ~500 | 100,000 |
| 1,000,000 | ~2,000 | 100,000 |

Traffic goes up 1000×; Worker requests go up ~40×. That's the whole trick.

**The other rule: never write to KV on a user request.** Free KV allows 100,000
*reads* a day but only **1,000 writes**. This Worker writes twice a day, from the
cron only. If you ever add a per-user counter or log to KV, you'll break the free
tier in an afternoon. Use Firestore for anything per-user — you already do.

---

## Step 1 — Install the tool (2 min)

Open a terminal and run:

```bash
npm install -g wrangler
wrangler login
```

A browser window opens; sign in to Cloudflare and click **Allow**. If you don't
have an account, create one — the free plan needs no card.

---

## Step 2 — Deploy the Worker (2 min)

```bash
cd worker
wrangler deploy
```

It prints a URL like:

```
https://roamwise-api.YOURNAME.workers.dev
```

**Copy that URL.** You need it twice more.

---

## Step 3 — Check it's alive (30 sec)

Open in any browser:

```
https://roamwise-api.YOURNAME.workers.dev/health
```

You should see:

```json
{ "ok": true, "configured": { "ai": false, "kv": false, "events": false } }
```

All `false` is correct right now. **This page never lies** — it reports what's
actually wired up, so come back to it after each step.

---

## Step 4 — Create the KV store (3 min) — REQUIRED

Without this, `/events` and `/news` have nowhere to cache and stay empty forever.

```bash
npx wrangler kv namespace create RW_KV
```

It prints something like:

```
id = "abc123def456..."
```

Open **`worker/wrangler.toml`**, find these three commented lines near the
bottom, delete the `#` from each, and paste your id:

```toml
[[kv_namespaces]]
binding = "RW_KV"
id = "abc123def456..."
```

Then redeploy:

```bash
wrangler deploy
```

Check `/health` again — `"kv": true`.

---

## Step 5 — Add your secrets (5 min)

**Get a free Ticketmaster key** at `developer.ticketmaster.com` (sign up, create
an app, copy the Consumer Key — takes 2 minutes).

**Invent a refresh token** — any long random string, e.g. `rw-8f3k2p9x-refresh`.

```bash
npx wrangler secret put TICKETMASTER_KEY
# paste the key, press Enter

npx wrangler secret put REFRESH_TOKEN
# paste your random string, press Enter
```

Optional, only if you want the AI proxy (hides your Groq key from browsers):

```bash
npx wrangler secret put GROQ_API_KEY
```

Check `/health` — the flags you set should now be `true`.

---

## Step 6 — Fill the cache once (30 sec)

Don't wait a week for the first cron. Open this once, with your token:

```
https://roamwise-api.YOURNAME.workers.dev/events/refresh?token=YOUR_REFRESH_TOKEN
```

You'll see `{"updated":"...","count":42,"events":[...]}`.

Now open `/events` — same data, served from cache. Done.

---

## Step 7 — Turn it on in the app (2 min)

Edit **`rw-config.js`** in your site root:

```js
backend: 'auto',                                        // was 'firebase'
workerUrl: 'https://roamwise-api.YOURNAME.workers.dev', // your URL
```

Deploy the site. Open Event radar — you should see a green
**"↻ N live events synced"** line.

---

## That's it. Settings that keep it free

Already built into the Worker you're deploying:

- **Edge caching** on `/events` (1 hr) and `/news` (30 min) — the CDN absorbs
  traffic instead of your Worker
- **Cron writes only** — 2 KV writes a day against a 1,000/day limit
- **AI rate limit** — 1 request per IP per minute, built on the cache API so it
  costs zero KV writes
- **Token-protected refresh** — nobody can burn your Ticketmaster quota

---

## If you ever DO get huge

Two honest notes:

1. **You'd get an email, not a bill.** On the free plan, exceeding 100k
   requests/day returns an error (Cloudflare error 1027) — it does **not**
   auto-charge you. You cannot accidentally run up a bill on the free plan.

2. **If that day comes, the fix is $5/month.** The Workers Paid plan removes the
   daily cap entirely. If you're serving a million people, $5 is not the problem
   you'll be thinking about.

---

## Rolling back

Set `backend: 'firebase'` in `rw-config.js` and redeploy the site. The Worker is
a router, not a database — nothing lives only there, so nothing is lost.

---

## Quick troubleshooting

| Symptom | Fix |
|---|---|
| `/events` returns empty | KV not created (Step 4), or refresh not run (Step 6) |
| `"kv": false` on /health | You didn't uncomment all three lines in wrangler.toml, or didn't redeploy |
| `unauthorised` on refresh | Token in the URL doesn't match `REFRESH_TOKEN` |
| Cron never runs | Cron only runs on a **deployed** Worker, never on `wrangler dev` |
| Error 1027 | You hit 100k requests in a day — genuinely good news; upgrade to the $5 plan |
