# WebLLM (vendored)

- Package: `@mlc-ai/web-llm` 0.2.85, Apache-2.0 (see LICENSE).
- `index.js` is `lib/index.js` from the npm package, minified with esbuild 0.24 (`--minify --format=esm --target=es2020`). No code changes.
- `worker.js` is ours: a 4-line module worker that hosts the engine.
- Loaded lazily by `js/copilot/webgpu-ai.js` only when a user turns on "On this device (WebGPU)". It is not preloaded and is not cached by the service worker.
- Model weights are not in the repo. They are downloaded by the user's browser from huggingface.co/mlc-ai and the model library from raw.githubusercontent.com, then cached in the browser.
- To upgrade: `npm pack @mlc-ai/web-llm@<version>`, repeat the esbuild step, update the version above, and re-test on a phone.
