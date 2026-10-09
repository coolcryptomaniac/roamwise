// Runs the WebLLM engine off the main thread so the page stays responsive.
import { WebWorkerMLCEngineHandler } from './index.js';
const handler = new WebWorkerMLCEngineHandler();
self.onmessage = (msg) => { handler.onmessage(msg); };
