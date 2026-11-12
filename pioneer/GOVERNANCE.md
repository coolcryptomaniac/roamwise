# Pioneer Circle · Proof of Care (proposal, not automatic entitlements)
**Release:** static transparent information page + pure policy utilities. Actual verified seat allocation and benefit redemption are not live in this PR.

## Self-sustaining rules inspired by Bitcoin's *engineering*, not its coin
1. **Predictable issuance of membership recognition:** first *server-verified eligible account* receives the earliest available seat in a serializable Firestore transaction; unique identity and anti-sybil policy subject to audit. The existing Founder Pro purchase eligibility (first 1,000, launch date and server gate) is untouched. No fictitious or retroactive seat is generated from browser localStorage.
2. **Proof of care, not proof of spending:** verified itinerary corrections, responsible safety submissions, independently validated local businesses and approved trip reviews can earn non-financial reputation. Moderation, attribution, anti-spam and appeals required. Do not pay for fake reviews or engagement.
3. **Capped benefits, no passive yield:** only after a *genuine settled profitable order* and independent spend authorization may the recommendation function suggest a discretionary promotional benefit. Hard cap = 10% of that order's realized net margin and remaining approved pool/per-order maximum. Relative weighting: seats 1–100 100%, 101–1,000 80%, later 60%, all within one approved budget. No credit or discount is currently promised, minted or issued by this code.
4. **Perpetual recognition ≠ perpetual spend:** preserve the founding rank and badge record even after a subscription changes; never promise a future paid API allowance, discounts or operator benefits indefinitely. Published purchased Pro terms and consumer rights are distinct from optional promotions.
5. **Self-governance without a token:** signed policy releases and public version history, optional member votes on *proposals*, 2/3 approval of at least 3 eligible maintainers for high-impact rules, security veto, external code audit, rollback and break-glass stewardship. A pure function models the quorum; privileged server verification is future work.
6. **Resilience:** open-source essential offline trip format, reproducible builds, self-hostable docs, source escrow/backups, printed emergency contacts, documented maintainer succession. Legal responsibility, hosting, supplier contracts, consumer complaints and settlement cannot be delegated away by a mathematical promise.

## Release gates before actual Circle accounts and benefits
- Server-issued immutable membership IDs with verified timestamps and account recovery; migration policy for legacy paid founders and NMIMS recipients; no duplicate identity.
- Firestore rules deny all client-side seat assignment; concurrent seat claims and payment reversals tested under emulator.
- Approved reward funding account and atomic double-entry journal, reconciliation and expiry terms; regulatory/CA review for cross-merchant benefits.
- Contracted benefits only where supply partners have specifically approved them, with capacity and geographic limitations.
- Transparent opt-in privacy policy, data export/deletion, fraud appeals, no MLM, no speculation, no transferability.
- Signed release artifacts, documented dispute process, monitoring and a small reserve for support and refunds.

**Design target:** network effects from verified supply, repeat trip history and trust, not token price, referral pyramids, or unlimited discounting.
