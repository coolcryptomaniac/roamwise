# Firestore rules review test scope

`auth-referral-review.test.js` runs the candidate generator against the actual current `firestore.rules` and checks that the latest referral/payment/partner guards survive. `prepare-auth-referral-rules.test.py` unit-tests source-drift safeguards against a synthetic fixture.

**These static tests are not equivalent to Firebase Emulator permission tests.** No rules have been published and no live authentication or email delivery has been exercised. Before changing production: build and compile the full candidate using the Firebase Emulator, migrate and smoke-test anonymous NMIMS claim issuance, verify failed/allowed claim paths, and perform email verification across devices. See `AUTH-REFERRAL-RELEASE-GATE.md`.
