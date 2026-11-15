# RoamWise · Bengaluru Tech Summit 2026 field launch
Checked against the official Bengaluru Tech Summit and STPI pages on 15 November 2026.

## Official event facts
- Bengaluru Tech Summit **17–19 November 2026** (not November 20), Bangalore International Exhibition Centre, 10th Mile, Tumkur Road, Bengaluru, India.
- 29th edition. Theme **AI & Beyond**. Official programme is subject to change.
- Official programme: https://www.bengalurutechsummit.com/programme_at_a_glance.php
- Speakers (announced, not promised encounters): https://www.bengalurutechsummit.com/speakers_2026.php . Published list includes Kris Gopalakrishnan, Dr Kiran Mazumdar-Shaw, Vivek Raghavan (Sarvam AI), and Prashanth Prakash (Accel).
- STPI says it will sponsor exhibition space for about 100 startups: https://bengaluru.stpi.in/en/events/bengaluru-tech-summit-2026-0

## What ships in this branch
- Homepage removes the dated Diwali marketing panel, presents one BTS event card, and limits personal music/books/artist promotion. Founder products remain available through /about.html, /books/ and /music/.
- /summit/ landing page: verified summit facts, Ailon-inspired opt-in turn-taking voice demo with typed fallback, a free planner link, two explicit contact/partner actions, and share-code QR generation.
- /summit/cards.html: four printable branded QR cards, one personalized sharing code for the summit card, plus founder and business cards.
- Avoid using official summit logos. All experiences say **independent RoamWise activation**, not sponsored/exhibiting/endorsed.
- Web Speech Recognition availability varies by Android browser/WebView and language; it is turn-taking, not production full-duplex. No speech recording is stored by this page; browser or vendor speech services can process audio under their own terms. No promises of zero external processing.
- Unknown summit questions prompt the visitor to open the full Ailon travel planner; do not present the deterministic demo as a general-purpose model.

## Student promoter / intern field script
1. Ask permission for a **30-second live product demo**; do not interrupt visitors already in conversations.
2. Say: "We are building RoamWise from Almora. Want to ask our travel assistant a question about this summit or your next trip?"
3. Open /summit/ and let the visitor choose **Fun fact**, **Speakers**, **RoamWise demo**, or microphone where their browser supports it.
4. If interested, ask them to **open the main planner** and sign in there. A QR scan alone is not a signup.
5. For business prospects, offer /business/ and the email introduction with consent. Never imply an official BTS endorsement.
6. Log aggregate, nonidentifying counts manually after the session. Do not record unsolicited names, phone numbers, badge scans, location or audio.
7. Ask for a permitted follow-up only after the visitor explicitly opts in. No unsolicited outreach using lists scraped from speaker directories.

## Campaign funnel, conversion review
Track per promoter share code (A-Z, 0-9, dash, underscore; max 24 chars). Codes alone are link identifiers; **the current static code does not implement authoritative backend attribution**. Do not announce conversion counts until server/account analytics are validated. Suggested manual log fields: date, promoter code, scanned (observed), live demo started, main planner opened, verified signups (only if independently confirmed), explicitly consented qualified leads, requested follow-ups, outcome.
- Test target, **not a guarantee**: 150 real conversations -> 60 demo interactions -> 20 authenticated users -> 5 consented B2B leads.
- Every promoter gets their own link (e.g. /summit/?src=bts26&rep=STUDENT01). Never attribute a conversion from a scan alone.
- Prior NMIMS conversion was reportedly zero. Focus on one live demo and one measurable next action, not free-pass page views.

## Pro pilot: do not release until entitlement is real
- The existing published Founder Pro language allocates 500 NMIMS free and 500 paid seats. A **new** 500–1,000 BTS lifetime giveaway would conflict with this allocation, and could add long-term AI cost.
- To run a BTS pilot, first obtain approval for a precise **term** (suggestion: 30-day limited, fair-use Pro trial), **cap** (e.g. 500 authenticated unique accounts), exact launch date, eligibility, and rights; update pricing, policy and FAQ before promotion.
- Implement an authenticated, idempotent server claim endpoint with a transactional campaign quota, verified user ID, expiry, one claim per user, rate limits, abuse detection, server-verified benefit grant and an audit record. Never activate Pro from QR scan, local storage or an unverified claim string.
- This branch **does not** grant, reserve, or advertise an active 500–1,000 free-Pro campaign.

## Ailon upgrades after the event
- Production voice roadmap: robust stream cancellation/interrupt, explicit start/stop, visual speaking/listening state, network fallback, ASR transcription review, multilingual quality evals, latency and cost budget, voice session privacy disclosure and 8-turn cap.
- Capture the difference between deterministic event FAQs, tool-powered live schedule queries, and general AI responses. Use only organizer-linked schedule data with a last-checked timestamp. Never hallucinate sessions, ticket access or speaker attendance.
- Android WebView/browser audio permissions may need native app release work and Play Store review. A web commit alone does not publish a new Android APK.

## Post-event archive, 20 November onward
- Only add **RoamWise-owned or explicitly licensed** summit photos/videos to `/memories/data.json` and `/memories/` once images are actually available; no speculative event photos.
- Caption with photo date, place, creator credit and rights, alt text, and clear distinction between BTS official programme and RoamWise activities. Obtain consent for identifiable featured attendees as applicable.
- Add a recap with actual booth/visit status and aggregate conversion results; never claim RoamWise was an official exhibitor unless verified.
- After November 19 IST, homepage summit card hides automatically. Campaign landing remains accessible for archive/referrals.
- Repeat this minimal campaign template for future events, changing only verified date, sources, audience and demo prompts.

## Release QA
- Preview /summit/, /summit/cards.html, /about.html and homepage on Android Chrome, iOS Safari, desktop and the RoamWise Android app.
- Verify QR readability on a second phone, link query code, screenshot and print on A4, microphone permission denial, Stop, text fallback, screen reader labels, small screens.
- Confirm homepage retains Ailon, travel discovery, booking flows, partner links, and no Diwali banner.
- Confirm URLs resolve on published domain after deployment; PR merge alone is not proof of production availability.
