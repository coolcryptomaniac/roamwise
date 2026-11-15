# Ailon Tusk · Source-first hybrid knowledge (November 2026)

## Decision
Keep Cloudflare Workers + existing Firestore for accounts, bookings and commercial records. Use existing `worker/data/tusk-facts.js` for reviewed public facts. Add an optional public-query search pipeline to `GET /tusk/search`, without turning on a paid service or changing account/checkout logic. **No new infrastructure or cost is required to run the initial reviewed-facts route.**

1. Validate a **public** question only; reject email addresses, phone numbers, credentials, long inputs and control characters. This API is not the destination for private account queries.
2. For **non-live** questions only, optionally retrieve an exact approved response from `RW_KV` (key = hashed normalized public query + language; 1h default TTL). KV is deliberately **off** until the founder approves query-level storage charges.
3. Check the existing **reviewed, dated RoamWise fact pack**, linking directly to sources. Seasonal records expire.
4. Optional: Workers AI `@cf/baai/bge-m3` generates a query embedding; Cloudflare Vectorize (cosine, **1024 dimensions**) returns the top three **pre-approved** candidates. Require both a calibrated score threshold and lexical overlap, then fetch the manually approved and expiry-dated record from **R2 Standard**. The *same* embedding model/pooling must be used when uploading source vectors; no automatically generated pages get into this index. This stage is **off by default**. An index is not created by merging the code.
5. Optional licensed **Brave Search** retrieves verified **links/snippets** when no reliable local answer exists, or when information is live. This does not synthesize a confident answer from snippets. **Off by default**: needs the founder's API key and explicit enablement. Browser-side Wikipedia/DDG instant-answer fallbacks remain best-effort.
6. If nothing verified is available, explicitly admit that and link to official external verification. Do not hallucinate fares, weather, routes, hotel availability or reservations.

Ailon's existing authenticated `POST /ai` model routing remains unchanged: `MANAGED_AI_ENABLED=false` by default, with user allowance and revenue-based spend gating. Never smuggle public search traffic into paid `/ai` or auto-grant Pro access.

## Existing endpoints and code
- `worker/handlers/tusk-web-search.js`: public retrieval route.
- `worker/lib/tusk-hybrid-knowledge.js`: pure sanitisation, expiry, exact-cache and optional approved-vector logic.
- `worker/data/tusk-facts.js`: reviewed seed inventory with primary sources.
- `js/copilot/sourced-search.js`: browser adapter; public source cards and freshness metadata.
- `js/copilot/core.js`: existing results UI with swipeable HTTPS source cards.
- `worker/lib/ai-cache.js`: separate authenticated model answer cache; does **not** replace source freshness checks.

## Optional bindings and explicit toggles

Existing `worker/wrangler.toml` keeps these disabled:

```toml
TUSK_EXACT_KV_ENABLED = "false"
TUSK_VECTOR_SEARCH_ENABLED = "false"
TUSK_WEB_SEARCH_ENABLED = "false"
TUSK_KV_TTL_SECONDS = "3600"
TUSK_VECTOR_MIN_SCORE = "0.87"
```

The Vectorize and R2 binding examples are commented out and must be added only after those resources really exist. Example, **not a deploy command until reviewed**:

```sh
cd worker
npx wrangler vectorize create roamwise-tusk-approved --dimensions=1024 --metric=cosine
# Create R2 Standard bucket 'roamwise-tusk-knowledge' through Cloudflare
# then enable the bindings and explicit flags in wrangler.toml.
```

JSON R2 object schema for `tusk-approved/v1/<id>.json` (this is a **fictional sample**, not verified content):

```json
{
  "id": "example-kasar-quiet",
  "approved": true,
  "title": "Quiet travel around Kasar Devi",
  "keywords": "Kasar Devi Almora quiet travel",
  "summary": "Human-reviewed text, supported by the referenced source.",
  "checkedAt": "2026-11-16",
  "validUntil": "2026-12-16",
  "sources": ["https://uttarakhandtourism.gov.in/"]
}
```

