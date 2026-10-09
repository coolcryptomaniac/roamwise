# Kainchi daily hub — 9 October 2026

The user requested a visual refresh and day-by-day web/news/official-source intelligence on
9 October 2026. This extends the original offline-only Phase 0 scope: the browser may now GET
one **same-origin public JSON** snapshot. Pass/report inputs are not sent with it. The earlier
CHATGPT-BRIEF describes Phase 0; this document describes the new implementation. No auth,
payment, Firestore or Worker changes are included.

## What ships in the feature PR

- New locally hosted AI exterior illustration, explicitly labelled as illustrative rather than a
  current/exact photo; forest/amber layout, mobile tabs with arrow/Home/End keys and hash history.
- Seven-day calendar preview, selected-date/pass sync, English/Hindi and visitor-initiated
  WhatsApp plan sharing. Calendar ratings do not absorb headline claims or measured traffic.
- Today tab: dated news/official/history filters, original source links, independent source-health
  statuses, last attempted check, last successful checks, a factual count digest and refresh.
- Same-origin `data/daily.json`, rechecked every 15 minutes while visible, on returning to the tab,
  and on button press. `data/daily.js` provides a bundled snapshot if offline. Ten-second timeout,
  200 KB response bound, failure message and last-good-data retention.
- Independent Python collector, source registry, 30-day rolling check counts, bounded reads,
  12-second request timeout, duplicate filtering, link validation and source-specific failures.
- Emergency calls appear immediately when ambulance obstruction is selected, before report
  submission. No claim that a support email files a government complaint.
- Bhakti tab with a short, source-linked Hanuman Chalisa excerpt, plain-language meaning,
  pauseable mist/diya motion, official Trust links, and a local-only digital diya. The diya is
  a visual reflection aid only: it has no audio, donation, booking or account flow.
- Important-date cards for the Trust's annual 15 June Pratishtha Divas and 28 December Siddhi
  Maa punya tithi, plus dated 2026 Dussehra and Diwali entries where the holiday source gives an
  exact Gregorian date. Each card links to its source and can be added to the local visit plan.
- Trust guidance is deliberately scam-safe: the page links visitors to the official Trust for
  hours, aarti timing and notices, and does not invent online donation, room-booking or
  registration functionality.

## Sources and collection rules

Registry: `tools/sources.json`. Sources verified as entry points on 9 October:

- https://nainital.nic.in/ — district/DM site; official notices followed only on the same host.
- https://nainital.nic.in/divisions/police/ — official district police directory.
- https://uttarakhandpolice.uk.gov.in/ — public police website; may be unavailable.
- https://x.com/nainitalpolice_ — official profile, **link-only**, no unauthenticated social-feed API claim.
- https://cmhelpline.uk.gov.in/ — grievance portal linked by the district site.
- Google News RSS searches for Kainchi Dham in English/Hindi — headline discovery, not official orders.

RSS requires a title, HTTPS URL, a parseable publication timestamp with timezone, relevance to
the route, and a publication age of at most 30 days. Future records and XML entities are rejected.
Official HTML collection follows at most three same-host notice/press-release/news/announcement
pages linked from the source, and requires an actual published timestamp. Undated pages remain
references rather than being given today's date. HTML extraction can miss notices published only
in PDFs or social images: the source-health badge means the page was read, not complete coverage.

On collector failure, keep that source's last-good headlines without rewriting their dates. On a
successful empty source response, remove its old items from the current list. Dates over 48 hours
old are historical in the UI. Even a new headline is only a reading lead: users must open the
source and check the order's **effective dates**. No headline changes routes, permits, official
rates, slot limits or emergency advice. No HTML from a source is inserted in the page.

Seed historical context is paraphrased from:
- Amar Ujala, 2 Oct 2026, 01:50 IST: https://www.amarujala.com/amp/uttarakhand/nainital/route-diversion-for-kainchi-dham-devotees-to-reach-the-temple-via-shuttle-haldwani-news-c-8-1-hld1057-844061-2026-10-02
- Dainik Jagran, 3 Oct 2026, 13:39 IST: https://www.jagran.com/uttarakhand/nainital-kainchi-dham-traffic-chaos-pilgrims-stranded-in-garampani-40393031.html
These do not establish travel restrictions for 9 October or a later date.

