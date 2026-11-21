# RoamWise mobile commerce, navigation and feature inventory

**Audit date:** 22 November 2026. **Repository:** `coolcryptomaniac/roamwise`; recovery branch `fix/mobile-commerce-ailon-recovery-20261122`.

## What was inspected

- 2,597 tracked repository paths from the `main` tree (directory + file entries); **11** representative entry pages inspected for static `href` links, including Home, More, partnerships, packages/checkout, shop, artists, wallet and host onboarding.
- **186** page/link occurrences; **0** unresolved static targets found in these entry pages. A static route existing in Git does **not** establish that its live JavaScript, assets, permissions, APIs, checkout or Android deep-link work.
- Source-only audit. **Not** a deployed Android/Chrome browser test, complete DOM runtime trace, full network crawl, API uptime check or Cashfree transaction test.

## Confirmed founder-reported regressions and patch

| Observation | Evidenced cause | Recovery branch action |
|---|---|---|
| Commercial swipe rails missing on Home | `design/ailon-first.css` explicitly hid `#rwSalesCarousels`; another inline style hid `#rwSalesShop` | Remove both hides; keep existing card links and checkout unchanged |
| Natasha ambassador not on Home | `index.html` hid `#brand-ambassador` in Home and marked its section Explore-only | Unhide Home and add Home class; use existing licensed artist images, no fabricated endorsement |
| Wallet absent | `design/ailon-first.css` hid `#rwWalletChip`; quick navigation lacked a Wallet item | Restore signed-in header visibility and add Wallet shortcut for guests |
| Ailon occupies too much mobile height | `app.css` and `mobile-stability.css` layered forced heights | Reduce composer while retaining at least 42px tap targets |
| Ailon shows too many irrelevant tools | `rwTuskRail` always emitted navigation, budgets, speech and reminder buttons | Show context-relevant primary actions; preserve other controls in expandable More tools |
| Generic shortcut gets blocked as private query | `js/ui/ailon-first.js` submitted long instructions asking for traveller/booking data | Prefill a short request and wait for user input rather than auto-spend searches |
| Home rendered but Trips tab highlighted | `renderTabbar` restored stored last tab, unrelated to current `body.dataset.view` | Highlight the visible tab on initial render |
| `/partners/` shows generic retired notice | No `partners/index.html` existed, and `404.html` is the fallback | Add redirect to existing `/partnership/` |

## Keep-list — directly sellable and conversion-critical

Do not remove, archive, disable, or replace these features without founder approval:

| Group | Canonical route or module | Retain |
|---|---|---|
| Hotels and rooms | `/partner/stays/`, `/packages/`, home `rwSalesStays` | Swipeable property/room cards, availability requests, verified pricing |
| Travel packages and honeymoons | `/packages/`, `rwSalesPackages` | 12+ package cards and direct checkout paths |
| Manali wedding packages | `rwSalesWeddings`, `/packages/amor-checkout.html` | Three Padma Villa wedding offers and booking inquiry |
| Shop/Qikink catalogue | `/shop/`, `rwSalesShop`, `shop/catalog.js` | Hoodies, scarves, headbands, daily SKU inventory |
| Original paintings and artists | `/creators/gallery.html`, `/creators/natasha.html`, `#brand-ambassador` | Artist sales, verified images, Natasha ambassador promotion |
| Wallet/credits | `/wallet/`, `/credit/` | Wallet balance, credit purchases and transaction integrity |
| Pro and subscription | `/pricing.html`, existing Pro modal | Subscription discovery, verified entitlement |
| Trek departures | `/treks/`, home `rwSalesTreks` | Approved operator cards and direct inquiries |
| Events and experiences | Home event rails and `/events/` (if deployed) | Ticket/experience exploration and itinerary handoff |
| Corporate offsites/retreats | `/business/`, `/partner/` as applicable | Sales leads and approval-gated bookings |
| Partner acquisition | `/partnership/`, `/partner/join/`, `/creators/` | Seller and creator onboarding |
| Direct checkout security | `/packages/amor-checkout.html`, `/shop/` + Worker | Payment status verified server-side; no fabricated confirmations |

