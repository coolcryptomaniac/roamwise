# Creator outreach — how this works, and why it's built this way

## The short version
Find creators through legitimate channels → log them in the admin CRM →
send **one personalised email at a time** from your own mail app.
Plus a public page so creators come to you.

No scraping, no harvested phone numbers, no bulk sender.

## Why not just scrape Instagram and blast everyone?

Three reasons, and the third is the one that would actually hurt:

1. **Instagram's ToS forbids automated scraping.** Meta enforces this with
   litigation and account/IP bans. There is no "compliant scraper" version.
2. **India's DPDP Act 2023** requires a lawful basis to process personal data.
   A public profile is not consent to be entered into a marketing database.
   Mobile numbers and WhatsApp are squarely in scope.
3. **It would destroy founder@roamwise.co.in.** Cold-blasting a few hundred
   scraped addresses generates spam complaints, and domain reputation collapses
   fast. That address is on your Play listing, your support flow, your invoices
   and these daily reports. Getting a burned domain back is slow and painful.

And on pure results: creators receive dozens of these weekly. **Twenty
researched emails outperform five hundred blasts.** Personalisation is the
entire game.

## Where to actually find creators (all legitimate)

- **Instagram Creator Marketplace** — Meta's own tool, built for this.
- **Licensed platforms** — Qoruz, Winkl, Plixxo, BharatInfluencer. They have
  the consent and the contact data legitimately.
- **Creators who invite pitches** — many put "collabs: name@email" or a
  Contact button on their profile. That is a public invitation; one personal
  email in response is fine. A bulk import of them is not.
- **Your own channel** — @mohucool has ~10K subs. People who comment and
  engage there are already warm.
- **Inbound** — `roamwise.co.in/creators/` (built, see below). This is the one
  that compounds.

## The offer ladder (nothing permanent is given away upfront)

Pro lifetime is a **Rs 14,999** pass. Handing that to everyone who fills a form
would mean no revenue and a dead app — so the programme is staged, and the page
says so openly.

| Step | Trigger | They get |
|---|---|---|
| **Applied** | anyone accepted | 30-day full Pro trial (zero marginal cost) + affiliate code live immediately: audience 15% off, they keep **25%** |
| **Partner** | 1 published piece **or** 5 referred sales | 1 year Pro free + commission to **30%** + roadmap input |
| **Featured** | 25 referred sales **or** a dedicated video | Pro for life (earned) + routes featured in-app with credit + co-marketing |

Why this shape:
- **Commission comes out of money that arrived.** You can never pay out more
  than you took in, so the programme cannot run at a loss.
- **A trial costs you nothing** — software has no marginal cost — but it lets
  them evaluate honestly, which is what produces a real recommendation.
- **Lifetime is earned at 25 sales.** By then that creator has generated
  roughly Rs 45,000+ net, so a Rs 14,999-value pass is cheap.
- Promotion is **automatic** at each threshold in the admin, so nobody has to
  trust you to remember.

Margin check on a Rs 2,999 Pro year: 15% audience discount leaves Rs 2,549;
25% commission is Rs 637; you keep **Rs 1,912 (64%)** — with no other
acquisition cost. At Partner rates you keep Rs 1,784 (60%).

## The tools

### 1. `/creators/` landing page
Public page describing the offer (lifetime Pro, revenue share, routes featured
with credit, a say in the roadmap). Applicants tick an explicit consent box and
land in your CRM as `seg: creator`, `consent: true`, `stage: new`.

Firestore rules allow the public to **create** such a record and nothing else —
no one but an admin can read the collection back. Size caps prevent abuse.

Share this link in your app, video descriptions, and email signature.

### 2. Admin → CRM → Creators
Log anyone you find manually. Creator-specific fields: handle, audience size,
niche, and **"one thing you liked"** — that last one feeds the pitch and is the
difference between a reply and a delete.

### 3. Pitch composer
Four templates: Warm intro · Collab offer · Feedback ask · Gentle follow-up.
Each auto-fills their name, handle, niche and the specific thing you liked.

