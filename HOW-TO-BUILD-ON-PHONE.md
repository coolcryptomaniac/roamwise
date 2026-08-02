# How to get your RoamWise APK + AAB (no PC needed)

You can do this entirely from your phone's browser. It builds BOTH:
- an **APK** you install directly on your phone to test
- an **AAB** you upload to the Play Store

The build runs free on GitHub's servers. You never install anything.

---

## Step 1 — Create a GitHub account
Go to **github.com** and sign up (free). You can do this on your phone.

## Step 2 — Make a new repository
- Tap **+** (top right) → **New repository**
- Name it anything, e.g. `roamwise-app`
- Set it to **Private** (recommended, since it holds your app)
- Tap **Create repository**

## Step 3 — Upload the project files
- In the new repo, tap **Add file → Upload files**
- Upload everything from the `capacitor-roamwise` folder (the contents of this
  zip). On mobile you may need to unzip first using a file app, then upload the
  files. Make sure the `.github` folder and `capacitor.config.json`,
  `package.json`, and the `www` folder all go in.
- Tap **Commit changes**

## Step 4 — Add your signing key as a secret
This lets the build sign the app with YOUR key (so it's an update, not a new app).
- Open **KEYSTORE_B64.txt** (included in your downloads) and copy ALL its text.
- In the repo: **Settings → Secrets and variables → Actions → New repository secret**
- Name: `KEYSTORE_B64`
- Value: paste the text from KEYSTORE_B64.txt
- Tap **Add secret**

## Step 5 — Run the build
- Go to the **Actions** tab in your repo
- Click **"Build RoamWise Android (APK + AAB)"**
- Tap **Run workflow → Run workflow**
- Wait ~5–10 minutes (watch the green tick appear)

## Step 6 — Download your files
- Click the finished (green ✓) run
- Scroll to **Artifacts** at the bottom
- Download **RoamWise-APK** and **RoamWise-AAB**
- The APK: unzip and install it on your phone (allow "install from unknown
  sources" when asked)
- The AAB: upload to Play Console → your app → Production/Testing → Create release

---

## Important notes (honest)
- The build sets **versionCode 77** — higher than your last (76), so Play accepts
  it. If you build again later, bump this number in
  `.github/workflows/build-android.yml`.
- This app has **real GPS** — the first time you open "Near Me," Android will ask
  for location permission, and it'll work.
- Keep **KEYSTORE_B64.txt** private — it's your signing key. Don't share it or
  commit it into public code. (It's safe as a GitHub *secret*.)
- If the build fails, open the failed step's log — it usually says exactly what's
  missing (most often the KEYSTORE_B64 secret wasn't added). Send me the error
  and I'll fix it.

## Don't want to use GitHub?
If you have a laptop, `BUILD-STEPS.md` has the direct commands instead. Either
path produces the same APK + AAB.