## Feature inventory — founder review before removal

| Feature family | Examples | Recommendation |
|---|---|---|
| Consumer core | Ailon Tusk, Plan, Stays, Trips, Map, Wallet, More | Keep top-level, reduce duplicative shortcuts |
| Commercial rails | Travel, hotels, weddings, shop, original art, trekking, events | Keep horizontal animated/swipe rails on Home |
| Journey utilities | Saved itineraries, booking requests, trip desk, trip vault, PDF, share, budget | Keep directly accessible in Trips/Ailon |
| AI and voice | Model selector, hosted fallback, Hindi/Hinglish, voice mode, context, response cards | Simplify surface; diagnostics and BYOK settings under More |
| Partner network | Property owners, creators, artists, wellness, nomad, transport, cafes, colleges | Keep active listings; place administrative functions under Partner/More |
| Travel discovery | EV routes, local map, guides, circuits, trek vault, daily scroll | Keep useful discovery but avoid duplicating main sale actions |
| Creative collections | Albums, books, memories, Raveverse, Journey Card | Preserve routes; move nontransactional content into More/discover |
| Games and experimental | Realms, XP, badges, Beacon, TrailMesh, sound-of-place | Retain code until approved; label experimental features accurately |
| Back office | Certificates, promo manager, partner verification, accounting, analytics | Keep authenticated and separate from consumer Home |
| Legal | Privacy, terms, refund policy, safety notices | Keep accessible from More/footer |

## Static link inventory (186 occurrences)

Status = `✓` means a file/folder exists in the repository tree; `Review` means no matching static target. **Neither means the route was clicked or its backend verified.**

### /about.html/ — 2 links

| Source | Destination | Static match |
|---|---|---|
| `index.html` | `/about.html#founder` | ✓ |
| `more/index.html` | `/about.html` | ✓ |

### /app-base.css/ — 1 links

| Source | Destination | Static match |
|---|---|---|
| `index.html` | `/app-base.css` | ✓ |

### /app.css/ — 1 links

| Source | Destination | Static match |
|---|---|---|
| `index.html` | `/app.css?v=rw-v124-personal-group-planner` | ✓ |

### /assets/ — 1 links

| Source | Destination | Static match |
|---|---|---|
| `index.html` | `/assets/fonts/outfit-latin-wght.woff2` | ✓ |

### /bhakti/ — 1 links

| Source | Destination | Static match |
|---|---|---|
| `index.html` | `/bhakti/` | ✓ |

### /books/ — 3 links

| Source | Destination | Static match |
|---|---|---|
| `index.html` | `/books/books.css?v=1` | ✓ |
| `index.html` | `/books/` | ✓ |
| `more/index.html` | `/books/` | ✓ |

### /business/ — 1 links

| Source | Destination | Static match |
|---|---|---|
| `index.html` | `/business/` | ✓ |

### /contact.html/ — 1 links

| Source | Destination | Static match |
|---|---|---|
| `more/index.html` | `/contact.html` | ✓ |

### /creators/ — 25 links

