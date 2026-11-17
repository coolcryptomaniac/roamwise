# Hugging Face optional AI

Verified against Hugging Face documentation and the live public model catalogue on 18 November 2026.

## What this integration does

- Adds Hugging Face to Settings → Advanced → Optional AI tools and the key wizard.
- Calls https://router.huggingface.co/v1/chat/completions directly from the browser with the user's hf_ token in the Bearer header.
- Requires a token with **Inference Providers** permission, a supported chat model and sufficient Hugging Face credits.
- Defaults to meta-llama/Llama-3.1-8B-Instruct:cheapest, which was present in the live router catalogue at verification. Users can override it with owner/model or owner/model:provider in Settings. Availability and prices can change.
- Uses Hugging Face only when explicitly selected (including an explicit wizard test). Merely saving/restoring its key does not add it to Automatic mode or another provider's fallback pool. AI Arena includes HF only while HF is selected.
- Keeps existing BYOK storage: on-device localStorage, optional passphrase-encrypted backup, and the shared-device key-wipe option at sign-out. Model choice stays on the device. No HF token is added to the RoamWise Worker or public source.
- Caps HF output at 4,096 tokens per request, uses the existing 15-second timeout, and surfaces permission, billing, rate-limit and unavailable-model errors. Provider error bodies are not displayed, to avoid echoed secrets.
- Requests JSON through the prompt and uses the existing tolerant JSON parser. Strict structured-output support varies by provider; this adapter does not claim a schema guarantee.

This is chat/itinerary BYOK support. It does not add HF to the tool-calling Agent, voice synthesis/transcription, embeddings, managed Worker routes or the automatic free pool. No HF account, paid plan, Space, inference endpoint or company-funded credential is provisioned.

## Setup

1. Enable Advanced AI in Settings; the confirmation explains provider billing.
2. At <https://huggingface.co/settings/tokens>, create a fine-grained token with Inference Providers permission. A generic read-only token may be insufficient.
3. Check the balance and current prices in your HF account. Requests and the Test button consume your credits.
4. Paste the token into Hugging Face. Optionally select a supported chat model from <https://huggingface.co/playground>. Save, then Test.
5. Select Hugging Face as the active provider. Switch to Automatic or clear the key when it is no longer wanted.

Do not paste real credentials into issues, pull requests or screenshots. The test suite uses mocks and makes no paid model calls. A real-token browser/CORS and Hindi itinerary check remains necessary before calling this live-verified.

## Cost and hosting corrections

The current pricing page lists **no monthly Inference Providers credits for free accounts**; PRO includes $2 in general-purpose compute credits. The hf-inference provider is metered compute, not an unlimited free CPU API.

CPU Basic Spaces have no hourly hardware charge, but current rules require a paid plan to create Gradio/Docker compute Spaces, with a separate eligible-account ZeroGPU exception. Free hardware can sleep. It is not a guaranteed always-on production backend.

ZeroGPU has daily quotas and queues, hardware/account restrictions, and Gradio-specific requirements. It is unsuitable as an assumed unlimited replacement for the managed AI pool.

RoamWise already has WebGPU and local-server options. Transformers.js could be considered separately for small offline speech/embedding tasks, after checking model format/licence, Hindi quality, mobile memory, first-download size, cache eviction, runtime files and offline restart. On-device inference removes per-request server billing; it does not guarantee every phone, permanent cached files or accurate Kumaoni/Garhwali support.

## Sources

- Pricing: <https://huggingface.co/docs/inference-providers/pricing>
- Chat endpoint and permission: <https://huggingface.co/docs/inference-providers/tasks/chat-completion>
- Live supported models: <https://router.huggingface.co/v1/models>
- Spaces hardware and lifecycle: <https://huggingface.co/docs/hub/spaces-overview>
- ZeroGPU: <https://huggingface.co/docs/hub/spaces-zerogpu>
- Browser runtime: <https://huggingface.co/docs/transformers.js/index>
