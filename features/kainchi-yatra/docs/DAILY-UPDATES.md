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

Frontend JS/CSS/HTML gzip budget expands from 30 KB to 48 KB for the bilingual hub and a bounded
30-headline snapshot (current authored snapshot about 35 KB). Hero is WebP, approximately 504 KB,
with a separate 650 KB cap; no fonts, UI libraries, remote images or extra visitor analytics.

## Artwork provenance

`ui/art/kainchi-dawn.webp` was generated using the built-in image-generation tool on 9 October
2026, then encoded as WebP. Prompt: original editorial painted exterior inspired by Kainchi Dham,
red-roof temple structures, red bridge, mountain river, forested Kumaon hills and morning mist;
forest-teal shadows and saffron sunlight; landscape, no interiors, idols, people, text or logos.
It is not a factual map, current photograph, official trust artwork or an architectural record.

## Review handoff

Review this PR before merging; run the browser gate with Chromium available. The deployment
workflow is a separate review under AI-ROLES-AND-HANDOFF rule 7. Keep source availability failures
visible and verify the served `daily.json` after deployment. Do not mark parking, queues, shuttle
seats or road-open status as live without a real independently verified data contract.
