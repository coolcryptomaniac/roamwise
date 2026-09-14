# Firebase authentication hardening runbook

The repository now contains the hardened client flow, custom email-action page,
App Check integration hook, referral-rule validation, and founder-seat repair
tool. The Firebase Console steps below are required before every protection is
live. A code deploy alone cannot change Firebase email branding, sender
reputation, password policy, authorized domains, or enforcement switches.

## 1. Account identity and passwords

In **Firebase Console → Authentication → Settings**:

1. Keep **One account per email address** enabled. Do not enable multiple
   accounts with the same email; that is what prevents a Google identity and a
   password identity from silently becoming two RoamWise users.
2. Enable **Email enumeration protection**. The UI intentionally does not call
   `fetchSignInMethodsForEmail`; it gives safe Google/password guidance without
   confirming which emails exist.
3. Set the password policy to match the UI: minimum 10 characters, at least one
   alphabetic character and one numeric character. Prefer **Require** mode after
   checking that existing password users can still sign in/reset normally.
4. Confirm `roamwise.co.in` and `www.roamwise.co.in` are authorized domains.

The “Last used on this device” hint contains only `google.com` or `password` in
local storage. It never sends an email address and is not proof that an account
exists.

## 2. Professional verification and reset email

In **Authentication → Templates**, update all relevant templates:

- Public-facing project/sender name: **RoamWise**
- Verify-email subject: **Verify your email for RoamWise**
- Password-reset subject: **Reset your RoamWise password**
- Support/reply-to address: a monitored address on the RoamWise domain
- Action URL: `https://www.roamwise.co.in/auth/action.html`

The custom page handles `verifyEmail`, `resetPassword`, and `recoverEmail`,
rejects non-RoamWise continuation URLs, and is marked `noindex`. Test each email
from a fresh address after publishing. The old `project-299014744987` wording
and generic `firebaseapp.com` confirmation page will remain until the Console
template/action URL is changed.

If Firebase offers a custom email domain for the project/plan, configure and
verify it, including the DNS records Firebase supplies. No frontend change can
guarantee inbox placement: sender authentication, domain reputation, message
volume, recipient behaviour, and Gmail filtering all contribute. Never ask
users to whitelist blindly; monitor real test deliveries to Gmail and Outlook.

## 3. App Check and bot resistance

1. Create a **reCAPTCHA Enterprise** web key restricted to
   `roamwise.co.in` and `www.roamwise.co.in`.
2. Register the web app under **Firebase Console → App Check**.
3. Put only the public site key in `RW_CONFIG.appCheck.webRecaptchaEnterpriseSiteKey`.
4. Deploy and watch App Check metrics for web, PWA and Android traffic.
5. Only after valid users consistently receive tokens, enable enforcement for
   **Authentication** and **Cloud Firestore**.

App Check is invisible and risk-scored. It complements—not replaces—Firestore
rules, verified email, Firebase rate limits, and human payment approval.

## 4. Firestore rules and referral integrity

Publish `firestore.rules` using the full-replace process in
`firestore-rules-history/README.md`, then update the repository's expected
rules-version marker as described there. The hardened rules now require:

- claim document IDs to be bound to the authenticated UID and 12-digit UTR;
- claim fields to be allowlisted;
- referral commission rate at most 30% and bonus at most 90 days;
- referral-signup UID and document ID to match the signed-in caller;
- server timestamps for new claims and referral signups.

The admin liability calculation independently prefers the admin-controlled
referrer directory and caps historical rates at 30%, so forged legacy data
cannot inflate commission owed.

## 5. Repair the founder-seat counter

After deploying, open **Admin → Money → Founder-seat database sync**. It compares
permanent `users/{uid}.pro == true` accounts with `pricing/founder.count`. Review
the before/after confirmation, then press **Sync founder seats** once. The update
writes both current and legacy counters in one transaction and creates an
`adminAuditLog` record. With five permanent Pro accounts, the public page will
show **995 of 1,000 seats left**; no value is hardcoded in the public UI.

## 6. Phone OTP decision

Do not expose phone OTP as a second independent signup button yet. A phone-only
Firebase user has no email and can become a separate UID from the same person's
Google/password account. That creates the duplicate identity this work is meant
to prevent and adds SMS cost/abuse exposure.

When needed, introduce phone only after sign-in as a **linked factor** (MFA or
verified recovery/contact method), with explicit consent, India SMS region
policy, reCAPTCHA, resend cooldowns, test numbers, budget alerts, and account
recovery support. The admin console already uses linked phone MFA; the public
consumer flow intentionally does not create standalone phone identities.

## Release checks

- Google new sign-in and returning sign-in
- Password signup, branded verification, return to app, then sign-in
- Existing Google email entered in password signup (safe guidance; no duplicate)
- Wrong email/password response does not prove whether an account exists
- Password show/hide, keyboard Enter, autofill and 320–480 px mobile widths
- Reset and recover-email custom action links, including expired/reused links
- App Check metrics before enforcement, then authenticated Firestore reads
- Referral create with valid code; reject spoofed UID, oversized fields, and
  `refRate > 0.30`
- Admin founder sync, audit log, and public 995-seat display
