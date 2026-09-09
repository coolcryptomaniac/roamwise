# Business travel: start here

This folder owns the business-travel feature. Preserve root `CLAUDE.md` and
`AI-ROLES-AND-HANDOFF.md`; this file narrows discovery, not authorization.

## Fast context

Run `npm run business:context -- core`, `-- ui` or `-- api` from the repo root.
`feature.json` is the checked module map and browser load order. Open the one
relevant module, its direct dependencies and related feature tests first.
Read `docs/INTEGRATION.md` only for deployment, company identity, vendor mapping
or webhook operations. Avoid rereading the entire repository for a local edit.

| Concern | Owner |
|---|---|
| Input bounds and dates | `core/validation.js` |
| Decimal money / FX | `core/money.js` |
| Trip schema / policy flags | `core/reports.js` |
| CSV safety | `core/exports.js` |
| Form state and mapping | `ui/context.js`, `ui/forms.js` |
| Device persistence / backup validation | `ui/storage.js` |
| Text-node rendering | `ui/view.js` |
| Downloads and file restore | `ui/transfers.js` |
| Startup / UI lifecycle | `ui/controller.js` |
| Request bounds / private responses | `api/http.js` |
| Hashes / tenant policies | `api/crypto.js`, `api/tenants.js` |
| Signed delivery | `api/webhooks.js` |
| API orchestration | `api/handler.js` |

## Runtime boundaries

- `/business/index.html` is the public entry; no feature scripts on consumer
  startup. Use classic scripts in the manifest order, one namespace per layer.
- `RWBusinessCore` holds pure shared rules; `RWBusinessUI` holds page factories.
  Keep state in the explicit page context. Worker code uses named ES exports.
- `worker/handlers/business.js` is only a re-export. `worker/worker.js` remains
  the single Worker deployment entry. Never add another default fetch handler.
- No runtime dependencies, paid AI calls, API keys or location tracking in UI.
- Company identity, policy and destination come from provisioned server secrets.
  Never trust a submitted tenant ID, changed client limits or webhook endpoint.
- An expense report is a draft, never an approval, payment, booking or ERP post.
  References/rates are user supplied. Keep unresolved vendor/SSO setup explicit.
- Do not add retries to exports: outcome may be unknown. Receiver deduplication
  and later durable-outbox work require an explicit design, not a retry loop.
- Keep runtime modules under the manifest's 350-line cap. Update the manifest
  when files move. Avoid public API/schema behavior changes in relocation commits.

## Verification and handoff

Run `npm run business:check` and `npm run business:test` for local iteration.
Before publishing a PR, run `npm test`, `npm run check`, and `npm run mod-status`.
Record actual results and pending vendor/device tests. Browser simulation is not
a device test; company-key behavior requires the repo's separate review.