| Source | Destination | Static match |
|---|---|---|
| `index.html` | `/creators/match.html?role=creator&invite=founding&src=home-top` | ✓ |
| `index.html` | `/creators/gallery.html?src=home-top` | ✓ |
| `index.html` | `/creators/join-artist.html?src=home-top` | ✓ |
| `index.html` | `/creators/match.html?role=creator&invite=founding` | ✓ |
| `index.html` | `/creators/match.html?role=property` | ✓ |
| `index.html` | `/creators/artists.html` | ✓ |
| `index.html` | `/creators/jagriti.html` | ✓ |
| `index.html` | `/creators/sacred-art.html` | ✓ |
| `index.html` | `/creators/gallery.html` | ✓ |
| `index.html` | `/creators/join-artist.html` | ✓ |
| `more/index.html` | `/creators/match.html?role=creator` | ✓ |
| `more/index.html` | `/creators/match.html?role=property` | ✓ |
| `partnership/index.html` | `/creators/index.html` | ✓ |
| `shop/index.html` | `/creators/gallery.html` | ✓ |
| `creators/gallery.html` | `/creators/artists.css` | ✓ |
| `creators/gallery.html` | `/creators/sacred-art.css` | ✓ |
| `creators/gallery.html` | `/creators/artists-hub.css` | ✓ |
| `creators/gallery.html` | `/creators/gallery.html` | ✓ |
| `creators/gallery.html` | `/creators/sacred-art.html` | ✓ |
| `creators/gallery.html` | `/creators/join-artist.html` | ✓ |
| `creators/gallery.html` | `/creators/compare-artists.html` | ✓ |
| `creators/gallery.html` | `/creators/artist-terms.html` | ✓ |
| `creators/natasha.html` | `/creators/gallery.html` | ✓ |
| `creators/natasha.html` | `/creators/artists.html` | ✓ |
| `partner/index.html` | `/creators/match.html?role=property` | ✓ |

### /credit/ — 2 links

| Source | Destination | Static match |
|---|---|---|
| `index.html` | `/credit/` | ✓ |
| `wallet/index.html` | `/credit/` | ✓ |

### /css/ — 8 links

| Source | Destination | Static match |
|---|---|---|
| `index.html` | `/css/base/01-tokens.css` | ✓ |
| `index.html` | `/css/base/02-shell.css` | ✓ |
| `index.html` | `/css/base/03-features-legacy.css?v=rw-checkout-focus-1` | ✓ |
| `index.html` | `/css/base/04-accounts-and-extras.css?v=rw-auth-nonblocking-2` | ✓ |
| `index.html` | `/css/base/05-desktop-and-discovery.css` | ✓ |
| `index.html` | `/css/base/06-commerce-and-social.css` | ✓ |
| `index.html` | `/css/base/07-tusk-readability.css` | ✓ |
| `index.html` | `/css/base/08-tusk-motion.css` | ✓ |

### /design/ — 5 links

| Source | Destination | Static match |
|---|---|---|
| `index.html` | `/design/trip-desk.css?v=1` | ✓ |
| `index.html` | `/design/roamwise-akatsuki-theme.css?v=rw-v125-akatsuki-tusk` | ✓ |
| `index.html` | `/design/home-polish.css?v=rw-v1` | ✓ |
| `index.html` | `/design/ailon-first.css?v=20261121` | ✓ |
| `index.html` | `/design/ailon-room-carousel.css?v=20261122` | ✓ |

### /ecosystem.html/ — 2 links

| Source | Destination | Static match |
|---|---|---|
| `index.html` | `/ecosystem.html#nvidia-inception` | ✓ |
| `more/index.html` | `/ecosystem.html#nvidia-inception` | ✓ |

### /favicon.ico/ — 4 links

| Source | Destination | Static match |
|---|---|---|
| `index.html` | `/favicon.ico?v=20261018` | ✓ |
| `more/index.html` | `/favicon.ico` | ✓ |
| `shop/index.html` | `/favicon.ico` | ✓ |
| `wallet/index.html` | `/favicon.ico` | ✓ |

### /help/ — 1 links

| Source | Destination | Static match |
|---|---|---|
| `more/index.html` | `/help/` | ✓ |

### /home/ — 19 links

| Source | Destination | Static match |
|---|---|---|
| `index.html` | `/` | ✓ |
| `more/index.html` | `/` | ✓ |
| `more/index.html` | `/?rw_open=bookings` | ✓ |
| `more/index.html` | `/?rw_open=stays` | ✓ |
| `more/index.html` | `/?rw_open=itineraries` | ✓ |
| `more/index.html` | `/?rw_open=transport` | ✓ |
| `more/index.html` | `/?rw_open=experiences` | ✓ |
| `more/index.html` | `/?rw_open=saved` | ✓ |
| `more/index.html` | `/?rw_open=events` | ✓ |
| `more/index.html` | `/?rw_open=mesh` | ✓ |
| `more/index.html` | `/?rw_open=groups` | ✓ |
| `more/index.html` | `/?rw_open=journey` | ✓ |
| `more/index.html` | `/?rw_open=settings` | ✓ |
| `partnership/index.html` | `/` | ✓ |
| `packages/amor-checkout.html` | `/` | ✓ |
| `shop/index.html` | `/` | ✓ |
| `creators/gallery.html` | `/` | ✓ |
| `creators/natasha.html` | `/` | ✓ |
| `wallet/index.html` | `/` | ✓ |

