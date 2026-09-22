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
      ai:     String(env.MANAGED_AI_ENABLED || '').toLowerCase() === 'true'
        && !!env.GROQ_API_KEY && !!env.GROQ_MODEL
        && !!env.FIREBASE_SERVICE_ACCOUNT_JSON && !!env.AI_USAGE,
      aiKey:  !!env.GROQ_API_KEY,
      aiModel: !!env.GROQ_MODEL,
      aiMeter: !!env.AI_USAGE,
      kv:     !!env.RW_KV,
      events: !!env.TICKETMASTER_KEY,
      refreshProtected: !!env.REFRESH_TOKEN,
      push: !!env.FIREBASE_SERVICE_ACCOUNT_JSON,
      // Checkout authenticates and persists orders via Firebase, so Cashfree
      // credentials alone are NOT sufficient to call the endpoint ready.
      // Presence is NOT proof that any credential, KYC or settlement is valid.
      cashfree: !!env.CASHFREE_APP_ID && !!env.CASHFREE_SECRET_KEY && !!env.FIREBASE_SERVICE_ACCOUNT_JSON,
      partnerPayments: !!env.FIREBASE_SERVICE_ACCOUNT_JSON,
    },
    paymentEnvironment: String(env.CASHFREE_ENV || 'sandbox').toLowerCase() === 'live' ? 'live' : 'sandbox',
    // Public, non-secret deploy indicators only. Neither validates API keys,
    // proves Cashfree connectivity, nor confirms paid orders or fulfillment.
    cashfreeApiVersion: String(env.CASHFREE_API_VERSION || '2025-01-01'),
    cashfreeDiagnosticsRevision: '2026-09-21-network-v1',
  });
}
