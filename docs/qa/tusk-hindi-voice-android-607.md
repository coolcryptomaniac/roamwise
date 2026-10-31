# Ailon Tusk Hindi voice — Android internal QA (#607)

## Automated status
PR #608 CI passed: Runtime asset integrity, brand check, Jekyll site CI, Platform V5 guardrails, Firestore Rules Autopilot, repo health. These are not device voice tests.

## Code review notes
- Voice input uses Capacitor SpeechRecognition on Android and browser SpeechRecognition fallback.
- New change selects hi-IN when page locale is Hindi, and suppresses identical speech callbacks within 1.5 seconds.
- Caveat: this is **single-utterance dictation**, not continuous full-duplex conversation or barge-in. Do not market as equivalent to ChatGPT Live.
- Review permission-denied behavior, language switching, native callbacks, repeated identical intentional commands, offline behavior, and TTS speaker state.

## Android internal build and device test
1. Build from feature/tusk-hindi-voice-phase1-607 (not main), using existing signed internal-test Android workflow and secure credentials; do not publish to production.
2. Install on Moto G64 Android 15 and one other Android device.
3. Grant microphone permission; say 'अल्मोड़ा में कल दो लोगों के लिए कमरा दिखाओ'. Confirm correct transcript, exactly one request, and Hindi response.
4. Repeat with Hinglish and English; verify locale selection and manual language settings.
5. Deny/revoke mic, interrupt speech, lose network, background/resume, and retry. Ensure typed input still works.
6. Check TTS on/off, no accidental autoplay, accessible status indicators, safe-area layout.
7. Search verified Stay & Do listings; never assert unverified availability or price.
8. Booking test: itemized quote -> explicit consent -> sandbox Cashfree checkout or WhatsApp fallback -> verified status. Never charge real money during QA.
9. Capture screenshots, device/build version, console errors, latency, transcript accuracy, and booking outcomes.

## Release gates
Do not merge or ship until device voice tests and booking/payment tests pass. Full-duplex streaming, interruption, premium visual redesign, and end-to-end booking remain separate implementation work in #607.
