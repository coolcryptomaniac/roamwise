# Uttarakhand travel safety: pages + automatic alerts

Built 30 Oct 2026 from a review of Uttarakhand news (record 6.03 crore visitors in 2025,
56 lakh+ Char Dham pilgrims in 2026, Kainchi Dham overcrowding, Adi Kailash permits
tripling, 100+ roads shut in the August 2026 monsoon, ~550 fake Kedarnath helicopter
booking pages blocked). The common need is trusted, current help with permits, closures
and scams. RoamWise never issues permits, passes or helicopter tickets.

## Pages (static, no network requests, strict CSP)

| URL | What it does | Code |
|---|---|---|
| `/uttarakhand-travel-rules/` | Pick places, date and activities. Shows what to register, book or carry, the live advisories for those places, and safety notes. Each rule names its official link, its source and the date it was checked. Share on WhatsApp, print, or "get alerts". | `features/travel-safety/ui/rules-page.js`, data in `features/travel-safety/data/rules.js` |
| `/uttarakhand-road-status/` | Every current advisory grouped by region, plus "coming up in 30 days", official live links (traffic police, IMD, USDMA, temple committee), emergency numbers and the follow-regions picker. | `ui/status-page.js`, data in `conditions-data.js` |
| `/booking-safety/` | Offline checker for a link, UPI ID or phone number, with context (helicopter, Char Dham, stay, taxi, trek). Lists the official booking sites and RoamWise's signed Uttarakhand stays. | `core/scam.js`, `ui/safety-page.js` |

Kumaon planners that already existed are linked from the checker: `/kainchi/`, `/adi-kailash/`,
`/jageshwar/`, `/kasar-devi-almora/`, `/char-dham/`.

### Keeping the data honest
- **Rules** (`features/travel-safety/data/rules.js`): every rule needs a source URL and a
  `checked` date. Cards say "Re-check" after 60 days. `status: 'draft'` is shown as "coming".
- **Advisories** (`conditions-data.js`): add only with a source URL and an `until` date; they
  expire by themselves. After any edit, bump `RW_CONDITIONS_CHECKED` and run
  `npm run conditions:build` (writes `data/conditions.json`). `npm run check` fails while
  the JSON is stale.
- **Regions** (`features/travel-safety/data/places.js`): 12 Uttarakhand regions with place
  words. Used by the pages, by the JSON, and by `js/core/alert-follow.js` (keep the id list
  in sync; a test checks it).

## Automatic alerts (Worker)

`worker/handlers/advisory-alerts.js` (rules and wording: `worker/lib/advisory-alerts-core.js`)
reads `https://www.roamwise.co.in/data/conditions.json` and tells:

| Who | When | How |
|---|---|---|
| **Guests** with a live stay booking (requested, confirmed, pay-later, paid) checking in within 21 days, in a region an advisory touches, with overlapping dates | hourly | push to their devices, email if no device took it |
| **Followers**: signed-in users who picked regions on the status page (`users/{uid}.alertRegions`) | hourly | push, email fallback (unsubscribe link `/?unfollow=1`) |
| **Partners**: the property owner (`partnerUid`) of affected bookings, with the guest list | hourly | push, email fallback |
| **Team**: daily digest (active advisories, ones expiring in 2 days, affected stays, who was told, new stay requests, whether the list needs a review) | daily 11:00 IST | email to `ALERT_TEAM_EMAILS` + push to every `admins/{uid}` |

Each person hears about each advisory once (KV marker `adv:<id>:<who>`, kept 120 days).
Messages carry at most 3 advisories, each with its source. Emails share the
`maxEmailsPerRun` budget and stop at the Gmail daily cap; the rest goes next run.
Without the `RW_KV` binding the live run refuses to send.

### Switch it on
1. Merge (the Worker deploys itself). Nothing is sent until step 2.
2. Firebase Console → Firestore → `config/tripNotifySettings` (same doc as booking emails), add
   booleans: `advisoryAlerts`, `partnerAlerts`, `teamDigest` = `true` as wanted.
3. Cloudflare → Worker `roamwise-api` → Settings → Variables and Secrets → add Secret
   `ALERT_TEAM_EMAILS` = `you@example.com,teammate@example.com` (up to 10).
4. Email needs the Gmail relay from `EMAIL-PUSH-SETUP.md`; push needs `PUSH-NOTIFICATIONS-SETUP.md`.
5. Test as admin: `POST /admin/advisory-alerts/run` with your Firebase ID token. It is a dry run
   (counts only) unless you add `?dry=0`; add `?digest=1` to include the team digest.

### Data and privacy
- Reads `roomBookings`, `users` (pushTokens, email, alertRegions), `admins`, `stayLeads`
  through the service account. Writes only dead push-token pruning and KV markers.
- `alertRegions`/`alertRegionsAt` are written by the signed-in user on their own doc
  (`js/core/alert-follow.js`), the same self-write rule `pushTokens` uses. **No
  `firestore.rules`, auth, payment or entitlement change.**
- Optional Worker var `CONDITIONS_URL` overrides the feed URL (staging).

## Verify
`node --test tests/travel-safety.test.mjs tests/advisory-alerts-run.test.mjs`, then
`npm test` and `npm run check`.
