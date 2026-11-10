# RoamWise Cloudflare-first caching implementation
This change adds an opt-in, GET-only public-display endpoint at `/public-cache/:collection/:id`, backed by existing `RW_KV`. It does not export Firestore or alter checkout, user auth or dynamic data. It is disabled until `PUBLIC_DISPLAY_CACHE_ENABLED=true` is set after backfill and validation.

## Intended ownership
- Cloudflare Worker: scheduled repeated jobs, response shaping, low-cost AI routing, abuse controls.
- KV: repetitive public responses and short-lived approved public display projections. KV is eventually consistent; do not use for transaction or inventory authority.
- R2 (future, provision separately): static photos, itineraries and media with proper consent and cache-control.
- D1 (future, provision separately): searchable public catalog, after schema and costs reviewed.
- Firestore: authoritative users, live availability, payment states, refunds, orders, wallet and dynamic booking data.

## Next implementation gates
1. Review the actual Firestore schema and privacy classification. Existing PR #735's replica module is separate and should be reconciled before integration.
2. Create a least-privilege authenticated incremental sync job, only for approved display fields. Include deletion propagation and a version/checkpoint, no repeated full collection scans.
3. Backfill in bounded batches; compare source and cache results, then enable route.
4. Add R2 bindings only after provisioning a bucket; move approved static assets with verified content types and rights.
5. Track Firestore reads, KV operations, cache-hit rate and billing; budget $10/month Google Cloud target, not a hard spending guarantee.
6. Run `node --test tests/cloudflare-public-cache.test.mjs` and staging smoke tests before deployment.
No live data has been copied. No production deployment or billing changes have been made.

## Incremental sync now in PR #736
Daily cron calls `syncApprovedPublicTargets` but exits unless `PUBLIC_DISPLAY_SYNC_ENABLED=true`. The JSON `PUBLIC_DISPLAY_SYNC_TARGETS` accepts up to 10 explicit `{"collection":"destinations","id":"almora"}` entries, from approved public collections only. It reads at most 10 Firestore documents per day, projects allowed display fields, and removes KV records when source docs are absent or no longer approved. Errors preserve the previous cache until TTL expiry. This is a bounded pilot, not a full-database mirror; no data copied yet.

**Before enabling:** inspect actual collection names and source document consent flags (`approvedForPublic=true`, `visibility=public`), then stage test and verify deletion propagation. Run `node --test tests/public-display-sync.test.mjs tests/cloudflare-public-cache.test.mjs`. Cache endpoints remain disabled independently. Never add payment/user collection IDs to targets. For larger datasets, use checkpointed paginated backfill with a dedicated queue or D1; do not increase cron reads without a cost review.
