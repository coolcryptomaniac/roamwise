// @ts-nocheck
/* ==================== TUSK STAY DESK: the "honest receipt" ====================
   When a traveller tells Ailon Tusk "book a room in Manali 12 to 15 Nov for 2",
   Tusk reads the dates and guests from the message and shows, BEFORE anything
   is sent or paid, an itemised receipt built only from the property's own
   numbers: nights x the property's listed rate, what RoamWise charges the guest
   (always Rs 0), what the property keeps after RoamWise's fee, and the
   cancellation terms exactly as the property set them. It then opens the
   existing partner booking desk with the dates already filled in.

   Deliberate limits (policy + safety):
   - No payment, auth or Firestore code is touched. The request, the property's
     confirmation and the pay button stay on /partner/ exactly as before.
   - Nothing is invented: no availability, no taxes, no comparison with other
     sites' prices. A missing rate shows "rate on request".
   - Dates and guests from the chat are used only to build the link and the
     receipt on this device; they are not stored or sent anywhere by this file.
   Classic script; helpers are guarded so tests can load it in a sandbox. */

var RW_SD_MON = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];

function rwSdIso(d){
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}
function rwSdAddDays(d, n){ var x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x; }
/* Next occurrence of day/month on or after today. */
function rwSdDate(day, mi, today){
  var y = today.getFullYear(), d = new Date(y, mi, day, 12, 0, 0);
  if(d.getMonth() !== mi) return null;
  if(d < new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0)) d = new Date(y + 1, mi, day, 12, 0, 0);
  return d.getMonth() === mi ? d : null;
}
function rwSdMonthIdx(s){ return RW_SD_MON.indexOf(String(s||'').slice(0,3).toLowerCase()); }

/* Reads "12 to 15 Nov", "12-15 november", "20 Nov for 3 nights", "tomorrow for 2 nights".
   Returns {checkIn, checkOut, nights} (ISO strings) or null. Never guesses a missing end. */
function rwSdParseDates(raw, now){
  var t = String(raw||'').toLowerCase(), today = now || new Date(), m, a, b;
  var MON = '(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*';
  m = t.match(new RegExp('\\b(\\d{1,2})(?:st|nd|rd|th)?\\s*(?:to|till|until|-|\\u2013)\\s*(\\d{1,2})(?:st|nd|rd|th)?\\s*' + MON + '\\b'));
  if(m){
    var mi = rwSdMonthIdx(m[3]); a = rwSdDate(+m[1], mi, today);
    if(a){ b = new Date(a.getFullYear(), mi, +m[2], 12, 0, 0); if(b.getMonth() !== mi) b = null; }
    if(a && b && b > a) return rwSdOut(a, b);
  }
  m = t.match(new RegExp('\\b(\\d{1,2})(?:st|nd|rd|th)?\\s*' + MON + '\\s*(?:to|till|until|-|\\u2013)\\s*(\\d{1,2})(?:st|nd|rd|th)?\\s*' + MON + '\\b'));
  if(m){
    a = rwSdDate(+m[1], rwSdMonthIdx(m[2]), today);
    if(a){ b = new Date(a.getFullYear(), rwSdMonthIdx(m[4]), +m[3], 12, 0, 0); if(b < a) b = new Date(a.getFullYear() + 1, rwSdMonthIdx(m[4]), +m[3], 12, 0, 0); }
    if(a && b && b > a) return rwSdOut(a, b);
  }
  var nm = t.match(/\b(\d{1,2})\s*nights?\b/), n = nm ? +nm[1] : 0;
  var start = null;
  if(/\btomorrow\b/.test(t)){ start = rwSdAddDays(new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12), 1); }
  else if(/\btoday\b|\btonight\b/.test(t)){ start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12); }
  else{
    m = t.match(new RegExp('\\b(?:from\\s+|on\\s+)?(\\d{1,2})(?:st|nd|rd|th)?\\s*' + MON + '\\b'));
    if(m) start = rwSdDate(+m[1], rwSdMonthIdx(m[2]), today);
  }
  if(start && n >= 1 && n <= 60) return rwSdOut(start, rwSdAddDays(start, n));
  return null;
}
function rwSdOut(a, b){
  return { checkIn: rwSdIso(a), checkOut: rwSdIso(b), nights: Math.round((b - a) / 86400000) };
}
function rwSdGuests(raw){
  var m = String(raw||'').match(/\b(\d{1,2})\s*(?:guests?|people|persons?|pax|adults?)\b/i) || String(raw||'').match(/\bfor\s+(\d{1,2})\b(?!\s*(?:nights?|days?|k\b|,|\d))/i);
  var n = m ? +m[1] : 0;
  return n >= 1 && n <= 12 ? n : 0;
}
/* A room-booking ask: a booking word plus a stay word. Not "best hotels", not questions about price history. */
function rwSdIsStayAsk(raw){
  var t = String(raw||'').toLowerCase();
  if(t.length > 300) return false;
  return /\b(book|reserve|booking|get me|arrange)\b/.test(t) && /\b(room|rooms|stay|hotel|homestay|cottage|villa|resort)\b/.test(t);
}

