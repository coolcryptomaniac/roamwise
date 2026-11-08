/* ============================================================================
   RoamWise Cloudflare Worker — SINGLE entry point.
   ============================================================================
   Cloudflare runs exactly ONE `main` file (see wrangler.toml) with ONE
   `export default` object (fetch + scheduled). That constraint is real and
   this file is the only one in worker/ allowed to have that default export.

   It does NOT mean the route logic all has to live in this one file, though.
   This project's wrangler.toml already points `main` at a file using
   `export default { fetch, scheduled }` — that's Cloudflare's "modules"
   Worker format, which wrangler bundles with esbuild before upload, and that
   format supports real ES `import`/`export` between files same as Node.
   Route handlers live in worker/handlers/*.js (one file per route) and
   shared HTTP helpers live in worker/lib/http.js; this file just wires them
   together — a routing table plus the fetch()/scheduled() dispatch.

   (An earlier version genuinely broke, but not because imports don't work:
   it split cron logic into a *second* file, events-refresh.js, that had its
   *own* `export default { fetch, scheduled }` — a second, competing entry
   point. wrangler.toml's `main` only points at worker.js, so Cloudflare
   never ran that second file's scheduled() at all — silently, no error. The
   fix isn't "never split files", it's "only worker.js may export default";
   every other file — handlers/*.js and lib/http.js — exports plain named
   functions that get imported IN to worker.js's single fetch()/scheduled(),
   never a competing entry point of their own. See worker/handlers/events.js
   for where refreshEvents() now lives as a plain named export.)

   Routes:
     GET  /health              is it alive               -> handlers/health.js
     POST /ai                  AI proxy, keeps key OFF the browser -> handlers/ai.js
     GET  /news                cached travel-tech feed    -> handlers/news.js
     GET  /events               cached events (weekly refreshed) -> handlers/events.js
     GET  /events/refresh      force a refresh (token-protected) -> handlers/events.js
     GET  /geo                 geocoding proxy            -> handlers/geo.js
     GET  /leads                partner lead finder        -> handlers/leads.js
     POST /cashfree/order              create a Cashfree order (secrets stay server-side) -> handlers/cashfree.js
     GET  /cashfree/order/:id/status   confirm order_status with Cashfree     -> handlers/cashfree.js
     GET  /shop/catalogue              public merchandise catalogue (no prices accepted from clients) -> handlers/shop-order.js
     POST /shop/quote | /shop/order    server-priced merchandise quote / order (Cashfree or direct UPI) -> handlers/shop-order.js
     GET  /shop/order/:id/status       buyer status (order token); verifies Cashfree before marking paid
     POST /shop/cashfree/webhook       signed Cashfree callback for shop orders
     POST /partner/cashfree/order      confirmed direct-stay checkout          -> handlers/partner-cashfree.js
     GET  /partner/cashfree/order/:bookingId/status  verify and persist paid stay -> handlers/partner-cashfree.js
     POST /push/send                   admin-only: send an FCM push to one user -> handlers/push.js
     POST /admin/creator/ig-rating     admin-only: rate a creator from Instagram Business Discovery -> handlers/creator-rating.js
     POST /admin/creator/public-check  admin-only: YouTube Data API numbers + web footprint links -> handlers/creator-public-check.js
     POST /nomad/advise                public: Workers AI explains Nomad Match picks (cached, capped) -> handlers/nomad-ai.js
     POST /admin/ai-ca/review          admin-only redacted finance/compliance review -> handlers/ai-ca.js
     POST /admin/invoices/sweep        admin-only: issue invoices for paid orders with none yet -> handlers/invoices.js
     POST /admin/advisory-alerts/run   admin-only: advisory alerts + team digest (dry-run default) -> handlers/advisory-alerts.js

   Cron: runs daily; refreshes news every run, events once a week (Mondays).

   DEPLOYING THIS IS OPTIONAL. RoamWise works fully without it — rw-config.js
   decides whether the app talks to the Worker at all.
   ========================================================================= */

