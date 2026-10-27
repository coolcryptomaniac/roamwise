# Capital discipline

Admin → Business → Capital discipline & long-runway planning.

This owner-entered planner supplements the existing growth forecast and compliance workbench. It does not obtain a bank balance, certify compliance, change pricing, block bookings, move money or enforce API spending.

## Inputs and accounting boundaries

- Total business cash and the portion committed to partners, refunds, taxes and other liabilities. Each obligation should be counted once. Available cash is never negative; any liability shortfall is displayed separately.
- Essential monthly costs include founder pay, team costs, software/AI, accounting and other unavoidable operating costs.
- Conservative monthly cash contribution is Roamwise income after variable costs and taxes. Exclude GMV, customer advances and partner payouts. Do not also include deducted variable costs in essential costs.
- Annual cost increase is an editable assumption, initially 6%, not a prediction.
- Monthly AI budget and month-to-date spend are owner-entered warning inputs, not provider-enforced limits or forecasts. Existing production entitlements are unchanged.

Blank figures remain unknown. The interface does not auto-populate historic revenue or expense records as if they were current cash.

## Calculations

Available cash = max(0, total cash − committed funds).
Reserve target = 24 × today's essential monthly cost (no assumed contribution).
Cash above reserve = max(0, available cash − reserve target); this is not authorization to spend.

For months 1–240, essential costs increase once each year and contribution stays constant. Starting capital required is the maximum cumulative funding deficit through month 120 or 240; operating surpluses may fund later deficits. No returns, fundraising or growth are assumed. Runway is the number of complete months before cash becomes negative, bounded at 240 months. Not exhausting cash during this scenario is not an infinite-runway claim.

Unexpected losses, one-off liabilities beyond entered commitments, changes in contribution and payment timing can shorten actual runway. Review the model whenever inputs materially change.

## Operating choices

Prefer recurring software services and disclosed referral fees with measurable support costs. Honour existing terms. Validate contribution after support, AI, payment fees and refund costs before expanding. Keep optional extras separately priced.

Review proposals involving third-party fund custody, wallets, lending, crypto custody, guaranteed inventory or foreign entities before implementation. Payment routing and a referral label alone do not determine statutory obligations. The existing finance workbench remains the place to evaluate actual facts with professional review.

## Persistence and verification

Inputs save to the dedicated `capitalDiscipline` field of the existing admin-only finance costs document using merge writes. Values are loaded only after its snapshot arrives. Live refreshes do not overwrite an open draft. Inputs changing clears stale results. Save failures retain the draft and display an error.

Run `node --test tests/capital-discipline.test.js`. No rules or payment handlers were changed. This panel deliberately leaves hard spending enforcement to configured provider limits and the existing entitlement system.
