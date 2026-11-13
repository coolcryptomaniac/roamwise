# Firebase Blaze cost safety — RoamwisePro
Owner-approved maximum **USD 10 per month** for Firebase/Google Cloud usage. Target USD 0–5; trigger alerts at USD 2.50, 5, 7.50 and 9. No service is authorized to incur extra spend merely because Blaze is enabled.

## Immediate owner action in Google Cloud Billing
1. Open https://console.cloud.google.com/billing and select the billing account associated with the **RoamwisePro** project. Review month-to-date actual and forecast costs, and check for other projects on the same billing account.
2. Budgets & alerts → Create budget → Scope to **RoamwisePro project** → Calendar month → USD 10 → alerts at 25%, 50%, 75%, 90%, 100% (actual), plus forecasted where supported. Confirm notifications reach the owner.
3. If available to this project and service, configure a **spend cap budget** at **USD 8** to allow latency/overage margin. Google documents that spend caps can pause selected services, may not cover every service and can overshoot due to reporting delays. Test carefully: stopping Firestore or Functions can break customer bookings, order confirmations and refunds. Prefer disabling optional features over core payment workflows.
4. Review Firebase console Usage and Billing and Cloud Billing Reports grouped by service and SKU. Look for Firestore read/write bursts, network egress, storage, Cloud Functions, App Hosting, BigQuery exports, Firebase AI Logic and paid backups.
5. Set service quotas where supported; use App Check, Firestore security rules, pagination, query limits, server-side caching and rate limiting. Avoid continuous polling and unlimited AI/cron loops.
6. Consider Pub/Sub budget notifications to a secure cost-control handler that first disables optional workloads, raises an alert and requires founder approval for disruptive action. Do not automatically unlink Cloud Billing: this can break live checkout and database features.
7. Keep Cloudflare Workers billing and third-party AI provider charges separate; this USD 10 budget is specifically for Google Cloud/Firebase.

## Status of this change
This PR provides a **pure read-only policy helper and tests**. It does not have Google Cloud Billing permissions, does not configure a live budget or spend cap, does not obtain current costs and does not modify production. No guarantee of an absolute USD 10 invoice limit is possible solely through application code or budget emails.

Official docs:
https://docs.cloud.google.com/billing/docs/how-to/budgets
https://docs.cloud.google.com/billing/docs/how-to/budgets-spend-caps
https://firebase.google.com/docs/firestore/pricing
