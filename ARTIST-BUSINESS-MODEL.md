# Artists gallery: business model and onboarding

Status: **current** (Oct 2026). Introductory model, to be reviewed after the first 10 artists.

## Principles (why it is fair)
- **0% commission.** Artists sell directly to buyers and keep 100%. RoamWise never touches the sale money.
- **Free listing forever.** Not a trial.
- **One-time contributions only.** No subscription, no auto-renew.
- **Artist stays in control.** Edit or remove the page any time. Nothing goes live until the artist approves it.
- **7-day refund** of a contribution if the promised page or feature is not live.

## Plans (single source of truth: `plans` in `creators/artists-data.json`)
| Plan | Price | What the artist gets |
|---|---|---|
| Free | 0 | Own page (`creators/artist.html?a=<id>`), up to 6 paintings, gallery listing, direct enquiries |
| Studio | 199 one-time | Up to 24 paintings, price tiers, Kala presents the work (Sacred art gallery, wall preview, finder, comparison), institutional buyer matches, enquiry log |
| Spotlight | 499 per 30 days, one-time purchase | Painting of the week on the homepage, promo caption, gallery badge. Needs Studio |

Brand Ambassador and Featured Artist (`plan: ambassador | featured`) are founder-invited and unpaid; they get Studio features.

Free artists are intentionally left out of Kala's shelves, finder and comparison (`plan === 'free'` filter in `creators/art-*.js` and `sacred-art.js`).

## Onboarding flow
1. Artist fills `creators/join-artist.html` (client-side only), which prepares a WhatsApp or email message to the RoamWise number with a `DATA:` JSON line. A consent tick is required.
2. Artist sends 3 to 6 painting photos with title, size and price on WhatsApp.
3. Founder saves the `DATA:` JSON to a file and runs `node tools/add-artist.js file.json` (dry run), then `--write`. Add `--plan studio` only after the contribution is confirmed. Rules live in `creators/artist-core.mjs` (https-only links, consent, duplicate ids).
4. Founder copies the photos into `assets/img/<artist>/`, adds them to the new record's `artworks`, and merges. The page is live at once.
5. Spotlight: edit `spotlight` in `artists-data.json` (`artistId`, `artworkId`, `label`, `note`). The homepage card (`creators/home-art.js`) follows it.

## Open items before charging real money
- Payment: no payment code was added. Collect by UPI or payment link on WhatsApp for now. Moving this into the app's payment flow needs a separate review (AI-ROLES-AND-HANDOFF rule 7).
- GST and invoicing for a 199 or 499 contribution: confirm with the CA.
- Get each artist's written consent for page, photos and prices (Natasha and Jagriti are still pending).
- Update `terms.html` / `refund-policy.html` if the contribution terms change.