function rwSdMoney(n){ return '₹' + Math.round(Number(n)||0).toLocaleString('en-IN'); }
function rwSdEsc(s){
  return (typeof esc2 === 'function') ? esc2(String(s)) : String(s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; });
}

/* One receipt card for one room. Pure: same inputs, same HTML. */
function rwSdReceiptHTML(room, dates, guests, destLabel){
  var e = rwSdEsc, rate = Math.round(+room.price || 0), n = dates.nights;
  var terms = window.RW_BOOK_TERMS || {}, feePct = Number(terms.commissionPct) || 7;
  var rows = [];
  if(rate > 0 && typeof rwStayQuote === 'function'){
    var q = rwStayQuote({ rate: rate, nights: n, rooms: 1, policy: room.policy, feePct: feePct });
    rows.push(['Room', rwSdMoney(rate) + ' × ' + n + ' night' + (n > 1 ? 's' : '') + ' = <b>' + rwSdMoney(q.total) + '</b>']);
    rows.push(['RoamWise charges you', '<b>₹0</b> (the property pays RoamWise ' + feePct + '% only after a completed stay)']);
    rows.push(['The property keeps', rwSdMoney(q.propertyReceives) + ' of ' + rwSdMoney(q.total)]);
    rows.push(['Taxes', 'set and shown by the property at confirmation — not added here']);
  }else{
    rows.push(['Room', 'Rate on request — the property confirms the exact total']);
    rows.push(['RoamWise charges you', '<b>₹0</b>']);
  }
  var cancel = (room.cancel && String(room.cancel)) || ((typeof rwStayPolicyText === 'function' && room.policy) ? rwStayPolicyText(room.policy) : '');
  rows.push(['Cancellation', cancel ? e(cancel) + ' <span class="rw-note">(set by the property)</span>' : 'Not stated — ask the property before you pay']);
  rows.push(['Payment', 'Choose your payment method in the booking desk. Nothing is taken until the property confirms this exact room, dates and total and you accept them.']);
  rows.push(['Changes & refunds', 'Ask the property to approve changes or cancellation; refund handling depends on the confirmed terms and payment method.']);
  var href = '/partner/?role=customer&destination=' + encodeURIComponent(room.zone || room.area || destLabel || '')
    + '&checkin=' + dates.checkIn + '&checkout=' + dates.checkOut + (guests ? '&guests=' + guests : '');
  return '<div style="padding:10px 0;border-bottom:1px solid var(--b2,#2A2A36)">'
    + '<div style="font-weight:850">' + e(room.property) + ' <span style="font-weight:500;font-size:11px;color:var(--t3)">· ' + e(room.room) + ' · ' + e(room.area || room.zone || '') + '</span></div>'
    + '<p class="rw-note">Listed-price estimate · not a confirmed quote or reservation. The property must confirm availability and the final total.</p>'
    + '<table style="width:100%;font-size:11.5px;margin:6px 0;border-collapse:collapse">'
    + rows.map(function(r){ return '<tr><td style="padding:3px 8px 3px 0;color:var(--t3);vertical-align:top;white-space:nowrap">' + e(r[0]) + '</td><td style="padding:3px 0">' + r[1] + '</td></tr>'; }).join('')
    + '</table>'
    + '<a class="tk-chip gold" href="' + e(href) + '" onclick="try{track(\'tusk_verified_stay_handoff\')}catch(x){}">Send request to the property →</a>'
    + '</div>';
}

