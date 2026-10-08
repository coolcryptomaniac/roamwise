# Come-back reminders (push first, email second)

Brings back users who registered but have not opened RoamWise for a while. No phone numbers are collected, so no WhatsApp/SMS.

## Control it from Admin -> Reminders (no command line)
Switches for push and email (both start OFF), days away, wait between reminders, the message text, **Preview who would get it** (sends nothing) and **Send now**. Saved in Firestore `config/reminderSettings` and `config/reminderContent`. The daily cron (11:00 IST) honours the same switches.
- **Push** works with no extra setup for users who allowed notifications (existing FCM + `users/{uid}.pushTokens`). A user gets push if they have a live device, otherwise email.
- **Email** also needs the one-time setup below.

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
Until both secrets exist email is skipped (push still works). You can add the two secrets in the Cloudflare dashboard: Workers -> roamwise-api -> Settings -> Variables and Secrets -> Add (type: Secret), no terminal needed.

## Check it before it sends
Use the **Preview** button in Admin -> Reminders. (Under the hood: founder-only `POST /admin/reminders/run`, dry run unless `?dry=0`.)

## Edit the offers
The Admin -> Reminders form writes `config/reminderContent` (https links only, up to 3 items here). Used for messages without a remembered destination. Do not promise discounts that do not exist.

## Privacy and law (India)
Reminders go only to registered users, with unsubscribe in every mail, and use only the registered email and last searched destination. Mention email reminders in the privacy policy before enabling. Have a CA/lawyer confirm DPDP Act consent wording.
