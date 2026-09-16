# Authentication + referral: September 16 release gate

**Status: REVIEW ONLY — do not deploy the generated candidate or merge this PR yet.** The current live Firebase Console rules were pasted in chat and are older than `main/firestore.rules`. Never paste the old file over the canonical one, or append duplicate `match` blocks.

## Current confirmed findings

1. `partnerClaims` permits unauthenticated creation of self-issued codes, followed by self-redemption and a client-side Pro entitlement grant. A counter checked at create time is not an issuance authority, especially when the claim create need not increment the counter. The candidate generator stops this path by requiring admin/trusted-server issuance and matching a verified Firebase Auth email to the existing claim at redemption and at the grant.
2. `partnerClaimEmails` publicly exposes an email-derived lookup for claim codes. The candidate makes that index admin-only.
3. The current `main` rules already include the September 14 `refSignups` UID/document-ID/timestamp validation and September 15 `paymentDestinations` + partner operations-lock logic. Preserve those changes; the pasted older rules do not.
4. Email/password signup creates a Firebase account **before** calling `sendEmailVerification()`. A failed email send can leave an existing but unverified user, explaining the sequence "no email, then account already exists." Firestore rules cannot send email or resolve sender reputation. Never delete a real user's account merely to make signup repeatable.

## Candidate generation (non-deploying)

Run `python3 tools/prepare-auth-referral-rules.py --input firestore.rules --output firestore-review.rules`. The script fails closed if expected modern guards are missing and refuses to overwrite `firestore.rules`. The generated file intentionally **blocks the existing anonymous NMIMS claim form**. It must not become the canonical file until a trusted claim-issuance endpoint exists and the NMIMS client is migrated to it. The endpoint must authenticate/verify the claim owner, allocate a pre-approved unique code, and atomically record the email index/claim/counters, or use a server-authoritative ledger. Do not expose service account credentials to the web client.

`getAfter()` can validate atomic multi-document changes in Firestore Security Rules, subject to rule-access-call limits; it does not by itself make an anonymously invented claim authentic. Use the Firebase Emulator to check atomicity and any counter invariants before release.

## Required pre-merge checks

- Run `python3 -m unittest discover -s tests -p 'prepare-auth-referral-rules.test.py' -v` and generate the candidate against **current** `main` (no drift errors).
- Compile and exercise the **generated full rules file** with the Firebase Emulator, including a malicious self-issued claim, an existing admin-issued claim owned by a verified email, another user's attempt to redeem it, anonymous and authenticated referral-signup writes, original booking/partner flows, revoked staff, and admin approval.
- Make the NMIMS claim flow use verified ownership and trusted code issuance; test its duplicate-email handling and capped allocations on the same batch. Do not ship the lockdown alone.
- In Firebase Authentication Console check the actual affected UID and sign-in provider. Check verification template sender, support address, allowed domains, authorized action URL, quotas and Firebase Auth errors; send a test from a fresh address and from an existing unverified account.
- Verify the signup error UI distinguishes an **existing account** from a **verification-email send failure**. Show a non-destructive resend option and never claim delivery when Firebase rejected the request.
- End-to-end smoke: iPhone 16 Pro/Pro Max Chrome, Vivo T3x Chrome, and the RoamWise Android app; new email+valid referral, existing Google account, verified-email return, resend, Google->payment, and attribution to exactly one Firebase UID.
- Check `staff/{uid}` and `admins/{uid}` for revoked team members, including any independent admin document; role changes in the UI alone do not revoke Firestore permissions.

## Explicitly not changed

No production rules, Auth templates, deployed Workers, Firebase data, live user account, payment provider setting, or repository `main` was changed. The existing PWA/Android authentication flows have not been exercised against the live Firebase backend in this review. Beacon location privacy and self-asserted passport verification require separate product/backend migration rather than an untested rule change that may break safety features.
