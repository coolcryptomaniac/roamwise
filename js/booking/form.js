// @ts-nocheck
/* Moved from app.js (Phase 3 modularization) — the booking form + pay flow:
   the INSTANT BOOKING ENGINE (room search/booking form/UPI pay/confirm/
   notify-owner) and the REQUEST TO BOOK basket scaffolding. Pure code
   motion, zero logic changes. Depends on globals defined elsewhere in
   app.js (rwPageOpen, rwForm, rwOverlayClose, esc2, showToast, lsGet/lsSet,
   rwWhatsShare, rwBookingText, rwSanitizeRefCode, rwRefActive) and on
   RW_ROOMS/RW_BOOK_TERMS (rooms-data.js) / RW_BOOK_CATS (booking-data.js),
   all already loaded by the time these are invoked at runtime. */

/* ============================================================================
   INSTANT BOOKING ENGINE (rw-v84) — pilot
   ============================================================================
   Researched against MakeMyTrip, Booking.com, Agoda, Expedia and OYO. Two
   things they all do that we deliberately do NOT:
     · they charge the property 15-25%  -> we charge 8%
     · they hold the money 7-14 days    -> the guest pays the property DIRECT
   Those two facts are the entire reason a property lists with a platform that
   has 20 users. Everything below is built to preserve them.
   ========================================================================= */
function rwRoomsFor(zone){
  var list=(window.RW_ROOMS||[]).slice();
  if(zone) list=list.filter(function(r){ return String(r.zone).toLowerCase()===String(zone).toLowerCase(); });
  return list;
}
function rwNights(a,b){
  try{ var d=(new Date(b)-new Date(a))/86400000; return d>0? Math.round(d):1; }catch(e){ return 1; }
}
function openStays(zone){
  window._stZone = (zone!==undefined? zone : window._stZone) || '';
  rwPageOpen('stays', function(body){
    var zones={}; (window.RW_ROOMS||[]).forEach(function(r){ zones[r.zone]=1; });
    body.innerHTML='<div class="st-save">\ud83d\udcb8 <b>You pay the property directly.</b> We take 8% from them afterwards \u2014 other platforms take 15\u201325%, which is why their rooms cost more.</div>'
      +'<div class="pt-chips" style="margin:12px 0">'
      +'<button class="ev-chip'+(!window._stZone?' on':'')+'" onclick="openStays(\'\')">Everywhere</button>'
      + Object.keys(zones).map(function(z){
          return '<button class="ev-chip'+(window._stZone===z?' on':'')+'" onclick="openStays(\''+z+'\')">'+esc2(z)+'</button>';
        }).join('')
      +'</div><div id="staysOut"></div>';
    rwStaysRender();
  });
}
function rwStaysRender(){
  var host=el('staysOut'); if(!host) return;
  var list=rwRoomsFor(window._stZone);
  if(!list.length){ host.innerHTML='<div class="note" style="text-align:center;padding:22px;color:var(--t3)">No rooms listed here yet.</div>'; return; }
  host.innerHTML=list.map(function(r){
    return '<div class="st-card">'
      +'<div class="st-top"><span style="flex:1;min-width:0">'
      +'<b class="st-prop">'+esc2(r.property)+'</b>'
      +'<div class="st-room">'+esc2(r.room)+'</div>'
      +'<div class="st-where">'+esc2(r.area)+' \u00b7 '+esc2(r.zone)+' \u00b7 sleeps '+r.maxGuests+'</div>'
      +'</span>'
      +'<span class="st-price">\u20b9'+r.price.toLocaleString('en-IN')+'<span>/night</span></span></div>'
      +'<div class="st-inc">'+(r.inc||[]).map(function(i){ return '<span>'+esc2(i)+'</span>'; }).join('')+'</div>'
      +'<div class="st-cancel">\u2713 '+esc2(r.cancel||'')+'</div>'
      +'<button class="st-book" onclick="openRoomBook(\''+r.id+'\')">Book this room \u2192</button>'
      +'</div>';
  }).join('')
  +'<div class="gr-foot">Rates are set by the property, not by us. We never discount someone\u2019s room without asking them first.</div>';
}
function rwRoomById(id){ return (window.RW_ROOMS||[]).filter(function(r){ return r.id===id; })[0]; }

