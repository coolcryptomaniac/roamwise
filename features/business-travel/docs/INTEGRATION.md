# RoamWise Business: integration and pilot guide

Status: implementation prepared on 8 September 2026, subsequently modularized before publication. This document does not
assert that the branch, Worker, or any customer integration is deployed.

## What works in this change

`/business/` is a separate, dependency-free expense workspace. Opening the main
RoamWise planner does not download its JavaScript or stylesheet. The workspace
uses no fonts, video, AI calls, analytics, polling or external data requests.
It has a 25 KiB gzip budget for its HTML/CSS/JavaScript, enforced by a test.

The workspace supports one trip draft at a time, 200 expense rows, editing and
removing expenses, trip/daily spending limits, receipt-reference checks,
possible-duplicate warnings, 10 currencies, and decimal-exact conversion with
user-supplied exchange-rate provenance. It prepares CSV and JSON reports, plus
restorable JSON backups. A receipt reference is not a verified receipt.

Drafts stay in memory by default. Saving on this device is explicit and uses
only `rw_business_draft_v1`. Turning it off removes that saved draft. Browser
storage is not encrypted, shared-device access is not identity-gated, and
multiple tabs do not synchronize. Use one tab on an approved device; download
a backup before replacing a draft. Do not enter card numbers, passport details
or confidential notes. Site-wide JavaScript on this origin can access local
storage: use the in-memory mode for sensitive drafts. No employer receives
data from this page. Offline use works while the tab remains open; a first
visit or cold offline launch is not guaranteed by this change.

`POST /v1/business/reconcile` and `POST /v1/business/export` are optional additions
to the existing Worker. They are **disabled by default** and separate from
Firebase sign-in, consumer Pro entitlements and payments. The first evaluates
expenses; the second sends one signed export to a provisioned receiver. Neither
endpoint generates routes, predicts live crowds, approves an expense, books
travel, pays anyone, or posts directly to an ERP. The report's `route` is a
human-entered itinerary description. Use the existing travel planner for route
exploration; do not tell an AI agent that these endpoints optimize routes.

## Start with an independent finance export

1. A traveler uses the existing RoamWise planner, then records the business trip,
   cost center, dates and policy in `/business/`.
2. They enter expenses and the exchange rates approved by finance. Rates express
   **one original-currency unit in report-currency units**, dated and sourced.
3. They resolve flags and download the CSV. A flagged CSV can still be downloaded
   for review; it never says approved. Automated exports reject unresolved flags.
4. Finance verifies receipts and rates and maps columns to its own import format.
   CSV interoperability is not a claim of certified SAP/Oracle compatibility.

All exported monetary values are decimal strings. INR/USD/EUR/GBP/AED/SGD/CAD/
AUD/CHF have two fractional digits; JPY has none. FX rates accept up to six
digits. Conversion uses integer arithmetic and rounds half up once per row.
Daily limits group **all** expenses by expense date; they are not per-diem or
hotel-night calculations. The report currency cannot change once rows exist.
Rows must lie within the trip dates; advance purchases/refunds require a later,
explicit accounting design. Amounts are positive: this version is not a general
ledger and must not silently net refunds against expenses.

## Enable a company API pilot

Deployment/auth configuration needs its own review under
`AI-ROLES-AND-HANDOFF.md` rule 7. This patch changes no live secrets, Firestore
rules, deployment bindings, company accounts or pricing.

The existing `worker/wrangler.toml` still contains a placeholder KV namespace ID.
Resolve the existing Worker's setup first using `worker/WHATS-LEFT.md`; do not
paste a replacement configuration that deletes unrelated bindings or cron.

1. Provision a server-side integration owned by the customer's IT team. Keep
   credentials there, never in the browser, `rw-config.js`, source control, an AI
   prompt or an OpenAPI document. Prefer issuing `reconcile` scope first.
2. Generate a random 32-byte secret, encode base64url and prefix it with `rw_biz_`.
   Calculate SHA-256 over the **entire** resulting token, including the prefix.
   Give the raw token to the customer's secret store. The Worker receives only
   its lowercase SHA-256 digest, in `BUSINESS_TENANTS_JSON`.
3. Store `BUSINESS_TENANTS_JSON` as a Worker secret containing an array of tenant
   objects. Maximum 25 tenants and 2 keys each; this intentionally bounds pilot
   complexity. The object shape is below. Placeholder values are not credentials.
