// @ts-nocheck
/* ============================================================================
   THE LISTING (rw-v87) — fluid, Airbnb-class browsing
   ============================================================================
   What makes Airbnb's listing feel good is not decoration. It is:
     · a big image area that holds its shape before anything loads
     · one clear price, one clear rating, nothing else competing
     · horizontal collection rails so browsing feels like scanning, not reading
     · everything reacting instantly to touch
   Built with CSS only — no image CDN, no library, no layout shift.
   ========================================================================= */
function rwBadge(id){
  var b=(window.RW_BADGES||{})[id]; if(!b) return '';
  return '<span class="bdg" style="--bc:'+b.color+'" title="'+esc2(b.means)+'">'
    + b.icon+' '+esc2(b.short)+'</span>';
}
/* deterministic gradient per listing, so a card looks identical every load */
function rwHue(str){
  var h=0, s=String(str||'');
  for(var i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))%360;
  return h;
}
function rwCardArt(x){
  var h=rwHue(x.id||x.name);
  var photo=(x.photos||[])[0];
  if(photo&&rwListingPhotoUrl(photo.src)) return '<div class="lst-art lst-photo" style="--h1:'+h+';--h2:'+((h+38)%360)+'">'
    +'<img loading="lazy" src="'+rwListingPhotoUrl(photo.src)+'" alt="'+rwListingAttr(photo.alt||x.name)+'">'
    +((x.photos||[]).length>1?'<span class="lst-photo-count">▧ '+(x.photos||[]).length+' photos</span>':'')
    +'<span class="lst-shine"></span></div>';
  return '<div class="lst-art" style="--h1:'+h+';--h2:'+((h+38)%360)+'">'
    +'<span class="lst-emoji">'+(x.cat==='adventure'?'\ud83e\udde1':x.tier==='green'?'\ud83c\udf3f':'\ud83c\udfe1')+'</span>'
    +'<span class="lst-shine"></span></div>';
}
function rwListingPhotoUrl(src){
  return typeof src==='string'&&/^assets\/property-photos\/[a-z0-9-]+\.(?:jpg|jpeg|png|webp)$/i.test(src)?src:'';
}
function rwListingAttr(value){
  return esc2(value).replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function rwListingPhotoGallery(x){
  var photos=(x.photos||[]).filter(function(photo){ return rwListingPhotoUrl(photo.src); });
  return (photos.length>1?'<div class="lst-gallery">'+photos.slice(1).map(function(photo){
    return '<figure><img loading="lazy" src="'+rwListingPhotoUrl(photo.src)+'" alt="'+rwListingAttr(photo.alt||x.name)+'">'
      +'<figcaption>'+esc2(photo.caption||'')+'</figcaption></figure>';
  }).join('')+'</div>':'')
    +(x.instagramUrl==='https://www.instagram.com/milan_height/'?'<a class="lst-instagram" href="'+x.instagramUrl+'" target="_blank" rel="noopener noreferrer">More photos &amp; videos on Milan Heights’ Instagram ↗</a>':'');
}
function openListing(){
  rwPageOpen('listing', function(body){
    body.innerHTML='<div id="lstOut"></div>';
    var out=el('lstOut');
    var live=rwListingAll();
    out.innerHTML='<div class="rail-h lst-live-heading"><b>Stay &amp; do</b><span>Signed RoamWise stays you can enquire about today.</span></div>'
      +'<div class="lst-grid">'+live.map(function(x){ return rwListCard(x,false); }).join('')+'</div>'
      +'<div class="gr-foot">The hotel confirms availability, final price including taxes, payment method and reservation directly. <a href="mailto:founder@roamwise.co.in?subject=RoamWise%20booking%20support">Need help? Contact RoamWise support</a>.</div>';
  });
}
function rwListingAll(){
  var out=(window.RW_PARTNERS||[]).filter(function(p){ return p.verified==='signed'&&p.listingReady===true; }).slice();
  out.forEach(function(x){
    if(!x.badges){
      x.badges = x.verified==='signed' ? ['verified'] : ['listed'];
      if((x.rating||0)>=4.8 && (x.reviews||0)>=200) x.badges.push('loved');
    }
  });
  return out.sort(function(a,b){ return rwBadgeRank(b)-rwBadgeRank(a); });
}
function rwBadgeRank(x){
  var order=['listed','verified','slept','loved','green','local','signature'];
  return (x.badges||[]).reduce(function(m,b){ return Math.max(m, order.indexOf(b)); }, -1);
}
function rwListingFor(badge){
  return rwListingAll().filter(function(x){ return (x.badges||[]).indexOf(badge)>-1; }).slice(0,8);
}
function rwListCard(x, rail){
  var b=(x.badges||[])[ (x.badges||[]).length-1 ];
  return '<div class="lst'+(rail?' rail-c':'')+' lst-live" onclick="rwListOpen(\''+esc2(x.id)+'\')">'
    + rwCardArt(x)
    +'<div class="lst-b">'
    +'<div class="lst-r"><b>'+esc2(x.name)+'</b>'
    + (x.rating? '<span class="lst-star">\u2605 '+x.rating.toFixed(1)+'</span>':'')
    +'</div>'
    +'<div class="lst-w">'+esc2((x.area||'')+(x.area?' \u00b7 ':'')+(x.zone||''))+'</div>'
    +'<div class="lst-bd">'+(b?rwBadge(b):'')+'</div>'
    + (x.price? '<div class="lst-p"><b>\u20b9'+Number(x.price).toLocaleString('en-IN')+'</b> night</div>':'')
    +'</div></div>';
}
function rwListOpen(id){
  var all=rwListingAll();
  var x=all.filter(function(p){ return String(p.id)===String(id); })[0];
  if(!x) return;
  var B=window.RW_BADGES||{};
  var ov=el('lstOv');
  if(!ov){ ov=document.createElement('div'); ov.id='lstOv'; ov.className='overlay'; ov.style.zIndex='4300';
    ov.onclick=function(e){ if(e.target===ov) rwOverlayClose('lstOv'); }; document.body.appendChild(ov); }
  var waText='Hello '+x.name+', I found your stay through RoamWise. I am interested in staying in '+x.zone+'. Please share available room options for my dates, the final total including applicable taxes, payment method, and booking terms.';
  var waHref='https://wa.me/'+encodeURIComponent(x.bookingWhatsapp||'')+'?text='+encodeURIComponent(waText);
  ov.innerHTML='<div class="sheet lst-detail" style="max-width:440px">'
    +'<div class="sheet-h"><b>'+esc2(x.name)+'</b><button class="tact" onclick="rwOverlayClose(\'lstOv\')">\u2715</button></div>'
    + rwCardArt(x)
    + rwListingPhotoGallery(x)
    +'<div class="lst-w" style="margin:10px 0 6px">'+esc2((x.area||'')+' \u00b7 '+(x.zone||''))+'</div>'
    + (x.hook? '<div class="xp-hook" style="margin-bottom:10px">'+esc2(x.hook)+'</div>':'')
    +'<div class="lst-badges">'+(x.badges||[]).map(function(k){
        var b=B[k]; if(!b) return '';
        return '<div class="lst-bl"><span style="color:'+b.color+'">'+b.icon+'</span>'
          +'<span><b>'+esc2(b.label)+'</b><i>'+esc2(b.means)+'</i></span></div>';
      }).join('')+'</div>'
    + (x.price? '<div class="bk-total" style="margin-top:12px"><span>From</span><b>\u20b9'+Number(x.price).toLocaleString('en-IN')+'</b></div>':'')
    +(x.bookingMode==='whatsapp'?'<a class="bk-go lst-wa" style="display:block;text-align:center;text-decoration:none;margin-top:12px" href="'+esc2(waHref)+'" target="_blank" rel="noopener noreferrer">Ask the hotel on WhatsApp \u2197</a><p class="lst-confirm">Your reservation is confirmed directly by the hotel. Please verify current availability, final total including taxes and booking terms before paying.</p>':'<button class="bk-go" style="margin-top:12px" onclick="rwOverlayClose(\'lstOv\');openStays(\''+esc2(x.zone||'')+'\')">See rooms &amp; book \u2192</button>')
    +'<a class="lst-support" href="mailto:'+esc2(x.supportEmail||'founder@roamwise.co.in')+'?subject=Help%20with%20'+encodeURIComponent(x.name)+'%20booking">RoamWise support: '+esc2(x.supportEmail||'founder@roamwise.co.in')+'</a>'
    +'</div>';
  ov.classList.add('open');
}
