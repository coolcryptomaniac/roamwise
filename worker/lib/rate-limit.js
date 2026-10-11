/* ============================================================================
   worker/lib/rate-limit.js — generic per-key N-per-window limiter (additive).
   ============================================================================
   Uses the Cloudflare Cache API (free, no KV writes — see the "staying free"
   note in lib/http.js). Each hit claims one "slot" key for the current window;
   when all `limit` slots are taken the caller is limited.

   Honest limits: the cache is per data-centre and not atomic, so this is a
   speed bump against floods and scripts, not an exact meter. It FAILS OPEN
   (never blocks real users because the limiter itself broke). Money and
   entitlement checks stay in their own handlers and are not touched here.
   ========================================================================= */

export async function sha256Hex(text){
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(text)));
  return Array.from(new Uint8Array(buf)).slice(0, 12).map(b => b.toString(16).padStart(2, '0')).join('');
}

/* Returns true when this hit is OVER the limit. */
export async function overLimit(name, key, limit, windowSec, cacheImpl){
  try{
    const cache = cacheImpl || caches.default;
    const win = Math.floor(Date.now() / (windowSec * 1000));
    for(let i = 0; i < limit; i++){
      const k = new Request(`https://rl.invalid/${name}/${key}/${win}/${i}`);
      if(!(await cache.match(k))){
        await cache.put(k, new Response('1', { headers: { 'Cache-Control': `max-age=${windowSec}` } }));
        return false;
      }
    }
    return true;
  }catch(e){ return false; }
}

export function clientIp(request){
  return request.headers.get('CF-Connecting-IP') || 'anon';
}

/* Public routes → [name, limit, windowSec]. Limits are per IP and sized for
   a college Wi-Fi where many students share one address. */
export const ROUTE_LIMITS = {
  'cashfree/order':          ['cf-order', 60, 600],
  'partner/cashfree/order':  ['pcf-order', 60, 600],
  'payment-events':          ['pay-ev', 300, 600],
  'leads':                   ['leads', 12, 600],
  'status':                  ['cf-status', 200, 600],
  'ai-anon':                 ['ai-anon', 20, 60],
  'flood':                   ['flood', 600, 60]
};

export function routeKey(path, method){
  if(method === 'POST' && ROUTE_LIMITS[path]) return path;
  if(path === 'leads') return 'leads';
  if(method === 'GET' && /^(partner\/)?cashfree\/order\/[^/]+\/status$/.test(path)) return 'status';
  return null;
}

export const MAX_BODY_BYTES = 65536;   /* public JSON routes never need more */

/* Returns a {status, error} when the request should be refused, else null. */
export async function abuseGuard(request, path, cacheImpl){
  if(path === 'health') return null;
  /* Read-only public data routes are already cached at the edge and are hit by everyone on a shared Wi-Fi; never throttle them. */
  if(request.method === 'GET' && /^(geo|news|events)$/.test(path)) return null;
  const ip = clientIp(request);
  const len = Number(request.headers.get('content-length') || 0);
  const rk = routeKey(path, request.method);
  if(rk && request.method === 'POST' && len > MAX_BODY_BYTES) return { status: 413, error: 'request_too_large' };
  if(await overLimit(ROUTE_LIMITS.flood[0], ip, ROUTE_LIMITS.flood[1], ROUTE_LIMITS.flood[2], cacheImpl))
    return { status: 429, error: 'Too many requests — slow down and try again shortly.' };
  if(rk){
    const [name, limit, win] = ROUTE_LIMITS[rk];
    if(await overLimit(name, ip, limit, win, cacheImpl))
      return { status: 429, error: 'Too many requests — try again in a few minutes.' };
  }
  return null;
}

/* /ai: one request per signed-in user per minute (keyed by a hash of the
   bearer token, so a whole college sharing one IP is NOT throttled together).
   Requests with no token get a looser per-IP limit and are rejected as 401
   by the handler anyway. */
export async function aiGuard(request, cacheImpl){
  const m = /^Bearer\s+(.+)$/i.exec(request.headers.get('authorization') || '');
  if(m) return overLimit('ai-user', await sha256Hex(m[1]), 1, 60, cacheImpl);
  const [name, limit, win] = ROUTE_LIMITS['ai-anon'];
  return overLimit(name, clientIp(request), limit, win, cacheImpl);
}
