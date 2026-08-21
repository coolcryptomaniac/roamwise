# The Worker — complete tutorial

**On your Android phone. 20 minutes. Free forever.**

I've pre-configured everything I can. You edit **one line** and paste **three
values**. That's the whole job.

---

## Before you start

Open Chrome → **⋮** menu → tick **Desktop site**.

Skip this and the code editor is unusable on a phone. It's the single most
common reason people give up.

---

## Step 1 · Copy the code (1 min)

1. Chrome → your GitHub repo → **worker** → **worker.js**
2. Tap **Raw**
3. Long-press the text → **Select all** → **Copy**

---

## Step 2 · Create the Worker (4 min)

1. **dash.cloudflare.com** → sign in
2. Left menu → **Compute (Workers)** → **Workers & Pages**
3. **Create application** → **Start with Hello World!** → **Get started**
4. Name it exactly: `roamwise-api`
5. **Deploy** (this deploys the placeholder — fine)
6. **Edit code** → select all the placeholder → delete → **paste** yours
7. **Deploy** (top right)

**Write down the URL.** It looks like:
`https://roamwise-api.yourname.workers.dev`

---

## Step 3 · Check it's alive (30 sec)

Open `your-url/health` in a new tab.

```json
{"ok":true,"configured":{"ai":false,"kv":false,"events":false}}
```

All `false` is **correct** right now. Bookmark this page — it's the only thing
that tells you the truth about what's actually working.

---

## Step 4 · The KV store (5 min) — REQUIRED

Without this, `/events` and `/news` stay empty forever.

**4a.** Left menu → **Storage & Databases** → **KV** → **Create namespace**
→ name it exactly `RW_KV` → **Add**

**4b.** Copy the **ID** it shows (a long string of letters and numbers)

**4c.** Back in your Worker → **Settings** → **Bindings** → **Add** →
**KV namespace**
- Variable name: `RW_KV`  ← exactly this, capitals matter
- KV namespace: pick `RW_KV` from the dropdown
- **Deploy**

Reload `/health` → `"kv": true` ✅

> On the dashboard path you never touch `wrangler.toml`. The binding does the
> same job. The file is only for the laptop route.

---

## Step 5 · Secrets (6 min)

**Get a Ticketmaster key** (free, works fine on mobile):
developer.ticketmaster.com → sign up → **My Apps** → create app →
copy the **Consumer Key**

**Add it:** Worker → **Settings** → **Variables and Secrets** → **Add**
- Type: **Secret** ← not Text. Secret keeps it hidden.
- Name: `TICKETMASTER_KEY`
- Value: paste
- **Deploy**

**Repeat** for `REFRESH_TOKEN` — invent any long random string like
`rw-8f3k2p9x-refresh`. Save it in your notes; you need it once in Step 7.

**Optional:** `GROQ_API_KEY` from console.groq.com if you want the AI proxy.

Reload `/health` → your flags should be `true` ✅

---

## Step 6 · The schedule (2 min)

Worker → **Settings** → **Triggers** → **Cron Triggers** → **Add**

Enter exactly: `30 5 * * *`

That's daily at 11:00 AM IST. News refreshes every run; events on Mondays.

---

## Step 7 · Fill the cache now (30 sec)

Don't wait until tomorrow. Open:

```
your-url/events/refresh?token=YOUR_REFRESH_TOKEN
```

You should see `{"updated":"...","count":42,...}`. Then open `/events` — same
data, now cached.

---

## Step 8 · Switch it on (3 min)

Edit `rw-config.js` **directly on GitHub** from your phone:

1. Repo → tap `rw-config.js` → tap the **✏️ pencil**
2. Change two lines:

```js
backend: 'auto',
workerUrl: 'https://roamwise-api.yourname.workers.dev',
```

3. Scroll down → **Commit changes**

GitHub Pages redeploys in ~1 minute. Open Event radar — you should see a green
**"↻ N live events synced"**.

---

# Every scenario, and what to do

### "It says Error 1101 or the deploy fails"
You pasted incomplete code. Re-copy from the **Raw** view — the normal GitHub
view adds line numbers that break it.

### `"kv": false` even after adding the binding
Three things, in order:
1. The variable name must be exactly `RW_KV` — not `rw_kv`, not `RW-KV`
2. You must tap **Deploy** after adding the binding
3. Hard-refresh `/health` (pull down to reload)

### `/events` returns `{"count":0}`
You skipped Step 7. Open the refresh URL once with your token.

### `"error":"unauthorised"` on the refresh URL
The token in the URL doesn't match `REFRESH_TOKEN` exactly. Watch for a
trailing space when you paste.

### The cron never seems to run
- Cron only runs on a **deployed** Worker, never in preview
- Cloudflare cron can drift by a few minutes — that's normal
- Check it worked by opening `/events` and looking at the `updated` timestamp

### "Am I going to get charged?"
**No.** On the free plan, exceeding 100,000 requests/day returns an error
(code 1027) — it does **not** bill you. You cannot accidentally run up a
charge on the free plan. There's no card on file.

### "What if RoamWise gets huge?"
Your `/events` response is cached at Cloudflare's edge for an hour, so a
million users produce roughly 2,000 Worker requests a day. If you ever did
exceed the free tier, the fix is **$5/month** for unlimited — and at that point
five dollars is not your problem.

### "I broke something and want to undo it all"
Edit `rw-config.js` → `backend: 'firebase'` → commit. Done. The Worker is a
router, not a database — nothing lives only there, so nothing is lost.

### "Can I test without affecting the live site?"
Yes. Leave `backend: 'firebase'` and just open the Worker URLs in a browser.
The app ignores the Worker entirely until you flip that line.

### "The AI proxy is open to the world"
It is, as written. Before you share the URL anywhere: Cloudflare dashboard →
your Worker → **Settings** → **Rate limiting** → add a rule. Or leave
`GROQ_API_KEY` unset and the endpoint just returns "not configured".

---

## What this unlocks

Once it's live, three things that need a scheduled job start working:

- **Live events** — Ticketmaster data refreshed weekly, merged under your
  curated list (yours always wins)
- **Travel-tech news** — refreshed daily
- **The AI proxy** — your API key moves off the browser
- **Geocoding at scale** — place lookups cached 30 days at the edge

And it's the foundation for the Travel Intelligence Graph: anything that needs
to run while nobody has the app open needs this Worker.
