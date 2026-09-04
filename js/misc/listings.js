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
  return '<div class="lst-art" style="--h1:'+h+';--h2:'+((h+38)%360)+'">'
    +'<span class="lst-emoji">'+(x.cat==='adventure'?'\ud83e\udde1':x.tier==='green'?'\ud83c\udf3f':'\ud83c\udfe1')+'</span>'
    +'<span class="lst-shine"></span></div>';
}
function openListing(){
  rwPageOpen('listing', function(body){
    var cols=(window.RW_COLLECTIONS||[]);
    body.innerHTML='<div id="lstOut"></div>';
    var out=el('lstOut');
    /* collection rails */
    out.innerHTML = cols.map(function(c){
      var items=rwListingFor(c.badge);
      if(!items.length) return '';
      return '<div class="rail">'
        +'<div class="rail-h"><b>'+esc2(c.title)+'</b><span>'+esc2(c.tagline)+'</span></div>'
        +'<div class="rail-s">'+items.map(function(x){ return rwListCard(x,true); }).join('')+'</div>'
        +'</div>';
    }).join('')
    + '<div class="rail-h" style="margin-top:26px"><b>Everything we know</b><span>All places, ranked by how much we can vouch for them.</span></div>'
    + '<div class="lst-grid">'+rwListingAll().map(function(x){ return rwListCard(x,false); }).join('')+'</div>'
    + '<div class="gr-foot">A badge is earned, never bought. Places pay us nothing to rank higher \u2014 that is why the ladder is worth reading.</div>';
  });
}
function rwListingAll(){
  var out=[];
  (window.RW_PARTNERS||[]).forEach(function(p){ out.push(p); });
  (window.RW_ROOMS||[]).forEach(function(r){
    if(!out.some(function(o){ return o.name===r.property; }))
      out.push({ id:r.id, name:r.property, zone:r.zone, area:r.area, cat:'stay',
                 price:r.price, badges:['verified'] });
  });
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
  return '<div class="lst'+(rail?' rail-c':'')+'" onclick="rwListOpen(\''+esc2(x.id)+'\')">'
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
  ov.innerHTML='<div class="sheet" style="max-width:440px">'
    +'<div class="sheet-h"><b>'+esc2(x.name)+'</b><button class="tact" onclick="rwOverlayClose(\'lstOv\')">\u2715</button></div>'
    + rwCardArt(x)
    +'<div class="lst-w" style="margin:10px 0 6px">'+esc2((x.area||'')+' \u00b7 '+(x.zone||''))+'</div>'
    + (x.hook? '<div class="xp-hook" style="margin-bottom:10px">'+esc2(x.hook)+'</div>':'')
    +'<div class="lst-badges">'+(x.badges||[]).map(function(k){
        var b=B[k]; if(!b) return '';
        return '<div class="lst-bl"><span style="color:'+b.color+'">'+b.icon+'</span>'
          +'<span><b>'+esc2(b.label)+'</b><i>'+esc2(b.means)+'</i></span></div>';
      }).join('')+'</div>'
    + (x.price? '<div class="bk-total" style="margin-top:12px"><span>From</span><b>\u20b9'+Number(x.price).toLocaleString('en-IN')+'</b></div>':'')
    +'<button class="bk-go" style="margin-top:12px" onclick="rwOverlayClose(\'lstOv\');openStays(\''+esc2(x.zone||'')+'\')">See rooms &amp; book \u2192</button>'
    +'</div>';
  ov.classList.add('open');
}
