# RoamWise creator × property matching

## What the pages do

- `/creators/match.html?role=creator&invite=founding` is the low-friction creator invite. It accepts one Instagram, YouTube, or portfolio link plus collaboration preferences and can be shared through WhatsApp, Instagram, YouTube, email, or the phone share sheet.
- `/creators/match.html?role=property` collects property preferences, stores a short draft on the device, and carries it into `/partner/join/` for the full property and manager verification.
- Signed-in verified accounts can save the same preferences to the Creator Protection worker. Only active profiles that pass trust review can appear in match results.
- Match Autopilot scores niche, destination, platform, deliverable, and budget fit. It can shortlist or invite both sides, but cannot book, publish, or move money. Cash above the review threshold or suspicious profile signals pause for a human decision.

## Collaboration tiers

| Tier | Starting point | Typical use |
| --- | --- | --- |
| Hosted barter | ₹0 cash, agreed room/meals/experiences | Most ordinary stay collaborations |
| Hybrid | Hosted value + ₹3,000–₹15,000 | Travel support or extra production |
| Paid launch | ₹15,000–₹50,000+ | New opening, multi-asset shoot, broad usage rights |
| Custom | Mutually proposed terms | Larger or unusual campaigns |

These are negotiation bands, not platform-fixed creator prices. Both sides see and accept the same dates, inclusions, deliverables, usage rights, cancellation terms, and cash amount.

## Trust and fraud controls

1. Verify email, phone, profile ownership, recent activity, and creator audience signals.
2. Verify property listing, operating identity, and the applicant's authority to offer the rooms.
3. Compare duplicate contact, device, campaign, payout, and abnormal follower-growth signals where legally available.
4. Require an exact written brief and acceptance by both sides before a campaign starts.
5. Route high-cash, conflicting, new-account, unusual-growth, dispute, and payout-change cases to a manual review queue. An admin decision is recorded before the profile can enter introductions.

## Banking and settlements

- A hosted barter has no payment order. RoamWise records the hosted benefits and agreed deliverables so both sides have one source of truth.
- A hybrid or paid campaign creates a shareable campaign/payment link. The amount shown on the server is the amount used to create the provider order; the browser does not decide the charge.
- Provider webhooks are signature-checked and idempotent before the campaign becomes funded.
- Creator payout details belong to a verified provider vendor account. Payout is requested only after the agreed work is approved, with disputes pausing release.
- RoamWise's disclosed service fee and creator settlement are separate ledger amounts. Live collection and split settlement remain disabled until provider onboarding, KYC, contracts, tax treatment, refunds, and dispute operations are approved.

The current worker supports a provider adapter for Cashfree Easy Split and a sandbox provider for testing. This is a technical flow, not a promise that live regulated payments are enabled.