### /home.html/ — 1 links

| Source | Destination | Static match |
|---|---|---|
| `index.html` | `/home.html` | ✓ |

### /icons/ — 6 links

| Source | Destination | Static match |
|---|---|---|
| `index.html` | `/icons/favicon-32.png?v=20261018` | ✓ |
| `index.html` | `/icons/icon-192.png?v=20261018` | ✓ |
| `index.html` | `/icons/apple-touch-icon.png?v=20261018` | ✓ |
| `partnership/index.html` | `/icons/favicon-32.png` | ✓ |
| `creators/gallery.html` | `/icons/favicon-32.png?v=20261018` | ✓ |
| `creators/natasha.html` | `/icons/favicon-32.png?v=20261018` | ✓ |

### /kainchi/ — 1 links

| Source | Destination | Static match |
|---|---|---|
| `index.html` | `/kainchi/` | ✓ |

### /legal/ — 1 links

| Source | Destination | Static match |
|---|---|---|
| `index.html` | `/legal/contest-rules.html` | ✓ |

### /lite/ — 1 links

| Source | Destination | Static match |
|---|---|---|
| `index.html` | `/lite/` | ✓ |

### /local-business/ — 3 links

| Source | Destination | Static match |
|---|---|---|
| `index.html` | `/local-business/?src=home-top` | ✓ |
| `index.html` | `/local-business/` | ✓ |
| `more/index.html` | `/local-business/` | ✓ |

### /manifest.webmanifest/ — 1 links

| Source | Destination | Static match |
|---|---|---|
| `index.html` | `/manifest.webmanifest` | ✓ |

### /map/ — 2 links

| Source | Destination | Static match |
|---|---|---|
| `index.html` | `/map/` | ✓ |
| `more/index.html` | `/map/` | ✓ |

### /memories/ — 3 links

| Source | Destination | Static match |
|---|---|---|
| `index.html` | `/memories/memories.css?v=1` | ✓ |
| `index.html` | `/memories/` | ✓ |
| `more/index.html` | `/memories/` | ✓ |

### /mobile-stability.css/ — 1 links

| Source | Destination | Static match |
|---|---|---|
| `index.html` | `/mobile-stability.css?v=rw-v125-compact-tusk` | ✓ |

### /more/ — 1 links

| Source | Destination | Static match |
|---|---|---|
| `index.html` | `/more/index.html` | ✓ |

### /music/ — 4 links

| Source | Destination | Static match |
|---|---|---|
| `index.html` | `/music/home.css?v=1` | ✓ |
| `index.html` | `/music/` | ✓ |
| `index.html` | `/music/#shuffle` | ✓ |
| `more/index.html` | `/music/` | ✓ |

### /network/ — 2 links

| Source | Destination | Static match |
|---|---|---|
| `index.html` | `/network/match/` | ✓ |
| `more/index.html` | `/network/match/` | ✓ |

### /nmims/ — 1 links

| Source | Destination | Static match |
|---|---|---|
| `partnership/index.html` | `/nmims/index.html` | ✓ |

### /nomads/ — 3 links

| Source | Destination | Static match |
|---|---|---|
| `index.html` | `/nomads/` | ✓ |
| `index.html` | `/nomads/join/` | ✓ |
| `more/index.html` | `/nomads/` | ✓ |

### /packages/ — 27 links

