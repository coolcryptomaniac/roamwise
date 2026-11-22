# RoamWise Design Vault & regression recovery (#831)
Status: **preview branch only**. Do not merge or deploy without a live-mobile and checkout regression pass.

## Approved editions
| Stable ID | Name | Role |
| --- | --- | --- |
| himalayan-saanjh | Himalayan Saanjh | Default: compact AI-first + visible selling rails |
| kasar-cloud | Kasar Cloud | Legacy: prior Ailon-first design |
| buransh-bazaar | Buransh Bazaar | Legacy: older commerce-forward styling |

Settings → **Design editions** persists to localStorage key \`rw_design_edition\`.
Add future editions to \`design/design-vault.js\` and version their stylesheet rules; never delete a user's previous stable edition without a migration. The existing \`rw_mode\` layout picker and colour theme system are independent.

### Restored business surfaces
Existing HTML retains travel/stay packages, Amor direct checkout, Manali weddings, shop products and Natasha's existing artist section. New CSS overrides the regressions in \`design/ailon-first.css\` and \`#rwFocusBts2026\` that hid these sections. Checkout, supplier confirmations, reservation fees and inventory APIs are unchanged.

### Verification
1. Open preview on Android 360/390/412 px. On Home confirm tracks: \`rwSalesStays\`, \`rwSalesPackages\`, \`rwSalesWeddings\`, \`rwSalesShop\`, and artist cards \`brand-ambassador\`.
2. Confirm all three editions selectable via Settings, preserved on reload; verify other tabs. Verify purchases are identical in every design; inspect wallet when logged in and logged out.
3. Verify JS carousel autoplay pauses on interaction/offscreen and with reduced motion. Keyboard arrows, taps and link destinations must be usable.
4. Verify /partners/ lands on /partner/ and /partner/join/ remains reachable.
5. AI outage: send >180-character generic travel/transport prompt and verify safe planning response instead of 'Private question'. Include an OTP or booking reference and verify **no public search of private data**.
6. Sandbox-test paid and refund flows and direct checkout before promoting any production release. If results differ, roll back branch/deployment.
7. Run \`node scripts/route-feature-inventory.mjs --out=reports/route-inventory.json\` to generate the complete static-route inventory. Manually check client-side hash routes and dynamically generated HTML links before declaring any URL broken.

### Follow-on work, not claimed complete here
* End-to-end live provider health, AI itinerary renderer and stored trip state; signed-in private booking flow
* Booking-grade ₹10–₹50 paid itinerary SKUs and Cashfree webhook reconciliation
* Android Play Console assets with Natasha's authorization and official photo release
* Zapier account integration (server-side signed webhooks only); Pine Computer separate restricted pilot
* Automated Android browser screenshot diff, link crawler, feature flags and rollout monitoring
