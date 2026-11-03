# Tusk curated knowledge and Cloudflare Workers Paid pilot

The Cloudflare Workers Paid subscription (commonly $5/month base) does **not** include unlimited Workers AI inference, KV writes, Firestore reads, or third-party provider calls. Do not raise `MANAGED_AI_LIMITS` or provider caps based solely on subscribing. Review the current Cloudflare account's actual quotas and billing alerts.

## Firestore data contract

Only **admin-approved** documents should be written to these collections. The Worker uses its server-side service account and explicitly exposes a public allowlist.

- `tusk_destinations/{slug}`: `verified:true`, `published:true`, `name`, `summary`, optional `state`, `country`, `highlights` (string array), `bestSeason`, `culture`, `transportTips`, `safetyTips`, `updatedAt`.
- `verified_properties/{slug}`: `verified:true`, `published:true`, `name`, optional `destination`, `city`, `state`, `summary`, `amenities` (string array), `category`, `priceFrom`, `currency`, `publicUrl`, `updatedAt`.

Both flags are mandatory; absent or unapproved documents are not returned. Do not store personal owner details in the public fields. Property records are informational only: no live room availability or confirmed booking is inferred.

## API and caching

`GET /tusk/curated?type=destination&id=almora` and `type=property&id=...` return `{hit,data,cached}`. IDs are strictly validated. A KV hit avoids Firestore entirely; verified records have a 1-hour TTL, misses 5 minutes. This is a read-only endpoint; writes must go through existing admin approval processes. Existing `/tusk/learned` remains the public generic-answer cache.

The browser uses curated destination answers for generic non-personal, non-live queries before invoking a hosted model, falling back to shared answers, guides, and the normal AI route on a miss. Curated records must be populated by an admin before any hits occur. The Worker service account needs least-privilege Firestore read access; no public Firestore rule relaxation is needed.

## Scaling checklist before 10k–50k users

1. Set paid-plan budget alerts and separate Workers AI / provider spending limits.
2. Replace KV read-modify-write usage reservations with an atomic Durable Object or transaction-backed counter; KV is eventually consistent and not safe as a strict global budget meter.
3. Monitor Worker request rate, KV reads/writes, Firestore reads, cache hit ratio, latency and provider error rate.
4. Add admin-approved ingestion and property sync; do not automatically publish unverified listings.
5. Load-test gradually, verify abuse controls, and avoid promising a specific concurrency or user capacity from the subscription alone.