/* ---------------- the booking form ---------------- */
function openRoomBook(id){
  var r=rwRoomById(id); if(!r) return;
  var t=new Date(), inD=new Date(t.getTime()+86400000), outD=new Date(t.getTime()+2*86400000);
  var f=function(d){ return d.toISOString().slice(0,10); };
  /* rwForm reads out[field.key] and renders field.placeholder (see rwFormSubmit),
     so these MUST use key:/placeholder:. They previously used id:/ph:, which made
     every value read back undefined and the "Name and phone are needed" guard fire
     on every submit. */
  var bkFields=[
    { key:'bk_in',    label:'Check in',  type:'date', value:f(inD) },
    { key:'bk_out',   label:'Check out', type:'date', value:f(outD) },
    { key:'bk_g',     label:'Guests',    type:'number', value:'2' },
    { key:'bk_nm',    label:'Your name' },
    { key:'bk_ph',    label:'Your phone', placeholder:'10-digit mobile' },
    { key:'bk_note',  label:'Anything they should know', placeholder:'arrival time, food needs' }
  ];
  /* VIEWING-ONLY: no live booking partnerships are connected yet. */
  bkFields._notice='\ud83d\udd0e Preview only \u2014 real booking isn\u2019t live yet (no partner hotels connected). This saves your interest; booking opens soon.';
  rwForm('\ud83c\udfe1 '+r.property, bkFields, function(v){
    if(!v.bk_nm || !v.bk_ph){ showToast('Name and phone are needed to save your interest'); return; }
    if(!/^\d{10}$/.test(String(v.bk_ph).replace(/\D/g,'').slice(-10))){ showToast('Enter a valid 10-digit mobile'); return; }
    var n=rwNights(v.bk_in, v.bk_out);
    rwBookPay(r, { inD:v.bk_in, outD:v.bk_out, nights:n, guests:+v.bk_g||2,
                   name:v.bk_nm, phone:v.bk_ph, note:v.bk_note||'' });
  });
}

/* ---------------- pay: UPI now, or at the property ---------------- */
function rwBookPay(r, b){
  var total=r.price*b.nights;
  var ref='RW'+Date.now().toString(36).toUpperCase().slice(-6);
  var upi=r.upi || (window.RW_BOOK_TERMS&&RW_BOOK_TERMS.deskUpi) || '';
  var payUrl='upi://pay?pa='+encodeURIComponent(upi)
    +'&pn='+encodeURIComponent(r.property)
    +'&am='+total+'&cu=INR&tn='+encodeURIComponent('RoamWise '+ref);
  var ov=el('bkPayOv');
  if(!ov){ ov=document.createElement('div'); ov.id='bkPayOv'; ov.className='overlay'; ov.style.zIndex='4200';
    ov.onclick=function(x){ if(x.target===ov) rwOverlayClose('bkPayOv'); }; document.body.appendChild(ov); }
  window._pendingBooking={ r:r, b:b, total:total, ref:ref };
  ov.innerHTML='<div class="sheet" style="max-width:430px">'
    +'<div class="sheet-h"><b>Confirm your booking</b><button class="tact" onclick="rwOverlayClose(\'bkPayOv\')">\u2715</button></div>'
    +'<div class="bk-sum">'
    +'<div class="bk-sr"><span>'+esc2(r.property)+'</span><b>'+esc2(r.room)+'</b></div>'
    +'<div class="bk-sr"><span>Dates</span><b>'+esc2(b.inD)+' \u2192 '+esc2(b.outD)+'</b></div>'
    +'<div class="bk-sr"><span>'+b.nights+' night'+(b.nights>1?'s':'')+' \u00d7 \u20b9'+r.price.toLocaleString('en-IN')+'</span><b>\u20b9'+total.toLocaleString('en-IN')+'</b></div>'
    +'<div class="bk-sr tot"><span>Total</span><b>\u20b9'+total.toLocaleString('en-IN')+'</b></div>'
    +'</div>'
    +'<div class="bk-pay-note">You are paying <b>'+esc2(r.property)+'</b> directly \u2014 the money goes to them, not to us. RoamWise invoices them 8% after your stay.</div>'
    +(upi? '<a class="bk-go" style="display:block;text-align:center;text-decoration:none;margin-top:12px" href="'+payUrl+'">\ud83d\udcf1 Pay \u20b9'+total.toLocaleString('en-IN')+' now (PhonePe / GPay / any UPI)</a>'
         : '<div class="bk-pay-note" style="margin-top:12px">This property has not shared a UPI id yet \u2014 choose pay-at-property below.</div>')
    +'<button class="tact" style="width:100%;margin-top:9px;padding:12px" onclick="rwBookConfirm(\'paid\')">\u2705 I\u2019ve paid \u2014 confirm my booking</button>'
    +'<button class="tact" style="width:100%;margin-top:7px;padding:12px" onclick="rwBookConfirm(\'cash\')">\ud83d\udcb5 I\u2019ll pay at the property</button>'
    +'<div class="bk-pay-fine">Booking reference <b>'+ref+'</b>. We cannot verify a UPI payment automatically, so the property confirms receipt \u2014 which is also why nobody can fake a paid booking.</div>'
    +'</div>';
  ov.classList.add('open');
}

