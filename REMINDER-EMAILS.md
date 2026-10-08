# Inactivity reminder emails

Brings back users who registered but have not opened RoamWise for 7+ days.
Email only (no phone numbers are collected, so no WhatsApp/SMS).

## What it does
- Runs inside the existing daily Worker cron (11:00 IST), `worker/handlers/reminders.js`.
- Selects users whose `users/{uid}.lastActive` is older than 7 days, with a valid email and no opt-out.
- Max 1 email per 14 days, max 3 in a row; the count resets when the user returns. Max 100 sends per run (Resend free tier is 100/day).
- If the user searched a destination, the email says "Still waiting for your next trip to Manali?" and links to `?destination=Manali`. Otherwise: "Planning a trip anytime soon?".
- Every email has a signed one-click unsubscribe link (also `List-Unsubscribe` headers). Opt-out sets `users/{uid}.emailOptOut = true`.
- `js/misc/interest-sync.js` saves only `lastDestination` + timestamp when a signed-in user runs a search.

## Turn it on (one-time)
1. Create a Resend account, add and verify the domain `roamwise.co.in` (DNS records), create an API key.
2. `npx wrangler secret put RESEND_API_KEY`
3. `npx wrangler secret put EMAIL_UNSUB_SECRET` (any long random string)
4. Optional vars in wrangler.toml `[vars]`: `REMINDER_FROM` (default `RoamWise <hello@roamwise.co.in>`), `REMINDERS_ENABLED="false"` to pause.
Until both secrets exist the cron only counts who WOULD be emailed; nothing is sent.

## Check it before it sends
Founder only (Firebase admin ID token): `POST /admin/reminders/run` is a dry run (`?dry=0` sends for real). It returns `{scanned, eligible, willSend, skipped:{...}}`.

## Edit the offers
Firestore doc `config/reminderContent`: `{headline, intro, items:[{title,text,url}], cta:{label,url}}` (https URLs only, max 5 items). Used for emails without a remembered destination. Do not promise discounts that do not exist.

## Privacy and law (India)
Reminders go only to registered users, with unsubscribe in every mail, and use only the registered email and last searched destination. Mention email reminders in the privacy policy before enabling. Have a CA/lawyer confirm DPDP Act consent wording.
