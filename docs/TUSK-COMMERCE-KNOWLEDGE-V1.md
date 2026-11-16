# Ailon Tusk · contextual commerce and durable knowledge (16 Nov 2026)

## What runs without new provider bills
- Public, **labelled** RoamWise-owned offer rails are attached only to relevant Ailon questions; unrelated topics, private account questions and emergencies have **no promotions**. Two cards at most per normal reply; swipe horizontally. Traveller can choose "Hide these offers" locally. This is first-party promotion, **not** third-party ad auction/paid placement.
- Commerce reads existing GET /shop/catalogue or GET /stays/rates from the existing Worker (no conversation text sent to these catalogue reads). The catalogue decides whether an item is present and whether shop checkout is enabled. RoamWise marketing text cannot create its own product, SKU, inventory or price.
- In the Ailon dialog, shop items, Amor packages and eligible RoamWise stays offer **Get verified price**. It calls POST /shop/quote (product, variant, quantity and shipping PIN) or POST /stays/quote (actual dates, package or property, room/meal plan).
- The button to pay is disabled until an official quote exists; the traveller must explicitly click "Approve and pay". The order is created through POST /shop/order or POST /stays/checkout. If the Worker returns an amount different from the reviewed quote, **do not launch checkout**.
- The Cashfree **hosted popup** is opened by the official v3 SDK using the server-issued payment session. No card or UPI secret touches Tusk. After the popup returns, only the existing Worker-side status API can verify whether payment happened.
- Shop purchase confirmation and fulfilment use shop-order.js. Paid stays/packages remain **pending property confirmation** until the supplier accepts; don't call an unconfirmed stay a guaranteed booking. No order or payment is created on an AI suggestion, speech transcript or carousel impression.
- The pre-existing live Amor swipe cards have an extra "Review & pay inside Ailon" control. Their original website checkout remains reachable as the fallback, including Android WebView/payment-page incompatibility.
- Trek/guide bookings remain on /treks/ (login, exact departure and operator-approval gates are required). Other package engines with only WhatsApp enquiry or no server quote must keep their existing fallback. NEVER promote a lead as a directly bookable package.

## Voice agent
Voice Studio can show the same labelled cards. Spoken factual answers exclude promotional card contents. Voice can request discovery, but payment is always tap/keyboard + explicit quote approval + Cashfree-hosted verification; voice transcripts, remembered payment credentials, and LLM tool calls cannot authorize a charge. No claim of full duplex or voice-only payment.

## Knowledge storage: permanence of a record is not permanence of a claim
Class | Examples | Authoritative store | Caching | Recheck
---|---|---|---|---
Anchor | Geographic location, historical dates, core cultural identity | Append-only reviewed source pack in Git; approved R2 later | Public read may be cached; records stay versioned | Annual provenance review
Reference | Airport codes, languages, plug types, borders, routes, typical climate | Reviewed dated records | Short TTL (policy cap 24h, not infinity) | Quarterly / changes
Policy | Visas, park permits, safety rules, GST, vaccination requirements | Official source lookup | No durable answer cache | Recheck for each use
Dynamic | Prices, stock, room/seat availability, flight times, closures, live weather, exchange rates | Source Worker/provider | No answer cache | Quote/verify every transaction
Private | User booking/order/wallet/history | Authenticated Firestore/Worker transaction layer | Never in public query index | User-authorized access

Versioned historical/geographic seed is in worker/data/tusk-evergreen-facts.js, created with short original summaries, official source URLs and checkedAt. *Do not silently rewrite facts:* add a new version, mark old one superseded in a follow-up and keep its original provenance. The seed is 7 records as a safe starting point, not "all information in the world." TUSK_FACTS continues as dated operational reference. Do not publish supplier net rates, contact details, personal data, third-party article copies, or paid source content in public vectors.

### 100-question baseline
- evals/tusk-100-questions.mjs labels exactly 100 requests across geography, history, infrastructure, slow references, visa/policy, prices, transport schedules, safety/weather, private records and commerce.
- tests/tusk-100-question-eval.test.mjs checks classification, secret/private redaction, fail-closed cache eligibility, and an official geographic seed result. These are **labelled fixtures**, not proof of factual answer correctness in 100 languages.
- Run npm test and the evaluation summary script. Save mismatches and reviewed-answer quality independently; score unsupported queries as "needs source" rather than a wrong made-up result.
- Before a Vectorize/R2 pilot, add 50–200 human-reviewed source records under versioned IDs, measure precision and latency against exact keyword baseline, validate permission to use all documents and ensure no auto-ingestion. Enable semantic or paid web lookup only after budget controls, provenance review and explicit approval.

## Release gates
1. Unit, static, accessibility/voice and full repo checks must pass.
2. Test a Cashfree **sandbox** shop checkout (correct SKU, delivery, amount and receipt), then a package booking, including cancellation and failed/rejected supplier confirmation. Never use production money just for testing.
3. Test Android Chrome and Capacitor WebView: Cashfree popup success/failure, UPI app handoff, return URL and the ability to check status without duplicate charges. Keep original official checkout links for fallback.
4. Verify actual live Worker revision and flags before calling a feature "deployed". Git merge updates source; it does not prove a Worker has been deployed.
5. Report initial conversion, clicks to quotes, quotes to payment, paid-but-unconfirmed rate, complaints and provider fees before increasing the number of promotional cards.

Cashfree official references:
- https://www.cashfree.com/devstudio/preview/pg/web/popupCheckout
- https://www.cashfree.com/docs/payments/overview
