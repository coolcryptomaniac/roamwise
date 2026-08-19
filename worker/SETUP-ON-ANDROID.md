# Cloudflare Worker setup — from your Android phone only

**No terminal. No laptop. Just Chrome.** About 20 minutes.

Cloudflare's dashboard can create, edit and deploy a Worker entirely in the
browser. The `wrangler` commands in the other guide are the *desktop* path —
ignore them.

---

## Before you start (1 min)

Open Chrome, go to **dash.cloudflare.com**, and sign in (or sign up — the free
plan needs no card).

**Do this first:** tap the **⋮** menu in Chrome → tick **Desktop site**.
The Worker code editor is cramped on mobile view; desktop mode makes it usable.

---

## Step 1 — Get the code onto your clipboard (2 min)

The Worker code is in your repo at `worker/worker.js`.

1. Open Chrome and go to your GitHub repo
2. Navigate to **worker → worker.js**
3. Tap the **Raw** button (shows the plain code)
4. Long-press anywhere on the text → **Select all** → **Copy**

Now the whole Worker is on your clipboard. Leave this tab open in case you need
to copy it again.

---

## Step 2 — Create the Worker (3 min)

1. Go to **dash.cloudflare.com**
2. Left menu → **Compute (Workers)** → **Workers & Pages**
3. Tap **Create application** → **Start with Hello World!** → **Get started**
4. Name it: `roamwise-api`
5. Tap **Deploy** (deploys the placeholder — that's fine)
6. Tap **Edit code**
7. In the editor: select all the placeholder code and **delete it**, then
   **paste** your Worker code
8. Tap **Deploy** (top right)

You'll get a URL like:

```
https://roamwise-api.YOURNAME.workers.dev
```

**Copy it into your notes app.** You need it twice more.

---

## Step 3 — Check it's alive (30 sec)

In a new Chrome tab, open:

```
https://roamwise-api.YOURNAME.workers.dev/health
```

You should see:

```json
{"ok":true,"configured":{"ai":false,"kv":false,"events":false}}
```

All `false` is correct at this point. **Bookmark this page** — it tells you the
truth about what's actually set up, so revisit it after each step.

---

## Step 4 — Create the KV store (4 min) — REQUIRED

Skip this and `/events` stays empty forever.

**4a. Create it**
1. Left menu → **Storage & Databases** → **KV**
2. Tap **Create namespace**
3. Name it exactly: `RW_KV`
4. Tap **Add**

**4b. Connect it to the Worker**
1. Left menu → **Workers & Pages** → tap **roamwise-api**
2. Tap **Settings** → **Bindings**
3. Tap **Add** → choose **KV namespace**
4. **Variable name:** type `RW_KV` (exactly, capitals matter)
5. **KV namespace:** pick `RW_KV` from the dropdown
6. Tap **Deploy** / **Save**

Reload `/health` — `"kv"` should now be `true`.

> You do **not** need to touch `wrangler.toml` on this path. The dashboard
> binding does the same job.

---

## Step 5 — Add your secrets (6 min)

**First get a Ticketmaster key** (free, ~2 min, works fine on phone):
1. Go to **developer.ticketmaster.com**
2. Sign up → **My Apps** → create an app
3. Copy the **Consumer Key**

**Then add it to the Worker:**
1. **Workers & Pages** → **roamwise-api** → **Settings**
2. Find **Variables and Secrets** → tap **Add**
3. **Type:** choose **Secret** (not Text — Secret keeps it hidden)
4. **Name:** `TICKETMASTER_KEY`
5. **Value:** paste your key
6. Tap **Deploy** / **Save**

**Repeat for a refresh token:**
- **Name:** `REFRESH_TOKEN`
- **Value:** make up any long random string, e.g. `rw-8f3k2p9x-refresh`
- Save it in your notes — you need it in Step 7

**Optional** (only if you want the AI proxy): same steps with name
`GROQ_API_KEY`, value from console.groq.com.

Reload `/health` — your flags should be `true`.

---

## Step 6 — Set the schedule (2 min)

1. **Workers & Pages** → **roamwise-api** → **Settings** → **Triggers**
2. Find **Cron Triggers** → tap **Add Cron Trigger**
3. Enter exactly: `30 5 * * *`
4. Tap **Add**

That runs it daily at 05:30 UTC (11:00 AM IST). News refreshes every run; events
refresh on Mondays.

---

## Step 7 — Fill the cache now (30 sec)

Don't wait for tomorrow's cron. In Chrome, open (with your token from Step 5):

```
https://roamwise-api.YOURNAME.workers.dev/events/refresh?token=YOUR_REFRESH_TOKEN
```

You should see `{"updated":"...","count":42,...}`.

Then open `/events` — same data, now cached.

---

## Step 8 — Switch it on in the app (3 min)

Edit `rw-config.js` **directly on GitHub from your phone**:

1. Open your repo in Chrome → tap `rw-config.js`
2. Tap the **pencil ✏️** icon
3. Change these two lines:

```js
backend: 'auto',
workerUrl: 'https://roamwise-api.YOURNAME.workers.dev',
```

4. Scroll down → **Commit changes**

GitHub Pages redeploys in about a minute. Open Event radar in the app — you
should see a green **"↻ N live events synced"** line.

---

## Done. What keeps it free

Already built into the code you pasted:

- **Edge caching** — the CDN answers most requests, so the Worker isn't invoked
- **Only 2 KV writes a day** (from cron) against a 1,000/day free limit
- **AI rate limit** — 1 request per IP per minute, using zero KV writes
- **Token-protected refresh** — nobody can drain your Ticketmaster quota

**You cannot get a surprise bill on the free plan.** If you ever exceeded
100,000 requests in a day, Cloudflare returns an error — it does not charge you.

---

## If something goes wrong

| Problem | Fix |
|---|---|
| Editor unusable / buttons cut off | Chrome ⋮ → tick **Desktop site** |
| `"kv": false` on /health | Binding variable name must be exactly `RW_KV`, then redeploy |
| `/events` empty | Do Step 7 (the refresh URL) |
| `unauthorised` | Token in URL doesn't match `REFRESH_TOKEN` |
| Can't paste code | Re-copy from the GitHub **Raw** view (Step 1) |
| Want to undo everything | Set `backend: 'firebase'` in rw-config.js and commit |

---

## Rolling back

One line in `rw-config.js`: `backend: 'firebase'`, commit, done. The Worker is a
router, not a database — nothing lives only there, so nothing is lost.
