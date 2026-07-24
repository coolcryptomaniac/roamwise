# Public / private inventory

Everything RoamWise serves, what it exposes, and who should have it.
Audited 24 July 2026.

---

## Public — meant to be found

| URL | What it is | Why public |
|---|---|---|
| `/` | The app | The product |
| `/guides/` + 18 guide pages | Long-form travel guides | Organic acquisition |
| `/blog/` + 6 posts | Blog | Organic acquisition |
| `/about.html` | Who builds it, how it earns | AdSense requirement, and trust |
| `/contact.html` | Support and abuse reporting | AdSense requirement |
| `/terms.html` | Terms of use | AdSense requirement |
| `/privacy.html` | Privacy policy | Legal requirement |
| `/creators/` | Creator partner ladder + application | **Should be shared widely** |
| `/sitemap.xml`, `/robots.txt`, `/ads.txt` | Crawler files | Must be public |
| `/manifest.webmanifest`, `/sw.js`, icons | PWA plumbing | Required |

All are in `sitemap.xml` and indexable.

---

## Private — real URLs, not in search

| URL | Who should have it | What it exposes |
|---|---|---|
| `/staff/` | Interns you have added | Their own tasks and role-limited data. **Cannot read travellers, API keys, private chats or payments** |
| `/deck/` | Investors and advisors you send it to | Public-safe content and your funding ask. No user data |

Both carry `<meta name="robots" content="noindex">`, are absent from
`sitemap.xml`, are `Disallow`ed in `robots.txt`, and are **linked from nowhere
public**.

### Be clear about what that does and doesn't mean

**These pages are not password-protected.** Anyone with the exact URL can load
them. What that person gets is very different, though:

- `/staff/` without a staff record → *"No role assigned"* and nothing else. The
  Firestore rules do the protecting, not the URL.
- `/deck/` → your pitch. Nothing sensitive, just not for strangers.

**The URL is obscurity. The rules are security.** That distinction matters — if
a link leaks, you revoke access in the Team panel; you don't change the URL.

---

## Never on the website

| Thing | Where it lives |
|---|---|
| **Admin console** | `rw-admin-console.html` on your device, or `RWAdmin.apk` |
| **Keystore** | Offline backup only. Never in the repo |
| **Firebase service account** | GitHub Actions secret only |
| **API keys** | User devices (BYOK) or GitHub secrets. Never committed |

The admin console is deliberately not hosted. If it were on the site, its URL
would be one guess away from your whole business — and although Firestore rules
would still block the data, there is no reason to take the chance.

---

## What each role can actually read

Enforced in `firestore.rules`, verified by audit:

| Collection | Public | Marketing intern | Finance intern | Admin |
|---|---|---|---|---|
| `users` | ✗ | ✗ | ✗ | ✓ |
| `secrets` (API keys) | ✗ | ✗ | ✗ | owner only |
| `tripchats` | members only | ✗ | ✗ | ✗ |
| `payments`, `claims` | ✗ | ✗ | ✗ | ✓ |
| `crm` | create creator app only | creator records only | ✗ | ✓ |
| `ledger` | ✗ | ✗ | ✓ enter expenses | ✓ |
| `tasks` | ✗ | own status only | own status only | ✓ |
| `stats` | ✗ | ✓ aggregates | ✓ aggregates | ✓ |
| `bans` | own record | ✗ | ✗ | ✓ |

Neither intern can read a single traveller's personal data. That was checked
explicitly, not assumed.

---

## Fixed in this release

- **Footer deduplicated** — "Travel Guides"/"Guides", "About the creator"/"About"
  and "Terms"/"Terms & refunds" were doubled up. Three removed.
- **Group chat is now findable** — it existed but was only reachable from a
  saved trip. Added to the drawer alongside Group planner.
- **robots.txt now explicitly disallows** `/staff/` and `/deck/`.
- **Private links panel in Admin → Config** — every private URL in one place,
  with who it is for, what it exposes, and copy buttons.

---

## If a private link leaks

1. **Don't panic and don't change the URL** — that breaks it for your team and
   fixes nothing.
2. **Revoke the person** in Admin → Config → Team. Access dies immediately at
   the database.
3. **Check `abuse` and `ledger`** for anything unexpected.
4. `/deck/` leaking is not an incident. It contains nothing you wouldn't send an
   investor.