import { CORS, json } from './lib/http.js';
import { createStayOrder, stayOrderStatus, handleStayCashfreeWebhook, stayRates, stayQuote } from './handlers/stay-cashfree.js';
import { handleStayDecide, runStayDeadlines } from './handlers/stay-lifecycle.js';
import { handleWallet, runWalletReleases } from './handlers/wallet.js';
import { handleAgentMail } from './handlers/agentmail-outreach.js';
import {handleCreatorAutopilot,runCreatorAutopilot} from './handlers/creator-autopilot.js';
import { handleHealth } from './handlers/health.js';
import { handleSarvamVoice } from './handlers/sarvam-voice.js';
import { handleAI } from './handlers/ai.js';
import { handleKala } from './handlers/kala.js';
import { handleTuskReport, handleTuskReports } from './handlers/tusk-report.js';
import { handleTuskLearnedGet, handleTuskLearnedPost, handleTuskLearnedDrop } from './handlers/tusk-learned.js';
import { handleTuskCurated } from './handlers/tusk-curated.js';
import { abuseGuard, aiGuard } from './lib/rate-limit.js';
import { refreshNews, handleNews } from './handlers/news.js';
import { refreshEvents, handleEvents, handleEventsRefresh } from './handlers/events.js';
import { handleGeo } from './handlers/geo.js';
import { handleLeads } from './handlers/leads.js';
import { createCashfreeHandlers } from './handlers/cashfree.js';
import { cashfreeTransportFetch } from './lib/cashfree-transport.js';
import { handlePartnerCashfreeOrder, handlePartnerCashfreeStatus } from './handlers/partner-cashfree.js';
import { handlePushSend } from './handlers/push.js';
import { handleCreatorRating } from './handlers/creator-rating.js';
import { handleCreatorPublicCheck } from './handlers/creator-public-check.js';
import { handleNomadAdvise } from './handlers/nomad-ai.js';
import { handleBusiness } from './handlers/business.js';
import { handleAICAReview } from './handlers/ai-ca.js';
import { handlePaymentEvent } from './handlers/payment-events.js';
import { handleBookingCashfreeWebhook } from './handlers/booking-cashfree-webhook.js';
import { createMusicHandlers } from './handlers/music-order.js';
import { handleStay } from './handlers/stay-ledger.js';
import { handleInvoiceSweep, runInvoiceSweepCron } from './handlers/invoices.js';
import { handleBot, botDeps } from './handlers/bot.js';
import { handleReminders, runInactivityReminders } from './handlers/reminders.js';
import { handleTripNotify, runTripNotifications } from './handlers/trip-notify.js';
import { handleStayLead, purgeOldStayLeads } from './handlers/stay-lead.js';
import { sendAdminDigest } from './handlers/bot-admin.js';
import { handleAdvisoryAlerts, runAdvisoryAlerts } from './handlers/advisory-alerts.js';
import { createShopHandlers } from './handlers/shop-order.js';

// Only Cashfree PG calls use this diagnostic transport. The actual order,
// identity and entitlement rules stay inside handlers/cashfree.js unchanged.
const { handleCashfreeOrder, handleCashfreeOrderStatus, handleBhaktiAccess } = createCashfreeHandlers({
  request:cashfreeTransportFetch
});

// Merchandise checkout: Cashfree calls go through the same diagnostic transport; nothing else is shared.
const { handleShopCatalogue, handleShopQuote, handleShopOrder, handleShopStatus, handleShopWebhook, runShopFulfilmentCron } = createShopHandlers({
  fetchImpl: (url, options) => cashfreeTransportFetch(url, options)
});

// Music store (paid downloads + film licences): Cashfree calls use the same diagnostic transport; nothing else is shared.
const { handleMusicCatalogue, handleMusicOrder, handleMusicStatus, handleMusicDownload, handleMusicLicence, handleMusicWebhook } = createMusicHandlers({
  fetchImpl: (url, options) => cashfreeTransportFetch(url, options)
});

