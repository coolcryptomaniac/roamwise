// @ts-nocheck
/* ============================================================================
   STAY CODE — a short reference on every enquiry, and a "did you stay?" nudge
   ============================================================================
   When a guest taps "Ask the hotel on WhatsApp", the message carries a code
   such as RW-7KQ2MX and a link to confirm the stay later. The browser keeps a
   private secret for that code; the Worker stores only its SHA-256. Only the
   browser that made the enquiry can later confirm "I stayed", so a property
   cannot confirm or deny on a guest's behalf.

   Stores no name, phone or email. Never touches payment. If the Worker is not
   configured, enquiries still work: the code simply is not registered.
   ========================================================================= */
var RW_STAY_KEY = 'rw_stay_codes_v1';
var RW_STAY_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function rwStayRandom(n, alphabet){
  var out = '', i, bytes = null;
  try{ bytes = new Uint8Array(n); (window.crypto || window.msCrypto).getRandomValues(bytes); }catch(e){ bytes = null; }
  for(i = 0; i < n; i++){
    var r = bytes ? bytes[i] : Math.floor(Math.random() * 256);
    out += alphabet.charAt(r % alphabet.length);
  }
  return out;
}
function rwStayNewCode(){ return 'RW-' + rwStayRandom(6, RW_STAY_ALPHABET); }
function rwStayNewSecret(){ return rwStayRandom(24, 'abcdefghijkmnpqrstuvwxyz23456789'); }

function rwStayLoad(){
  try{ var v = JSON.parse(localStorage.getItem(RW_STAY_KEY) || '[]'); return Array.isArray(v) ? v : []; }catch(e){ return []; }
}
function rwStaySave(list){
  try{ localStorage.setItem(RW_STAY_KEY, JSON.stringify(list.slice(-30))); }catch(e){}
}
async function rwStaySha256(text){
  var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(text)));
  return Array.prototype.map.call(new Uint8Array(buf), function(b){ return ('0' + b.toString(16)).slice(-2); }).join('');
}
function rwStayApi(path){
  return typeof window.rwApi === 'function' ? window.rwApi(path) : null;
}

/* The enquiry text, with the code and confirm link appended. */
function rwStayMessage(baseText, code){
  return baseText + '\n\nRoamWise booking code: ' + code
    + '\nAfter your stay, confirm it here: https://roamwise.co.in/stay/?c=' + code;
}

/* Register a code with the Worker. Fire-and-forget: never blocks the WhatsApp tap. */
async function rwStayRegister(code, secret, partnerId){
  var url = rwStayApi('stay/enquiry');
  if(!url) return false;
  try{
    var res = await fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: true,
      body: JSON.stringify({ code: code, partnerId: partnerId, secretHash: await rwStaySha256(secret) })
    });
    return res.ok;
  }catch(e){ return false; }
}

/* Anchor onclick: swap in a fresh code just before the browser follows the link. */
function rwStayWaClick(a){
  try{
    var partnerId = a.getAttribute('data-pid') || '', name = a.getAttribute('data-pname') || '';
    if(!/^[A-Za-z0-9_-]{2,60}$/.test(partnerId)) return true;
    var base = a.getAttribute('data-wa-text');
    var href = a.getAttribute('data-wa-base');
    if(!base || !href) return true;
    var code = rwStayNewCode(), secret = rwStayNewSecret();
    a.href = href + '?text=' + encodeURIComponent(rwStayMessage(base, code));
    var list = rwStayLoad();
    list.push({ code: code, secret: secret, partnerId: partnerId, name: name || '', at: Date.now(), answered: false });
    rwStaySave(list);
    rwStayRegister(code, secret, partnerId);
  }catch(e){}
  return true;
}

/* Build a coded WhatsApp enquiry for a partner (used by Tusk / trip chat). Same code + secret
   mechanism as the listing button, plus the trip details the guest already gave. Returns
   { ok, url, code } or { ok:false, error }. Opening the link is left to the caller. */
