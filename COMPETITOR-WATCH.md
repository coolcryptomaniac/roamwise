# Competitor watch — how to do this honestly

## Why there is no scraping agent

You asked for an agent that routinely fetches what users like and dislike about
Mindtrip, Layla, Wanderlog and Google's travel tools. I checked whether that is
buildable and it is not, for three concrete reasons:

1. **There is no public review API.** Google Play and the App Store both
   prohibit automated review extraction, and both actively block it. Third-party
   "review APIs" resell scraped data and inherit the same violation.
2. **No usable feeds.** Wanderlog publishes no RSS. Mindtrip's `/feed` redirects
   to a sign-in page. There is nothing legitimate to subscribe to.
3. **They are JS-rendered apps.** Even setting the terms aside, a scraper would
   get an empty shell, not content.

A scraper here would also produce noise rather than insight. App-store reviews
are dominated by billing complaints and five-star spam. The signal about *why*
a travel planner disappoints is not there.

## What actually works

**Use the products.** Thirty minutes each, quarterly, planning a trip you know
well. You will learn more than any scraper because you can tell when an answer
is confidently wrong — which is the whole competitive gap.

**Structured log.** After each session, record in Admin → CRM (segment: research):

| Field | Example |
|---|---|
| Product | Mindtrip |
| Date | 2026-07-24 |
| Prompt used | "5 days Rishikesh under ₹15,000" |
| What it did well | Clean UI, fast, good map integration |
| Where it failed | No cost figures, invented a closed cafe, needs signal |
| Feature worth stealing | Their day-drag reordering is better than ours |
| Feature to avoid | Forced signup before first result |

**Watch what they publish.** Their own changelogs, LinkedIn posts and funding
announcements are public and intended to be read. That is legitimate research.

**Read r/travel and r/india threads** about trip planning tools. Reddit's API is
public and documented, unlike app-store reviews. Search rather than scrape.

## Standing assessment (July 2026)

Re-verify each quarter — these products ship fast.

| Product | Strength | Gap RoamWise fills |
|---|---|---|
| **Mindtrip** | Polished multimodal UI, strong maps | No local price data; no offline; Western-weighted inventory |
| **Layla** | Conversational, good discovery flow | Hallucinates specifics; thin on logistics and cost |
| **Wanderlog** | Best-in-class itinerary logistics, collaborative | Not AI-first; no cost-fairness or scam layer |
| **Google Travel/Gemini** | Enormous data, free | Generic output; steers to own booking; no offline; no local-price honesty |
| **TripIt** | Excellent booking parsing | Organiser, not a planner |

**The consistent gap across all of them:** none tells you what a thing *should*
cost locally, none warns about the specific overcharging mechanics of a place,
and none works properly with the phone offline. That is not an accident — a
global planner has no reason to invest in field data for one country. It is
exactly why going narrow first is defensible.

## What NOT to copy

- **Forced signup before first value.** Every one of them does it. Do not.
- **Subscription-only pricing.** Indian travellers overwhelmingly prefer paying
  once; this is a genuine positioning advantage, not a concession.
- **Confident invention.** Their worst failure mode is answering when they
  should decline. RoamWise's grounding is the differentiator — protect it.
