# Separate checkout/access review

`/bhakti/checkout.html` uses the existing Firebase project and signed-in account, fixed owned Worker
and Cashfree hosted redirect. The studio verifies `/bhakti/access`; no localStorage purchase flag
can unlock a paid programme. Names/intention stay out of payment metadata. Phone is used only for
the provider's receipt. A receipt is one-time digital programme access, not Pro membership,
temple fees/donations or physical puja/prasad. Higher paid levels include lower programmes.

Server boundaries: `/bhakti/order` only accepts the six canonical products and exact INR prices.
The membership endpoint rejects these products. The digital status endpoint cannot fulfill
membership orders, and the membership status endpoint rejects digital orders. Sandbox remains
admin-only. A provider PAID response must match the recorded order/amount/currency/owner and grant
must persist before fulfillment is returned. Per-product grant documents avoid concurrent lower
orders downgrading access. Membership fields and founder counters are never touched.

Access reads known grant documents using the existing server service-account boundary and checks
their corresponding fulfilled PAID receipt. Ordinary Firestore clients have no matching allow
rule for `bhaktiGrants`; no rule change is needed. Existing `cashfreeOrders` and `payments` admin
rules continue to govern receipts and bookkeeping. Revenue records carry `kind: digital_bhakti`.
Refund recovery: an admin must mark the corresponding receipt `status: REFUNDED` and payment
record refunded after a provider refund; access then excludes it. No automated refund/webhook
consumer was added. Do not use the membership “Record payment” action for a digital order.

Rollout is OFF unless `config/app.BHAKTI_CHECKOUT_ENABLED` is the boolean true, existing provider
is cashfree, environments match, secrets are configured, and server/browser price catalogues agree.
Restoring a verified purchase works when new purchases are paused. Server access is no-store;
client grants live only in memory and expire after one hour, reset on account change, and refresh
on returning to the tab. No claim that downloaded static text is encrypted.

1. Review/merge this payment PR independently of the studio presentation.
2. Deploy the existing `Deploy Worker (manual)` workflow (or configured roamwise-api build).
3. In admin → Partner payments → Digital Bhakti, Check digital checkout; test sandbox as an admin
   first and real-device checkout/return/recovery at the intended product prices.
4. After review/device checks, enable the digital purchase switch from that card. It changes only
   the digital switch, writes an audit log, and cannot activate an undeployed/unverified Worker.
5. Confirm a small authorised real purchase with the owner present; no automated test creates or
   pays a real Cashfree order. Check purchase recovery, lost tab, another account, insufficient
   payment, revoked/refunded receipt, and existing Founder Pro remaining intact.

Official integration reference checked 13 October 2026:
https://www.cashfree.com/docs/payments/online/web (hosted redirect + server confirmation).
The live config was read-only checked: Cashfree live enabled, owned Worker configured, digital
switch absent. No live config or secret was written by this development session.
