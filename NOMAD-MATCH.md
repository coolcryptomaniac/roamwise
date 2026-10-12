# Nomad Match (work stays for founders and professionals)

Added 2026-10-12 on `feature/nomad-match`. Page: `/nomads/`. Engine: `nomads/nomad-core.mjs` (pure, tested in `tests/nomad-match.test.mjs`).

## What it does
- **Seekers** (founder, remote professional, freelancer, small team, writer) pick stay length (15 days, 1 month, 3 months), Wi-Fi need, must-haves, mood, budget. The engine scores real spaces (when any exist) and 15 destinations, then opens a WhatsApp or email enquiry.
- **Hosts** tick what their space has and see a live Nomad-Ready score (Essential 40+, Pro 60+, Studio 80+). A speed-test screenshot makes it "verified"; without it the tier is "self-declared". The form opens a WhatsApp or email to RoamWise. Nothing is stored.
- No Firestore, Worker, payment or auth change. RoamWise holds no guest money and adds nothing to a guest total (see `COMPLIANCE-FIRST-BUSINESS-MODEL.md`).

## Going live with a real space
A space appears only when it is a signed, `listingReady` stay in `partners-data.js` (or the live partner list) that also carries a `nomad` object:

```js
nomad: { mbps: 60, backup: 'full'|'router'|'none', desk: 'ergonomic'|'basic'|'none',
         callRoom: true, kitchen: true, meals: false, laundry: true, coworking: false, community: true,
         verified: true, rate15: 0, rate30: 24000, rate90: 21000, minNights: 15 }
```
Set `verified: true` only after seeing a speed-test screenshot. `vibes: ['mountain','nature']` on the partner entry drives the mood match. Until then the page shows destinations only and says no verified stays are live.

`?preview=1` shows three clearly labelled SAMPLE spaces for design review. They are not real properties and have no contact button.

## Honesty rules
- Destination costs (USD per month, about Rs 88 to the dollar) and Wi-Fi notes come from the cited sources on each card; vibe and connectivity ratings are editorial and labelled so.
- Do not list unsigned third-party properties publicly. Invite them first (see the Google Sheet pipeline).

## Owner join page
`/nomads/join/` is a one-screen form (name, WhatsApp, stay, town, Wi-Fi, rooms, monthly rate, backup/desk/kitchen, consent). It opens WhatsApp to RoamWise when `chat.supportWhatsapp` is set in `partner/config.js`, otherwise an email to `supportEmail`. **Set `supportWhatsapp` (digits, 91XXXXXXXXXX) to switch it to WhatsApp.** It has a share-on-WhatsApp button for sending the link to owners. Homepage: a card in the sacred/kainchi/partner band, a footer link and a drawer link.
