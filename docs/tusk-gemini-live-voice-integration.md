# Ailon Tusk — optional high-quality real-time voice provider

Status: **architecture proposal, not a deployed service**.

## Current production fallback
Web Speech / installed Indian English and Hindi system voices. The new Voice actor selector
lists only voices exposed by the browser. Android native wrappers may use a different
TTS provider and therefore cannot promise this specific voice selection.

## Secure candidate: Google Gemini Live
Official documentation:
- https://ai.google.dev/gemini-api/docs/live-api
- https://ai.google.dev/gemini-api/docs/live-api/capabilities
- https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/live-api/configure-language-voice

Capabilities to validate: native real-time audio, interruption/turn-taking, Hindi,
English and code-switching, and transcribed user turns. Kumaoni and Garhwali **are not
promised or established as supported voice locales**.

## Required backend boundaries
1. Cloudflare Worker verifies Firebase Auth / App Check, checks user consent and quotas.
2. The Worker holds provider credentials in secrets and requests a **short-lived**
   scoped Gemini session/ephemeral token. Never ship the permanent key to JavaScript.
3. Browser opens a direct authenticated short-lived Live connection and sends microphone
   PCM only after a user presses Voice Mode; Stop must close it immediately.
4. Backend fetches authenticated up-to-date property records through existing approved
   RoamWise discovery rather than trusting model-invented availability.
5. Any weather, road or transport 'live' answer must cite its specific provider,
   timestamp and coverage; no Google Maps or weather feeds are assumed to be connected.
6. On 429/503 limits: show retry affordance, stop audio cleanly, and offer text or
   on-device speech. Never narrate the provider error as an itinerary.
7. Log aggregate cost/latency/429 rate without retaining raw audio by default.
   Use user opt-in and privacy disclosures before sending audio to third parties.

## Gate before activation
Real Android 15 and iPhone testing, confirmed per-minute cost budgets,
native audio interruptions and echo cancellation, consent, fair use / moderation,
data retention review, mock backend tests, and rate-limit recovery tests.
No API billing, production Worker deployment, or model key change is included here.
