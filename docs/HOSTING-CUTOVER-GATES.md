# Hosting cutover: Google sign-in, Cashfree, and two-host readiness

Status: **DO NOT CUT OVER DNS** until both the Cloudflare Pages preview and existing live host pass real browser acceptance. The read-only GitHub Action in this PR monitors HTTP availability only, **not** checkout or OAuth completion.

## Current locations
- Current custom domain: `https://roamwise.co.in`, historically on GitHub Pages
- Cloudflare Pages preview: `https://roamwise-web.pages.dev`
- Source: `coolcryptomaniac/roamwise`, branch `main`
- Firebase project: `roamwisepro`
- Trusted payment API: independently deployed `roamwise-api` Cloudflare Worker (not Cloudflare Pages)

## Google authentication — founder dashboard action

In Firebase Console > project `roamwisepro` > Authentication > Settings > Authorized domains, add **`roamwise-web.pages.dev`** (hostname only). Keep `roamwise.co.in`, `www.roamwise.co.in`, and other legitimate production auth hosts. In Authentication > Sign-in method verify Google is enabled. This is a Firebase console action and is **not** changed by a GitHub commit or Pages deployment.

In normal Chrome, open the Pages preview; tap Google sign-in, complete the popup, verify a real Firebase session, reload the tab and ensure the same user remains signed in. Repeat on mobile Chrome. A static `auth-init.js` fetch passing does **not** prove Google auth works. Distinguish `auth/unauthorized-domain`, popup blocked, invalid API key, OAuth redirect/third-party cookie issues, and Firestore access failures.

Firebase uses `roamwisepro.firebaseapp.com` for `authDomain`. Do **not** globally switch it to `pages.dev` by guesswork; redirect sign-in requires separate provider-specific hosting setup.

## Cashfree — separate front end from payment backend

The existing website's adapter `js/payments/providers/cashfree-adapter.js` fetches `/cashfree/order` and `/cashfree/order/:id/status` from the Worker, then loads Cashfree's own JS SDK. The Pages static build does **not** carry Cashfree secrets. Verify the **deployed Worker** has Secret bindings named:
- `CASHFREE_APP_ID`
- `CASHFREE_SECRET_KEY`
- `FIREBASE_SERVICE_ACCOUNT_JSON`

Do **not** publish secret values in files, screenshots, GitHub, or ChatGPT. Check deployed environment (live vs sandbox), `config/app.WORKER_URL`, `config/app.PAYMENT_PROVIDER`, and `config/app.CASHFREE_ENVIRONMENT` for consistency. Check merchant-dashboard Cashfree website/domain whitelisting for the origin used by checkout. A preview host may not be approved for *live* checkout even if the eventual production custom domain already is. Check `worker/CASHFREE-503-RUNBOOK.md` for `not_configured`/501 and service-account/503 cases.

Test in a dedicated sandbox Worker/config if available; never switch a live production Worker to sandbox as an experiment. Only after backend health and authorized-domain checks, perform a **single authorized** sandbox payment with documented sandbox credentials and verify server-side order receipt and entitlement; real low-value payment is a later explicit merchant test. A webpage returning 200 or a JavaScript SDK opening is **not** sufficient proof of successful payments. Never trigger synthetic paid orders as an uptime check.

## Hosting parity and Kainchi deployment

The workflow `hosting-parity-watch.yml` can be manually run on the Actions tab after merging. It checks both hostnames' home page, runtime config, auth client, Cashfree adapter and Kainchi page four times daily. It does not use Firebase secrets or make orders. It reports a *broken HTTP path*, not a verified broken Google/Cashfree transaction.

The existing GitHub Pages `static.yml` workflow builds `_site` and regenerates the Kainchi daily feed and restores prior public snapshots. The direct Cloudflare Pages Git build currently uses build scripts but does **not** reproduce the full feed/snapshot process; preserve this process before cutover, or accept that live Kainchi updates differ. A separate `cloudflare-pages.yml` action targets `roamwise-pages`; do not also deploy the Git-linked `roamwise-web` project through that workflow.

## Failover: what is and isn't configured

**Current:** keep GitHub Pages on the production domain and Cloudflare Pages on its preview. Retain a rollback plan, and test both. Merely having two sites online does NOT give `roamwise.co.in` automatic failover.

**Later, after both origins are independently reachable:** use a health-checking router such as Cloudflare Load Balancing with active/passive pools. It is an additional billed service; its origin Host headers must match each host's configured domain. A separate, functioning GitHub Pages backup hostname (with correct paths, TLS and auth/checkout approvals) is required; a GitHub hostname that simply redirects back to `roamwise.co.in` is NOT a valid independent backup. Cloudflare-based failover may not protect against a Cloudflare-wide outage.

**Alternative:** independent external DNS health-based failover provider plus separately authorized HTTPS/hostnames, with propagation/TTL delays. Never implement untested automatic DNS mutations or assume instant cutover. On failure, stop **new checkout attempts** but allow users to inspect existing orders without duplicate charges.

Until payment, login, and backup-host behavior have been tested across origins, **do not enable automatic routing changes**. Keep a known-good previous Pages deployment for immediate rollback of a bad deployment. Cloudflare Pages deployment rollback and infrastructure failover solve different problems.

## Cutover acceptance

- [ ] Cloudflare Pages homepage, major pages, assets, CSS, routes, PWA reload
- [ ] Google sign-in and sign-out, persistent session, mobile Chrome (both hosts)
- [ ] Firestore read/write permissions for the signed-in owner and ordinary users
- [ ] Worker `/health` and read-only payment boundary monitor pass
- [ ] Cashfree sandbox order, SDK, backend status verification, entitlement, duplicate-payment guard
- [ ] Checkout provider approves the production hostname
- [ ] Kainchi feed and other dynamic/static build outputs match
- [ ] Main custom domain TLS, apex/www redirection, email MX/SPF/DKIM validated
- [ ] Independent backup hostname, health check, and tested controlled rollback or paid failover solution

Do not remove the old custom domain or change GoDaddy/Cloudflare DNS until the above gates are verified.
