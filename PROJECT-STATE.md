# RoamWise Pro — Project State (read this first, every session)

**Purpose of this file:** Claude's sandbox can reset mid-project (it happened once already — lost the Android SDK, keystore, and agent folder). This file is the single source of truth so a fresh session can pick up correctly without re-deriving everything from a long chat transcript. Update it whenever something structural changes.

## 🚨 Critical — read before touching the Android build
- **The signing keystore (`rw.keystore`) is the single most important file in this project.** If Play Store publishing has happened, losing it means you can NEVER update the app again under the same package — you'd have to publish as a new app from zero installs/reviews.
- **Mohit: confirm right now whether you have `RoamWise-KEYSTORE-BACKUP.zip` saved somewhere durable** (Drive, email, USB). If not, do it before anything else.
- If a fresh Claude session needs to rebuild the Android toolchain and the keystore is lost, **ask Mohit for the backup before generating a new one** — a new keystore only breaks nothing if the app has never been published to Play Store yet.

## Current versions (update these each ship)
- Package: `com.gyanverse.roamwise`
- Last APK: v9.4 (versionCode 6, targetSdk 34, minSdk 24)
- Last AAB: versionCode 6
- Web `index.html`: ~438KB, single-file architecture
- Keystore alias: `roamwise`, password: `roamwise2026` (yes, in plaintext here — this is a solo-dev low-stakes app; rotate if that ever changes)

## Architecture in one paragraph
Single `index.html` (web app), wrapped in a thin Android WebView shell (`MainActivity.java`) that loads it from `file:///android_asset/index.html`. A JS↔Java bridge (`window.RW`) exposes `saveCard()` (writes files to Downloads/RoamWise) and `openExternal()` (launches URLs natively — needed because YouTube/some embeds reject the `file://` origin). Firebase (Auth + Firestore) provides accounts, Pro status, ratings, squads. A GitHub Actions "agent" package runs cron jobs (SEO page generation, news crunching, daily ops report, newsletter) with zero server needed.

## Build toolchain — how to rebuild from scratch if lost
```
# 1. Download Android SDK cmdline-tools + install build-tools/platform
curl -sL -o cmdline-tools.zip https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip
unzip -q cmdline-tools.zip -d tmp && mkdir -p sdk/cmdline-tools && mv tmp/cmdline-tools sdk/cmdline-tools/latest
yes | sdk/cmdline-tools/latest/bin/sdkmanager --sdk_root=sdk "platform-tools" "platforms;android-34" "build-tools;34.0.0"

# 2. Install JDK if missing (javac not found = only JRE present)
apt-get update && apt-get install -y openjdk-21-jdk-headless

# 3. Download bundletool for AAB
curl -sL -o bundletool.jar https://github.com/google/bundletool/releases/download/1.15.6/bundletool-all-1.15.6.jar

# 4. Generate keystore ONLY if truly lost AND nothing published yet:
keytool -genkeypair -v -keystore build/rw.keystore -alias roamwise -keyalg RSA -keysize 2048 \
  -validity 10950 -storepass roamwise2026 -keypass roamwise2026 \
  -dname "CN=Mohit Pandey, OU=GYANVERSE, O=RoamWise, L=Almora, ST=Uttarakhand, C=IN"
```
**AndroidManifest.xml MUST include** `<uses-sdk android:minSdkVersion="24" android:targetSdkVersion="34" />` — omitting this caused a real bug once (Android blocked install as "incompatible/unsafe").

## Firebase / Firestore
- Full security rules live in `firestore.rules` in this same repo folder — paste directly into Firebase Console → Firestore → Rules.
- Collections in use: `users` (+`devices` subcollection), `claims`, `payments`, `admins`, `pulse`, `requests`, `stats`, `ratings`, `squads`, `reports`.
- Pro is **account-bound, not device-bound** — verified fix for a real leak where logout didn't clear Pro (stale Firestore listener wasn't unsubscribed).

## Constants still waiting on Mohit (search `index.html` for these)
- `ADSENSE_ID` — ✅ set (`ca-pub-4943859484482348`)
- `AFF_BOOKING` — empty, waiting on a Booking.com/Agoda affiliate ID
- `PLAYSTORE_URL` — empty, fill in once the app is live on Play Store (unlocks in-app "rate us" nudges)
- Book links — ✅ all wired (Amazon/Pothi/Flipkart, real URLs)
- Spotify/JioSaavn — ✅ wired (`SPOTIFY_ARTIST_ID`, `SPOTIFY_PLAYLIST_ID`, `JIOSAAVN_URL`)
- `WA_NUMBER` / `WA_CHANNEL` / `WA_GROUP` — still empty, waiting on Mohit to create these himself (can't be done by an agent — needs his phone/SIM)

## Known-fixed bugs (don't reintroduce)
1. **YouTube embed error 153 inside the app**: fixed by using the real YT IFrame Player API with `onStateChange` verification (checking for actual `PLAYING` state, not just `onReady`) — `onReady` can fire while YouTube silently shows its own in-frame error with no JS `onError` event. Falls back to native `RW.openExternal()` after ~4.5s if PLAYING never arrives.
2. **Pro survives logout**: was caused by an unsubscribed Firestore `onSnapshot` listener from a prior session firing a stale cached event after logout. Fixed by capturing and explicitly unsubscribing on sign-out, and making the signed-out auth branch authoritative.
3. **Missing `<uses-sdk>`**: causes "app not compatible" install failures on modern Android — always verify with `aapt2 dump badging <apk> | grep sdkVersion` after any manifest rebuild.
4. **Popular-card photo loading**: must be sequential (not parallel/burst), or the weserv.nl proxy rate-limits and some images silently never load.
5. **Journey Card canvas tainting**: any photo drawn onto the exportable card canvas must go through `fetchImg64()` (fetch→blob→dataURL), never a direct cross-origin `Image.src` — otherwise `toDataURL()` throws on save/share.

## Skills-check reminder for future sessions
Always re-read this file, then check `/mnt/user-data/outputs/` for the latest shipped files before assuming anything is missing.
