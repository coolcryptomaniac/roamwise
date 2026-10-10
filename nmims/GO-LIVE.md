# NMIMS go-live checklist (founder steps)

**Status (10 Oct 2026): the MOU is signed by both parties** (Mohit Pandey 9 Oct, E-Cell NMIMS 10 Oct). Part B is now unlocked. Still open in the signed text (MOU section 9): legal entity names and addresses, the event name/date/venue, final 50/450 eligibility, the privacy/consent wording, and the **commission settlement schedule** (payee, base, invoice and tax details, section 7). Settle that in writing with E-Cell before the first payout.

Student instructions live at `https://roamwise.co.in/nmims/redeem/` (linked from the home-page event card as "How it works"). Share that link with the coordinator.

Do Part A now. Do Part B now that the MOU is countersigned. Part C after the event.

## Part A. Ship the code (no public effect yet)

1. **Get the code onto GitHub.** On your Mac, in the roamwise repo:
   `git checkout -b feature/nmims-coupons origin/main && git am roamwise-nmims-coupons.patch && git push -u origin feature/nmims-coupons`
   Open a pull request. CI ("NMIMS pass issuer and campus creators") runs both Firestore emulator suites and the unit tests. Four older tests fail on main too (business-travel, country-budget, kainchi-yatra, user-feedback-regressions); they are not from this change.
2. **Review and merge.** This touches Firestore rules, entitlement and payments, so read the diff yourself first: `firestore.rules`, `js/payments/partner-redeem.js`, `worker/handlers/cashfree.js`.
3. **Rules go live on merge.** Merging to main runs the workflow "Deploy Firestore Rules" (needs the `FIREBASE_SERVICE_ACCOUNT` secret). In GitHub, Actions, check it is green. If it is missing or red: Firebase Console, Firestore Database, Rules, paste the whole `firestore.rules`, Publish. Then open the admin console and run the Rules health test.
4. **Deploy the Worker** (it adds the referral code to Cashfree orders): `cd worker && npx wrangler deploy`, then open `/health`.
5. **Website** updates from main automatically (GitHub Pages). If the Android app bundles the web files, rebuild it through your normal APK build; if it loads roamwise.co.in remotely it updates by itself. Check which one yours is.
6. **Test referral tracking with a code that is already live** (for example a staff code): open `roamwise.co.in/?ref=<that code>`, buy the cheapest plan with a real small payment, then check that Firestore `payments/<order id>` has `refCode` and the admin Referrals tab lists the sale. Do not skip this: it is the proof NMIMS commission will count.

## Part B. Go live (after the MOU is countersigned)

7. Sign in to RoamWise as admin and open `/nmims/pass-issuer/`. Press **Enable approved issuance** and type `APPROVED NMIMS`. This reserves the 500 seats in the public counter.
8. In Firebase Console, Firestore, collection `partnerships`, document `nmims2026`: add field `officialConfirmed` = `true` (boolean). This flips the proposal badge to Official.
9. **Turn on the referral code.** Admin console, Referrals, find `NMIMS2026`, set it **active** (the live list is the Firestore doc `config/referrers`; it overrides the repo file). On a phone open `roamwise.co.in/?ref=NMIMS2026`: you should see "You came via E-Cell NMIMS Mumbai".
10. **1 to 2 days before the event:** on the pass desk press **Generate the 500 coupons**, type the confirmation, and download both CSVs immediately. Email Tannu the SHA-256 fingerprint shown on screen. Send the two CSV files only to her named coordinator through a private channel (for example Google Drive shared to her email only), never in a group chat.
11. **Test one coupon yourself:** redeem `NMIMS-ORG-0050-…` with a spare Google account (verified email), confirm Founder Pro turns on and the congratulations card appears, then tell Tannu you used organiser #50 (she has 49 + 450). Or generate the batch a day early and test before handing over.
12. **Event day:** watch the pass desk (redeemed / unredeemed) and Admin, Referrals (sales, revenue and commission owed for `NMIMS2026`). Tell people to type **NMIMS2026** under "Have a referral code?" before paying. Revoke any lost card from the pass desk.

## Part C. After the event and paying NMIMS

13. Within 14 days: send Tannu the totals (issued, redeemed, unredeemed).
14. After the 30-day coupon window, unredeemed codes expire. Optionally reveal the list so the fingerprint can be re-checked.
15. **Commission:** wait 7 days after the last purchase (refunds), then export the NMIMS2026 row from Admin, Referrals. Ask NMIMS for a receipt or invoice with PAN (and GSTIN if registered) and the institution's bank details. Pay by bank transfer to that account and keep the statement, the invoice and the transfer proof.
16. **Tax:** see the "Payment and tax" paragraph in the process note. Before the first payout, ask your CA to confirm (a) that no TDS applies to an individual proprietor not under tax audit, (b) whether you must deduct TDS if you incorporate before paying, and (c) NMIMS's GST position.

## Switching it off
Pause issuance on the pass desk; set `NMIMS2026` inactive in Admin, Referrals; revoke single coupons on the pass desk. Redeemed coupons cannot be taken back.