Every matching Vectorize record needs `id=example-kasar-quiet` with metadata `{approved:true,title:"Quiet travel around Kasar Devi",keywords:"Kasar Devi Almora quiet travel"}`, and a 1024-dimensional BGE-M3 vector generated from that exact title/keywords/summary. R2 and Vectorize *must* be reviewed together. No live user prompt will automatically upsert either store. `validUntil` is mandatory. For multilingual results, evaluate Hindi/Kannada on real RoamWise queries before enabling.

## Budget reality and evaluation

- Cloudflare R2 Standard includes 10 GB-month free and monthly operation quotas. Additional storage and requests can incur charges, and a subscription must be enabled.
- Vectorize allowances are billed by **vector dimensions**, not a promise of millions of free 1024-dimensional records. A 10-million stored-dimension allowance is only around **9,765** 1024-dimensional embeddings, before accounting for other usage.
- Workers AI free allowance is 10,000 Neurons/day, **not** a guaranteed fixed number of searches. Free allowance and pricing vary with model/token load.
- Firestore vector search exists but needs a supported SDK and vector index. Avoid using 1–10 GB of indexed Firestore documents as a blind web-dump storage plan. R2 is better for large, public, approved source text; Firestore remains the transactional database.
- Gemini 2.5 grounding costs and free allowances differ from Gemini 3+ grounding. Recent Gemini 3+ paid tiers advertise 5,000 free monthly search requests then **$14 per 1,000** search queries, and a request can generate multiple billable Google queries. Model tokens and tier-specific restrictions still apply.
- Groq `llama-3.1-8b-instant` was deprecated in August 2026, and Groq Compound web search in September 2026. Neither is a dependable 2026 design assumption.
- Do **not** promise a 95% cache-hit ratio or under-50ms answer time without measured production traffic. At 500,000 searches/month, 5% live misses = 25,000 grounding lookups; at the 5k free/14-per-1k scenario the nominal search cost is **$280** before tokens. This estimate can be higher if a request triggers multiple searches.
- No **hard $30 monthly guarantee** comes from ordinary KV counters: KV writes are not atomic. Keep paid retrieval disabled unless the provider's own monthly spending cap and an atomic Cloudflare Durable Object or equivalent budget reservation are in place.

Primary documentation:
- https://developers.cloudflare.com/workers-ai/platform/pricing/
- https://developers.cloudflare.com/workers/platform/pricing/
- https://developers.cloudflare.com/vectorize/reference/client-api/
- https://developers.cloudflare.com/vectorize/get-started/intro/
- https://developers.cloudflare.com/r2/pricing/
- https://firebase.google.com/docs/firestore/vector-search
- https://ai.google.dev/gemini-api/docs/pricing
- https://console.groq.com/docs/deprecations

## Small-team rollout gate (do not jump straight to 10 GB)

1. Keep the reviewed fact route on and verify source/date labels through Android + web. Run the new test file.
2. Build a **50–200**-question labelled evaluation set across English, Hindi, Kannada, general travel and corporate/offsite queries. Measure incorrect hit rate, coverage, latency, unsupported-language rate and **actual** provider calls.
3. On explicitly approved public text only, populate at most 50–200 R2 records and Vectorize entries. Compare results to a keyword baseline; tune the threshold against false positives, not merely cache-hit percentage.
4. Consider 1–10 GB R2 **after** validating data rights, event/transport TTL policies, provenance, redaction, and measured benefit. Keep private documents, account data, partner net rates and user trip histories out of public retrieval.
5. Turn on paid search and grounded generation only after an enforceable spend limit, provider terms review, and clear evidence that linked source cards alone aren't enough.

**No external source is silently copyrighted/re-hosted. No automatic publishing of model output. No promise that a cache score means answer correctness.**
