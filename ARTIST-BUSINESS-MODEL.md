# Artists gallery: business model and onboarding

Status: **current** (Oct 2026). Introductory model, to be reviewed after the first 10 artists.

## Principles (current, founder decision 2026-10-19)
- **Free for every artist.** For now every artist is a founding artist with all features at no cost. No paid tiers are offered (earlier drafts of 199, 499, 999 and 1,999 were dropped to avoid charging artists).
- **Thank-you contribution only.** If a buyer came through RoamWise, an artist may share a thank-you. Optional, any amount, no fixed percentage, adjusted with time. Never present it as a fee. Not collected through the site.
- **No fixed commission today.** Artists sell directly; RoamWise never handles sale money.
- **Possible future commission.** The founder may later set a standard commission in the 5 to 20% range on sales that come through RoamWise. Do not publish the range. The terms promise written notice before it applies and no effect on earlier sales: change the terms text and tell artists before switching it on.
- **No exclusivity, no lock-in.** Artists edit or remove their page any time. Nothing goes live until the artist approves it.
- **Invited artists:** Natasha (Brand Ambassador) and Jagriti (Featured Artist) have full features.
- **Painting of the week** on the homepage is chosen by RoamWise (`spotlight` in `artists-data.json`), not sold.

## What artists get (`plans.founding` in `creators/artists-data.json`)
Own page (`creators/artist.html?a=<id>`), up to 24 paintings, gallery listing, Kala presenting the work (Sacred art gallery, wall preview, finder, comparison), price tiers, institutional buyer matches where found, enquiry log with CSV export. The old `plan: free` value still exists in the code as a restricted listing (6 paintings, no Kala) but is not used for new artists.

## Onboarding flow
1. Artist fills `creators/join-artist.html` (client-side only), which prepares a WhatsApp or email message to the RoamWise number with a `DATA:` JSON line. A consent tick is required.
2. Artist sends 3 to 6 painting photos with title, size and price on WhatsApp.
3. Founder saves the `DATA:` JSON to a file and runs `node tools/add-artist.js file.json` (dry run), then `--write`. New artists get the founding plan by default. Rules live in `creators/artist-core.mjs` (https-only links, consent, duplicate ids).
4. Founder copies the photos into `assets/img/<artist>/`, adds them to the new record's `artworks`, and merges. The page is live at once.
5. Spotlight: edit `spotlight` in `artists-data.json` (`artistId`, `artworkId`, `label`, `note`). The homepage card (`creators/home-art.js`) follows it.

## Open items
- Before introducing any commission: update `creators/artist-terms.html` and give artists written notice, then decide how to collect it (needs a separate payment and legal review, see AI-ROLES-AND-HANDOFF rule 7).
- Get each artist's written consent for page, photos and prices (Natasha and Jagriti are still pending).
- Have a CA or lawyer read `artist-terms.html` and the refund-policy artist section.
