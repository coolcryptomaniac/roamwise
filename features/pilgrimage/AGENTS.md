# Sacred journeys

Shared independent advisory pages: `/pilgrimage/`, `/char-dham/`, `/panch-kedar/`,
`/kumbh/`, `/vaishno-devi/`, `/kashi/`, `/tirupati/`. Kainchi remains its own daily hub.
Preserve root `CLAUDE.md` and `AI-ROLES-AND-HANDOFF.md`.

- `destinations.js`: bilingual destination facts and official references. Never invent dates,
  traffic, facilities, prices, ticket quotas, medical advice or entry permissions.
- `strings.js`: complete English/Hindi parity and short traditional mantra texts.
- `page.js`: local planner, directions, checklist, group sharing and devotional composition.
- `build-pages.cjs`: tracked static HTML generation; `node ... --check` verifies entry drift.
- `pilgrimage.css`: responsive styling, dark red/gold theme, reduced motion and print.
- `check.cjs`: syntax, generated entries, 350-line modules and 44 KiB/page gzip source budget.

No remote runtime scripts, frameworks, auth/payment behavior, Workers or Firestore changes.
No network requests from these pages. Visitor-opened official links are not a live feed.
Planner names remain in memory. Device-provider voice consent is separate, per player and
not stored: a provider may process the spoken text, including names. Voice starts only on
a visitor action. The shared Pro seam is moved verbatim from Kainchi, not a new entitlement.
The avatar is an original illustrated SVG puppet with speech-activity mouth motion, not
photorealistic video or phoneme lip-sync. No real Trust priest, physical prasad or ritual booking.

Run `npm run pilgrimage:check`, `npm run pilgrimage:test`, `npm run kainchi:test`,
`npm test`, `npm run check`, `npm run mod-status`, `git diff --check`.
Phone layout and actual device/OS speech need browser/device QA; mocked tests cannot verify sound.