4. Add a rate-limiter binding to the existing Wrangler config. Use an unused
   positive integer namespace in **your** Cloudflare account:

   ```toml
   [[ratelimits]]
   name = "BUSINESS_RATE_LIMITER"
   namespace_id = "1008" # example: choose an unused namespace
   simple = { limit = 30, period = 60 }
   ```

   This is an approximate limit **per Cloudflare location**, not a global billing
   cap. Do not use it for metered invoicing or promise a global request quota.
   Missing or failing limiters make these endpoints return 503. No KV write is
   added per request. [Cloudflare rate-limiting contract](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/).
5. Add `BUSINESS_ENABLED = "true"` under the existing `[vars]`, only after the
   tenant, policy, rate limiter and receiver have been tested. Setting it to
   anything else disables both routes immediately on the next deployment.
6. Deploy the existing Worker through its normal, reviewed path. Point the
   OpenAPI document's placeholder `host` to that deployment. No deployment is
   needed for the local CSV workspace beyond publishing the static files.

Example tenant secret structure (replace every placeholder before activation):

```json
[
  {
    "id": "customer-pilot",
    "enabled": true,
    "keyHashes": ["REPLACE_WITH_64_CHARACTER_SHA256_HEX"],
    "expiresAt": "2026-12-01T00:00:00Z",
    "scopes": ["reconcile"],
    "policyVersion": "2026-09-v1",
    "policy": {
      "baseCurrency": "INR",
      "budget": "25000.00",
      "dailyLimit": "8000.00",
      "receiptThreshold": "500.00",
      "requireReceipt": true
    },
    "webhookUrl": "https://YOUR-APPROVED-RECEIVER/roamwise",
    "webhookSecret": "REPLACE_WITH_A_SEPARATE_RANDOM_SECRET_AT_LEAST_32_CHARACTERS"
  }
]
```

Server policy always overrides client-supplied limits. Report currency must
match server policy, so a caller cannot reinterpret an existing exchange rate.
Tenant identity comes from the key; submitted tenant IDs and webhook URLs are
ignored. Disable a tenant, expire its key, remove its hash or remove `export`
scope to revoke access. For rotation, provision a second hash briefly and then
remove the old hash. Never reuse a key across companies.

Use `Authorization: Bearer <token>` and `Content-Type: application/json`.
`../contracts/openapi.json` is OpenAPI/Swagger **2.0**, with a placeholder host; provide the
entire `Bearer …` value when the connector asks for the Authorization API key.
Requests are limited to 128 KiB and body reading times out after five seconds.
Responses are `no-store`. No browser Origin or CORS access is allowed.

Request shape:

```json
{ "report": { "schemaVersion": 1, "trip": {}, "policy": {}, "expenses": [] } }
```

Use the included `../contracts/example-report.json` for a complete synthetic example. The
workspace's report JSON contains the normalized input under `.report`, so the
download itself can also serve as the reconciliation request body. To export,
add `"reviewed": true` at the top level and use an export-scoped credential.
This flag records the caller's assertion of review; it is not proof of human
approval. The customer must enforce its own approval permissions before calling.

For economical agent calls, add `"responseMode": "summary"` to reconciliation
requests. Full responses remain the default. See `AI-AGENTS.md` for bounded
responses, tool-call budgets and explicit export review requirements.

## Webhook delivery contract

Enable `export` scope only after validating the receiver. Use an endpoint
controlled by the customer's IT team on public HTTPS, with no redirects,
embedded credentials or custom ports. The configured hostname must resolve to
the approved public service; the Worker does not implement DNS/IP attestation.
Never allow a customer form to directly edit `BUSINESS_TENANTS_JSON`.

The server sends `expense_report.exported`, never `trip.confirmed` or
`expense.approved`. Payload fields include schema version, event ID, tenant ID,
policy version, export time and the normalized reconciliation. It sends only
defined report fields, with no GPS, account tokens or arbitrary input fields.

The receiver must:

1. Verify `X-RoamWise-Signature` (`v1=<hex>`) against HMAC-SHA256 of
   `X-RoamWise-Timestamp + "." + rawRequestBody`, using its own tenant secret.
   Compare signatures in constant time, **before** parsing or acting on fields.
2. Reject timestamps more than five minutes from its synchronized clock.
3. Persist a unique `X-RoamWise-Event-Id` / payload `id` before taking action;
   match the expected tenant and process each event once. Use the event ID as a
   unique external reference in finance. A repeated payload has the same event
   ID, even when delivery timestamps differ. A changed report or policy version
   has a different ID and must go through the customer's amendment procedure.
4. Return 2xx only after durable acceptance. Apply company approval and field
   mappings before any downstream ERP posting. Never trigger reimbursement
   directly from the presence of an export event.

