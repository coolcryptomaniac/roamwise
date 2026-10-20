# Tusk trip desk — implementation and integration boundaries

19 October 2026. This change is a working browser trip workspace, not an all-channel booking platform.

## Available in this change

- Home and Stay & Do access to flight/train/bus/taxi discovery; electric bus and taxi links appear first. Links open provider sites without claiming live prices, availability, API access or coverage.
- Free-date window, origin, optional destination, budget and EV preference become an explicit Tusk planning request. Dates are validated; nothing is purchased.
- Stay shortlisting, successful inquiry tracking, pending-versus-confirmed separation, WhatsApp summary draft and human email support.
- Authenticated, read-only `roomBookings` history scoped by guestUid under existing Firestore rules. External reservations and other devices' inquiry lists are not imported. Up to 50 returned direct bookings are shown; this is not a complete export.
- Local memory is opt-in and namespaced by signed-in UID; guests have a separate device namespace. Clear removes local preferences and inquiries, not actual bookings. No raw conversation, phone or name is retained by this module. Signing out does not delete an opted-in account's local workspace. Shared devices should disable remembering.
- Agent `trip_desk` tool exposes current explicit preferences and inquiry state; tool cannot confirm bookings, charge money or message strangers.
- Read-only aggregate review module: `node tools/ai-ops/tusk-learning-review.cjs metrics.json`. It rejects unknown/raw fields, suppresses cohorts below 20, and flags grounding/task failure. It does not train a model or auto-promote a prompt.

## Integration work requiring service access

| Area | Next concrete requirement |
| --- | --- |
| Flights | Server-side Amadeus or contracted distributor credentials, production market eligibility, fare revalidation, ticketing/consolidator agreement, refund support. Never expose API keys in browser. |
| Rail | Authorized IRCTC distribution arrangement; discovery links do not confer booking API rights. |
| Bus / EV taxi | Operator inventory agreement, supported routes, vehicle-type evidence, cancellation policy and callback verification. No assumption every departure is electric. |
| WhatsApp / Telegram | Existing worker bot handlers already exist. Configure their provider tokens and signed webhook secrets, test inbound/outbound delivery, link channel identities to authenticated accounts using expiring one-time challenges. Never link by a user-supplied UID. |
| Instagram | Professional account, approved Meta application permissions and messaging webhooks; shared support-ticket state and staffed handoff. |
| LinkedIn | No general-purpose inbox bot integration is established here. Use a profile/contact route until approved platform access is verified; do not scrape inboxes. |
| Phone / IVR | Telephony number/provider, recording consent, language routing, verified callback identity and a human escalation queue. |
| Calendar / proactive planning | Explicit calendar authorization or user-entered free windows, timezone-aware conflict detection, separate notification opt-in and quiet hours. Calendar free time is not purchase consent. |
| Automatic booking | Itemized fresh quote, availability, cancellation/refund terms, passenger details, explicit transaction or narrowly scoped spend mandate, idempotent server-side order state and verified payment webhooks. None are bypassed by a model. |
| Social travel | Opt-in discovery, coarse destination/date sharing, block/report/moderation, private contact controls. Identity checks cannot establish that somebody is safe. No automatic sharing of reservations or free-day calendars. |

## Model and learning strategy

Keep the existing managed AI gateway and provider fallback. Choose a primary model per task using measured correctness, grounding, latency and cost, rather than sending personal travel data to every model. Booking state and prices must come from deterministic tools. Use a second model only for bounded verification of complex plans; never let model agreement authorize payment.

The existing daily `tusk-selfcheck.yml` already runs regression checks and can collect configured anonymous quality reports. The new aggregate evaluator can run on a daily/weekly/monthly schedule once an approved aggregate export exists. Do not grant a training job unrestricted Firestore access. Export only whitelisted aggregate fields (task, model, samples, successful, grounded, p95ms, costINR), with consent/retention controls upstream. Public web changes should become cited review candidates, not instructions executed by an agent. Hold out regression cases, review recommendations, stage experiments and retain rollback. No production self-modifying loop is enabled by this PR.

Birla AI Labs Yug-1 is a time-series forecasting model, not a chat model. Its potential use is demand/lead-volume forecasting after sufficient clean time-series data exists, subject to license, benchmark and operating-cost review. It does not replace Tusk's conversational reasoning.

## ChatGPT / API release path

A public ChatGPT app would expose a remote MCP server through the Apps SDK. First ship read-only `search_stays`, `discover_transport` and `trip_summary` with OAuth account linking, per-user authorization, rate limits, input validation, privacy policy and deletion controls. Keep create-inquiry and purchase tools separate and require explicit user action. The existing browser agent tools are not a hosted MCP server. No connector has been published in this change.

## Primary references checked

- https://www.nuego.in/
- https://www.everacabs.com/
- https://contents.irctc.co.in/en/IRCTC%20Authorised%20Principal%20Service%20Providers.pdf
- https://admin.developers.amadeus.com/self-service/apis-docs/guides/developer-guides/faq/
- https://huggingface.co/birlaailabs/yug
- https://www.postman.com/meta/whatsapp-business-platform/overview
- https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api
- https://help.openai.com/en/articles/12515353-build-with-the-apps-sdk

## Validation

Run `node --test tests/trip-desk.test.js tests/tusk-learning-review.test.js`, then existing booking/Tusk regressions. Manually check narrow screens, keyboard focus, save/remove/clear, account switching, blocked storage, offline history errors, and provider link handoffs. Do not claim live provider end-to-end validation without configured credentials.
