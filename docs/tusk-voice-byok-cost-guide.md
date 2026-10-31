# Ailon Tusk · Voice Providers and BYOK (verified 31 October 2026)

## Recommended defaults

**Free for RoamWise:** Browser/Android/iOS system speech synthesis, when
supported by the device. No paid cloud voice calls, but accent/quality varies.
Do not claim that devices universally support real native Kumaoni speech.

**Sarvam BYOK:** Bulbul v4 Flash is the latest available Sarvam TTS model
(200+ advertised personas), v3 is the stable API default. The app offers
both; user explicitly enables BYOK and enters their own API key for **this
tab only**. Their key is forwarded through a fixed-origin Cloudflare proxy,
never placed in URL, log, localStorage, or Firestore by this new voice flow.
Worker deployment/URL is required before it can run. Fallback is device TTS.

**RoamWise-funded voice:** Do not turn on unlimited shared premium TTS by
default. Browser/device voice is the no-model-bill option; Workers AI free
allowance is finite. Cloudflare-hosted models are usage-metered, can be
English-specific, and need voice-locale checks before public rollout.

## Beginner setup

1. Open https://dashboard.sarvam.ai and create an account.
2. Inspect the current balance, commercial usage terms and prices.
3. Create a limited-scope key, where provider permits it.
4. In RoamWise open **Settings → Ailon Tusk · Voice provider** or
   **Voice Mode → ⚙️ Voice provider**.
5. Choose Sarvam Bulbul v4 Flash (or v3 stable), paste key, press
   **Use key for this tab**, then open Voice Mode.
6. The app must be connected to RoamWise's deployed HTTPS Cloudflare Worker.
   If unavailable, voice falls back to your phone's installed TTS.
7. **Clear voice key** after use. If suspicious activity occurs, rotate/revoke
   the key in Sarvam dashboard and inspect provider bills.

### Verified rates (public pay-as-you-go, excl. GST)
- Sarvam Bulbul v4 Flash: **₹1 per 1,000 characters**.
- Sarvam Bulbul v3: **₹3 per 1,000 characters**.
- Sarvam STT: **₹0.49 per audio minute**.
- Cloudflare Workers AI free allocation **10,000 neurons/day**; above this,
  metered charges require Workers Paid. Free is not unlimited or guaranteed.

Illustration: 1 million users × 500 generated TTS characters each would be
500 million characters = ₹500,000 with v4 Flash, **before GST**, network
and other costs. 1 million users × 5,000 chars each would cost ₹5,000,000.
This is why high-usage cloud voice should be user-funded or hard-quotad.

Sources (check frequently; pricing and models can change):
- https://docs.sarvam.ai/api/getting-started/pricing
- https://docs.sarvam.ai/api/api-guides-tutorials/models/bulbul
- https://docs.sarvam.ai/api-reference/text-to-speech/convert
- https://developers.cloudflare.com/workers-ai/platform/pricing/
- https://ai.google.dev/gemini-api/docs/live-api/ephemeral-tokens

## Future integrations and version updates

Gemini Live / other real-time models need backend ephemeral tokens, explicit
microphone consent, per-user quotas, token cost accounting and latency tests.
They are not activated by the BYOK Sarvam **TTS** control. For updated models,
verify the provider's official model/pricing pages before changing defaults;
do not silently migrate user-funded accounts to an expensive model.

This implementation does not promise server deployment, real-time full-duplex
audio, automatic model discovery, free usage for millions, or actual Kumaoni
native voice synthesis. Apply rate controls, service-side auth and device QA
before promoting a shared provider.
