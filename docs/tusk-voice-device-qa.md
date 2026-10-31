# Tusk Voice Studio — real-device acceptance matrix

This checklist is **not evidence of a device test**. Automated CI covers only code-level regressions.
Run the following on a physical Android device (including Moto G64, Android 15)
and an iPhone with Safari/WebKit; use narrow browsers at 320, 360, 390 and 768 CSS px.

| Case | Expected | Tested |
| --- | --- | --- |
| Voice Mode button in homepage and expanded Tusk chat | Both launch the same optional studio | Pending physical device |
| Microphone permission denied | Clear accessible message and usable typing fallback; no loop | Pending |
| Start speaking, then tap Stop | Capture/TTS end, delayed callbacks never reopen microphone | Pending |
| Interim browser speech transcript | Visible as spoken, not submitted until final | Pending |
| Rapid repeat of recognition results | Exactly one chat message | Pending |
| Hindi, English, Hinglish questions | Real transcription verified against spoken words | Pending |
| Friendly/Guide/Kumaoni-inspired options | Text tone changes; device voice depends on installed TTS | Pending |
| Browser TTS completes | Next turn can start only during opted-in session, up to eight turns | Pending |
| Native TTS finishes | Manual Speak still works; do not assume provider gave a reliable completion event | Pending |
| Listings, artists, itinerary cards | No horizontal overflow at 320/360/390/768 CSS px | Pending |
| Compact/comfortable card toggle | Touch controls, text/images stay within viewport | Pending |
| Reduced-motion preference | Stationary orb/cards; usable layout | Pending |
| Screen reader and TalkBack/VoiceOver | Buttons announced; transcript/phase status accessible | Pending |
| Payment/OTP/emergency message | Never automatically read payment-sensitive content | Pending |

## Safe rollout

Ship behind existing user-initiated Voice Mode entry. Verify real device audio, WebView
permissions, microphone lifecycle, battery/CPU, TalkBack/VoiceOver, and property cards
before expanding the audience. Full-duplex streaming PCM/audio and genuine Kumaoni neural
TTS require separately integrated backends/models and licensing; this PR does not implement them.
