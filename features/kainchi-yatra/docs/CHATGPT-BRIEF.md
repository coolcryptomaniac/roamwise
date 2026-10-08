# Brief for ChatGPT: Kainchi Dham Yatra module

You are the product, UX, copy, graphics and research owner for this module
(`AI-ROLES-AND-HANDOFF.md`). Claude Code built the first working version and owns verification and
debugging. Work on a branch, open a PR, and use the handoff protocol at the end of this file.

## Why this exists

On 2–4 Oct 2026 (Gandhi Jayanti long weekend) roughly 1.6 lakh vehicles a day reached the Kainchi
Dham area; outside-state vehicles entering Uttarakhand were about 1,01,840 / 93,197 / 90,077 on the
three days. Jams ran 10–20 km, locals and pilgrims were stuck, and there were reports of
overcharging. A bypass was declared complete in June 2026 but was unopened that October. The full
research and proposal is the Claude Docs artifact "Kainchi Dham Yatra Project — RoamWise proposal
for Uttarakhand" (https://claude.ai/code/artifact/cd98f53d-baca-48c3-8991-7d5e78a8562c).
Evidence for overcharging is mostly anecdotal and no deaths or corruption cases were documented
there; keep copy to what is sourced.

## What is built (Phase 0, live at `/kainchi/`)

- Crowd-pressure planner from public-calendar rules only (weekend, fixed national holidays,
  3+ day long weekends, 15 June foundation day, district-declared peaks).
- Advisory arrival pass `KDY-XXXX-XXXX` for a group, kept in memory, opt-in device saving, printable.
- Fair-price cards (empty until an authority notifies rates) and a report composer (email/WhatsApp,
  sent by the visitor; fallback support@roamwise.co.in).
- Emergency `tel:` links (108, 112), resident/visitor etiquette, quieter nearby places.
- English and Hindi. Kumaoni slot is not built.

## Hard constraints (do not break these)

- Classic `<script defer>` files in `feature.json` order. No bundler, no ES modules, no CDN, no web fonts.
- CSP is `default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'none'`.
  So: no inline JS/CSS/handlers, images and SVG only from this repo, no network.
- Text-node rendering only. Runtime modules ≤ 350 lines. Gzip budget 30,720 bytes (now about 22.5 KB).
- Never fabricate data. Rate cards, slot capacities and district contact stay empty until an official
  source is cited in the PR. No invented statistics, quotes or "live" claims.
- No Firestore, auth, payment, Worker or deployment changes in the same PR (rule 7).
- Original artwork only. Do not copy shrine photographs, trust logos or any person's likeness.
  Photography inside the ashram is not allowed, so do not depict it.
- Accessibility: contrast AA, 44 px targets, visible focus, works at 360 px wide and in print.

## What I would like from you

### 1. Graphics (your strength)
Replace or extend these, as plain SVG under `ui/art/` (no scripts, no external refs):
1. `ui/art/hero.svg` — placeholder now. A calm, original Kumaon-hills scene, 320×120 viewBox, readable on dark `#141b23`.
2. Crowd-pressure meter — design for four levels (normal, elevated, high, peak). CSS-only, in `kainchi.css` (`.meter`, `.level-*`).
3. Pass design — the printable card (`.pass.printing` in the print CSS). Keep the code large and legible; no QR.
4. "Spread the load" infographic — sharing visitors across Kainchi, Jageshwar, Binsar, Ranikhet, Katarmal, Baijnath. Illustrative only, no invented distances or times.
5. District poster (A3/A4 SVG or PDF, English + Hindi) for check posts: "Rate lists must be displayed", how to report, 108/112. Leave the rate fields blank for the authority to fill.
6. Icons for the five report categories, as small inline-able SVGs.

### 2. Copy and language
- Review `data/strings-en.js` for tone: respectful to pilgrims and residents, plain, no blame.
- Review and improve `data/strings-hi.js`.
- Draft `data/strings-kum.js` (Kumaoni) and mark it `NEEDS NATIVE REVIEW`. Do not ship it until a native speaker signs off; register it in `core/i18n.js` and the language buttons only then.
- Every English key needs a Hindi key (test enforces).

### 3. Research (cite sources in the PR)
- Official rate cards: taxi/shuttle (Nainital RTO / district administration), stay rate lists (tourism department), parking. Add only what a cited notice says, to `data/rate-cards.js`.
- Official Kainchi Dham trust guidance on visiting hours and conduct, and any district-announced peak dates (`data/peak-dates.js` `declaredPeaks`).
- Bypass and road status: add only after a dated official source.
- Contact for district reports: add to `districtContact` in `data/config.js` only if officials agree to receive reports.

### 4. Product ideas to design, not build blindly
Write them up in `docs/` as proposals first: resident passes, a one-way shuttle from a park-and-ride
site, an ambulance corridor, a vendor "display your rate card" badge, dynamic slot limits. They need
the district and, for any stored data, the Firestore proposal in `docs/FIRESTORE-PROPOSAL.md`.

## Handoff protocol (end of every PR)

Record: what changed; what you deliberately did not change; tests run (`npm run kainchi:check`,
`npm run kainchi:test`, `npm test`, `npm run check`); risks; whether `main` is safe to merge.
Ask Claude Code to verify before merge. Do not leave open questions in code comments.
