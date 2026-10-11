# Abuse protection (Worker) — what is on, what needs you

## On as soon as this deploys (no setup)
`worker/lib/rate-limit.js`, called once at the top of the router:
| Route | Limit (per IP) |
|---|---|
| everything except health and cached GET news/events/geo | 600 / min |
| POST /cashfree/order, /partner/cashfree/order | 60 / 10 min |
| POST /payment-events | 300 / 10 min |
| order status GETs | 200 / 10 min |
| /leads | 12 / 10 min |
| /ai with sign-in token | 1 / min **per user** (was 1/min per IP) |
| /ai without a token | 20 / min per IP (then 401 anyway) |
POST bodies over 64 KB on the guarded routes get 413. The limiter fails open if the cache breaks.
Limits are sized for a college Wi-Fi where many students share one IP.

## Honest limits
- Cache-API limiter is per data-centre and not atomic: a speed bump against floods and scripts, not an exact meter.
- **Coupon redeem is client-side Firestore** (`js/payments/partner-redeem.js`), so the Worker cannot rate-limit it. Real protection there = Firebase App Check + the one-time-redeem rule already in Firestore. Do the App Check step below.
- Payment/entitlement logic is untouched; payments are protected by sign-in, server-side price checks and these limits.

## Needs you (accounts/consoles)
1. **Turnstile (captcha)**: Cloudflare dashboard → Turnstile → add widget for roamwise.co.in → copy site key + secret. `wrangler secret put TURNSTILE_SECRET`. The verifier (`lib/turnstile.js`) is dormant until then, verifies a token sent as `X-Turnstile-Token`, and only *requires* one if `TURNSTILE_REQUIRED=true` (leave off until a form sends tokens). No public form calls it yet; wire it into whichever public form gets abused first.
2. **Firebase App Check** (Firebase console → App Check → register Web with reCAPTCHA Enterprise/Turnstile provider, then Android with Play Integrity). Start in *monitor* mode, enforce after a week. Do this AFTER 15 Oct, not on event week.
3. **Cloudflare in front of the site** (WAF, Bot Fight Mode, rate-limit rules, DDoS): after 15 Oct. Copy all DNS records first; never cache `/ai` or `/cashfree`; test Cashfree callbacks and Firebase afterwards.
