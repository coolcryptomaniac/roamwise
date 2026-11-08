// @ts-nocheck
/* ============================================================================
   BOOKING ROUTES — one answer to "how can a guest actually book this property?"
   ============================================================================
   Founder decision (8 Nov 2026): guests book and pay through RoamWise only.
   Host WhatsApp numbers, phone numbers and OTA links are never shown to guests.

     direct    RoamWise rooms with a price, bookable + paymentEnabled flags
     pay       server-priced Cashfree checkout: nightly rate, long-stay plan or a
               refundable booking advance (pick dates, pay)
     roamwise  everything else: a coded WhatsApp to RoamWise with the stay and
               dates filled in; RoamWise confirms the room and sends a pay link

   A property is shown only when the admin has opened it for bookings
   (bookingMode saved) or it is a founder-approved enquiry listing. It stays
   hidden otherwise. Pure functions, no DOM, so tests can run them directly.
   ========================================================================= */
var RW_BOOKING_WA = '919987379730'; /* RoamWise bookings WhatsApp */
/* Partner id -> stay id in the Worker's stay checkout (worker/handlers/stay-cashfree.js RATE). */
var RW_PAY_STAYS = { p_amor_tattwaa: 'tattwaa', p_amor_nanau: 'nanau', p_amor_padma: 'padma', p_amor_aramness: 'aramness',
  p_milan_heights: 'milan', p_soulmate_homestay: 'soulmate', p_big_bro_hotel: 'bigbro', p_woodbook_devine: 'woodbook',
  p_new_himank: 'newhimank', p_corbett_jungle_view: 'corbett' };
function rwLivePartners(){
  return (window.RW_PARTNERS||[]).filter(function(p){ return p&&p.verified==='signed'&&p.listingReady===true; });
}
function rwRoomIsLive(r){
  return !!r&&r.bookable===true&&r.paymentEnabled===true&&isFinite(+r.price)&&+r.price>0;
}
/* Rooms guests may book directly through RoamWise: live partner + direct mode + valid room. */
function rwRoomsLive(){
  var ok={};
  rwLivePartners().forEach(function(p){ if(String(p.bookingMode||'').toLowerCase()==='direct') ok[p.id]=1; });
  return (window.RW_ROOMS||[]).filter(function(r){ return ok[r.partnerId]&&rwRoomIsLive(r); });
}
/* Has this property been opened for bookings? (admin saved a mode, or a founder-approved enquiry listing) */
function rwBookingOpen(p){
  if(!p) return false;
  if(p.enquiryOnly===true) return p.verified==='founder-approved'&&!!p.founderApproval;
  var mode=String(p.bookingMode||'').toLowerCase();
  if(mode==='direct') return (window.RW_ROOMS||[]).some(function(r){ return r.partnerId===p.id&&rwRoomIsLive(r); });
  return !!mode;
}
/* The guest's message to RoamWise for this stay; d = {checkIn, checkOut, nights, guests} (all optional). */
function rwBookingText(p, d){
  d=d||{};
  var t='Hello RoamWise, I would like to book '+p.name+(p.zone?' ('+p.zone+')':'')+'.';
  if(d.checkIn) t+=' Check-in: '+d.checkIn+(d.checkOut?'. Check-out: '+d.checkOut:(d.nights?' for '+d.nights+' night'+(d.nights>1?'s':''):''))+'.';
  if(d.guests) t+=' Guests: '+d.guests+'.';
  return t+' Please confirm availability and the all-in price, and send the payment link.';
}
/* All valid channels for a partner, primary first. */
function rwBookingRoutes(p){
  var out=[];
  if(!rwBookingOpen(p)) return out;
  var mode=String(p.bookingMode||'').toLowerCase();
  var rooms=(window.RW_ROOMS||[]).filter(function(r){ return r.partnerId===p.id&&rwRoomIsLive(r); });
  if(mode==='direct'&&rooms.length&&p.enquiryOnly!==true) out.push({type:'direct',label:'See rooms & book →',partnerId:p.id});
  if(RW_PAY_STAYS[p.id]) out.push({type:'pay',label:'Pick dates & pay →',href:'/packages/amor-checkout.html?stay='+RW_PAY_STAYS[p.id],site:'RoamWise'});
  out.push({type:'roamwise',label:'Book through RoamWise →',href:'https://wa.me/'+RW_BOOKING_WA,number:RW_BOOKING_WA,site:'RoamWise'});
  return out;
}
function rwBookingRoute(p){
  var all=rwBookingRoutes(p);
  return all.length?all[0]:{type:'none'};
}
function rwIsOperational(p){ return rwBookingRoute(p).type!=='none'; }

