# RoamWise Cloudflare-first, Firebase-low-cost data strategy
This PR is a safe, **not-yet-wired** read replica library, not a complete Firestore export or production migration.

## Data placement
- Cloudflare KV: explicitly approved public destination, property, creator and experience *display fields*, 1h TTL; no secrets, phone/email, private addresses, financial data, live availability, authoritative prices or booking status.
- Cloudflare D1: future searchable relational catalog and verified read projections after schema and migration tests; create binding with Wrangler only after owner approves resource costs.
- Cloudflare R2: approved images and documents, with rights and access checks.
- Firestore: continue as authority for bookings, orders, users, payment status, refunds, wallet records and real-time inventory until transactional replacement and reconciliation are tested.
- Durable Objects or Firestore transactions: authoritative financial/inventory concurrency; never Workers KV read-modify-write.

## Migration stages
1. Inventory collections, security rules, volumes, PII, data residency, indexes and API consumers. Make encrypted backup and test restoration.
2. Create sanitized, consent-approved public projections from Firestore, not whole-document copies. Implement authenticated sync endpoint or change-event queue with least-privilege access, idempotency, retry, deletion propagation, and checkpointing.
3. Backfill in bounded pages, with read budgets and progress checkpoint. Avoid re-reading entire database on every cron.
4. Shadow-read KV/D1, compare with Firestore for 7 days, track cache hit, stale rates and costs. Preserve source on cache miss.
5. Shift only safe public GET routes to Cloudflare-first; monitor conversion and correctness. Never cache final checkout price or availability.
6. Add circuit breakers, metrics and scheduled verification. Limit Gemini model calls, batch AI jobs, use approved caching and strict provider budgets.
7. Set Google Cloud $10 budget alerts and eligible spend caps manually in authenticated billing account; this code cannot cap Google invoices.

## Cost constraints
Cloudflare Workers Paid $5 is a base subscription, not a universal limit. KV writes, D1 rows, R2 operations, external AI and Firebase billing can add usage charges. Set independent alerts. No actual data has been copied and no live settings changed.

## Security
Never expose service-account JSON or unrestricted Firestore exports in GitHub, R2 public buckets, KV or logs. Implement deletion and consent revocation propagation. Public listings can include only explicitly approved display fields. Validate media URLs and HTML before publishing to prevent script injection.
