# Mesh Networking / Android Nearby Connections API — Planning Spec

**Status: planning/spec only. No implementation in this repo.** This
document exists so that a future Claude Code session with access to the
separate `roamwiseapkaabbuild` repository (an Android APK-build repo this
session does not have access to) can pick up the actual native work
already informed by this spec, instead of starting from zero. It is
referenced from `FUTURE-ARCHITECTURE-PLAN.md` §9.

## 1. What Google's Nearby Connections API actually provides

Nearby Connections is a Google Play Services API (part of the "Nearby"
family, alongside the separate, now-deprecated Nearby Messages API — not
the same thing, and worth double-checking on the current Android
developer docs since APIs in this space have shifted over the years) that
lets nearby Android devices discover each other and exchange data
directly, device-to-device, **without requiring internet connectivity**.
Key characteristics, described honestly from general knowledge of the
API's design (flagging that this assistant's training data has a cutoff,
so any specific method name, strategy constant, or current API surface
detail below should be re-verified against the live Android developer
documentation before writing code against it):

- It transparently uses a mix of Bluetooth Classic, Bluetooth Low Energy
  (BLE), and Wi-Fi (including Wi-Fi Direct and a local Wi-Fi hotspot the
  API can establish itself) to move data, choosing the underlying
  transport automatically based on what's available and what the chosen
  "strategy" calls for — the app doesn't have to manage each radio
  itself.
- It supports different connection topologies/strategies — historically
  including something like a one-to-many "star" topology (`P2P_STAR`)
  and a many-to-many cluster/mesh-like topology (`P2P_CLUSTER`), plus a
  point-to-point option — chosen based on how many peers need to be
  connected at once. "Mesh-capable" in this document's framing means the
  cluster-style topology, where multiple nearby devices can each connect
  to multiple others, not a single-hop-only design.
- The typical flow is: one or more devices **advertise** a service/payload
  they're willing to connect over, one or more devices **discover** those
  advertisements, a connection is proposed and both sides must
  **accept** it (with a human-readable/token-based confirmation step,
  historically), and once connected, devices exchange **payloads** (byte
  arrays, streams, or files) directly over whichever transport was
  negotiated.
- Range is inherently short — this is a local, physical-proximity
  technology (roughly the range of Bluetooth/Wi-Fi Direct, so tens of
  meters at most, highly environment-dependent), not a substitute for
  internet-based long-distance communication.
- Because it doesn't require an internet connection or a cell/Wi-Fi
  network with backhaul, it works in true dead zones — which is exactly
  why it's relevant to a travel app with existing offline features.

## 2. Realistic use cases for RoamWise specifically

Grounded in features that already exist in this repo today (checked
directly, not assumed):

