# Atomic daily budget integration
This module performs a Firestore read-write transaction that reads both daily aggregate and expense claim, checks the ₹500 cap, then atomically writes both. A unique expense ID prevents repeat reservations. It is **not yet invoked by any vendor adapter**. Budget accounting and wallet customer money remain separate.

## Before production
- Configure server-only service-account OAuth access; do not expose the token in frontend code.
- Validate against Firestore emulator and concurrent live test project. Confirm batchGet response ordering, contention retries, transaction rollback and midnight IST behavior.
- Build a **settle reservation** transaction to move reserved to spent after verified provider billing; unused reservation release must be idempotent and tied to provider evidence. Never automatically reset ambiguous charges.
- Wire every paid AI/research/SEO vendor through one guarded adapter. Uninstrumented providers must remain disabled for autonomous spending.
- Confirm existing bills/subscriptions are outside this adapter and are not magically constrained by the ₹500 limit.
- Finance wallet still uses unsafe KV paths; do not enable new wallet functionality until ledger migration and audit.
