# RoamWise Creator Protection

This service is the server-side money and campaign control plane behind `/creators/`. It does not put provider secrets in the browser and it never trusts a client-side `funded` flag.

## Product contract

One campaign record represents one creator contract. A hotel that wants five creators can clone five seats from one campaign brief; each creator then has independent acceptance, KYC, funding, delivery, dispute and settlement evidence.

The creator's cash economics are explicit:

- creator fee;
- travel reimbursement;
- accommodation nights and meals (non-cash benefits);
- deliverables and quantities;
- usage rights and exclusivity;
- RoamWise fee charged to the brand, not deducted from the creator's contractual fee.

Paid and hybrid campaigns can show `FUNDED` only after a valid provider webhook moves `funding_pending -> funded`. Barter campaigns never show a funded badge.

## Recommended India provider path

| Priority | Provider | Best use | Important limitation |
| --- | --- | --- | --- |
| 1 for MVP | [Cashfree Easy Split](https://www.cashfree.com/docs/api-reference/payments/latest/split/easy-split-overview) | Marketplace collection, vendor KYC, split settlement, refunds and reconciliation | This is marketplace settlement, not automatically a milestone escrow. Enable delayed split only after Cashfree approves the exact hold/release schedule in writing. |
| 2 | [Razorpay Route](https://razorpay.com/route/) | Mature marketplace linked accounts, transfers, settlement holds and broad payment acceptance | Route pricing and hold terms are account-specific. The adapter remains gated until RoamWise's approved contract is known. |
| 1 for strict legal escrow | [Castler](https://castler.com/) with a named partner bank/trustee | Conditional, bank-led escrow where the agreement—not only settlement scheduling—controls release | Commercial pricing and API details are not public; legal agreement, bank, trustee, KYC and API specification must be verified during onboarding. |
| Due-diligence backup | [EXCRO](https://www.excro.in/api-powered-escrow) | API-led conditional escrow alternative | Do not activate from marketing claims. Verify the fund-holding bank, trustee/licence position, segregation, dispute role, SLA, pricing and exit process first. |

Cashfree's public page currently advertises an Easy Split fee of 0.2%–0.25% of order value in addition to collection charges, but commercial pricing can change and must be confirmed in RoamWise's merchant quote. Castler and Razorpay Route use sales-led/custom terms for this use case.

The governing compliance baseline is the RBI's [Master Direction on Regulation of Payment Aggregators, dated 15 September 2025](https://www.rbi.org.in/Scripts/BS_ViewMasDirections.aspx?id=12896). It defines marketplaces and payment aggregators, requires non-bank PAs to be authorised, sets ₹15 crore entry and ₹25 crore ongoing-stage net-worth requirements for a PA, and places collected merchant funds in prescribed escrow accounts. RoamWise should therefore use an authorised PA or bank-led escrow provider and must not custody campaign money in its operating account.

## Production activation sequence

1. Incorporate the RoamWise Indian company and open its operating current account.
2. Apply to Cashfree Easy Split and Razorpay Route with the creator-marketplace flow, average order value, expected monthly volume, refund/dispute policy and exact desired hold duration.
3. Ask both providers to confirm in writing whether funds may remain unsettled until brand acceptance and how creator travel advances, chargebacks and partial refunds must work.
4. In parallel, request a Castler proposal naming the scheduled commercial bank, trustee, escrow agreement parties, permitted credits/debits, release API, dispute authority, SLA and complete fee stack.
5. Obtain creator KYC and bank verification through the selected provider; RoamWise stores only the provider vendor ID, not raw bank credentials in this D1 service.
6. Apply `schema.sql` to D1 and deploy the worker with sandbox credentials.
7. Set `creatorProtectionUrl` in `rw-config.js`, but keep `CREATOR_PROTECTED_HOLD_APPROVED=false` through UI and webhook testing.
8. Test duplicate webhooks, stale campaign updates, payment failure, chargeback, cancellation, dispute freeze, partial refund and settlement confirmation.
9. After legal/provider sign-off, enable `CREATOR_PROTECTED_HOLD_APPROVED=true`. Enable `CASHFREE_DELAYED_SPLIT_APPROVED=true` only if Cashfree approved that exact release model.

From the repository root, the deployment skeleton is:

```bash
npx wrangler d1 create roamwise-creator-protection
# Copy the returned database ID into wrangler.toml, then:
npx wrangler d1 execute roamwise-creator-protection --remote --file=creators/protection/schema.sql
npx wrangler secret put CASHFREE_APP_ID -c creators/protection/wrangler.toml
npx wrangler secret put CASHFREE_SECRET_KEY -c creators/protection/wrangler.toml
npx wrangler secret put CASHFREE_WEBHOOK_SECRET -c creators/protection/wrangler.toml
npx wrangler secret put CREATOR_PROTECTION_ADMIN_UIDS -c creators/protection/wrangler.toml
npx wrangler deploy -c creators/protection/wrangler.toml
```

Copy `wrangler.toml.example` to an untracked production configuration before running these commands. Do not enable either approval gate merely because sandbox checkout works.

## API flow

```text
verified Firebase account -> actor onboarding -> RoamWise/provider KYC approval
brand draft -> publish -> creator application -> brand acceptance
brand funding order -> verified payment webhook -> FUNDED
creator starts -> submits -> brand approves -> release request
verified settlement webhook -> PAID
```

Either party may open a dispute from funded through approved. That transition prevents a release until an admin/provider resolution is recorded.

## Secrets and bindings

- D1 binding: `CREATOR_DB`
- `FIREBASE_PROJECT_ID`
- `CREATOR_PLATFORM_FEE_BPS`, `CREATOR_SERVICE_TAX_BPS` (example defaults: 15% and 18% GST on the service fee; confirm with RoamWise's tax adviser before production)
- `CREATOR_PROTECTION_ADMIN_UIDS`
- `CASHFREE_APP_ID`, `CASHFREE_SECRET_KEY`, `CASHFREE_WEBHOOK_SECRET`
- optional bank escrow: `ESCROW_PROVIDER_API_BASE`, `ESCROW_PROVIDER_API_KEY`

Use the Wrangler example as a checklist. Never commit live keys, PAN, Aadhaar, bank account numbers or escrow agreement secrets.
