# Revenue integrations — what to sign up for

Every row here is a real programme you can join as a solo developer in India.
Rates are the published/typical bands as of **July 2026** — always confirm on
signup, they move.

Nothing here requires scraping, and nothing requires you to hold anyone's card
details.

---

## 1. Travel affiliates — highest value, lowest effort

| Programme | What it pays | Notes |
|---|---|---|
| **Travelpayouts** | 1.1–3% flights, 4–7% hotels | Single signup covers Aviasales, Hotellook, Kiwi, GetYourGuide and more. Easiest starting point — one dashboard, one payout. |
| **Booking.com Affiliate Partner** | 25–40% of Booking's commission (≈4–6% of stay) | Applies through their partner portal. Deep-link ready. |
| **Agoda Partners** | 4–7% of booking | Strong across Asia; often converts better than Booking for Indian users. |
| **EaseMyTrip Affiliate** | ₹100–300 per flight, 3–5% hotels | India-specific, pays in INR, no forex friction. |
| **MakeMyTrip Affiliate** (via Cuelinks/Admitad) | 1.5–3% | Not open directly to small publishers — go through an aggregator. |
| **GetYourGuide Partner** | 8% of tour value | Highest-margin travel category. Pairs perfectly with the "What's actually there" cards. |
| **Klook Affiliate** | 2–5% | Good SE Asia + Japan coverage. |
| **12Go Asia** | 5–8% | SE Asia buses/ferries/trains — where nobody else has inventory. |

**Start with Travelpayouts + GetYourGuide.** Two signups cover flights, hotels
and activities, and both approve small publishers.

---

## 2. Indian aggregators — one signup, many merchants

| Programme | Covers | Typical |
|---|---|---|
| **Cuelinks** | MakeMyTrip, Amazon, Flipkart, Myntra, Ajio, 1000+ | 2–8%, auto-converts links |
| **EarnKaro** | Similar catalogue, INR payouts | 2–8% |
| **Admitad** | Global + Indian merchants | varies |
| **Amazon Associates India** | Everything Amazon | 0.2–9% by category (apparel ~5%) |
| **Flipkart Affiliate** | Flipkart catalogue | 2–6% |

These plug straight into the **action hub** already built (`RW_ACTIONS`) — swap
the plain URLs for your affiliate versions and every "buy beach shorts" tap
starts earning.

---

## 3. Print-on-demand — your own margin, not a commission

**These are the ones that actually enable the custom-tee feature.**

| Partner | API | Base cost (printed tee, India) | Ship |
|---|---|---|---|
| **Qikink** | REST API, dropship, no minimums | ~₹230–290 | 4–7 days |
| **Printrove** | REST API, dropship | ~₹250–310 | 4–7 days |
| **Printful / Printify** | Mature APIs | ₹700+ landed | 10–20 days |

**Recommended: Qikink.** Lowest landed cost in India, no minimum order,
white-label packing slips, and a documented API for automated order push.

**Your margin at ₹499 retail:**

```
Retail            ₹499
Print + ship      ₹315   (conservative — Qikink mid-range tee)
Payment gateway   ₹ 12   (~2.4%)
─────────────────────────
Your margin       ₹172    (34%)
```

That lands inside the ₹100–200 you asked for. If you push retail to ₹599 for a
premium tee, margin goes to ~₹270 without changing anything upstream.

**Do not promise same-day.** No POD prints in under 24 hours. The app already
says 4–7 days and routes urgent needs to stock inventory instead.

---

## 4. Free APIs already wired in (keep them)

| Service | Used for | Cost |
|---|---|---|
| **Pollinations** | AI artwork for tees, keyless | free |
| **Wikivoyage** | Guide text (CC BY-SA) | free |
| **OpenStreetMap / Overpass** | Mapped attractions | free |
| **Open-Meteo** | Weather + geocoding | free |
| **Frankfurter** | FX rates | free |
| **Wikipedia REST** | Destination photos | free |

---

## 5. Payments

| Option | Rate | Notes |
|---|---|---|
| **UPI (current)** | 0% | What you use now. Zero fees, manual verification. |
| **Razorpay** | ~2% + GST | Auto-verification, subscriptions, refunds. Worth it once merch volume starts. |
| **Cashfree** | ~1.75% | Slightly cheaper, good payout speed. |

Once t-shirts start selling, manual UPI verification will become the bottleneck
long before the fees do.

---

## Priority order

1. **Qikink** — unlocks merch revenue, which is margin not commission
2. **Travelpayouts** — one signup, covers flights + hotels
3. **Cuelinks or EarnKaro** — turns the existing action hub into income
4. **GetYourGuide** — highest commission rate of any travel category
5. **Razorpay** — when manual verification starts costing you hours

Steps 1–3 could realistically be done in an afternoon.
