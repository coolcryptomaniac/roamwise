# RoamWise authentication and proposed NMIMS security — 16 September 2026

## Release status

The NMIMS program is **only proposed; there are no NMIMS participants**. The `/nmims/` page now explicitly states that it is not live and has no registration/claim/payment form. Canonical `firestore.rules` now permits partner-code issuance **only by an administrator**, verified-email owner redemption, and a corresponding verified-email owner Pro grant. Public access to the claim-email index and public partner seat-counter writes are disabled. The existing referral UID/document-ID/timestamp rules, Cashfree handling, and September 15 partner marketplace changes are retained. The new rules do not launch NMIMS or issue any passes.

Email/password registration now recovers an existing account **only when the submitted password authenticates that original Firebase account**. A previously created unverified account is offered another verification request without deletion, a new UID, or additional referral signup credit. If the password does not authenticate, the UI switches to sign-in and recommends Google or password reset; it never guesses a provider or silently merges separate UIDs. A rejected email-send request is clearly distinguished from Firebase accepting a request; an invalid authorized continue URL is retried once using the Firebase default action URL. Acceptance does not guarantee inbox delivery.

## Tests completed in the feature-branch workflow

- `npm test` includes auth recovery cases (new account, failed email send, duplicate account with correct password, wrong-password/Google case, invalid verification URL fallback) and the whole repository test suite.
- `npm run check` and JavaScript syntax checks.
- Python drift-guard tests and generation of the complete consolidated rules from the September 15 canonical version.
- Isolated Firestore Emulator: unauthorized claim issuance, wrong-user redemption, unverified redemption, public index reads and forged referral signups are denied; admin issuance and verified-owner redemption/Pro grant succeed. This checks security rules, **not** live provider delivery or physical devices.

## Publishing rules — only after PR merge

1. In GitHub, verify that PR #181 is merged and `main/firestore.rules` has the secure 2026-09-16 header.
2. Download the complete `firestore.rules` from `main`, or use the `firestore-rules-manual-publish` CI artifact. Do **not** use the older rules pasted in chat or a previous review-only candidate.
3. Firebase Console → Firestore Database → Rules: select **all** existing text, replace it with the entire new file, and click **Publish**. Do not append new `match` blocks to old rules, because allow rules are OR-combined.
4. Check whether your `meta/rulesVersion` staleness probe requires a manual update. Keep its existing Platform V5 `v17.0` marker; that marker is a CI epoch, **not** an authorization or cryptographic proof of published rules.
5. Check signup and referral registration on fresh email+password and an existing unverified account. Test Google sign-in and paid checkout without changing payment credentials.

The repository merge **does not** publish the Firestore rules. No Firebase project/console access, payment gateway secrets, live account mutation, or delivery template change is performed by the GitHub workflow.

## Firebase Authentication follow-up (cannot be guaranteed from code)

In Firebase Console → Authentication, inspect the affected UID's sign-in providers and emailVerified status; review the verification template sender/support email, authorized domains (`www.roamwise.co.in` and/or `roamwise.co.in` as actually used), authorized action URL, quotas and Firebase error logs. Test first signup, resend, and the delivered verification-link return on iPhone Chrome, Vivo Chrome, and the installed Android build. Check spam, sender domain authentication (SPF/DKIM/DMARC if custom sending is supported), and provider limits. Do not publish email/OTP/Cashfree secrets in the repository or chat. **No code change can guarantee email inbox placement.**

## Before any NMIMS activation

Keep `/nmims/` proposal-only until a real agreement and approved launch date exist. A trusted admin/server must verify eligibility and email ownership, issue unique cryptographically random, non-guessable codes, enforce one claim per eligible user and the agreed seat cap atomically, and monitor/finalize redemptions. Public browsers must never generate claim documents, edit allocation counters, or award Pro without the issued claim and verified-email rule. Add end-to-end tests for duplicate-email claims, expiry, cap concurrency and replays before restoring a form or promotional claims.

## Other remaining checks

Review `staff/{uid}` **and** `admins/{uid}` in the actual Firebase project for departed team members, including any independent admin UID. Remove their privileged documents and revoke any outstanding auth sessions as needed. Beacon location privacy and self-asserted passport badges need separate product changes rather than a speculative rule change during this release.