/* ------------------------------------------------------------------ router */
export default {
  async fetch(request, env, ctx){
    // Isolated server-to-server routes: do not inherit the public API's CORS.
    const businessPath = new URL(request.url).pathname.match(/^\/v1\/business\/([^/]+)$/);
    if(businessPath) return handleBusiness(request, env, businessPath[1]);
    if(new URL(request.url).pathname === '/admin/agentmail/outreach') return handleAgentMail(request, env);
    if(new URL(request.url).pathname === '/admin/creator-autopilot') return handleCreatorAutopilot(request,env);
    if(request.method === 'OPTIONS') return new Response(null, { headers: CORS });
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/+|\/+$/g, '');

    if(path === 'health') return handleHealth(env);
    if(path === 'voice/sarvam/byok' && request.method === 'POST') return handleSarvamVoice(request);
    // Server-to-server endpoint; no public CORS or booking confirmation until atomic persistence is integrated.
    if(path === 'booking/cashfree/webhook') return handleBookingCashfreeWebhook(request, env);
    // Server-to-server music-store webhook: signature-checked inside the handler, so it sits before the browser abuse guard.
    if(path === 'music/cashfree/webhook') return handleMusicWebhook(request, env);
    // Signed server-to-server Cashfree callback for shop orders; never IP-throttled so a real payment is not dropped.
    if(path === 'shop/cashfree/webhook') return handleShopWebhook(request, env);
    if(path === 'stays/cashfree/webhook') return handleStayCashfreeWebhook(request, env);

    /* Flood / per-route limits and body-size cap (additive; see lib/rate-limit.js). */
    const refused = await abuseGuard(request, path);
    if(refused) return json({ error: refused.error }, refused.status);

    if(path === 'music/catalogue' && request.method === 'GET') return handleMusicCatalogue(request, env);
    if(path === 'music/order' && request.method === 'POST') return handleMusicOrder(request, env);
    { const m = /^music\/(order|download|licence)\/([^/]+)(?:\/status)?$/.exec(path);
      if(m && request.method === 'GET'){
        if(m[1] === 'order' && /\/status$/.test(path)) return handleMusicStatus(request, env, m[2]);
        if(m[1] === 'download') return handleMusicDownload(request, env, m[2]);
        if(m[1] === 'licence') return handleMusicLicence(request, env, m[2]);
      } }

    if(path === 'ai' && request.method === 'POST'){
      if(await aiGuard(request))
        return json({ error: 'Too many requests — try again in a minute.' }, 429);
      return handleAI(request, env);
    }

    if(path === 'kala/chat') return handleKala(request, env, path);

    if(path === 'tusk/report' && request.method === 'POST') return handleTuskReport(request, env);
    if(path === 'tusk/reports' && request.method === 'GET') return handleTuskReports(request, env);
    if(path === 'tusk/curated' && request.method === 'GET') return handleTuskCurated(request, env);
    if(path === 'tusk/learned' && request.method === 'GET') return handleTuskLearnedGet(request, env);
    if(path === 'tusk/learned' && request.method === 'POST') return handleTuskLearnedPost(request, env);
    if(path === 'tusk/learned/drop' && request.method === 'POST') return handleTuskLearnedDrop(request, env);

    if(path === 'geo') return handleGeo(request, env, ctx);

    if(path === 'leads') return handleLeads(request, env, ctx);

    if(path === 'news') return handleNews(request, env, ctx);

    if(path === 'events') return handleEvents(request, env, ctx);

    if(path === 'events/refresh') return handleEventsRefresh(request, env);

    if(path === 'stays/rates' && request.method === 'GET') return stayRates();
    if(path === 'stays/decide' && request.method === 'GET') return handleStayDecide(request, env);
    if(path === 'wallet' || /^wallet\/(keep|bank|link)$/.test(path)) return handleWallet(request, env, path);
    if(path === 'stays/quote' && request.method === 'POST') return stayQuote(request);
    if(path === 'stays/checkout' && request.method === 'POST') return createStayOrder(request,env);
    const stayCfStatus=path.match(/^stays\/status\/(rwstay_[a-f0-9]{32})$/);
    if(stayCfStatus && request.method === 'GET') return stayOrderStatus(request,env,stayCfStatus[1]);
    if(path === 'cashfree/order' && request.method === 'POST') return handleCashfreeOrder(request, env);
    if(path === 'bhakti/access' && request.method === 'GET') return handleBhaktiAccess(request, env);
    if(path === 'bhakti/order' && request.method === 'POST') return handleCashfreeOrder(request, env, true);
    const bhaktiStatus=path.match(/^bhakti\/order\/([^/]+)\/status$/);
    if(bhaktiStatus && request.method === 'GET')return handleCashfreeOrderStatus(request,env,bhaktiStatus[1],true);
    if(path === 'payment-events' && request.method === 'POST') return handlePaymentEvent(request, env);

    if(path === 'shop/catalogue' && request.method === 'GET') return handleShopCatalogue(request, env);
    if(path === 'shop/quote' && request.method === 'POST') return handleShopQuote(request, env);
    if(path === 'shop/order' && request.method === 'POST') return handleShopOrder(request, env);
    const shopStatus = path.match(/^shop\/order\/([^/]+)\/status$/);
    if(shopStatus && request.method === 'GET') return handleShopStatus(request, env, shopStatus[1]);

    if(path === 'partner/cashfree/order' && request.method === 'POST') return handlePartnerCashfreeOrder(request, env);

    const partnerCfStatus = path.match(/^partner\/cashfree\/order\/([^/]+)\/status$/);
    if(partnerCfStatus && request.method === 'GET') return handlePartnerCashfreeStatus(request, env, partnerCfStatus[1]);

    const cfStatus = path.match(/^cashfree\/order\/([^/]+)\/status$/);
    if(cfStatus && request.method === 'GET') return handleCashfreeOrderStatus(request, env, cfStatus[1]);

    if(path.indexOf('stay/') === 0) return handleStay(request, env, path);

    if(path.indexOf('bot/') === 0) return handleBot(request, env, path);

    if(path === 'push/send' && request.method === 'POST') return handlePushSend(request, env);

    if(path === 'email/unsubscribe' || path === 'admin/reminders/run') return handleReminders(request, env, path);

    if(path === 'admin/trip-notify/run') return handleTripNotify(request, env);

    if(path === 'admin/advisory-alerts/run') return handleAdvisoryAlerts(request, env);

    if(path === 'stay/lead') return handleStayLead(request, env);

    if(path === 'admin/ai-ca/review' && request.method === 'POST') return handleAICAReview(request, env);

    if(path === 'admin/invoices/sweep' && request.method === 'POST') return handleInvoiceSweep(request, env);

    if(path === 'admin/creator/ig-rating' && request.method === 'POST') return handleCreatorRating(request, env);
    if(path === 'admin/creator/public-check' && request.method === 'POST') return handleCreatorPublicCheck(request, env);

    if(path === 'nomad/advise' && request.method === 'POST') return handleNomadAdvise(request, env);

    return json({ error: 'not found', try: ['/health', '/ai', '/news', '/events', '/geo', '/leads', '/cashfree/order', '/partner/cashfree/order', '/push/send', '/admin/ai-ca/review', '/admin/invoices/sweep', '/admin/creator/ig-rating', '/nomad/advise', '/email/unsubscribe', '/admin/reminders/run', '/admin/trip-notify/run', '/admin/advisory-alerts/run', '/stay/enquiry', '/stay/lead', '/stay/confirm', '/bot/telegram', '/bot/whatsapp'] }, 404);
  },

  /* ONE scheduled handler. News daily; events on Mondays only, to stay well
     inside the Ticketmaster free quota. */
  async scheduled(event, env, ctx){
    /* Hourly trigger: booking acknowledgement emails only (guests expect a prompt reply). */
    if(event && event.cron === '0 * * * *'){
      try{ if(env.FIREBASE_SERVICE_ACCOUNT_JSON) await runTripNotifications(env, { mode: 'ack' }); }catch(e){ /* best-effort */ }
      /* New closures / crowds / events reach guests, followers and partners within the hour. Switches default OFF. */
      try{ if(env.FIREBASE_SERVICE_ACCOUNT_JSON) await runAdvisoryAlerts(env, {}); }catch(e){ /* best-effort */ }
      /* Paid shop orders not yet at Qikink (it was off or briefly down). No-op unless config/shop.qikinkEnabled. */
      try{ if(env.FIREBASE_SERVICE_ACCOUNT_JSON) await runShopFulfilmentCron(env); }catch(e){ /* retried next hour */ }
      /* Paid stays nobody confirmed in time go to the guest wallet; wallet credit past its hold goes back to the bank. */
      try{ await runStayDeadlines(env); }catch(e){ /* retried next hour */ }
      try{ await runWalletReleases(env); }catch(e){ /* retried next hour */ }
      return;
    }
    try{if(env.CREATOR_AUTOPILOT_ENABLED==='true') await runCreatorAutopilot(env);}catch(e){/* observe-only; no external sends */}
    try{
      await refreshNews(env);
      if(new Date().getUTCDay() === 1) await refreshEvents(env);
    }catch(e){ /* a cron failure must never take the Worker down */ }
    /* Invoices for any verified payment that has none (idempotent; no-op without the service account). */
    try{ if(env.FIREBASE_SERVICE_ACCOUNT_JSON) await runInvoiceSweepCron(env); }catch(e){ /* invoicing is best-effort; the admin page can re-run it */ }
    /* Inactivity reminder emails (7+ days away). No-ops until RESEND_API_KEY + EMAIL_UNSUB_SECRET are set. */
    try{ if(env.REMINDERS_ENABLED !== 'false' && env.FIREBASE_SERVICE_ACCOUNT_JSON) await runInactivityReminders(env); }catch(e){ /* reminders are best-effort */ }
    /* Booking acknowledgements + 3-day / 1-day trip reminders. Both switches default OFF (config/tripNotifySettings). */
    try{ if(env.FIREBASE_SERVICE_ACCOUNT_JSON) await runTripNotifications(env, { mode: 'all' }); }catch(e){ /* best-effort */ }
    /* Advisory alerts + the daily team travel-safety digest (config/tripNotifySettings switches, default OFF). */
    try{ if(env.FIREBASE_SERVICE_ACCOUNT_JSON) await runAdvisoryAlerts(env, { digest: true }); }catch(e){ /* best-effort */ }
    /* Guest stay requests are kept 12 months, then deleted (see privacy.html). */
    try{ if(env.FIREBASE_SERVICE_ACCOUNT_JSON) await purgeOldStayLeads(env); }catch(e){ /* retried tomorrow */ }
    /* Founder digest on Telegram/WhatsApp. Skipped unless the bot secrets and admin ids are set. */
    try{ if(env.BOT_ADMIN_TELEGRAM || env.BOT_ADMIN_WHATSAPP) await sendAdminDigest(env, botDeps(env)); }catch(e){ /* digest is best-effort */ }
  },
};
