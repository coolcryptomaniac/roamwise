# Owning the "RoamWise" search

## What you're actually up against

I checked the name landscape:

| Domain | Status | What it is |
|---|---|---|
| **roamwise.co.in** | live | **You** |
| **roamwise.app** | live | A different, real product — *"Roamwise – Smart Travel Day Tracking for Tax & Visa"* |
| roamwise.com | 403 | Held, not serving publicly |
| roamwise.io / .ai / .co | 200 | Parked or minimal |

**roamwise.app is your genuine competitor for the name.** It is a different
product in an adjacent space (day-counting for tax residency and visas), which
makes it worse, not better — Google may treat you as the same entity or split
the brand signal between you.

You will not win this by writing "RoamWise" more times on your homepage. Brand
searches are resolved by **entity signals**: does Google know you are a distinct
organisation, with a consistent identity, that people actually visit?

---

## Fixed in this release

- **Organization + WebSite + SoftwareApplication schema** on the homepage, with
  `alternateName` covering RoamWise Pro / RoamWise India, your Almora address,
  founder attribution, and `sameAs` links to your YouTube and LinkedIn. This is
  the single strongest "we are a distinct entity" signal available.
- **Article schema** on all 8 content pages, publisher-attributed to RoamWise.
- **og:image, twitter:card, geo tags** — social shares now render a card instead
  of a bare link, which materially affects click-through.
- **icon-512.png** created (the og:image was pointing at a 404).

---

## What you need to do — in priority order

### 1. Google Search Console (do this today, 20 minutes)

Nothing else matters until this is done.

1. Verify `roamwise.co.in` at search.google.com/search-console
2. Submit `https://www.roamwise.co.in/sitemap.xml`
3. Use **URL Inspection → Request Indexing** on: homepage, /guides/, /about.html,
   and your three new long-form guides
4. Check **Coverage** for anything excluded, and fix it

Without this, Google finds you slowly and you have no visibility into why.

### 2. Pick one canonical domain form and never vary

Right now you have both `roamwise.co.in` and `www.roamwise.co.in` resolving.
Pick **one** (I'd suggest `www.` since your canonical already uses it), 301 the
other, and use that exact form everywhere — app, deck, email signature, social
bios, Play listing.

Inconsistency splits your signal in half. This is free to fix and genuinely
matters.

### 3. Google Business Profile

Register **RoamWise, Almora, Uttarakhand**. A verified local business entity is
one of the strongest disambiguators available, and roamwise.app — a foreign SaaS
product — cannot compete for an Indian local entity.

### 4. Link from properties you already own

Google weighs entity co-occurrence heavily. Add `roamwise.co.in` to:

- **YouTube @mohucool** — channel description *and* the link section
- **LinkedIn** — featured link and experience entry
- **Instagram** bio
- **Play Store listing** — developer website field
- Your books on Pothi — author bio

Five links from properties that already carry your name is worth more than fifty
random directory listings.

### 5. Make the brand string slightly distinctive

`RoamWise` alone is contested. `RoamWise Pro` and `RoamWise India` are not.

Use **"RoamWise Pro"** consistently as the product name (your title tag already
does). Over time this becomes the phrase people search, and it belongs entirely
to you.

### 6. Publish on a schedule

The three new guides plus fifteen destination guides is a real content base.
Google rewards freshness signals on a site it considers active. **One new guide
a month** is enough — it does not need to be weekly.

Write for questions that have a search volume and a bad current answer:
- "how much should an auto cost in [city]"
- "is [place] crowded in [month]"
- "[trek] cost DIY vs organised"

These are exactly what your app knows and what nobody has written well.

### 7. Get one or two real backlinks

Not directory spam. Realistic options:

- A guest post on an Indian travel blog about over-tourism data
- Being listed by a creator you partner with
- An Indian startup directory (YourStory, Inc42 startup listings)

Two genuine links beat two hundred bought ones, and bought links can get you
penalised.

---

## What will not work

- **Keyword stuffing "RoamWise"** — this hasn't worked since roughly 2012 and
  now reads as spam.
- **Buying the other domains.** roamwise.app is an operating business; they will
  not sell, and you do not need it.
- **Paid ads on your own brand name.** Only worth it once someone else is
  bidding on it — check Search Console for that first.
- **Rebranding.** Your name is fine. Entity signals fix this, not a new name.

---

## Realistic timeline

- **Week 1:** Search Console, canonical domain, Business Profile, owned links
- **Month 1:** structured data indexed, brand search improving
- **Month 3:** consistent #1 for "roamwise india", "roamwise pro", "roamwise app india"
- **Month 6+:** competitive for bare "roamwise" if content cadence holds

You will realistically not outrank an established `.app` for the unqualified
one-word term quickly. You will own every qualified variant — and those are the
searches from people who actually want *you*.
