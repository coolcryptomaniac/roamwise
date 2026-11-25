# RoamWise Design Engine

The founder's signature Ailon gradient, spectrum travel-card outlines, rounded cards, gold actions and Founding Traveller Credit card are shared recipes, independent of the selected layout edition. Home promotes the existing credit offer after the Ailon shortcut row. `/design/` previews the collection; Settings retains all three layout editions and has a motion switch.

## Catalogue and persistence

`design/catalogue.json` is the reviewed source of truth for colours, border palettes/widths/speeds, card surfaces/radii, animation recipes, carousel behaviour, editions, moods and component identities. `tools/design-catalogue.cjs` generates the classic-script offline seed; `--check` rejects drift. `catalogue-core.js` validates both browser and Worker input. Arbitrary CSS, HTML, scripts and checkout routes are never executed from database data.

The main-branch-only `Save RoamWise design catalogue` workflow writes the exact release into existing `RW_KV` under `design:catalogue:<version>`, reads it back and verifies equality. No new database, binding, secret or resource is provisioned. Older version keys are retained for rollback. No visitor-triggered database writes exist. Only public design data is stored under this prefix.

`GET /design/catalogue` reads only the release version bundled with that Worker and reports `storage: kv` when the validated record is present. It returns the bundled catalogue on absence, invalid data or storage failure. The browser accepts only its matching schema and release; its same-release cache lasts six hours and it retains its built-in fallback. The API times out after 3.5 seconds. Templates, stylesheet code, and the renderer remain in Git; database entries describe their reviewed recipes rather than allowing executable remote content.

To change a recipe, edit JSON, increment its version, regenerate the seed, run checks and merge a reviewed PR. Deploy the matching Worker and web assets. To roll back, revert the release commit and redeploy; the previous database version is retained. Do not repurpose design keys for balances, user preferences, supplier records or payment amounts. Visitor edition and motion preferences remain local to their device.

## Runtime and accessibility

The existing carousel helper owns scrolling; no second autoplay timer is added. It reads the bounded catalogue interval, pauses on interaction, hidden/offscreen pages and reduced motion. Signature border animations also pause offscreen, on hidden documents and when motion is off. Static gradients remain when animation support is unavailable. Existing booking anchors and card nodes are preserved across edition switches.

Credit promotion links to the existing `/credit/` offer and uses the existing bonus ceiling, pack range and terms. Pricing, inventory counts, payments, balances, Pro fulfilment, refund processing and supplier obligations are unchanged. The decorative membership card has no fabricated balance or member number.

`js/ui/stay-browser.js` reads the approved public partner inventory and existing booking route registry. Find a stay, the stays category and the handy stays shortcut open the full horizontal property collection with search and room/date links. New enquiry-only records retain quote requests. Booking assistance exposes booking history, trip requests, support and the collection without overwriting chat drafts or spending AI quota. Group chat, Plan together, TrailMesh and Wallet remain visible in the horizontal quick-access row.

## Verification

Run `node tools/design-catalogue.cjs --check`, `node --test tests/design-engine.test.mjs tests/design-vault*.test.mjs`, `npm test`, and `npm run check`. Inspect Home, Copilot, Settings, `/credit/`, `/wallet/` and `/design/` at mobile and desktop widths. Verify API `storage: kv` after both the Worker deploy and catalogue-save jobs finish. Real payment testing is not necessary for this presentation change; do not initiate a charge.
