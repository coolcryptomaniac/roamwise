# RoamWise Partner Hub

## What this PR changes
- Replaces the current `/partner/` portal with the role-based RoamWise partner and booking workspace.
- Keeps the existing Firebase-first production model and current partner/room/booking collections.
- Adds Customer, Property Owner, RoamWise Partner, and Admin/Staff test flows.
- Gives verified RoamWise supply preference and widens travel choices when direct supply is limited.
- Adds configurable Travelpayouts, Expedia, Trawex, and BookingXML connection placeholders without exposing secret API keys in public code.
- Fixes partner accounting so commission is treated as earned only on completed stays.
- Adds a safe demo lab via `/partner/?lab=1&mode=demo`; the normal production route defaults to live mode.

## Files
- partner/index.html
- partner/app.css
- partner/app.js
- partner/config.js
- partner/core.js
- partner/README.md
- partner/TEST-CHECKLIST.md
- partner/OPTIONAL-FIRESTORE-RULES.txt
- partner/FILE-HASHES.txt

## Suggested testing
1. Open `/partner/?lab=1&mode=demo`.
2. Submit a property as Property Owner.
3. Approve it as Admin/Staff.
4. Add/edit a room as Partner.
5. Book it as Customer.
6. Confirm it as Partner.
7. Verify status in Customer → My Trips.
8. Mark completed as Admin and verify partner earnings update.

## Safety
This PR changes only files inside `/partner/`. It does not modify the homepage or root booking engine.