Devotional and temple guidance is linked to the official Trust at
https://shreekainchimandirtrust.org/ (including its events and contact pages) and the Neem
Karoli Baba Ashram Hanuman Chalisa text at https://nkbashram.org/hanuman-chalisa. The page keeps
the prayer excerpt short, labels meaning as an interpretation, and leaves ritual authority with
the Trust rather than presenting generated text as scripture.

The first collector run on 9 October read the district site. Police and both RSS calls failed from
the development environment; their statuses are explicitly `error`, not connected/live. A GitHub
runner run and post-deployment inspection remain necessary to verify those connections there.

## Daily publication — separate deployment PR

The deployment PR adds a daily 00:17 UTC (05:47 IST) schedule to the existing static Pages workflow.
GitHub schedules can be delayed; this is not a realtime service. On each main deployment the job
restores the last successful public snapshot artifact if available, collects fresh sources, validates
the generated runtime and uploads the public data artifact for 90 days. The existing Pages
artifact includes the new data. No bot commit or branch-protection bypass is needed.

Only after both PRs are reviewed/merged, the scheduled workflow runs successfully and the served
snapshot is checked may this be called active website autopublishing. Source outages do not block
an otherwise healthy page deployment. Schema/tool failures should fail the build, retaining the
previous production site. The page reveals staleness after 30 hours and never says an empty feed
means clear roads.

## AI maintenance

The separate **Kainchi Daily Care** task is enabled for daily research/review around 08:00 IST,
starting 10 October. It checks sources, workflow freshness and small evidenced defects, then can
prepare tested branch/PR improvements. It is not model training, uncontrolled production code
rewriting, a police integration or a 24/7 monitoring service. It does not contact anyone.

## Run and verify

```
python features/kainchi-yatra/tools/daily-feed.py
python features/kainchi-yatra/tests/daily-feed.test.py
npm run kainchi:check
npm run kainchi:test
npm test
npm run check
npm run mod-status
```

Optional browser test: `node features/kainchi-yatra/tools/browser-smoke.cjs`. Set
`KAINCHI_PLAYWRIGHT_MODULE`, `KAINCHI_CHROMIUM_PATH` and `KAINCHI_QA_OUTPUT` if needed. It checks
360/390/1280 px, both languages, all tabs, day/pass sync, opt-in persistence, printing, reports,
emergency visibility, feed failure and reduced motion. Chromium is a QA dependency only.

Frontend JS/CSS/HTML gzip budget is 88 KiB for the bilingual hub, visitor guide, panditji player, immersive strip and a bounded
30-headline snapshot (current authored snapshot about 51 KB). Hero is WebP, approximately 504 KB,
with a separate 650 KB cap; no fonts, UI libraries, remote images or extra visitor analytics.

## Artwork provenance

`ui/art/kainchi-dawn.webp` was generated using the built-in image-generation tool on 9 October
2026, then encoded as WebP. Prompt: original editorial painted exterior inspired by Kainchi Dham,
red-roof temple structures, red bridge, mountain river, forested Kumaon hills and morning mist;
forest-teal shadows and saffron sunlight; landscape, no interiors, idols, people, text or logos.
It is not a factual map, current photograph, official trust artwork or an architectural record.

## Visitor-guide update — 9 October 2026

The founder explicitly requested the home-page Akatsuki palette, routes, parking, government
facilities and a photograph of Neem Karoli Baba, and authorised PR merge. `ui/visit.css` uses the
home-page night-ink / crimson / violet / gold palette. `ui/visit.js` opens map directions and
official links only on visitor action; there are no map embeds or geolocation requests.

