/* ============================================================================
   worker/lib/turnstile.js — Cloudflare Turnstile (captcha) verifier. DORMANT.
   ============================================================================
   Does nothing until the TURNSTILE_SECRET Worker secret is set. Once set:
     - a request that carries a token (header X-Turnstile-Token) is verified,
       and rejected if the check fails;
     - a request with no token is rejected only if TURNSTILE_REQUIRED === 'true'
       (leave it off until the front-end widget sends tokens).
   Not wired into payment routes: payments are protected by sign-in, server-side
   price checks and the rate limits in lib/rate-limit.js.
   ========================================================================= */

export async function verifyTurnstile(request, env, fetchImpl){
  if(!env || !env.TURNSTILE_SECRET) return { ok: true, skipped: true };
  const token = request.headers.get('X-Turnstile-Token') || '';
  if(!token) return env.TURNSTILE_REQUIRED === 'true' ? { ok: false, reason: 'captcha_required' } : { ok: true, skipped: true };
  try{
    const body = new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: token });
    const ip = request.headers.get('CF-Connecting-IP');
    if(ip) body.set('remoteip', ip);
    const r = await (fetchImpl || fetch)('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
    const d = await r.json();
    return d && d.success ? { ok: true } : { ok: false, reason: 'captcha_failed' };
  }catch(e){
    return { ok: true, skipped: true };   /* Cloudflare unreachable: fail open, never block real users */
  }
}