One call makes one delivery attempt, with a five-second timeout and no redirects.
There is **no durable RoamWise outbox, automatic retry, dead-letter queue, or
exactly-once guarantee**. A timeout returns `delivery_unknown`: the receiver
may already have processed the report. Check its event ID before retrying the
same content. HTTP failures return `receiver_rejected`; 2xx returns
`receiver_accepted`, which does not assert successful ERP posting or payment.

Before unattended production use, add a tenant-isolated durable outbox,
transactional idempotency records, retries with jitter, dead-letter inspection,
retention/deletion controls and an audit trail. Use that infrastructure when
actual contract volume funds it; do not turn a stateless pilot into a false
promise of reliable asynchronous delivery.

## Vendor and identity pathways

| Ecosystem | Next concrete connection | Status in this patch |
|---|---|---|
| Custom finance stack / ERP | Map CSV columns or receive signed exports; attach cost-center and account mappings | Generic export and adapter implemented; customer setup required |
| SAP / Oracle | Customer IT maps the generic report to its approved expense API/import and tests in its tenant | No vendor-specific connector or certification |
| Microsoft Copilot Studio / Power Automate | Import OpenAPI 2.0 into an approved server-side connector; first allow only reconciliation | Contract supplied; no Microsoft account connected |
| Salesforce Agentforce | Register a scoped server-side API action against the same reconciliation contract | No Salesforce account connected |
| Entra ID / Okta SSO | Register OIDC authorization-code client against the existing Firebase/Identity Platform architecture; enforce server-owned company membership | Not implemented or enabled |
| SOC / duty of care | Separately design explicit, expiring trip sharing and authorized emergency access | No location collection or security automation |

Microsoft documents OpenAPI 2.0 and authentication configuration for REST tools;
its direct REST-tool feature is marked preview at the time of this review, so
validate the supported production integration path and customer license before
promising availability. [Microsoft REST tools](https://learn.microsoft.com/en-us/microsoft-copilot-studio/agent-extend-action-rest-api).

Company SSO needs actual issuer, client ID/secret, callback registration and
membership/role rules. Preserve existing consumer Google sign-in. An email suffix
is not tenant authorization, and a client-supplied organization ID cannot grant
membership. [Google Identity Platform OIDC setup](https://docs.cloud.google.com/identity-platform/docs/web/oidc).

Location is a limited contextual signal, not an identity or device-trust proof.
Do not automatically restrict corporate access merely because a traveler enters
a region. The customer's identity/device policy engine owns those decisions.
[NIST zero-trust architecture](https://csrc.nist.gov/pubs/sp/800/207/final).

## A sustainable rollout

This is a proposed operating sequence, not a forecast or a published price plan.

- **First 30 days:** serve up to three small-team design partners using CSV;
  measure repeat business trips, time spent reconciling, support time, errors and
  willingness to pay. Verify current payment/entitlement reliability before
  increasing acquisition spend. Do not rely on historic user/revenue counts.
- **Days 31–60:** connect the ecosystem a paying pilot actually uses. Quote a
  monthly organization service plus paid setup for integration/support. Keep
  existing lifetime consumer promises intact; sell separately contracted company
  services. Exclude unbounded AI, custom engineering and safety guarantees.
- **Days 61–90:** add SSO, shared records and durable delivery only for a proven
  customer need. Measure contribution per organization: collected recurring fees
  minus infrastructure, provider usage, refunds and attributable support. Expand
  only after retention and those costs support the service.

Keep the static planner and small feature modules. Route heavy features to their
own pages; no enterprise SDKs on consumer startup. Keep deterministic budget
checks free of AI calls. If agent route generation is later exposed, add caching,
timeouts, bounded tool calls and cost controls before enabling it. Audit API and
cloud bills monthly; avoid promises that free tiers remain free indefinitely.
Use official exports/APIs for finance integration, not scraping employee systems.

## Verification and release

```sh
npm run business:check
npm run business:test
npm test
npm run check
npm run mod-status
```

Test company credentials and real delivery in a sandbox after provisioning.
Check successful receipt, invalid/expired credentials, wrong tenant policy,
rate limiting, duplicate delivery, server outage and receiver timeout. Include a
receiver signature tampering test and a replay rejection test. Tests in this
repository exercise real decimal/HMAC code with mocked outbound delivery; they
do not claim to have tested a live SAP, Oracle, Microsoft or Salesforce tenant.

Publish the static workspace through the existing GitHub Pages workflow after
review. Do not rehost the site or change its domain. Independently review and
enable the optional Worker feature after configuration and customer validation.