Press **Open in mail app** and it opens in your own client, pre-filled — you
read it, edit it, send it. Deliberately not a server-side sender: there is no
button anywhere that can blast a list, by design.

Contacts without a consent flag trigger a confirmation warning first.

### 4. `agent/outreach-digest.js`
Daily report **on your own CRM data only**:
- new inbound applications (warmest leads — reply first)
- follow-ups due (contacted 7+ days ago, no reply)
- contacts lacking consent (do not pitch)
- funnel counts and reply rate

Needs `FIREBASE_SERVICE_ACCOUNT` as a GitHub secret. Wire into the daily
workflow the same way as `daily.js`.

## Rules of thumb that actually raise reply rates

- Name something specific in the first two lines. "Loved your Spiti winter
  series" beats "love your content" every time.
- Ask for an opinion, not a favour. Creators are far likelier to answer
  "tell me what's broken" than "please post this".
- Give first: lifetime Pro unconditionally, whether or not they post.
- Say "no is fine, and I won't chase" — and mean it. One follow-up maximum.
- Under ~15% reply rate means the pitch is wrong, not the volume.

---

## Failsafes on the creator programme

Every lever that could be abused is now founder-controlled or rule-enforced:

| Attack | Guard |
|---|---|
| Applicant posts `tier:'featured'` to get Pro for life | Firestore rule forces `tier=='applied'`, `refSales==0`, `refRevenue==0`, no `code`, no `proGranted` on any public create |
| Someone reads the creator list to harvest contacts | `crm` read is admin-only — the public create rule grants no read |
| Creator inflates their own sales | `refSales` only moves via the admin "+1 sale" button. Nothing client-side can touch it |
| Creator self-redeems their own code | Attribute the sale manually — you approve every UPI claim anyway, so you see the payer |
| Refunded sale still counts toward a tier | Only log "+1 sale" after the payment settles and the refund window passes |
| Form spam / storage abuse | Size caps on name/email/note; consent must be explicitly `true` |

Promotion at 5 and 25 sales is automatic **in your admin**, not claimable by them.

## Founder offer — hard cap

Rs 100 lifetime closes at **1,000 buyers OR 1 year from launch**, whichever
comes first.

- The signup counter lives in `meta/signupCounter` and the rule allows
  **increment-by-exactly-one and nothing else** — it cannot be reset to 0 to
  reopen the offer, and no other field can be smuggled in.
- The window verdict lives in `pricing/founder` (admin-writable only). The app
  previously judged this from `daysSinceLaunch()`, which reads the **device
  clock** — rolling a phone's date back reopened the offer. Server value now
  wins; the offline fallback can only ever *close* it, never open it.
- Admin → Config has the gate panel: seats left, days left, force-close.

**Do not reopen it once closed.** You told buyers "this exact price never comes
back". If conditions change, price a *new* offer — reviving this one costs you
the trust of the people who backed you first.

## On "viable for 100+ years"

One honest caution, because it is the single most common way indie apps die:

**Lifetime pricing is a liability, not revenue.** Rs 100 once, service owed
forever. Your Firestore reads, storage and support scale with active users while
that revenue does not. A thousand founder members is a fine, bounded gift to
early believers. **A hundred thousand of them would be an unpayable debt.**

Which is why the cap matters more than the price.

For the long run, the structure you already have is the right one:

- **Recurring** (Plus/Pro/Elite monthly and yearly) is the backbone. It is the
  only revenue that grows with the cost of serving people.
- **Long-term passes (3/5/10 year)** are bounded liability — a 10-year pass has
  a known end. Keep these as the longest commitment you sell.
- **After the founder cohort closes, do not sell "lifetime" again.** The 10-year
  pass is the honest maximum.
- **Review annually** (the admin tracks the due date): cost per active user,
  refund rate, what the free tier actually costs, whether the ladder pays for
  itself. Change prices at the review, deliberately — not reactively.

A business that lasts is one where each new user pays for the cost of serving
them. Everything above is built so that stays true.