Sources checked on 9 October 2026:
- Trust travel / FAQ: https://shreekainchimandirtrust.org/contact
- District travel: https://nainital.nic.in/tourist-place/kaichi-dham/
- Bus search: https://utconline.uk.gov.in/
- Government hospitals: https://nainital.nic.in/public-utility-category/hospitals/
- Disaster control: https://nainital.nic.in/disaster-management/ (1077 and 05942-231178)
- Temple history: https://shreekainchimandirtrust.org/about

The two official guides differ on road distance from Kathgodam (37/43 km) and Pantnagar
(71/79 km). The UI shows approximate ranges with both sources, not fixed journey times. The
Trust's water, shoe-stand, assistance and shuttle details describe past 15 June festivals; the
page keeps that qualification. No daily toilet/accessibility inventory, live parking space,
official parking tariff or permanent shuttle schedule was verified. Maps results are explicitly
discovery links, not evidence of government status or availability.

`ui/art/neem-karoli-baba.jpg` is the unaltered 453 × 640 historical photograph downloaded from
https://upload.wikimedia.org/wikipedia/commons/6/66/Neemkaroli_14.jpg (64,355 bytes).
Attribution: Prabhard / Wikimedia Commons. The source file page lists it as public domain by the
copyright holder: https://commons.wikimedia.org/wiki/File:Neemkaroli_14.jpg (revision 1238224165).
The caption links to that record. This user-requested historical photo is the exception to the
original Phase 0 artwork-only scope; no ashram interior photograph or generated Baba likeness is used.

## Bhakti media update — 9 October 2026

The Bhakti tab now has separate visitor-initiated controls for a flickering digital diya, animated
agarbatti smoke and a Pro-only visual aarti. These are explicitly labelled as personal digital
meditation visuals; they do not perform a puja, collect an offering or represent temple access.
The Pro gate accepts the host app's `RoamWiseMembership` / `RWMembership` entitlement seam or the
page's `data-membership="pro"` attribute; it fails closed for guests.

Three outbound YouTube links were added without embedding or autoplay: the official Trust channel,
a public Hindi Neem Karoli Baba story and a public Kainchi Dham darshan video. RoamWise does not
download or re-upload these videos; uploader rights remain with YouTube creators, and the links
are described as atmosphere/orientation rather than live access or official guidance. The Baba
area also has a bilingual expandable story timeline anchored to the Trust's history and Maharaj Ji
pages.

## Review handoff

## Digital panditji player — 9 October 2026

Both Pro digital aarti and private custom pooja now use the same scripted player. It includes
23 steps: welcome, intention (names and well-wishers for the custom session), invocation,
symbolic flowers, dhoop/agarbatti, lamp, chosen mantra, the 12 traditional Hanuman aarti couplets
and repeated opening refrain, symbolic prasad, peace prayer and closing good wishes. Gayatri
and Sarve Bhavantu Sukhinah choices now include their complete short texts rather than fragments.
This is a RoamWise-authored devotional sequence, not the Trust's official liturgy or every
possible mantra/puja. The whole configured script remains readable without voice.

Text source checked: https://www.drikpanchang.com/lyrics/aarti/lord-hanuman/shree-hanuman-aarti.html
(traditional public-domain hymn only; no modern translations, images, recordings or logos copied).
Optional speech uses the Web Speech API with only voices reporting `localService === true`
and a matching language. Sanskrit/Hindi text requests a local Hindi voice; English guidance
requests an English voice. No silent fallback to cloud/default voices. Unsupported/no-local-voice
devices show a text-mode message. Voice is off by default, has pause/resume/next/stop, and is
cancelled when switching sessions, language, leaving Bhakti, hiding the page or losing Pro.
Late completion callbacks are ignored. A hung utterance stops after 45 seconds with an error.
Names are not saved, logged or sent by RoamWise; OS voice-provider privacy is explicitly qualified.
Speech reference: https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisVoice/localService

