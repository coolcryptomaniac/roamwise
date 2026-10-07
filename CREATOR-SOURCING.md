# Creators for RoamWise stays: terms, matching and sourcing

Updated 2026-10-07.

## Where each property stands

| Property | Creator status | Terms |
|---|---|---|
| Milan Heights | **Open** | Free stay on non-weekend nights in the off-season. Optional cash up to Rs 5,000, paid only if the creator brings guests who book and stay. |
| Soulmate Homestay | **Closed** | Owner declined. Nobody is introduced; the reason is kept. |
| New Himank | **Pending** | Waiting for Deepanshi's answer. Nobody is introduced until it is set to open. |

**Things I assumed for Milan Heights and you should confirm with the owner** (they are listed as `unconfirmed` in the code and the public page says "some details are still being confirmed"): 2 free nights, off-season months January, February, July, August, September, meals not included, 10% of each completed stay as the cash share, at most 2 creator stays a month. "Weekend" means Friday and Saturday nights.

## How to change terms (no code)

Terms live in `creators/property-terms-core.mjs` as the starting point. To change them without a deploy, an admin writes a document `config/creatorPolicies` in Firestore with a `list` of policies; it overrides the starting point per `propertyId`. When New Himank agrees, add an entry with `status: "open"` and its terms. Anything invalid is cleaned or turned into `pending`.

## What the engine now does

`evaluateCollab(creator, policy, property, {checkIn, nights})` answers one question: what should happen with this creator at this property?

- `closed`, `waiting_on_owner`, `full_this_month`: no introduction.
- `dates_not_offered`: the dates break the terms (a weekend night, peak season, a blocked date); the reply lists the next real windows instead of a flat no.
- `hold`: the creator needs money upfront and will not do barter. This property pays nothing before guests stay.
- otherwise the existing fit score decides (`invite_both`, `shortlist`, `ask_for_details`, `hold`), and the quote shows cash as contingent, never upfront.

`performanceBonus(policy, referredStays)` works out the cash: a share of each completed stay booked through the creator, capped at the owner's maximum, paid by the property after the stay. RoamWise does not hold this money. To attribute stays to a creator, the booking code on the enquiry should carry the creator's reference; that link is not built yet.

## "AI adjustable"

- The numbers (nights, monthly cap, cash cap, share %) are editable config, not code.
- `suggestAdjustments(policy, stats)` proposes changes from simple stats (applications, creator stays, guests actually booked, empty off-season nights), with a reason each. Example: three creator stays and no booked guests, so offer one night less.
- `buildAiPrompt` + `parseAiSuggestions` let a language model propose changes. Its reply is treated as untrusted: only four whitelisted settings can change, values are clamped, at most three items, and it can never suggest upfront cash, weekend nights or opening a closed property.
- Every suggestion says `needsOwner: true`. `applyAdjustment` changes anything only when the owner switched `autoAdjust` on, and then never beyond the ceilings the owner set (cash, nights, creators a month). Default is off.

## Finding creators (honest version)

I could not produce a verified list of available, low-ask creators. Search results gave little and no one's availability can be known until they reply. One example of the problem: the best-known Uttarakhand adventure creator I found has about 1.2 million Instagram followers ([Favikon profile](https://app.favikon.com/public/profile/the-pahadi-venturer-64f0f3fa3e946a843160d40b/)), which is exactly the celebrity tier to avoid for this offer. Another, [@uttarakhandtraveller](https://www.thehandbook.com/brand/uttarakhand-traveller/), is a lead to check, with no follower data and no availability known.

So the engine does the part it can do honestly:

1. `searchPlan('Almora')` gives where to look (hashtags, location tags, YouTube searches) and the filters: 3k to 100k followers, posted in the last 30 days, real comments, based in or often in Uttarakhand/Himachal, no agency, Hindi and English.
2. Note each candidate's public numbers (handle, followers, engagement, posts in the last 30 days, location, niches) and run `rankCandidates`. Celebrity-tier accounts, anyone asking for money upfront, anyone who declines barter and growth anomalies are skipped; nano and micro locals who post often and engage rank first.
3. `inviteMessage(policy, name)` writes the first message with the real terms, no upfront fee on either side, no follower minimum, and an easy way to say no.
4. A creator is "available" only after they reply with dates.

Applicants who already joined through `creators/match.html` are the best first pool: they came to you.

## Not built yet

- Putting `evaluateCollab` inside the live introduction worker (`creators/protection/worker.mjs`): that stores profiles in its own database, so it needs a schema change and a payments-side review.
- Creator reference on booking codes, to credit referred stays automatically.
- An admin screen for editing policies; today it is a Firestore document.
