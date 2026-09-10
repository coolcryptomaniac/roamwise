# RoamWise Global Operations Control Plane

This module turns the “5–20 core employees, asset-light, global reach” strategy into an operating system. It records partners, automation, support and compliance work; computes honest capacity/risk metrics; routes support to a follow-the-sun queue; and runs scheduled risk sweeps.

It deliberately does **not** promise zero legal liability. Contracts can allocate risk, but RoamWise still needs appropriate insurance, legal review, incident response and statutory compliance.

## What is automated

- founder-only dashboard secured by Firebase ID tokens and an allowlisted admin UID;
- core-headcount cap and owned-asset exceptions;
- partner/API/vendor registry with owner, region, due date, cost and evidence;
- recurring-workflow coverage measured from active automation records;
- public support intake protected by Turnstile and a Cloudflare rate-limit binding;
- deterministic safety/payment/privacy/legal classification before any optional AI call;
- optional AI response drafting only after explicit consent;
- mandatory human gates for safety, money, refunds, security, privacy, legal and account access;
- APAC → EMEA → Americas queue routing by UTC shift;
- 15-minute scheduled risk scans, Queue delivery, retries and a dead-letter queue;
- 180-day support-contact retention for resolved records;
- append-only operational events.

AI never sends money, issues refunds, changes bookings, grants account access, files legal documents, makes safety decisions or commits RoamWise to a deadline.

## Researched stack decision — 10 September 2026

### Cloud control plane

RoamWise already uses Cloudflare, so the lowest-complexity path is Workers + D1 + Queues + scheduled triggers, adding Workflows only for genuinely long-lived multi-step jobs. Cloudflare documents Queues as at-least-once delivery, so every downstream action must remain idempotent. AI Gateway can provide logging, caching, rate limiting and provider switching when AI volume justifies it.

- https://developers.cloudflare.com/workers/
- https://developers.cloudflare.com/queues/reference/how-queues-works/
- https://developers.cloudflare.com/workflows/
- https://developers.cloudflare.com/ai-gateway/

Do not introduce AWS or Azure merely to appear enterprise-ready. Add a second cloud only when a customer, data-residency rule or measured reliability requirement makes the operational cost worthwhile.

### Customer support

Start with this RoamWise queue plus a shared support inbox. Buy a full helpdesk only after ticket volume makes it cheaper than internal tooling.

- Freshdesk currently publishes plans from $19/agent/month billed annually and includes the first 500 Freddy AI Agent sessions on listed plans: https://www.freshworks.com/freshdesk/pricing/
- Intercom publishes Fin pricing separately and should be compared by resolved outcome rather than headline seat price: https://www.intercom.com/pricing
- Zendesk publishes plans from $19/agent/month and outcome-based AI allowances: https://www.zendesk.com/pricing/

The proposed “85% solved by AI” target is **not** treated as a fact. The dashboard measures actual resolution and escalation outcomes; only RoamWise production data may justify such a claim.

### Asset-light travel inventory

Use commercial partner APIs rather than inventory ownership:

- Expedia Rapid for lodging at enterprise scale: https://partner.expediagroup.com/en-us/solutions/build-your-travel-experience/rapid-api
- Duffel for flight selling and managed airline content; current public fees must be modeled per confirmed order: https://duffel.com/pricing
- Airalo Partner API for eSIM inventory: https://developers.partners.airalo.com/introduction-752219m0
- Amadeus now routes developers toward Enterprise APIs; its self-service portal was decommissioned on 17 July 2026, so do not build a new dependency on the old self-service flow: https://developers.amadeus.com/

A provider is not marked active until commercial terms, refunds, support SLA, data processing, termination/export and failure fallback are evidenced.

### India-first global compliance

RoamWise should launch the global operating company only after its CA/CS/legal advisers confirm the actual service and payment flows.

- RBI’s Export of Goods and Services Master Direction was updated 17 July 2026: https://www.rbi.org.in/Scripts/BS_ViewMasDirections.aspx?id=10395
- CBIC guidance covers export under bond/LUT and IGST procedures: https://cbic-gst.gov.in/pdf/circularno-37-cgst.pdf
- India’s Digital Personal Data Protection Rules, 2025 are published by MeitY: https://www.meity.gov.in/documents/act-and-policies/digital-personal-data-protection-rules-2025-gDOxUjMtQWa

Track at minimum: incorporation and tax registrations, annual LUT decision, foreign-remittance evidence, contract/DPA status, privacy notices and consent, breach response, retention, sanctions screening, consumer/refund rules and destination-specific obligations. The dashboard is an evidence tracker, not legal advice or automatic filing software.

### Remote team

Keep Product/Engineering, Partnerships, Growth, Finance/Compliance and Customer Operations as the accountable core. Use specialists for bounded work; do not label an employee as a contractor merely to avoid payroll. Employer-of-record services are useful when RoamWise controls work like an employer but lacks a local entity, although current public pricing can be material:

- Remote EOR: https://remote.com/global-hr/employer-of-record
- Deel pricing: https://www.deel.com/pricing/

## Deployment

1. Copy wrangler.toml.example to an untracked production configuration.
2. Create the D1 database and Queues, including the dead-letter queue.
3. Apply schema.sql.
4. Set GLOBAL_OPS_ADMIN_UIDS to the Firebase UID(s) already authorized for RoamWise admin.
5. Deploy with SUPPORT_PUBLIC_ENABLED=false.
6. Set globalOpsUrl in rw-config.js and verify founder login, CRUD, audit records and scheduled sweeps.
7. Configure Turnstile and the rate-limit binding before enabling public support.
8. Add an AI binding/model only after privacy, retention and cost review.
9. Add an alert webhook only after confirming it receives sanitized payloads and has appropriate access controls.

The feature remains in provider-onboarding mode while globalOpsUrl is blank.