`ui/art/digital-panditji.webp` is a 768 × 802 transparent WebP (167,862 bytes), encoded from
the built-in image generator's original fictional panditji artwork from this conversation.
Prompt: original respectful seated panditji in saffron/cream and maroon, namaste, gentle expression,
sandalwood tilak, soft golden halo, transparent background; not Neem Karoli Baba or a real priest,
no temple branding, text or watermark. It has gentle CSS breathing/glow, not video lip-sync or
physical priest gestures. CSS supplies flowers, smoke, five-flame brass thali and prasad bowl.
Reduced motion and the existing pause-motion toggle are honoured. No interior photograph is used.

The source budget moves from 64 to 80 KiB to explicitly accommodate this additive bilingual
player and hymn without libraries or remote runtime dependencies; image limit stays unchanged.
No auth/payment/entitlement, Firestore, Worker or deployment behaviour was changed.

Release verification: run `npm run kainchi:check`, `npm run kainchi:test`, `npm test`,
`npm run check`, `npm run mod-status`. Before merge, Claude Code should run the browser gate
at 360/390/1280 px, check both modes in English/Hindi and reduced motion, and test local Hindi
speech on Android Chrome and iOS Safari. Local WebView/voice availability is device-dependent.
This environment has no supported control-browser skill or local Chromium, so visual browser
QA and real-device pronunciation cannot be claimed here. Keep the PR pending that release gate.
Automated verification: 36 Kainchi tests, 647 repository tests, syntax/type/module checks and
architecture-drift check pass. Frontend source is about 71 KiB gzip under the new 80 KiB cap.

## Unofficial advisory layer — 9 October 2026

The page now includes a bilingual Visitor signals tab for device-local observations of parking,
shuttle and road conditions. A visitor can save a short note while nearby, but it is not uploaded,
shared, verified or presented as a live operational feed. A private resident journey note is also
stored on-device only; it is explicitly not a pass, exemption, identity document or police permission.

The tab explains the hard boundary: RoamWise cannot declare binding peak-day slot limits, operate
gate scanning, publish official fares or room rates, create resident passes, or establish an ambulance
corridor. It links to 108/112 and asks visitors not to self-direct traffic. The notice says RoamWise
is independent and unaffiliated with the Government of India, district administration, police and
Kainchi Trust; official notices and responders always take priority. No fabricated live readings,
rates, capacity, permits or government branding were added.

Review this PR before merging; run the browser gate with Chromium available. The deployment
workflow is a separate review under AI-ROLES-AND-HANDOFF rule 7. Keep source availability failures
visible and verify the served `daily.json` after deployment. Do not mark parking, queues, shuttle
seats or road-open status as live without a real independently verified data contract.

## Speaking guide and sacred journeys — 10 October 2026

The initial local-only voice catalogue now refreshes when device voices load. Explicit per-player
provider consent, language choices, Hindi test/retry and reading speed address remote-only or
late-loaded voices. Speech-start events drive approximate mouth animation and word-boundary
highlighting. The guide is an original articulated SVG illustration with offering gestures,
not a photorealistic/lip-synced video priest. Queued speech timeout is 10 seconds, started
speech timeout is 90 seconds. Native WebViews without Web Speech still need a capable external
browser; no native TTS or video-avatar service was connected.

`/pilgrimage/` adds six sourced destination pages reusing the player and existing Pro seam.
See `features/pilgrimage/README.md` for source and device-QA evidence. Those pages use short
RoamWise devotional sequences, not Kainchi’s full Hanuman hymn for every shrine. They have
no imported daily feed, government pass, live facility inventory or confirmed festival dates.

The 10 October release exposed a publication gate missed by seed-only checks: refreshed
headlines pushed the 80 KiB source budget over its limit. The budget is now 88 KiB and the
gate reserves 7,300 gzip bytes for the collector's bounded 7 KB snapshot plus its JS wrapper.
Current checked-in source is about 79.5 KB; the maximum reserved feed yields about 85.7 KB,
below 90,112. The collector limit, daily-source validation and deployment configuration are
unchanged. Future source additions must leave room for the full snapshot, not only the seed.
