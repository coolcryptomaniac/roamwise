# Kainchi Dham Yatra: start here

Local-only advisory planner for visits to Kainchi Dham (Nainital, Uttarakhand), built after the
2–4 Oct 2026 overcrowding. Preserve root `CLAUDE.md` and `AI-ROLES-AND-HANDOFF.md`; this file
narrows discovery, not authorization.

## Fast context

Run `npm run kainchi:context -- data|core|ui`. `feature.json` is the checked module map and
browser load order (data → core → ui, classic scripts, no modules). ChatGPT: read
`docs/CHATGPT-BRIEF.md` first.

| Concern | Owner |
|---|---|
| Config, peak rules, rate cards, nearby places | `data/*.js` |
| Copy (English / Hindi) | `data/strings-en.js`, `data/strings-hi.js` |
| Input bounds | `core/validation.js` |
| Crowd pressure | `core/calendar.js` |
| Arrival hours and capacities | `core/slots.js` |
| Advisory pass codes | `core/pass.js` |
| Official rates | `core/rates.js` |
| Visitor reports | `core/reports.js` |
| DOM, language, storage helpers | `ui/context.js` |
| Views | `ui/planner.js`, `ui/passes.js`, `ui/fair.js`, `ui/controller.js` |
| Look and feel | `ui/kainchi.css`, `ui/art/*` |

## Hard rules

1. Never invent rates, capacities, contacts, dates or statistics. Empty data means "not provided
   by the district yet" and the UI says so. Fill `data/*.js` only from a cited official source.
2. This page makes no network requests (CSP `connect-src 'none'`). Reports are composed locally and
   sent by the visitor through their own email or WhatsApp.
3. Passes are advisory (`kind: 'advisory'`). No QR codes until a district verifier exists.
4. Text nodes only: no `innerHTML`, inline script, inline style or `onclick`.
5. Runtime modules ≤ 350 lines; gzip budget in `feature.json`.
6. Firestore, auth, payments and Worker changes are out of scope; see `docs/FIRESTORE-PROPOSAL.md`.
7. New English string → add the Hindi key too (a test enforces parity). Kumaoni needs a native reviewer.

## Verify

`npm run kainchi:check && npm run kainchi:test`, then `npm test && npm run check && npm run mod-status`.
