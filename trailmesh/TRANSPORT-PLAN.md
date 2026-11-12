# TrailMesh transport stack and honest release status

## What this PR actually does
The website at `/trailmesh/` is a working offline-*after-first-visit* expedition mini app with saved trip plan, personal field journal, checklist, rule-based Scout avatar, optional text-to-speech, short safety quiz, opt-in one-shot GPS read and copyable safety briefing. A scoped service worker caches only the static mini-app shell. It does **not** do peer discovery, radio voice, group chat, automatic location sharing, satellite messaging or SOS dispatch. Test on a real phone with airplane mode *after* one successful online load; a browser/OS may evict offline caches.

## Native roadmap — do not advertise as available
1. **Android proof of concept:** Capacitor plugin calling Google Nearby Connections for device discovery and authenticated short message/file exchange. Google says it can operate offline using Bluetooth, BLE, Wi-Fi. Pair devices with user-visible short authentication codes. Test two Android phones from different manufacturers, screen-on and background conditions, with internet and mobile service disabled.
2. **Store-and-forward opportunistic mesh:** Nearby Connections provides *nearby peer* channels, not a managed multi-hop network. Build a separately audited protocol: random device IDs, end-to-end encryption, signed envelopes, TTL, hop limit, duplicate suppression, user consent, group roles, bounded queues, key rotation, and explicit delivery receipts. Do not imply a distress call is delivered unless acknowledged by a responsible human. Battery measurements across device models are release gates.
3. **Wi-Fi Aware where supported:** native Android capability checks and documented permissions, optional high-throughput transfers. Android docs say it is hardware/firmware-dependent and may conflict with hotspot/SoftAP use. Prefer Nearby abstraction first.
4. **NFC:** optional bootstrap pairing (tap-to-exchange a device invitation); it is not a useful long-distance packet relay.
5. **Voice:** record and queue voice clips before attempting live group calls, which are sensitive to jitter, battery, OS background restrictions and topology changes. Explicit consent, local encryption and retention controls.
6. **When connectivity returns:** with user opt-in and authenticated server, synchronize encrypted trip events, fetch verified operator updates, download low-data map tiles and offer AI avatar guidance with grounded sources and cached deterministic fallback. Never stream sensitive field data by default.
7. **iOS:** separately evaluate Nearby Connections iOS or MultipeerConnectivity, OS permissions and background limits; don't assume native Android protocol automatically works on all iPhones.

## Field validation / release gates
- Android 13/14/15/16 physical devices, explicit nearby-permission UX, airplane mode and cellular-off tests, GPS accuracy and battery drain over 8–12 hour walks.
- 2/4/8/12-person teams; wooded valleys/ridges, disconnected clusters, long pauses, battery saver, devices in pockets, app killed, and reconnects; measure P50/P95 latency and percent **actually acknowledged**, not merely queued.
- Safety audit: nobody is told a voice note or SOS arrived when there is no confirmed recipient. External rescue equipment and offline maps remain mandatory for applicable terrain.
- Build the APK/AAB and regression test Android permissions before stating the mesh layer is released.

References:
- https://developers.google.com/nearby/connections/overview
- https://developer.android.com/develop/connectivity/wifi/wifi-aware
- https://developer.apple.com/documentation/WiFiAware