function rwStayEnquiryFor(partner, d){
  try{
    d = d || {};
    if(!partner || typeof rwBookingRoutes !== 'function') return { ok: false, error: 'no property' };
    var wa = rwBookingRoutes(partner).filter(function(r){ return r.type === 'whatsapp'; })[0];
    if(!wa) return { ok: false, error: 'This property takes enquiries another way (website, phone or direct booking).' };
    var pid = String(partner.id || '');
    if(!/^[A-Za-z0-9_-]{2,60}$/.test(pid)) return { ok: false, error: 'bad property id' };
    var lines = ['Hello ' + partner.name + ', I found your stay through RoamWise.'];
    if(d.checkIn) lines.push('Dates: check-in ' + d.checkIn + (d.nights ? ' for ' + d.nights + ' night' + (d.nights > 1 ? 's' : '') : '') + '.');
    if(d.guests) lines.push('Guests: ' + d.guests + (d.rooms ? ' in ' + d.rooms + ' room' + (d.rooms > 1 ? 's' : '') : '') + '.');
    if(d.budget) lines.push('Budget: about \u20b9' + Number(d.budget).toLocaleString('en-IN') + ' per night.');
    if(d.note) lines.push(String(d.note).slice(0, 200));
    lines.push('Please share availability, the final total including applicable taxes, payment method and booking terms.');
    var code = rwStayNewCode(), secret = rwStayNewSecret();
    var list = rwStayLoad();
    list.push({ code: code, secret: secret, partnerId: pid, name: partner.name || '', at: Date.now(), answered: false });
    rwStaySave(list);
    rwStayRegister(code, secret, pid);
    return { ok: true, code: code, url: wa.href + '?text=' + encodeURIComponent(rwStayMessage(lines.join('\n'), code)) };
  }catch(e){ return { ok: false, error: 'could not prepare the enquiry' }; }
}

/* Gentle once-a-day nudge for enquiries older than 3 days that were never answered. */
function rwStayNudge(){
  try{
    var list = rwStayLoad(), now = Date.now(), DAY = 86400000, due = null, i;
    for(i = 0; i < list.length; i++){
      var s = list[i];
      if(!s.answered && now - s.at > 3 * DAY && now - s.at < 120 * DAY && now - (s.nudgedAt || 0) > DAY){ due = s; break; }
    }
    if(!due || document.getElementById('rwStayNudge')) return;
    due.nudgedAt = now; rwStaySave(list);
    var box = document.createElement('div');
    box.id = 'rwStayNudge';
    box.setAttribute('role', 'status');
    box.style.cssText = 'position:fixed;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:9000;max-width:420px;margin:0 auto;background:#1b1530;color:#fff;border:1px solid rgba(255,255,255,.18);border-radius:14px;padding:12px 14px;font:14px/1.4 system-ui,sans-serif;box-shadow:0 8px 28px rgba(0,0,0,.35)';
    var label = due.name ? 'Did you stay at ' + due.name + '?' : 'Did you stay at the place you enquired about?';
    box.innerHTML = '<div style="font-weight:600;margin-bottom:6px"></div>'
      + '<div style="display:flex;gap:8px;flex-wrap:wrap"><a style="color:#fff;background:#6d3df0;border-radius:10px;padding:10px 14px;text-decoration:none;min-height:44px;box-sizing:border-box" href="/stay/?c=' + due.code + '">Confirm</a>'
      + '<button type="button" style="min-height:44px;border-radius:10px;border:1px solid rgba(255,255,255,.3);background:transparent;color:#fff;padding:0 14px">Later</button></div>';
    box.firstChild.textContent = label;
    box.querySelector('button').onclick = function(){ box.remove(); };
    document.body.appendChild(box);
  }catch(e){}
}
if(typeof window !== 'undefined' && typeof document !== 'undefined'){
  window.addEventListener('load', function(){ setTimeout(rwStayNudge, 5000); });
}
