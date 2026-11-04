# Ailon Tusk curated knowledge — low-cost rollout

The Cloudflare Workers Paid plan (commonly $5/month base subscription) is **not** an unlimited Workers AI, Firestore, KV, bandwidth or third-party model allowance. Keep `MANAGED_AI_ENABLED`, provider caps and the spend governor intact. Never raise limits automatically based on expected user count.

## Firestore schema (server reads only)

Create documents in these two collections, with lowercase URL-safe IDs:

- `tusk_curated_destinations/almora`
- `tusk_curated_verified_properties/milan-heights`

Fields:
```json
{
  "name": "Almora",
  "region": "Uttarakhand",
  "summary": "A Kumaoni hill town with cultural heritage and nearby forest walks.",
  "highlights": ["Kasar Devi", "Local markets", "Kumaoni cuisine"],
  "published": true,
  "verified": true,
  "updatedAt": "2026-11-03"
}
```

Properties can additionally use `location` and `bookingNote`. Only publish records after staff review and final admin approval; the Worker intentionally does not auto-promote unverified listings. Do not put owner contact details, private notes, internal commission, or personal information in these fields.

## API

Set `TUSK_CURATED_ENABLED=true` in the Worker only after seeding and reviewing documents. An authenticated `POST /ai` request may include `knowledgeType: "destination" | "property"` and `knowledgeId: "almora"` (or a verified property slug). When both are present, the Worker looks up the published, verified record and returns a non-generative answer with `route: "firestore-curated"`. This route is independent of model allowance and stores a sanitized result in the Cloudflare Cache API for 1 hour. Missing/unverified records fall through to existing model routing.

**Important:** The browser must supply a verified canonical ID for this fast path; this PR does not yet implement entity resolution in the client. Do not infer a property identity from fuzzy user text, as it can display the wrong hotel.

Cache is per Cloudflare data center and is best-effort. Publishing corrections may take up to one hour to propagate; never cache live rates, inventory, traffic, emergency or booking status.

## Scaling gates

1. Seed and verify a small curated collection, test authenticated API and cache hit/miss behavior.
2. Add a canonical destination/property resolver to the client or a server-side search index.
3. Record per-route request counts, cache hit ratio, Firestore read volume, p95 latency, and AI spend.
4. Before 10k–50k users, replace KV read-modify-write metering with atomic Durable Object/transactional counters and enforce hard provider budget ceilings.
5. Load-test with realistic concurrent traffic and verify the actual Cloudflare account quotas; $5/month does not establish capacity for 50k users.