- **Offline itinerary/trip sharing between nearby travelers.** RoamWise
  already has an offline Trip Vault (`js/itinerary/trip-vault.js`) that
  stores saved trips in `localStorage` specifically so they're viewable
  "with zero signal" (see that file's own header comment). Nearby
  Connections would let one traveler share a saved trip's itinerary
  payload directly to another nearby traveler's phone with **no internet
  and no server round-trip at all** — a natural extension of a feature
  that's already built around working offline.
- **Local group-trip coordination in low-connectivity areas.** RoamWise's
  `js/misc/eco-safety.js` already has an "Off-Grid Safety" section built
  specifically for trekkers "above treeline" in genuinely disconnected
  places (the file's own comments reference Spiti and satellite/rescue
  guidance such as inReach devices). A small trekking group in exactly
  that kind of dead zone could use a device-to-device mesh to share
  position/plan updates or check-in status with each other without any
  cell signal — directly aligned with a feature area this app already
  invests in.
- **Proximity-based "nearby traveler" discovery.** RoamWise already has an
  opt-in, blurred-location, time-boxed "Beacon" feature
  (`js/social/tribe-beacon.js`) for nearby-tribe matching — but today it's
  server/Firestore-backed (`db.collection('squads')...` etc.), which means
  it requires connectivity and a signed-in account. A Nearby-Connections-
  based local discovery mode could offer a genuinely offline variant of
  the same idea — "who's nearby right now, with no signal at all" — as a
  complementary discovery path alongside the existing online Beacon, not
  a replacement for it.

## 3. This is cross-repo, native work — not something to build here

**`roamwise` (this repo) is a web/PWA app wrapped by Capacitor for
Android** — it ships JS/HTML/CSS served from a WebView (see
`FUTURE-ARCHITECTURE-PLAN.md` §7 on how Capacitor's WebView model works).
The Nearby Connections API is a **native Android API** (Java/Kotlin,
Google Play Services) with no JavaScript/WebView-accessible equivalent.
It cannot be called from this repo's existing `js/` code directly.

To use it from a Capacitor app, one of two paths is needed:
- An **existing community Capacitor plugin** for Nearby Connections, if
  one exists and is currently maintained. **This document does not claim
  certainty that one exists** — search npm (`@capacitor-community/*` and
  similar) and the Capacitor community plugin directory at
  implementation time to check, rather than assuming either way.
- Failing that, a **custom native Capacitor plugin** written in
  Kotlin/Java that wraps the Nearby Connections API and exposes a
  JS-callable bridge (Capacitor's standard plugin pattern: a native
  class annotated for Capacitor, exposing methods the JS side calls via
  `Capacitor.Plugins.X`, with events bridged back to JS via Capacitor's
  plugin event/listener mechanism).

**Either way, the actual plugin development and native integration work
belongs in `roamwiseapkaabbuild`**, the separate Android build repo this
session does not currently have access to — not in this `roamwise` web
repo. Once access to that repo is granted, a future session should use
this document as the starting spec for that work. Nothing in this
`roamwise` repo should be modified to attempt this feature until that
native plugin exists and has a defined JS-facing API contract to
integrate against.

## 4. Phased outline (realistic, not a quick add-on)

This is a genuinely non-trivial native feature — treat it with the same
seriousness as a from-scratch native Android capability, not as a small
bolt-on:

1. **Spec (this document).** Define the use cases, the topology needed
   (cluster/mesh vs. simpler star), the rough data payloads to exchange
   (e.g. a serialized trip-vault entry, a lightweight presence/check-in
   ping), and the safety model (see below) — before any code, in either
   repo.
2. **Bare native Android proof-of-concept, in `roamwiseapkaabbuild` (or a
   throwaway test project first, if preferred), with no Capacitor
   involved at all.** Build the smallest possible native Android app
   that advertises, discovers, connects, and exchanges a trivial payload
   between two physical devices using Nearby Connections directly. Prove
   the core mechanics — permissions (location permission is historically
   required for Bluetooth/Wi-Fi scanning on Android, exact requirements
   vary by Android version and should be re-verified at implementation
   time), connection reliability, range, and battery behavior — work in
   practice before adding any Capacitor bridging complexity on top.
3. **Build the Capacitor plugin bridge.** Once the native mechanics are
   proven, wrap them in a proper Capacitor plugin with a clean JS-facing
   API (e.g. `startAdvertising()`, `startDiscovery()`, `sendPayload()`,
   `onPeerFound`/`onPayloadReceived` events) so the web/JS side of the app
   can consume it without knowing Nearby Connections' native details.
4. **Integrate with existing RoamWise features**, only after the plugin
   is solid: wire a "share this trip nearby" action into
   `js/itinerary/trip-vault.js`'s existing UI, and/or an offline-discovery
   mode alongside `js/social/tribe-beacon.js`'s existing online Beacon,
   using the same safety-conscious patterns those files already use
   (opt-in only, time-boxed/expiring visibility, no forced contact-info
   exchange, blurred/approximate rather than exact positioning where
   applicable — Beacon's existing model in `js/social/tribe-beacon.js` is
   a good template for the safety posture a native nearby-discovery
   feature should match).

Do not treat steps 2-4 as a single sprint. Step 2 alone (proving the
native mechanics work reliably on real hardware) is real, standalone
native Android engineering; steps 3 and 4 each depend on the previous
step actually working, not just compiling.

## 5. Open questions for whoever picks this up in `roamwiseapkaabbuild`

- Confirm current Nearby Connections API status/support level directly
  against Google's live documentation — API surfaces and deprecation
  status in the Android "Nearby" family have changed over time, and this
  document's description should be re-validated, not assumed current.
- Confirm current Android permission requirements for BLE/Wi-Fi scanning
  (these have changed across Android versions) before writing the native
  proof-of-concept.
- Decide the actual payload format/schema for shared itineraries once
  this reaches step 3-4 — not specified here, since it depends on the
  trip-vault data shape at implementation time.
