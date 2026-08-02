# RoamWise → Capacitor Android app with REAL GPS

This turns your web app into a proper Android app where "Near Me" GPS actually
works (native permission prompt + accurate location), while keeping everything
else exactly as it is. You run these steps once on any computer with Node + the
Android SDK (or use a free cloud builder — see bottom).

## What you have in this folder
- `www/` — your web app (app.js already has native-GPS support baked in)
- `capacitor.config.json` — app id, name, geolocation plugin config
- `package.json` — the dependencies
- this guide

## One-time setup on your machine

1. Install Node.js (nodejs.org) and Java 17 + Android command-line tools.
   (Easiest all-in-one: install **Android Studio** once — it bundles the SDK.
   You won't code in it; you just need its SDK + one build command.)

2. In this folder, run:
   ```
   npm install
   npx cap add android
   npx cap sync android
   ```
   This generates the native `android/` project with the geolocation plugin.

3. **Add the location permissions** (Capacitor's geolocation plugin usually adds
   them, but confirm) — open `android/app/src/main/AndroidManifest.xml` and make
   sure these two lines are inside `<manifest>`:
   ```xml
   <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
   <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>
   ```

4. **Use your existing signing key** so it's an update, not a new app. Copy your
   `rw.keystore` into `android/app/` and add to `android/app/build.gradle`:
   ```gradle
   android {
     signingConfigs {
       release {
         storeFile file('rw.keystore')
         storePassword 'roamwise2026'
         keyAlias 'roamwise'
         keyPassword 'roamwise2026'
       }
     }
     buildTypes { release { signingConfig signingConfigs.release } }
     defaultConfig {
       applicationId "com.gyanverse.roamwise"
       versionCode 77          // must be higher than your last upload
       versionName "16.0"
     }
   }
   ```

5. **Build the AAB:**
   ```
   cd android
   ./gradlew bundleRelease
   ```
   Output: `android/app/build/outputs/bundle/release/app-release.aab` — upload
   that to Play. GPS will now prompt and work in the app.

## To update the app later (after web changes)
Just re-copy the new web files into `www/`, bump `versionCode`, and re-run
`npx cap sync android` + `./gradlew bundleRelease`. That's your new pipeline.

## No computer set up? Use a free cloud builder
- **GitHub Actions** (free) — push this folder to a GitHub repo; a workflow can
  run the Gradle build in the cloud and hand you the AAB. (I can write the
  workflow file if you want this route.)
- **Capacitor's Appflow / Ionic** or **Codemagic** — free tiers build Capacitor
  apps in the cloud without you installing anything.

## Honest note
The `www/` files here are ready and GPS-aware. The one thing that cannot happen
in this chat is the final Gradle/native compile — that needs a real Android build
environment. Everything up to that point is done for you.
