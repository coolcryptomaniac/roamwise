# Booking emails + trip reminders — setup (free: your Gmail + web/Android push)

What it does, once switched on:
- **Acknowledgement email** to the guest within the hour after a stay request ("we got your request — not a confirmed booking, nothing charged").
- **Trip reminders** 3 days and 1 day before check-in for *confirmed* stays: web/Android push first; email only if no push device received it.
- Each message is sent once per booking. Nothing is sent for declined, past or old (3+ days) requests.

Both switches are **OFF** until you turn them on. Nothing changes for users before step 4.
No Firestore rules, auth or payment code is touched.

## 1. Create the Gmail relay (about 5 minutes, works on a phone browser)
1. Sign in to the Google account you want to send from → open https://script.google.com → **New project**.
2. Delete the sample code, paste in all of `tools/gmail-relay/Code.gs`, **Save**.
3. **Project Settings** (gear) → **Script properties** → **Add**: name `RELAY_SECRET`, value = a long random string (30+ characters). Save.
4. **Deploy → New deployment → Web app**. Execute as: **Me**. Who has access: **Anyone**. Deploy and approve the permission prompt (it asks to send email as you).
5. Copy the **Web app URL** (ends in `/exec`). Opening it in a browser should show `{"ok":true,"service":"roamwise-gmail-relay"}`.

The URL alone is useless without the secret. Google enforces the daily limit (about 100 recipients/day on free Gmail, 1,500 on Workspace). The relay keeps 10 spare so you can still send your own mail; when it runs out, remaining messages wait for the next run.
Emails come from that Gmail address (display name "RoamWise", replies go to support@roamwise.co.in).

## 2. Give the Worker the two secrets
Cloudflare dashboard → Workers & Pages → `roamwise-api` → Settings → Variables and Secrets → add as **Secret**:
- `GMAIL_RELAY_URL` = the Web app URL
- `GMAIL_RELAY_SECRET` = the same string you used for `RELAY_SECRET`

(Already set for push: `FIREBASE_SERVICE_ACCOUNT_JSON`. `EMAIL_UNSUB_SECRET` is only needed for the existing inactivity emails.)

## 3. Merge the PR
Merging deploys the Worker automatically (Cloudflare Workers Builds). It adds an hourly cron for acknowledgements; the daily 11:00 IST run also sends reminders.

## 4. Switch it on
Firebase Console → Firestore → collection `config` → add document `tripNotifySettings` with fields:
`ackEmail` (boolean) = true, `reminders` (boolean) = true, `maxEmailsPerRun` (number) = 40.
Leave a switch false to keep that part off.

## 5. Test safely
- Make a stay request with your own email, and a second with someone else's address you control.
- As admin, POST `/admin/trip-notify/run` (dry-run by default; add `?dry=0` to send for real) with your Firebase ID token — it reports how many acks and reminders it would send.
- For reminders: confirm a test booking with check-in 3 days (or tomorrow) away and wait for the 11:00 IST run, or run it manually with `?dry=0`.

## Push (web + Android)
Push delivery already exists (`PUSH-NOTIFICATIONS-SETUP.md`): users who allow notifications get them. Reminders reach only users who have a registered device, so email covers the rest. Android push also needs the app build with `google-services.json` as described in that guide.

## Limits to know
- Free Gmail ≈100 recipients/day. Fine for early volume; move to Resend or Workspace if bookings grow.
- Reminders need the booking's `guestUid`/`guestEmail`, which the stays marketplace already stores.
- Bookings made through the older basket "request" form are not covered (they carry no email).
