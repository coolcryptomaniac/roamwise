# Cloudflare Worker — setup guide

**Read this first:** deploying the Worker is **optional and non-breaking**. RoamWise keeps
working exactly as it does today until you flip a switch in `rw-config.js`. You can turn it
on, test it, and turn it back off in seconds without touching any other code.

---

## Why bother

These are the things a static site genuinely cannot do, and the Worker unlocks all of them:

| Problem today | What the Worker fixes |
|---|---|
| AI keys are visible in the browser | Keys live server-side; the browser never sees them |
| No scheduled jobs | Cron runs daily — news feed, refreshing places |
| Passport "verified" flag is client-side, so a determined user could forge it | Verify server-side and the cheating hole closes |
| No way to email/notify without a human | A Worker can call SendGrid/Resend on a schedule |

Cost: the free plan covers **100,000 requests/day**, which is far beyond what you need today.

---

## Step 1 — Create a Cloudflare account
Go to **dash.cloudflare.com** and sign up (free). You do **not** need to move your domain.

## Step 2 — Install the CLI
On any computer with Node.js:
```
npm install -g wrangler
wrangler login
```
A browser window opens; approve it.

## Step 3 — Deploy
From this `worker/` folder:
```
wrangler deploy
```
It prints a URL like:
```
https://roamwise-api.<your-subdomain>.workers.dev
```
**Copy that URL.**

## Step 4 — Add your AI key as a secret
```
wrangler secret put GROQ_API_KEY
```
Paste the key when prompted. It is encrypted and never appears in your repo.

## Step 5 — (Optional) Add the KV cache for the news job
```
npx wrangler kv namespace create RW_KV
```
Paste the printed `id` into `wrangler.toml` and uncomment those two lines, then
`wrangler deploy` again.

## Step 6 — Turn it on in the app
Open **`rw-config.js`** in your site root and change two values:

```js
backend: 'auto',                                        // was 'firebase'
workerUrl: 'https://roamwise-api.xxxx.workers.dev',     // your URL from step 3
```

Deploy the site. That's it.

---

## The switch — how to move safely

`rw-config.js` has one setting that controls everything:

| Value | Behaviour | When to use |
|---|---|---|
| `'firebase'` | Ignores the Worker entirely. Current production behaviour. | Default. Always safe. |
| `'auto'` | Tries the Worker, silently falls back to Firebase if it is down. | **Recommended** once deployed |
| `'worker'` | Worker only. | Once you fully trust it |

**To roll back instantly:** set `backend: 'firebase'` and redeploy the site. Nothing else
changes, and no data is lost — the Worker is a router, not a database.

---

## GitHub Actions (optional auto-deploy)

If you want the Worker to redeploy whenever you push, add this as
`.github/workflows/deploy-worker.yml`:

```yaml
name: Deploy Worker
on:
  push:
    branches: [ main ]
    paths: [ 'worker/**' ]
  workflow_dispatch:
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          workingDirectory: worker
```

### The GitHub secret you need
Repo → **Settings → Secrets and variables → Actions → New repository secret**

| Name | Value |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare dash → My Profile → API Tokens → Create Token → template **"Edit Cloudflare Workers"** |

---

## Testing it worked

Open in a browser:
```
https://your-worker-url.workers.dev/health
```
You should see `{"ok":true,"service":"roamwise-worker"}`.

If you get anything else, leave `rw-config.js` on `'firebase'` — the app is unaffected.

---

## Honest notes

- The Worker is a **router and a scheduler**, not a database. Firestore remains your data store.
- The **AI proxy endpoint is unauthenticated** as written. That is fine for a soft launch, but
  before you promote it widely, add a rate limit or a shared token — otherwise someone could
  burn through your AI quota. Cloudflare's dashboard has built-in rate limiting rules.
- Moving passport verification server-side is the single highest-value follow-up, because it
  is what makes cash prizes genuinely cheat-proof.
