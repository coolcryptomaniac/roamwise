// @ts-nocheck
/* ============================================================================
   BOOKING ROUTES — one answer to "how can a guest actually book this property?"
   ============================================================================
   A property is only shown to guests when it has at least one WORKING route:

     direct    RoamWise rooms with a price, bookable + paymentEnabled flags
     whatsapp  bookingWhatsapp (a real wa.me number the property opted to publish)
     ota       bookingUrl on a third-party site (Booking.com, MakeMyTrip, Airbnb…)
     website   bookingUrl on the property's own site
     phone     bookingPhone (tel: link)

   No route -> the property is hidden everywhere (Stay & do, stays page, Tusk,
   search). It reappears automatically the moment a route is saved in the
   partner admin. Pure functions, no DOM, so tests can run them directly.
   ========================================================================= */
function rwWaNumber(v){
  var d=String(v||'').replace(/\D/g,'');
  if(d.length===10) d='91'+d;
  return d.length>=11&&d.length<=15?d:'';
}
function rwHttpsUrl(v){
  try{ var u=new URL(String(v||'').trim()); return u.protocol==='https:'?u.href:''; }catch(e){ return ''; }
}
function rwHostLabel(url){
  try{
    var h=new URL(url).hostname.replace(/^www\./,'');
    var known={'booking.com':'Booking.com','makemytrip.com':'MakeMyTrip','goibibo.com':'Goibibo','agoda.com':'Agoda','airbnb.co.in':'Airbnb','airbnb.com':'Airbnb','expedia.com':'Expedia','hotels.com':'Hotels.com','tripadvisor.in':'Tripadvisor','tripadvisor.com':'Tripadvisor','cleartrip.com':'Cleartrip','oyorooms.com':'OYO','stayvista.com':'StayVista'};
    return known[h]||h;
  }catch(e){ return 'the booking site'; }
}
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
/* All valid channels for a partner, primary first. */
function rwBookingRoutes(p){
  var out=[];
  if(!p) return out;
  var mode=String(p.bookingMode||'').toLowerCase();
  var rooms=(window.RW_ROOMS||[]).filter(function(r){ return r.partnerId===p.id&&rwRoomIsLive(r); });
  var wa=rwWaNumber(p.bookingWhatsapp), url=rwHttpsUrl(p.bookingUrl), tel=String(p.bookingPhone||'').replace(/\D/g,'');
  var routes={
    direct: mode==='direct'&&rooms.length?{type:'direct',label:'See rooms & book →',partnerId:p.id}:null,
    whatsapp: wa?{type:'whatsapp',label:'Ask the hotel on WhatsApp ↗',href:'https://wa.me/'+wa,number:wa}:null,
    ota: url&&mode==='ota'?{type:'ota',label:'Book on '+(p.bookingOtaName||rwHostLabel(url))+' ↗',href:url,site:p.bookingOtaName||rwHostLabel(url)}:null,
    website: url&&mode==='website'?{type:'website',label:'Book on the hotel’s website ↗',href:url,site:rwHostLabel(url)}:null,
    phone: tel.length>=10&&tel.length<=13?{type:'phone',label:'Call the hotel',href:'tel:+'+(tel.length===10?'91':'')+tel}:null
  };
  /* A WhatsApp number only counts when the property is in whatsapp mode (or no mode is set, for older entries). */
  if(routes.whatsapp&&mode&&mode!=='whatsapp') routes.whatsapp=null;
  var order=[mode].concat(['direct','whatsapp','ota','website','phone']);
  order.forEach(function(k){ if(routes[k]&&!out.some(function(r){ return r.type===k; })) out.push(routes[k]); });
  return out;
}
function rwBookingRoute(p){
  var all=rwBookingRoutes(p);
  return all.length?all[0]:{type:'none'};
}
function rwIsOperational(p){ return rwBookingRoute(p).type!=='none'; }

/* HTML for the primary action plus any secondary channels. */
function rwBookingActionHTML(p){
  var routes=rwBookingRoutes(p);
  if(!routes.length) return '';
  var main=routes[0], html='';
  var style='display:block;text-align:center;text-decoration:none;margin-top:12px';
  if(main.type==='direct'){
    html='<button class="bk-go" style="margin-top:12px" onclick="rwOverlayClose(\'lstOv\');openStays(\''+esc2(p.zone||'')+'\',\''+esc2(p.id)+'\')">'+main.label+'</button>'
      +'<p class="lst-confirm">Book directly through RoamWise. The property confirms your dates before payment opens.</p>';
  }else if(main.type==='whatsapp'){
    var text='Hello '+p.name+', I found your stay through RoamWise. I am interested in staying in '+(p.zone||'your area')+'. Please share available room options for my dates, the final total including applicable taxes, payment method, and booking terms.';
    html='<a class="bk-go lst-wa" style="'+style+'" href="'+esc2(main.href+'?text='+encodeURIComponent(text))+'" data-wa-base="'+esc2(main.href)+'" data-wa-text="'+esc2(text)+'" data-pid="'+esc2(p.id)+'" data-pname="'+esc2(p.name)+'" onclick="return typeof rwStayWaClick===\'function\'?rwStayWaClick(this):true" target="_blank" rel="noopener noreferrer">'+main.label+'</a>'
      +'<p class="lst-confirm">Your reservation is confirmed directly by the hotel. Please verify current availability, final total including taxes and booking terms before paying.</p>';
  }else if(main.type==='ota'||main.type==='website'){
    html='<a class="bk-go" style="'+style+'" href="'+esc2(main.href)+'" target="_blank" rel="noopener noreferrer sponsored">'+esc2(main.label)+'</a>'
      +'<p class="lst-confirm">You will book and pay on '+esc2(main.site)+'. Rates, availability and booking terms are set there, not by RoamWise.</p>';
  }else if(main.type==='phone'){
    html='<a class="bk-go" style="'+style+'" href="'+esc2(main.href)+'">'+main.label+'</a>'
      +'<p class="lst-confirm">Your reservation is confirmed directly by the hotel. Please verify availability and the final total before paying.</p>';
  }
  var extra=routes.slice(1).filter(function(r){ return r.type==='phone'||r.type==='website'||r.type==='whatsapp'; }).map(function(r){
    return '<a class="lst-instagram" href="'+esc2(r.href)+'"'+(r.type==='phone'?'':' target="_blank" rel="noopener noreferrer"')+'>'+(r.type==='phone'?'Or call the hotel':r.type==='whatsapp'?'Or WhatsApp the hotel ↗':'Or book on the hotel’s website ↗')+'</a>';
  }).join('');
  return html+extra;
}
