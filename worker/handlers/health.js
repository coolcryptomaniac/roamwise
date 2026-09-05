/* ============================================================================
   worker/handlers/health.js — GET /health
   ============================================================================
   Named export only — see worker/lib/http.js header for why. Imported into
   worker/worker.js and dispatched from its fetch() router.
   ========================================================================= */
import { json } from '../lib/http.js';

export function handleHealth(env){
  return json({
    ok: true, service: 'roamwise-worker',
    configured: {
      ai:     !!env.GROQ_API_KEY,
      kv:     !!env.RW_KV,
      events: !!env.TICKETMASTER_KEY,
      refreshProtected: !!env.REFRESH_TOKEN,
    },
  });
}
