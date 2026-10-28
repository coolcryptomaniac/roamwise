// @ts-nocheck
/* ==================== DIRECT BOOKING: one guest, one host, one code ====================
   The one-to-one flow on top of the stay codes in stay-code.js:

     1. Requested  — Tusk (or a page) sends a coded WhatsApp enquiry straight to the host
                     with the dates and guests filled in. Mountain advisories for that place
                     and date are shown first (mountain-conditions.js).
     2. Confirmed  — the host replies on WhatsApp; the guest taps "Host confirmed".
                     Or Declined / Cancelled.
     3. Check-in   — two days before, a reminder card: the code, "pay the property as agreed,
                     RoamWise adds Rs 0", and any road or temple advisory.
     4. Stayed     — the existing "Did you stay?" confirm at /stay/?c=CODE (stay-code.js).

   Deliberate limits: no payment, auth or Firestore code. Nothing leaves the device except
   the code registration stay-code.js already does. Status is the guest's own record on this
   device; the host's word is on WhatsApp. Classic script; helpers are guarded for node tests. */

var RW_DIRECT_STATUSES = ['requested', 'confirmed', 'declined', 'cancelled'];
var RW_DIRECT_NEXT = { requested: ['confirmed', 'declined', 'cancelled'], confirmed: ['cancelled'], declined: [], cancelled: [] };