/* ---------------- confirm + notify the owner ---------------- */
function rwBookConfirm(mode){
  var P=window._pendingBooking; if(!P) return;
  var r=P.r, b=P.b, total=P.total, ref=P.ref;
  var rec={ ref:ref, roomId:r.id, partnerUid:r.partnerId, guestUid:(user&&user.uid)||'',
    property:r.property,
    room:r.room, zone:r.zone, area:r.area,
    checkIn:b.inD, checkOut:b.outD, nights:b.nights, guests:b.guests,
    guestName:b.name, guestPhone:b.phone, note:b.note,
    amount:total, payMode:(mode==='paid'?'upi':'at-property'),
    /* commissionPct/commission are CLIENT DISPLAY ONLY. They are written for
       the owner's WhatsApp receipt and the local record; the actual payable
       commission MUST be recomputed and validated server-side at settlement.
       Never trust these client-sent amounts for money movement. */
    commissionPct:8, commission:Math.round(total*0.08),
    status:(mode==='paid'?'paid-unverified':'confirmed-pay-later'),
    at:new Date().toISOString() };
  /* Attribution hint only, and stored via the canonical stored code. Sanitised
     at capture (rwRefCapture) / entry (rwRefApply); server recomputes any payout. */
  try{ rec.ref_code=rwSanitizeRefCode(rwRefActive()||''); }catch(e){}
  try{ if(window.db) db.collection('roomBookings').doc(ref).set(rec).catch(function(){}); }catch(e){}
  try{ lsSet('rw_last_booking', JSON.stringify(rec)); }catch(e){}
  rwOverlayClose('bkPayOv');
  rwBookOwnerMsg(rec, r);
  rwBookDone(rec);
}
/* the WhatsApp message that reaches the property owner */
function rwBookOwnerMsg(rec, r){
  var to=r.ownerWa || (window.RW_BOOK_TERMS&&RW_BOOK_TERMS.desk) || '';
  var msg='*New RoamWise booking* \u2014 '+rec.ref+'\n\n'
    +'\ud83c\udfe1 '+rec.property+'\n'
    +'\ud83d\udecf\ufe0f '+rec.room+'\n'
    +'\ud83d\udcc5 '+rec.checkIn+' \u2192 '+rec.checkOut+'  ('+rec.nights+' night'+(rec.nights>1?'s':'')+')\n'
    +'\ud83d\udc65 '+rec.guests+' guest'+(rec.guests>1?'s':'')+'\n\n'
    +'\ud83d\udc64 '+rec.guestName+'\n'
    +'\ud83d\udcde '+rec.guestPhone+'\n'
    +(rec.note? '\ud83d\udcdd '+rec.note+'\n':'')
    +'\n\ud83d\udcb0 \u20b9'+rec.amount.toLocaleString('en-IN')+' \u2014 '
    +(rec.payMode==='upi' ? 'guest says PAID by UPI (please confirm receipt)' : 'PAYING AT PROPERTY')+'\n'
    +'RoamWise commission: \u20b9'+rec.commission.toLocaleString('en-IN')+' (8%), invoiced after checkout.\n\n'
    +'Reply CONFIRM to accept, or tell us if the room is unavailable.';
  window._lastOwnerMsg=msg;
  if(to){ window.open('https://wa.me/'+to+'?text='+encodeURIComponent(msg),'_blank','noopener'); }
}
function rwBookDone(rec){
  rwPageOpen('booked', function(body){
    body.innerHTML='<div class="bkd-wrap">'
      +'<div class="bkd-tick">\u2713</div>'
      +'<h2 class="bkd-h">Interest saved</h2>'
      +'<div class="bkd-ref">'+esc2(rec.ref)+'</div>'
      +'<div class="bkd-card">'
      +'<div class="bk-sr"><span>Property</span><b>'+esc2(rec.property)+'</b></div>'
      +'<div class="bk-sr"><span>Room</span><b>'+esc2(rec.room)+'</b></div>'
      +'<div class="bk-sr"><span>Dates</span><b>'+esc2(rec.checkIn)+' \u2192 '+esc2(rec.checkOut)+'</b></div>'
      +'<div class="bk-sr"><span>Guests</span><b>'+rec.guests+'</b></div>'
      +'<div class="bk-sr tot"><span>'+(rec.payMode==='upi'?'Paid':'Pay at property')+'</span><b>\u20b9'+rec.amount.toLocaleString('en-IN')+'</b></div>'
      +'</div>'
      +'<div class="bkd-next"><b>What happens now</b>'
      +'<div>\ud83d\udd0e This is a preview \u2014 real booking isn\u2019t live yet (no partner hotels are connected). We\u2019ve saved your interest, not a confirmed booking.</div>'
      +'<div>Booking opens soon. We\u2019ll reach out on the number you entered when this property goes live.</div>'
      +'<div>Save your reference: <b>'+esc2(rec.ref)+'</b></div></div>'
      +'<button class="bk-go" onclick="rwBookShare()">\ud83d\udcac Send to the property again</button>'
      +'<button class="tact" style="width:100%;margin-top:8px;padding:12px" onclick="rwShareMyBooking()">\ud83d\udce4 Share this booking with my group</button>'
      +'<button class="tact" style="width:100%;margin-top:8px;padding:12px" onclick="rwPageClose();tabGo(\'home\')">Done</button>'
      +'<div class="gr-foot">Keep this reference. If anything is wrong, message the property with it and they can find you instantly.</div>'
      +'</div>';
  });
}

