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
  var b=(window.RW_TRUST_BADGES||{})[id]; if(!b) return '';
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
  return ''; /* no photo yet: show a compact text card rather than an empty placeholder */
}
function rwListingPhotoUrl(src){
  if(typeof rwUploadedPhotoOk==='function'&&rwUploadedPhotoOk(src)) return src;
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
      +'<div class="lst-grid" id="lstGrid">'+live.map(function(x){ return rwListCard(x,false); }).join('')+'</div>'
      +'<div class="gr-foot">The hotel confirms availability, final price including taxes, payment method and reservation directly. <a href="mailto:founder@roamwise.co.in?subject=RoamWise%20booking%20support">Need help? Contact RoamWise support</a>.</div>';
    /* Admin-uploaded photos load lazily, then the grid repaints once. */
    if(typeof rwLoadUploadedPhotos==='function') live.forEach(function(x){
      if(!x.photoCount || (x.photos||[]).length) return;
      rwLoadUploadedPhotos(x, function(ok){ var g=el('lstGrid'); if(ok&&g) g.innerHTML=live.map(function(y){ return rwListCard(y,false); }).join(''); });
    });
  });
}
/* Re-draw the Stay & do grid when live partner data arrives after the page is already open. */
function rwListingRepaint(){
  var g=el('lstGrid'); if(!g) return;
  g.innerHTML=rwListingAll().map(function(y){ return rwListCard(y,false); }).join('');
}
function rwListingAll(){
  /* Only signed, ready partners with a WORKING booking route are ever shown to guests. */
  var out=(window.RW_PARTNERS||[]).filter(function(p){ return p.verified==='signed'&&p.listingReady===true&&(typeof rwIsOperational!=='function'||rwIsOperational(p)); }).slice();
  out.forEach(function(x){
    if(!x._ownBadges) x._ownBadges = (x.badges||[]).slice();
    var base = x._ownBadges.length ? x._ownBadges.slice() : [];
    if(!base.length){ base = x.verified==='signed' ? ['verified'] : ['listed']; if((x.rating||0)>=4.8 && (x.reviews||0)>=200) base.push('loved'); }
    /* Automatic compliance check: same rules every time, from evidence already on file. */
    if(typeof RWTrust!=='undefined'){
      x._trust = RWTrust.assess(Object.assign({}, x, {
        routeType: typeof rwBookingRoute==='function' ? rwBookingRoute(x).type : 'none',
        photoCount: (x.photos||[]).length || Number(x.photoCount)||0 }));
      base = RWTrust.mergeBadges(base, x._trust.badges);
      if(!base.length) base = ['verified'];
    }
    x.badges = base;
  });
  return out.sort(function(a,b){ return rwBadgeRank(b)-rwBadgeRank(a); });
}
function rwBadgeRank(x){
  var order=['listed','verified','checked','gst','trusted','slept','loved','green','local','signature'];
  return (x.badges||[]).reduce(function(m,b){ return Math.max(m, order.indexOf(b)); }, -1);
}
function rwListingFor(badge){
  return rwListingAll().filter(function(x){ return (x.badges||[]).indexOf(badge)>-1; }).slice(0,8);
}
function rwListCard(x, rail){
  var bl=(x.badges||[]).slice(-2);
  return '<div class="lst'+(rail?' rail-c':'')+' lst-live" onclick="rwListOpen(\''+esc2(x.id)+'\')">'
    + rwCardArt(x)
    +'<div class="lst-b">'
    +'<div class="lst-r"><b>'+esc2(x.name)+'</b>'
    + (x.rating? '<span class="lst-star">\u2605 '+x.rating.toFixed(1)+'</span>':'')
    +'</div>'
    +'<div class="lst-w">'+esc2((x.area||'')+(x.area?' \u00b7 ':'')+(x.zone||''))+'</div>'
    +'<div class="lst-bd">'+bl.map(rwBadge).join(' ')+'</div>'
    + (x.price? '<div class="lst-p"><b>\u20b9'+Number(x.price).toLocaleString('en-IN')+'</b> night</div>':'')
    +'</div></div>';
}
/* What the automatic check looked at, in plain words. Guests see passes only. */
function rwTrustBlock(x){
  var t=x._trust; if(!t) return '';
  var ok=t.checks.filter(function(c){ return c.ok; });
  if(!ok.length) return '';
  return '<div class="lst-confirm" style="margin-top:10px"><b>What RoamWise checked</b><br>'
    + ok.map(function(c){ return '\u2713 '+esc2(c.label); }).join('<br>')
    + '<br><i>Automatic paperwork check, not an inspection. Always confirm rates and terms with the property.</i></div>';
}
function rwListOpen(id){
  var all=rwListingAll();
  var x=all.filter(function(p){ return String(p.id)===String(id); })[0];
  if(!x) return;
  if(x.photoCount && !x._uplState && typeof rwLoadUploadedPhotos==='function') rwLoadUploadedPhotos(x, function(ok){ if(ok&&el('lstOv')&&el('lstOv').classList.contains('open')) rwListOpen(id); });
  var B=window.RW_TRUST_BADGES||{};
  var ov=el('lstOv');
  if(!ov){ ov=document.createElement('div'); ov.id='lstOv'; ov.className='overlay'; ov.style.zIndex='4300';
    ov.onclick=function(e){ if(e.target===ov) rwOverlayClose('lstOv'); }; document.body.appendChild(ov); }
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
    + rwTrustBlock(x)
    + (x.price? '<div class="bk-total" style="margin-top:12px"><span>From</span><b>\u20b9'+Number(x.price).toLocaleString('en-IN')+'</b></div>':'')
    + rwBookingActionHTML(x)
    +(typeof rwStayPolicyText==='function'&&rwStayPolicyText(x)?'<p class="lst-confirm">'+esc2(rwStayPolicyText(x))+'</p>':'')
    +(/^https:\/\/(?:www\.google\.com\/maps\/|maps\.app\.goo\.gl\/|goo\.gl\/maps\/)/.test(x.mapsUrl||'')?'<a class="lst-instagram" href="'+esc2(x.mapsUrl)+'" target="_blank" rel="noopener noreferrer">Find on Google Maps \u2197</a>':'')
    +'<a class="lst-support" href="mailto:'+esc2(x.supportEmail||'founder@roamwise.co.in')+'?subject=Help%20with%20'+encodeURIComponent(x.name)+'%20booking">RoamWise support: '+esc2(x.supportEmail||'founder@roamwise.co.in')+'</a>'
    +'</div>';
  ov.classList.add('open');
}
