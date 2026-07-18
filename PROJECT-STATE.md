# RoamWise Pro — Project State (read this first, every session)

**Purpose of this file:** Claude's sandbox can reset mid-project (it happened once already — lost the Android SDK, keystore, and agent folder). This file is the single source of truth so a fresh session can pick up correctly without re-deriving everything from a long chat transcript. Update it whenever something structural changes.

## 🚨 Critical — read before touching the Android build
- **The signing keystore (`rw.keystore`) is the single most important file in this project.** Location: `/home/claude/rw2/apk/build/rw.keystore` (both the old manual toolchain AND the new Gradle project reference this same file — don't duplicate it).
- **Mohit: confirm you have `RoamWise-KEYSTORE-BACKUP.zip` saved somewhere durable.** Losing it after Play Store publishing permanently breaks the ability to ship updates.

## ⚡ Build system: NOW GRADLE-BASED (as of v10.2) — the old manual toolchain is deprecated
The project moved from a manual `aapt2`+`javac`+`d8` pipeline to a **real Gradle project** at `/home/claude/rw2/gradleapp/`, specifically to support proper Maven dependency resolution (needed for the `android-youtube-player` native library — see below). **Use Gradle for all future Android builds; the old `/home/claude/rw2/apk/proj` manual pipeline is legacy and no longer the source of truth for MainActivity.java.**

**Toolchain as of v10.6 (SDK-36 rebuild):** Gradle **8.11.1** (`/home/claude/rw2/gradle-8.11.1/bin`) + AGP **8.10.1** + `platforms;android-36` + `build-tools;36.0.0` (installed in the same SDK dir). compileSdk 36 / targetSdk 36 / minSdk 24. **targetSdk 35+ enforces edge-to-edge on Android 15/16** — MainActivity handles this with a WindowInsets listener padding the root layout (dark #0A0A0C background behind the bars), zeroed during HTML5-fullscreen video and restored via `requestApplyInsets()` on exit. Do not remove that listener or the header will render under the status bar on modern devices.

**R8 minification ON as of v10.7 (versionCode 20):** `minifyEnabled true` + `shrinkResources true` cut the app from ~2.7MB to ~900KB. Keep rules live in `app/proguard-rules.pro` — the critical one preserves every `@JavascriptInterface` method unrenamed (verified in mapping.txt: saveCard/openExternal/playPromoVideo/openLastSaved all map to themselves). **Never delete proguard-rules.pro or the entire JS bridge silently breaks.** The deobfuscation map auto-embeds in the AAB (`BUNDLE-METADATA/com.android.tools.build.obfuscation/proguard.map`), which is what clears Play Console's "no deobfuscation file" warning — no manual mapping upload needed. Standalone mapping.txt per release lands at `app/build/outputs/mapping/release/mapping.txt`.

**Ads policy (as of v21): AdSense is WEBSITE-ONLY.** The loader in index.html detects the app (window.RW bridge OR PLAY_MODE) and never loads AdSense inside any app build — AdSense-for-Content in a native app violates AdSense program policy and endangers the whole account. Play Console declarations therefore: Advertising ID = **No** (manifest verifiably has no AD_ID permission, no ad SDKs); Contains ads = **No** for the app. Do not add play-services-ads / AdMob without revisiting both declarations.

```
cd /home/claude/rw2/gradleapp
export PATH=/home/claude/rw2/gradle-8.11.1/bin:$PATH  # Gradle 8.11.1 REQUIRED for AGP 8.10.1 (SDK 36); old gradle-8.7 is deprecated
export ANDROID_HOME=/home/claude/rw2/apk/sdk
export ANDROID_SDK_ROOT=/home/claude/rw2/apk/sdk

# Sideload APK (PLAY_MODE=false):
cp /home/claude/rw2/web/index.html app/src/main/assets/index.html
gradle assembleRelease --console=plain
# → app/build/outputs/apk/release/app-release.apk

# Play Store AAB (PLAY_MODE=true):
sed 's/var PLAY_MODE = false;/var PLAY_MODE = true;/' /home/claude/rw2/web/index.html > app/src/main/assets/index.html
gradle bundleRelease --console=plain
# → app/build/outputs/bundle/release/app-release.aab
# IMPORTANT: restore the sideload assets afterward before building the APK again!
```

**If Gradle itself is lost in a future reset:** re-download `https://services.gradle.org/distributions/gradle-8.7-bin.zip`, unzip, and the `gradleapp/` project (build.gradle, settings.gradle, app/build.gradle, AndroidManifest.xml, MainActivity.java) should still be on disk since it's separate from the downloaded Gradle binary itself.

**Key files in `gradleapp/`:**
- `app/build.gradle` — dependencies, signing config (points at `../../apk/build/rw.keystore`), versionCode/versionName (bump both on every release)
- `app/src/main/java/com/gyanverse/roamwise/MainActivity.java` — now extends `AppCompatActivity` (required for `getLifecycle()`, needed by the YouTube player library) — the manifest theme MUST stay an AppCompat theme (`Theme.AppCompat.NoActionBar`) or the app will crash on launch
- `app/src/main/assets/index.html` — copy the web build here before each build (see commands above)

## Native YouTube player (fixes error 153, replaces WebView iframe entirely for the promo video)
Uses `com.pierfrancescosoffritti.androidyoutubeplayer:core:12.1.0` (the actively-maintained community standard — Google's own official player API is deprecated since 2023). JS calls `RW.playPromoVideo(videoId)`; native side shows a full-screen overlay with a real `YouTubePlayerView`, sidestepping WebView file:// origin/referrer/cookie restrictions entirely since there's no WebView-hosted iframe involved in playback anymore. On the website (no `RW` bridge), the existing plain-iframe fallback still applies unchanged.

## Current versions (update these each ship)
- Package: `com.gyanverse.roamwise`
- Last APK: v10.9 (versionCode 22, compileSdk 36, targetSdk 36, minSdk 24, R8-minified ~900KB)
- Last AAB: versionCode 22, PLAY_MODE=true, SDK 36, R8-minified with embedded deobfuscation map
- Web `index.html`: single-file architecture, now includes the RWPricing engine (see below)

## Promo video: SELF-HOSTED MP4 (final decision — do not revisit YouTube embedding)
After exhausting YouTube iframe embeds AND the native android-youtube-player library (both hit YouTube's 2025 embedder-identity restrictions — errors 152/153, confirmed as open unresolved issues industry-wide), the film now plays via a plain HTML5 `<video>` tag pointing at `https://roamwise.co.in/promo.mp4` (constant `PROMO_MP4_URL` in index.html). Direct media elements have no embed restrictions and their error events actually fire — the fallback (clean "Watch on YouTube" card) is real and verified. A small "Watch on YouTube" button always sits below the player.
**PENDING (Mohit):** upload `promo.mp4` to the GitHub repo root. Get the file via YouTube Studio → Content → your video → ⋮ → Download (official creator feature for your own uploads). If the file is >50MB, compress to 720p first (HandBrake "Fast 720p30" preset on Mac). Until uploaded, clicking Play shows the YouTube-card fallback — nothing is broken, just not inline yet.

## Pricing / business model (RWPricing engine in index.html)
Single source of truth — search `var RWPricing` in index.html. Founder offer (₹100 lifetime) closes at EITHER 1000 signups OR 365 days from `LAUNCH_DATE`, whichever first. Ongoing tiers: Free/Plus(₹99)/Pro(₹299)/Elite(₹499) monthly, with yearly discounts and tier-specific long-term one-time passes (3/5/10yr, priced separately per tier). Short-term day/week passes exist too. **These are starting numbers Mohit should sanity-check against real margins, not validated market pricing.**

## Architecture in one paragraph
Single `index.html` (web app) + a WebView-wrapped Android shell, now Gradle-built specifically to support the native YouTube player dependency. JS↔Java bridge (`window.RW`) exposes `saveCard()`, `openLastSaved()`, `openExternal()`, and now `playPromoVideo()`. Firebase (Auth + Firestore) provides accounts, Pro status, ratings, squads, the pricing/trial system. GitHub Actions agent package runs cron jobs (SEO, news, ops report, newsletter) with zero server needed.

## Old manual toolchain (legacy, kept for reference only)
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