function rwShareMyBooking(){
  try{
    var b=JSON.parse(lsGet('rw_last_booking')||'null');
    if(!b){ showToast('No booking to share'); return; }
    rwWhatsShare(rwBookingText(b));
  }catch(e){ showToast('Could not share'); }
}

function rwBookShare(){
  var m=window._lastOwnerMsg||'';
  if(!m){ showToast('Nothing to send'); return; }
  window.open('https://wa.me/?text='+encodeURIComponent(m),'_blank','noopener');
}

/* ---------------- REQUEST TO BOOK ----------------
   One basket for the whole trip: stay, guide, transport, food, things to do.
   The request reaches the partner immediately; a human confirms. Honest about
   what it is — we never show a "Confirmed" we haven't actually got. */
function rwBasket(){ try{ return JSON.parse(lsGet('rw_basket')||'[]'); }catch(e){ return []; } }
function rwBasketSet(b){ try{ lsSet('rw_basket', JSON.stringify(b)); }catch(e){} rwBasketBadge(); }
function rwBasketAdd(item){
  var b=rwBasket();
  if(b.some(function(x){ return x.id===item.id; })){ showToast('Already in your trip'); return; }
  b.push(item); rwBasketSet(b);
  try{ rwHaptic&&rwHaptic(); }catch(e){}
  showToast('\u2795 Added to your trip \u2014 '+item.name);
}
function rwBasketRemove(id){ rwBasketSet(rwBasket().filter(function(x){ return x.id!==id; })); openBooking(); }
function rwBasketBadge(){
  var n=rwBasket().length, b=el('rwBasketBadge');
  if(!b) return;
  b.textContent=n; b.style.display=n?'flex':'none';
}
function rwBookTotal(b){ return b.reduce(function(a,x){ return a+(+x.price||0); },0); }
function rwCommissionOn(b){
  /* DISPLAY ONLY. This estimate is shown to the user for transparency; it must
     never be treated as the real commission. The payable amount is recomputed
     server-side (Cloud Function / admin at settlement) from the authoritative
     per-category rate — a client can trivially edit x.price or the RW_BOOK_CATS
     percentages, so nothing financial should trust this number. */
  var cats={}; (window.RW_BOOK_CATS||[]).forEach(function(c){ cats[c.id]=c.pct; });
  return b.reduce(function(a,x){ return a+((+x.price||0)*((cats[x.cat]||8)/100)); },0);
}
function openBooking(){
  rwPageOpen('booking', function(body){
    var b=rwBasket();
    var total=rwBookTotal(b);
    var html='';
    if(!b.length){
      html='<div class="bk-empty"><div style="font-size:46px">\ud83e\uddf3</div>'
        +'<b style="display:block;margin:10px 0 6px;font-size:16px">Your trip is empty</b>'
        +'<span class="note">Add a stay or an experience \u2014 then send one request and we\u2019ll get it all confirmed. (Guides, transport, food and celebrations bookings are coming soon.)</span>'
        +'<button class="tact" style="margin-top:14px;font-weight:800;background:linear-gradient(135deg,var(--gold),var(--gold2));color:#0A0A0C;border:none" onclick="rwPageClose();openPartners()">Browse stays &amp; experiences \u2192</button></div>';
    } else {
      html='<div class="bk-list">'+b.map(function(x){
        var C=(window.RW_BOOK_CATS||[]).filter(function(c){ return c.id===x.cat; })[0]||{icon:'\u2022',label:''};
        return '<div class="bk-row"><span class="bk-ic">'+C.icon+'</span>'
          +'<span style="flex:1;min-width:0"><b>'+esc2(x.name)+'</b>'
          +'<div class="bk-sub">'+esc2(C.label)+(x.where?' \u00b7 '+esc2(x.where):'')+'</div></span>'
          +'<span class="bk-amt">'+(x.price?'\u20b9'+Number(x.price).toLocaleString('en-IN'):'on request')+'</span>'
          +'<button class="bk-x" onclick="rwBasketRemove(\''+x.id+'\')">\u2715</button></div>';
      }).join('')+'</div>'
      +'<div class="bk-total"><span>Estimated total</span><b>'+(total?'\u20b9'+total.toLocaleString('en-IN'):'on request')+'</b></div>'
      +'<div class="bk-note">Estimates from partner rate cards. Final prices are confirmed by each partner before you pay anything \u2014 and you pay <b>them</b>, directly, unless a partner offers prepayment.</div>'
      +'<button class="bk-go" onclick="rwBookRequest()">\ud83d\udce8 Send one request for everything</button>'
      +'<div class="bk-how"><b>What happens next</b>'
      +'<div>1 \u00b7 Every partner in your list gets your dates and group size within seconds.</div>'
      +'<div>2 \u00b7 They confirm availability and a final price \u2014 usually the same day.</div>'
      +'<div>3 \u00b7 You approve what you want. Nothing is booked until you say yes.</div></div>';
    }
    body.innerHTML=html;
  });
}
function rwBookRequest(){
  var b=rwBasket(); if(!b.length) return;
  rwForm('\ud83d\udce8 Send your trip request', [
    { key:'bk_name',  label:'Your name' },
    { key:'bk_phone', label:'Phone (partners reply here)' },
    { key:'bk_dates', label:'Dates', placeholder:'e.g. 14-17 Sept' },
    { key:'bk_people',label:'How many people', placeholder:'e.g. 4' },
    { key:'bk_notes', label:'Anything they should know', placeholder:'dietary needs, arrival time, budget ceiling' }
  ], function(v){
    if(!v.bk_name || !v.bk_phone){ showToast('Name and phone are needed so partners can reply'); return; }
    var rec={ items:b, name:v.bk_name, phone:v.bk_phone, dates:v.bk_dates||'',
      people:v.bk_people||'', notes:v.bk_notes||'',
      estTotal:rwBookTotal(b), estCommission:Math.round(rwCommissionOn(b)),
      status:'requested', at:new Date().toISOString() };
    try{ rec.ref=rwRefActive()||''; }catch(e){}
    var done=function(){
      showToast('\u2705 Request sent \u2014 partners will reply to '+v.bk_phone);
      rwBasketSet([]); rwPageClose();
    };
    try{
      if(window.db) db.collection('bookings').add(rec).then(done).catch(done);
      else done();
    }catch(e){ done(); }
  }, 'One message goes to every partner in your trip. Nothing is charged now \u2014 this is a request, not a payment.');
}
