# RoamWise professional match deck — 16 November 2026

## Purpose

The new `/network/match/` page provides an optional Tinder-style interface for **professional collaborations**, not a dating service. It covers creators, influencers, stays, artists, yoga teachers, trekking companies and guides, travel/transport providers, experience hosts, wedding venues, wedding vendors, wedding planners and the customer/traveller **viewer role**.

There are currently **zero approved, consented professional records** in `network/directory.json`. This is intentional; 25–27 pending applications and private CRM contacts are not valid public matches. Until actual profiles with separate consent exist, the deck displays labelled *collaboration concepts*, never fictional people or invented availability. The previous `/creators/match.html` creator/property matching and `js/social/travel-matching.js` opt-in traveller matching continue to work separately.

## Consent and protection rules

Only the following existing public-record flags allow a profile to appear:
- `publicApproved===true` and `publicConsent===true` (explicit public listing permission)
- `matchApproved===true` and `matchConsent===true` (**separate consent to be featured in professional match recommendations**)
- `active!==false`

Professional categories are read only from `network/directory.json`: `creators`, `influencers`, `properties`, `artists`, `yogaTeachers`, `trekkingCompanies`, `trekkingGuides`, `travelProviders`, `transportProviders`, `weddingVenues`, `weddingProviders`, `weddingPlanners`, and `experiences`. These are newly supported schema keys; adding a private application under them does not bypass four opt-in flags.

**Never publish** `users` or `travellers` arrays, real-time whereabouts, precise addresses, dates, phone numbers, email, legal documents, payout details, owner net rates, private UIDs, full application forms, or chat logs to public JSON or GitHub Actions artifacts. Traveller-to-traveller interactions must continue via the existing **signed-in, explicitly posted, expiry-limited Firestore travel card** flow; do not join those records to a static public directory. The visitor's matching preferences stay in the browser and are not posted to a server.

Public status or being displayed on a card does **not** certify safety, legitimacy, trust, qualifications, insurance, or financial terms. A profile can be removed by withdrawing either consent flag; rebuild the public index and invalidate the CDN cache immediately.

## How ranking works

`network/match/core.mjs` computes a low-cost deterministic, **explainable matching score**. It is not an LLM-generated compatibility probability, and no hidden background AI is secretly learning from the user's profile.

- Complementary roles, base 42 points.
- Shared preferred destination or regional geography, +24.
- Shared interest/niche tags, +16.
- Shared collaboration mode (barter/hybrid/paid/custom), +11.
- An expressed goal supported by the counterpart, +7.
- Missing place or conflicting commercial modes are surfaced as reasons to investigate rather than invented confirmations.

The current static build caps public profiles at 2,000. For 200k+ professionals, use D1 indexed metadata or a protected candidate API with pagination and explicit permissions; never download 200k records to every user's browser. Pairwise recommendation reports are bounded and do not model all N² combinations.

A swipe right adds a public profile or concept to the device-only shortlist. A swipe left discards it. 'Explore' opens an approved public portfolio or the relevant existing onboarding form. **No emails, WhatsApp messages, auto-contracts, accepted introductions, complimentary stays, discounts, payments, or employment promises occur.** Leads require direct acceptance by both sides.

## GitHub Actions and deployment

`.github/workflows/network-matchmaker.yml` runs daily (scheduled for around 08:40 IST) and supports manual dispatch.

It:
1. Checks out the repo with **read-only** contents permissions.
2. Reads **only** `network/directory.json` (not Firestore, private admin sheets, Gmail or contact exports).
3. Produces a safe public-profile snapshot and read-only explanation/ranking report.
4. Validates that private fields were not included and uploads 30-day GitHub Actions artifacts.
5. Does **not** publish records, charge credits, contact leads, commit a PR or mutate any external service.

The GitHub Pages deployment builds `network/match/data.json` from approved, consented records on each normal site deploy. The version-controlled initial file contains zero profiles. This ensures the experience stays factual even without access to live CRM.

## Extended automation work (not configured in this phase)

If the founder later authorizes an authenticated private CRM matching backend, require: a service principal with minimum permissions; data minimization; retention windows; revocation/takedown handling; admin-only reports; rate/cost limits; user consent; independent evidence for licences and safety; and an explicit bilateral introduction approval. Do not put Firebase service account JSON or partner passwords in GitHub Actions or publicly readable artifacts.

Matching explanations can later be enhanced by an opt-in LLM using **only already approved public professional records** with strict token/cost budgets. Until then, deterministic role and fit scoring is free and predictable.

## Check

```sh
node tools/build-network-matches.mjs --check
node --test tests/network-match-deck.test.mjs
```

Review `/network/match/` in Android Chrome for swipe direction, accessibility, empty-state honesty, role changes and local shortlist behaviour. The page should show **no invented professional partners** until authorized publication and matching consent are recorded.
