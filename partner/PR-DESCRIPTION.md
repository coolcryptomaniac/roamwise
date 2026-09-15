# RoamWise Partner Hub

## What this branch changes
- Consolidates the two old CSS layers into one Akatsuki–Kumaoni `partner.css` design system.
- Preserves the canonical Firebase trust and request-to-book guardrails.
- Extends onboarding with experience, cleanliness and public-review evidence.
- Adds daily host operations plus pause and responsible-deboarding requests.
- Adds authenticated Cashfree stay checkout with server-authoritative amount validation.
- Adds manual RoamWise UPI after host confirmation and masked settlement-destination switching.
- Adds an admin-only experiential property CRM with 41 sourced leads, 1,000-row capacity and an explainable top-500 queue.

## Files
- partner/index.html
- partner/partner.css
- partner/app.js
- partner/marketplace.js
- partner/config.js
- partner/core.js
- partner/README.md
- partner/TEST-CHECKLIST.md
- partner/OPTIONAL-FIRESTORE-RULES.txt
- admin/property-prospects-data.js
- admin/property-outreach.js
- admin/payment-operations.js
- worker/handlers/partner-cashfree.js

## Suggested testing
1. Open `/partner/?lab=1&mode=demo`.
2. Submit a property as Property Owner.
3. Approve it as Admin/Staff.
4. Add/edit a room as Partner.
5. Book it as Customer.
6. Confirm it as Partner.
7. Verify status in Customer → My Trips.
8. Mark completed as Admin and verify partner earnings update.
9. Request pause/deboarding and confirm the host cannot directly change trusted status.
10. In Admin, verify Cashfree health and switch only to a provider-verified masked destination.
11. Open Property leads, inspect evidence, save a seed and create a human-reviewed draft.

## Safety
No release, deployment, merge or bulk outreach is performed by this branch. Gateway secrets stay in Cloudflare Worker secrets and full bank details never enter the browser UI.