| Source | Destination | Static match |
|---|---|---|
| `index.html` | `/packages/?destination=almora` | ✓ |
| `index.html` | `/packages/?destination=lansdowne` | ✓ |
| `index.html` | `/packages/amor-checkout.html?stay=nanau` | ✓ |
| `index.html` | `/packages/amor-checkout.html?stay=padma` | ✓ |
| `index.html` | `/packages/amor-checkout.html?stay=aramness` | ✓ |
| `index.html` | `/packages/amor-checkout.html?stay=tattwaa` | ✓ |
| `index.html` | `/packages/amor-checkout.html?package=manali-snow-honeymoon` | ✓ |
| `index.html` | `/packages/amor-checkout.html?package=corbett-plunge-honeymoon` | ✓ |
| `index.html` | `/packages/amor-checkout.html?package=jungle-to-snow` | ✓ |
| `index.html` | `/packages/amor-checkout.html?package=manali-glass-suite` | ✓ |
| `index.html` | `/packages/amor-checkout.html?package=gir-lion-honeymoon` | ✓ |
| `index.html` | `/packages/amor-checkout.html?package=corbett-forest-duo` | ✓ |
| `index.html` | `/packages/amor-checkout.html?package=corbett-family-suite` | ✓ |
| `index.html` | `/packages/amor-checkout.html?package=amor-grand-hop` | ✓ |
| `index.html` | `/packages/amor-checkout.html?package=family-forest-snow` | ✓ |
| `index.html` | `/packages/amor-checkout.html?package=padma-villa-takeover` | ✓ |
| `index.html` | `/packages/amor-checkout.html?package=gir-family-safari` | ✓ |
| `index.html` | `/packages/amor-checkout.html?package=manali-white-christmas` | ✓ |
| `index.html` | `/packages/amor-checkout.html?package=manali-mountain-pheras` | ✓ |
| `index.html` | `/packages/amor-checkout.html?package=manali-intimate-wedding` | ✓ |
| `index.html` | `/packages/amor-checkout.html?package=manali-signature-wedding` | ✓ |
| `more/index.html` | `/packages/` | ✓ |
| `packages/index.html` | `/icons/favicon-32.png` | ✓ |
| `packages/index.html` | `/packages/packages.css` | ✓ |
| `packages/index.html` | `/` | ✓ |
| `wallet/index.html` | `/packages/amor-checkout.html` | ✓ |
| `wallet/index.html` | `/packages/amor-checkout.html?wallet=` | ✓ |

### /partner/ — 16 links

| Source | Destination | Static match |
|---|---|---|
| `index.html` | `/partner/join/?src=home-top` | ✓ |
| `index.html` | `/partner/join/?src=home-top&retreats=1` | ✓ |
| `index.html` | `/partner/?role=customer` | ✓ |
| `index.html` | `/partner/join/` | ✓ |
| `index.html` | `/partner/` | ✓ |
| `more/index.html` | `/partner/join/` | ✓ |
| `more/index.html` | `/partner/` | ✓ |
| `partnership/index.html` | `/partner/index.html` | ✓ |
| `partner/index.html` | `/partner/partner.css` | ✓ |
| `partner/index.html` | `/` | ✓ |
| `partner/index.html` | `/partner/join/` | ✓ |
| `partner/join/index.html` | `/` | ✓ |
| `partner/join/index.html` | `/partner/mou/` | ✓ |
| `partner/join/index.html` | `/privacy.html` | ✓ |
| `partner/join/index.html` | `/partner/` | ✓ |
| `partner/join/index.html` | `/terms.html` | ✓ |

### /pilgrimage/ — 2 links

| Source | Destination | Static match |
|---|---|---|
| `index.html` | `/pilgrimage/` | ✓ |
| `more/index.html` | `/pilgrimage/` | ✓ |

### /pricing.html/ — 1 links

| Source | Destination | Static match |
|---|---|---|
| `index.html` | `/pricing.html` | ✓ |

### /privacy.html/ — 5 links

| Source | Destination | Static match |
|---|---|---|
| `index.html` | `/privacy.html` | ✓ |
| `more/index.html` | `/privacy.html` | ✓ |
| `shop/index.html` | `/privacy.html` | ✓ |
| `creators/gallery.html` | `/privacy.html` | ✓ |
| `creators/natasha.html` | `/privacy.html` | ✓ |

