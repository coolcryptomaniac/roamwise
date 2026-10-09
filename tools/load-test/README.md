# Load test

`load.mjs` hits a site or public Worker route with N concurrent clients and prints latency
percentiles, error rate and Cloudflare cache hit ratio. No install needed (Node 20+).

Run order before a big launch (e.g. 15 Oct NMIMS event):

1. Staging first: `node tools/load-test/load.mjs --url https://roamwise-pages.pages.dev --paths /,/about,/app.js,/sw.js --concurrency 50 --seconds 30`
2. Raise `--concurrency` in steps (50, 100, 200). Watch p95 and the cache hit ratio. After the first
   pass the hit ratio should be high (90%+); if not, check the Cloudflare cache rule.
3. Worker health route only: `--url https://<worker> --paths /health`.
4. Watch the Cloudflare dashboard (Workers requests, errors) and Firebase usage during the run.

Do not point this at `/ai`, `/cashfree/*` or any signed-in route on production: they cost money
or write data. Test those with a handful of real requests plus the unit tests instead.
A single laptop or phone connection can only show you a few hundred requests/s; for lakhs of users
the proof is that the static site is served from Cloudflare's cache (cache hit ratio) and that the
Worker stays inside its plan limits.
