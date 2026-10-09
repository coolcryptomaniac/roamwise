# RoamWise sacred journeys — 10 October 2026

The directory and six destination pages share a free group planner and Pro devotional player.
Preparation includes date/group checks, selected-shrine maps, a no-personal-details WhatsApp
draft, a printable in-memory checklist and official authority links. It does not issue tickets
or passes, reserve facilities, measure crowds or collect personal details. Checked links age
visibly after 30 days. Seasonal dates and snan schedules are not imported or inferred.

Char Dham covers Uttarakhand's four-shrine circuit, distinguished from the nationwide circuit.
Panch Kedar lists five individual Shiva shrines. Kumbh lists the four host cities plus
Trimbakeshwar, without suggesting an event is happening at all of them now. Vaishno Devi,
Kashi and Tirumala link their own authorities for registration, booking, notices and services.
All links were checked on 10 October 2026 (India date):

- https://uttarakhandtourism.gov.in/experiences/char-dham
- https://uttarakhandtourism.gov.in/experiences/panch-kedar
- https://registrationandtouristcare.uk.gov.in/
- https://badrinath-kedarnath.gov.in/
- https://uttarakhandtraffic.com/
- https://nashik.gov.in/en/tourism/culture-heritage/
- https://www.maavaishnodevi.org/
- https://shrikashivishwanath.org/
- https://www.tirumala.org/ (publishes its current online-services and news links)

New pages use an 11-step RoamWise-authored symbolic sequence with the selected shrine's short
traditional mantra, repeated during the lamp offering. They do not claim to reproduce a full
temple-specific liturgy. Kainchi retains its 23-step session and all traditional Hanuman aarti
couplets. Standard and custom modes share `features/kainchi-yatra/ui/ritual.js`.

## Voice correction and avatar

The previous player accepted only `localService === true` voices and treated an initially
empty browser catalogue as a terminal error. It also marked speech active at queue time.
This release keeps local-only mode as default, refreshes on `voiceschanged`, adds per-language
selection, Hindi test/retry buttons and speed control. A fresh explicit checkbox admits device
provider voices. Changing consent cancels speech; no automatic retry sends private names.
Hindi test text contains no personal details. `onstart` activates the speaking mouth and `onboundary`
highlights the current word where the browser emits boundaries. No phoneme lip-sync is claimed.
The illustrated puppet blinks, nods and makes offering gestures for flowers, incense, lamp,
prasad and closing good wishes. Reduced motion and the Kainchi motion control suppress animations.
Names remain text nodes and page memory. Voice provider privacy is visibly qualified.

Queued-but-silent speech fails after 10 seconds; actual-started speech has a 90-second watchdog.
Browser/WebView speech support, voice language availability, pronunciation and media volume are
device-dependent. Chrome/Safari guidance is available. This does not add a native Android TTS
plugin or connect a billed cloud TTS/video-avatar service. Realistic talking video would require
such a service and an operational budget; it is not faked by the illustrated puppet.

No auth, payment, Firestore or hosting changes. Existing Bhakti Pro checks were moved verbatim
to `ui/bhakti-access.js` for reuse. No new automatic recurring job or unverified live data feed.

## Verification handoff

Automated JS DOM tests exercise both aarti modes, asynchronous voice discovery, provider consent
and revocation, stale callbacks, speech-start mouth state, safe names and boundaries, Hindi,
all pages, route selection, checklist persistence within the page and invalid plans. These do
not verify actual sound or phone layout. Manual device matrix: Android Chrome, Android app
WebView, iOS Safari; both languages; local/provider/no voices; test, standard/custom, pause,
resume, next/stop; app backgrounding; Pro/guest; media volume; 360/390/1280 px; reduced motion.
This managed environment has no supported browser QA capability; record that limit at release.