### /quiet/ — 2 links

| Source | Destination | Static match |
|---|---|---|
| `index.html` | `/quiet/` | ✓ |
| `more/index.html` | `/quiet/` | ✓ |

### /refund-policy.html/ — 2 links

| Source | Destination | Static match |
|---|---|---|
| `index.html` | `/refund-policy.html` | ✓ |
| `more/index.html` | `/refund-policy.html` | ✓ |

### /shop/ — 9 links

| Source | Destination | Static match |
|---|---|---|
| `index.html` | `/shop/#aipan-scarf` | ✓ |
| `index.html` | `/shop/?buy=almora-after-dark-hoodie#buy` | ✓ |
| `index.html` | `/shop/?buy=roamwise-mandala-headband#buy` | ✓ |
| `index.html` | `/shop/` | ✓ |
| `more/index.html` | `/shop/` | ✓ |
| `shop/index.html` | `/shop/shop.css` | ✓ |
| `shop/index.html` | `/shop/merch-studio.css` | ✓ |
| `wallet/index.html` | `/shop/#collection` | ✓ |
| `wallet/index.html` | `/shop/?wallet=` | ✓ |

### /stays/ — 3 links

| Source | Destination | Static match |
|---|---|---|
| `index.html` | `/stays/almora/` | ✓ |
| `index.html` | `/stays/tirthan-valley/` | ✓ |
| `index.html` | `/stays/lansdowne/` | ✓ |

### /team/ — 2 links

| Source | Destination | Static match |
|---|---|---|
| `index.html` | `/team/` | ✓ |
| `more/index.html` | `/team/` | ✓ |

### /terms.html/ — 2 links

| Source | Destination | Static match |
|---|---|---|
| `index.html` | `/terms.html` | ✓ |
| `more/index.html` | `/terms.html` | ✓ |

### /tools/ — 1 links

| Source | Destination | Static match |
|---|---|---|
| `more/index.html` | `/tools/` | ✓ |

### /wallet/ — 2 links

| Source | Destination | Static match |
|---|---|---|
| `index.html` | `/wallet/` | ✓ |
| `more/index.html` | `/wallet/` | ✓ |

### /workation/ — 1 links

| Source | Destination | Static match |
|---|---|---|
| `index.html` | `/workation/almora/` | ✓ |

### /yoga/ — 3 links

| Source | Destination | Static match |
|---|---|---|
| `index.html` | `/yoga/?src=home-top` | ✓ |
| `partnership/index.html` | `/yoga/index.html` | ✓ |
| `partner/index.html` | `/yoga/match.html?role=property` | ✓ |

## Release gates / open risks

1. Execute `npm test`, `npm run typecheck`, `npm run check`; collect Chrome Android WebView and Cloudflare production videos at 360, 390, 412 and desktop widths.
2. Tap each carousel to its destination, verify query parameters and product identity. Confirm prices are latest supplier-approved net+markup and total taxes; do not infer inventory availability.
3. Confirm Cashfree checkout order creation, SDK response, webhook idempotency, refund eligibility and wallet ledger via staging/test credentials; never simulate successful payment to users.
4. Verify Ailon in Hindi, English and voice for itineraries, bookings, refund policy, private data, source citations and provider outage; no unverified live facts or unrelated search cards.
5. Verify direct link `/partners/` in Chrome (not generic 404) and `/wallet/` in both web and Android builds. Compare old/new home before deployment; clear old service-worker caches only when justified.
6. Check visual assets, permission to use Natasha Guleria photo/paintings, and Play Console marketing rights. Play Store feature graphics and screenshots must accurately depict released functions.
7. Paid ₹10–₹50 itinerary variants require an explicit SKU/product, tax treatment, entitlement and server-side verified Cashfree flow before turning on a payable CTA.
8. **No permanent deletion proposed.** Founder can select exact entries from this inventory for archive/removal.
