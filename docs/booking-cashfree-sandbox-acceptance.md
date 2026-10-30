# Cashfree booking webhook: sandbox acceptance checklist

This PR contains server-only modules, not a deployed route. Do not commit real credentials or log secrets.

## Backend configuration

- Provision sandbox App ID, secret key, and webhook signing secret in a server-side secret manager.
- Use Firestore Admin SDK and trusted order-to-booking lookup from server-created records.
- Compose createReconciledCashfreeEventProcessor with createCashfreeNodeHttpHandler on a TLS-protected POST endpoint.
- Verify the Cashfree payment API endpoint, version and response schema against current provider documentation before deployment.
- No real provider sandbox transaction has been performed as part of this PR.

## Sandbox acceptance tests

1. Create server-side test booking and Cashfree sandbox order; persist order ID, amount and ready_for_payment state.
2. Complete sandbox payment; verify signed raw webhook and independent Cashfree API lookup match order, payment ID, INR amount and SUCCESS status.
3. Verify exactly one Firestore transition to confirmed and one payment claim. Replay webhook to verify idempotency.
4. Tamper signature, order, amount, currency and payment ID; send failed/pending events. No booking may confirm.
5. Simulate provider timeout and concurrent Firestore claims; confirm fail-closed behavior and safe retries.
6. Test cancelled checkout and expired booking; ensure no unauthorized confirmation.
7. Reconcile provider dashboard, Firestore record and booking UI; ensure logs contain no secrets.
8. Record redacted sandbox evidence privately and obtain explicit production approval.

## Release gate

Do not merge or deploy before all CI checks and sandbox acceptance tests pass. Green unit tests alone do not prove real payment readiness.