/* The whole answer. Returns {html, dates, guests, count} or null when this is not a clear stay ask. */
function rwStayDeskAnswer(raw, dest, now){
  if(!rwSdIsStayAsk(raw) || typeof rwTuskStayMatches !== 'function') return null;
  var dates = rwSdParseDates(raw, now);
  var guests = rwSdGuests(raw);
  var list = rwTuskStayMatches(raw, dest) || [];
  var e = rwSdEsc, label = dest ? ' in ' + e(dest) : '';
  if(!dates){
    return { html: '<div class="tk-card tk-mini"><div class="tk-sec"><b>Happy to set up a stay' + label + '.</b>'
      + '<div style="font-size:11.5px;color:var(--t2);margin-top:5px">Tell me the dates, for example <i>12 to 15 Nov</i> or <i>20 Nov for 3 nights</i>' + (guests ? '' : ', and how many guests') + '. Then I will show an estimate before anything is sent.</div></div></div>', dates: null, guests: guests, count: list.length };
  }
  if(!list.length){
    var partners=typeof rwTuskPartnerStayHTML==='function'?rwTuskPartnerStayHTML(raw,dest):'';
    if(partners) return {html:partners,dates:dates,guests:guests,count:0};
    return { html: '<div class="tk-card tk-mini"><div class="tk-sec"><b>No verified RoamWise stay matches' + label + ' for these dates yet.</b>'
      + '<div style="font-size:11.5px;color:var(--t2);margin-top:5px">I will not guess availability. You can still browse the verified stays page, or compare other sites yourself.</div>'
      + '<div class="tk-chips" style="margin-top:8px"><a class="tk-chip gold" href="/partner/?role=customer&amp;destination=' + encodeURIComponent(dest || '') + '&amp;checkin=' + dates.checkIn + '&amp;checkout=' + dates.checkOut + '">Browse verified stays →</a></div></div></div>', dates: dates, guests: guests, count: 0 };
  }
  var head = '🧾 Your stay estimate' + label + ' · ' + dates.checkIn + ' → ' + dates.checkOut + ' (' + dates.nights + ' night' + (dates.nights > 1 ? 's' : '') + (guests ? ', ' + guests + ' guest' + (guests > 1 ? 's' : '') : '') + ')';
  return { html: '<div class="tk-card tk-mini"><div class="tk-sec"><div style="font-weight:850;font-size:13.5px;margin-bottom:4px">' + head + '</div>'
    + list.slice(0, 3).map(function(r){ return rwSdReceiptHTML(r, dates, guests, dest); }).join('')
    + '<div style="font-size:10.5px;color:var(--t3);margin-top:8px">Availability is confirmed only by the property. Sending a request does not charge you; you sign in on the next page and pay only after the property says yes.</div></div></div>',
    dates: dates, guests: guests, count: list.length };
}

/* copilotSend hook (via rwTuskPreAnswer). Returns true when it answered. */
function rwStayDeskReply(bubble, intents, t){
  try{
    var a = rwStayDeskAnswer(t, intents && intents.dest, new Date());
    if(!a) return false;
    intents._stayDesk = true;
    cpFinish(bubble, a.html, intents, t);
    return true;
  }catch(err){ return false; }
}

/* Trip booking uses known inventory, so it must not depend on an AI quota. */
function rwTuskBookingReply(bubble,intents,raw){
  if(!/\b(?:book|reserve|pay for)\b[^.!?]{0,35}\b(?:this|my|the)?\s*(?:trip|plan|itinerary|holiday)\b|\bbook this\b/i.test(String(raw||''))) return false;
  if(typeof rwTuskPlanBookingHTML!=='function') return false;
  var ctx=typeof _cpCtx!=='undefined'&&_cpCtx||{};
  var dest=intents.dest||ctx.dest||'', days=intents.days||ctx.days||null;
  intents.dest=dest;
  intents._stayDesk=true;
  cpFinish(bubble,rwTuskPlanBookingHTML(raw,dest,days),intents,raw);
  return true;
}