function rwDirectToday(){
  var d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function rwDirectAddDays(iso, n){
  var d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

/* Send the request. partner: a live partner record; d: {checkIn, nights, guests, rooms, budget, note}.
   Returns { ok, code, url, conditions } or { ok:false, error }. Opening the link is the caller's job. */
function rwDirectRequest(partner, d){
  d = d || {};
  if(!partner) return { ok: false, error: 'no property' };
  if(!/^20\d\d-\d\d-\d\d$/.test(String(d.checkIn || ''))) return { ok: false, error: 'checkIn must be YYYY-MM-DD' };
  if(String(d.checkIn) < rwDirectToday()) return { ok: false, error: 'checkIn is in the past' };
  var guests = Math.round(+d.guests || 0);
  if(guests < 1 || guests > 50) return { ok: false, error: 'guests must be 1 to 50' };
  if(typeof rwStayEnquiryFor !== 'function') return { ok: false, error: 'enquiry desk unavailable' };
  var place = [partner.zone, partner.area].filter(Boolean).join(' ');
  var conditions = typeof rwConditionsFor === 'function' ? rwConditionsFor(place, d.checkIn) : [];
  var r = rwStayEnquiryFor(partner, { checkIn: d.checkIn, nights: d.nights, guests: guests, rooms: d.rooms, budget: d.budget, note: d.note });
  if(!r.ok) return r;
  var list = rwStayLoad();
  for(var i = list.length - 1; i >= 0; i--){
    if(list[i].code === r.code){
      list[i].direct = true; list[i].status = 'requested'; list[i].statusAt = Date.now();
      list[i].checkIn = d.checkIn; list[i].nights = Math.max(1, Math.round(+d.nights || 1)); list[i].guests = guests;
      list[i].zone = partner.zone || '';
      break;
    }
  }
  rwStaySave(list);
  return { ok: true, code: r.code, url: r.url, conditions: conditions };
}

/* Guest records what the host said. Only forward moves are allowed. */
function rwDirectSetStatus(code, status){
  if(RW_DIRECT_STATUSES.indexOf(status) === -1) return { ok: false, error: 'unknown status' };
  var list = rwStayLoad(), hit = null;
  for(var i = 0; i < list.length; i++){ if(list[i].code === code && list[i].direct){ hit = list[i]; break; } }
  if(!hit) return { ok: false, error: 'no direct booking with that code on this device' };
  var from = hit.status || 'requested';
  if((RW_DIRECT_NEXT[from] || []).indexOf(status) === -1) return { ok: false, error: 'cannot go from ' + from + ' to ' + status };
  hit.status = status; hit.statusAt = Date.now();
  rwStaySave(list);
  return { ok: true, code: code, status: status };
}

/* The guest's direct bookings, newest first, without the private secret. */
function rwDirectList(){
  return rwStayLoad().filter(function(s){ return s.direct; }).reverse().map(function(s){
    return { code: s.code, property: s.name, partnerId: s.partnerId, zone: s.zone, checkIn: s.checkIn,
      nights: s.nights, guests: s.guests, status: s.status || 'requested', stayed: !!s.answered };
  });
}

/* What, if anything, to show now. Pure apart from reading the list. */
function rwDirectDue(nowMs){
  var now = nowMs || Date.now(), today = rwDirectToday(), soon = rwDirectAddDays(today, 2), HOUR = 3600000;
  var list = rwStayLoad();
  for(var i = 0; i < list.length; i++){
    var s = list[i];
    if(!s.direct || !s.checkIn) continue;
    if(s.status === 'confirmed' && s.checkIn >= today && s.checkIn <= soon && !s.remindedAt) return { kind: 'checkin', entry: s };
  }
  for(var j = 0; j < list.length; j++){
    var e = list[j];
    if(!e.direct || !e.checkIn || (e.status || 'requested') !== 'requested') continue;
    if(e.checkIn >= today && now - e.at > 6 * HOUR && now - (e.askedAt || 0) > 24 * HOUR) return { kind: 'ask', entry: e };
  }
  return null;
}

function rwDirectCard(){
  try{
    if(document.getElementById('rwDirectCard') || document.getElementById('rwStayNudge')) return;
    var due = rwDirectDue();
    if(!due) return;
    var s = due.entry, list = rwStayLoad(), i;
    for(i = 0; i < list.length; i++){
      if(list[i].code === s.code){ if(due.kind === 'checkin') list[i].remindedAt = Date.now(); else list[i].askedAt = Date.now(); }
    }
    rwStaySave(list);
    var box = document.createElement('div');
    box.id = 'rwDirectCard'; box.setAttribute('role', 'status');
    box.style.cssText = 'position:fixed;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:9000;max-width:440px;margin:0 auto;background:#14211c;color:#fff;border:1px solid rgba(255,255,255,.18);border-radius:14px;padding:12px 14px;font:14px/1.45 system-ui,sans-serif;box-shadow:0 8px 28px rgba(0,0,0,.35)';
    var head = document.createElement('div'); head.style.cssText = 'font-weight:700;margin-bottom:4px';
    var body = document.createElement('div'); body.style.cssText = 'opacity:.9;margin-bottom:8px';
    var row = document.createElement('div'); row.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap';
    var btn = function(label, primary, fn){
      var b = document.createElement('button'); b.type = 'button'; b.textContent = label;
      b.style.cssText = 'min-height:44px;border-radius:10px;padding:0 14px;cursor:pointer;' + (primary ? 'background:#2f8f6b;border:0;color:#fff;font-weight:700' : 'background:transparent;border:1px solid rgba(255,255,255,.3);color:#fff');
      b.onclick = function(){ try{ if(fn) fn(); }catch(e){ /* best-effort, ignore */ } box.remove(); };
      row.appendChild(b);
    };
    var who = s.name || 'the host';
    if(due.kind === 'ask'){
      head.textContent = 'Did ' + who + ' confirm your stay?';
      body.textContent = 'Check-in ' + s.checkIn + ' · code ' + s.code + '. Tap what the host said on WhatsApp.';
      btn('Host confirmed', true, function(){ rwDirectSetStatus(s.code, 'confirmed'); });
      btn('Not yet', false, null);
      btn('Declined', false, function(){ rwDirectSetStatus(s.code, 'declined'); });
    } else {
      head.textContent = 'Check-in at ' + who + ' on ' + s.checkIn;
      body.textContent = 'Booking code ' + s.code + '. Pay the property directly, as agreed on WhatsApp. RoamWise adds Rs 0 to your total.';
      var c = typeof rwConditionsFor === 'function' ? rwConditionsFor(s.zone || '', s.checkIn) : [];
      if(c.length && typeof RWConditions !== 'undefined'){ var w = document.createElement('div'); w.innerHTML = RWConditions.html(c); body.appendChild(w); }
      btn('Got it', true, null);
      btn('Cancelled', false, function(){ rwDirectSetStatus(s.code, 'cancelled'); });
    }
    box.appendChild(head); box.appendChild(body); box.appendChild(row);
    document.body.appendChild(box);
  }catch(e){ /* best-effort: a reminder must never break the page */ }
}
if(typeof window !== 'undefined' && typeof document !== 'undefined' && document.addEventListener){
  window.addEventListener('load', function(){ setTimeout(rwDirectCard, 7000); });
}