/* Route-specific responsibilities; external payment collection is not assumed. */
function rwBookingResponsibilities(route){
  if(!route || route.type==='none') return [];
  if(route.type==='direct') return [
    ['Confirmation', 'The property confirms availability, the final total and cancellation terms. Sending a request does not reserve a room.'],
    ['Payment', 'Choose a payment method in the booking desk. Pay only after the property confirms and you accept the total.'],
    ['Changes & refunds', 'Ask the property to approve date changes or cancellation. Refund handling follows the confirmed terms and payment method.']
  ];
  if(route.type==='pay') return [
    ['Confirmation', 'You pay through RoamWise (Cashfree). RoamWise then confirms the room with the property and sends you the booking details.'],
    ['Payment', 'The amount is calculated by RoamWise for your dates. Pay only on this site; never pay the property separately.'],
    ['Changes & refunds', 'Write to RoamWise. If the property cannot confirm your room, RoamWise starts a full refund to your original payment method.']
  ];
  if(route.type!=='roamwise') return [];
  return [
    ['Confirmation', 'RoamWise checks the room with the property and confirms your dates and the all-in price in writing.'],
    ['Payment', 'RoamWise sends a secure payment link (UPI or card). Pay only through RoamWise; never pay the property separately.'],
    ['Changes & refunds', 'Write to RoamWise. If your room cannot be confirmed after payment, RoamWise starts a full refund.']
  ];
}
function rwBookingResponsibilitiesHTML(route){
  var rows=rwBookingResponsibilities(route);
  if(!rows.length) return '';
  return '<details class="lst-confirm"><summary>Who handles my booking?</summary><dl>'+rows.map(function(row){
    return '<dt><strong>'+esc2(row[0])+'</strong></dt><dd style="margin:0 0 8px">'+esc2(row[1])+'</dd>';
  }).join('')+'</dl></details>';
}

/* HTML for the primary action (and the RoamWise WhatsApp as a second option when a checkout exists). */
function rwBookingActionHTML(p){
  var routes=rwBookingRoutes(p);
  if(!routes.length) return '';
  var main=routes[0], html='';
  var style='display:block;text-align:center;text-decoration:none;margin-top:12px';
  var wa=routes.filter(function(r){ return r.type==='roamwise'; })[0];
  var waLink=function(cls,label){
    var text=rwBookingText(p);
    return '<a class="'+cls+'" style="'+(cls==='bk-go lst-wa'?style:'')+'" href="'+esc2(wa.href+'?text='+encodeURIComponent(text))+'" data-wa-base="'+esc2(wa.href)+'" data-wa-text="'+esc2(text)+'" data-pid="'+esc2(p.id)+'" data-pname="'+esc2(p.name)+'" onclick="return typeof rwStayWaClick===\'function\'?rwStayWaClick(this):true" target="_blank" rel="noopener noreferrer">'+label+'</a>';
  };
  if(main.type==='direct'){
    html='<button class="bk-go" style="margin-top:12px" onclick="rwOverlayClose(\'lstOv\');openStays(\''+esc2(p.zone||'')+'\',\''+esc2(p.id)+'\')">'+main.label+'</button>'
      +'<p class="lst-confirm">Book directly through RoamWise. The property confirms your dates before payment opens.</p>';
  }else if(main.type==='pay'){
    html='<a class="bk-go" style="'+style+'" href="'+esc2(main.href)+'">'+main.label+'</a>'
      +'<p class="lst-confirm">Choose your dates, see the total and pay securely through RoamWise.</p>';
  }else{
    html=waLink('bk-go lst-wa',main.label)
      +'<p class="lst-confirm">RoamWise confirms the room and the all-in price, then sends you a secure payment link.</p>';
  }
  var extra=main.type!=='roamwise'&&wa?waLink('lst-instagram','Or ask RoamWise on WhatsApp ↗'):'';
  return html+rwBookingResponsibilitiesHTML(main)+extra;
}
