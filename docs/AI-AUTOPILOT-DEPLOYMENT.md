# RoamWise model routing, November 2026
The policy module is **advisory and read-only**, not a deployed AI router. The model identifiers and costs must be rechecked before API enablement.

Recommended default: GPT-6 Luna for routine support, GPT-6.1 Terra for marketing and itineraries, GPT-6.1 Sol for exception analysis and coding, GPT-6 Astra only for rare complex audits. Claude Sonnet 5.5 and Gemini can be evaluated as optional independent reviewers; never rely on one provider for correctness or availability.

## Production controls
- No AI model has direct access to payment credentials or the ability to issue refunds, supplier orders, payouts or production deployments.
- Every provider call requires a real atomic budget reservation and verified usage settlement; current #728 remains open and is not wired.
- Server-side Cloudflare Secrets for credentials; rotate via an authorized Cloudflare account. #729 is open and is not a deployed secrets configuration.
- Require explicit review for high-impact code changes, finance exceptions and marketing claims.
- Ground availability, rates, delivery promises and commission terms in verified records.
- Daily outreach runs via existing scheduled automation; do not create a duplicate sender.
- Implement fallback routing and circuit breakers only after testing latency, token spend, quality, multilingual behavior and privacy.
- Before production, run unit and integration tests, then sandbox and small live pilot.
