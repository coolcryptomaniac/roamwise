// @ts-nocheck
// Moved verbatim from js/itinerary/pdf-export.js (continued modularization pass) —
// shared image/geo/theme helper toolkit: jsPDF lazy-loader, image fetch/
// conversion (blobToJpeg/fetchImg64/fetchBmp), Wikipedia/Openverse photo
// lookup (wikiAction/openverseThumb/imgTry/wikiAny/wikiThumb), emergency
// numbers (EMG_NUM/emgFor), a geocoding shortcut (gcode), and the PDF/card
// color-theme system (PDF_THEMES/hueRGB/themeFor/detectTheme/drawMotif).
// Split out because these are no longer PDF-specific: they are also called
// from js/itinerary/journey-log.js, js/itinerary/journey-certificate.js,
// js/itinerary/map-view.js, js/ui/card-painter.js, js/game/realms.js,
// js/misc/misc-features.js, js/copilot/answer-cards.js and
// roamwise-premium-itinerary.js.
function loadJsPdf(cb){
  if(window.jspdf) return cb();
  var s=document.createElement('script');
  s.src='https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
  s.onload=cb; s.onerror=function(){ showToast('PDF engine needs internet'); };
  document.head.appendChild(s);
}
function blobToJpeg(b){
  function draw(bm,w0,h0){
    var c2=document.createElement('canvas');
    var w=Math.min(900,w0), h=Math.round(h0*w/w0);
    c2.width=w; c2.height=h;
    var g=c2.getContext('2d'); g.fillStyle='#fff'; g.fillRect(0,0,w,h); g.drawImage(bm,0,0,w,h);
    return c2.toDataURL('image/jpeg',0.88);
  }
  if(window.createImageBitmap){
    return createImageBitmap(b).then(function(bm){ var d=draw(bm,bm.width,bm.height); bm.close&&bm.close(); return d; });
  }
  return new Promise(function(res,rej){
    var fr=new FileReader();
    fr.onload=function(){ var im=new Image();
      im.onload=function(){ try{ res(draw(im,im.naturalWidth,im.naturalHeight)); }catch(e){ rej(e); } };
      im.onerror=function(){ rej(0); }; im.src=fr.result; };
    fr.onerror=function(){ rej(0); }; fr.readAsDataURL(b);
  });
}
function fetchImg64(url){
  /* weserv proxy: any source -> CORS-open, resized, guaranteed JPEG */
  var u0=String(url).replace(/\/thumb\/([0-9a-f]\/[0-9a-f]{2}\/[^\/]+)\/\d+px-[^\/]+$/,'/$1'); /* wikimedia: use ORIGINAL, let proxy resize */
  var prox='https://images.weserv.nl/?w=820&q=82&output=jpg&url='+encodeURIComponent(u0.replace(/^https?:\/\//,''));
  function toData(b){ return new Promise(function(res,rej){ var fr=new FileReader(); fr.onload=function(){res(fr.result);}; fr.onerror=function(){rej(0);}; fr.readAsDataURL(b); }); }
  return fetch(prox).then(function(r){ if(!r.ok) throw 0; return r.blob(); })
    .then(function(b){ if(b.size<400 || !/image/.test(b.type)) throw 0; return toData(b); })
    .catch(function(){ return fetch(url).then(function(r){ if(!r.ok) throw 0; return r.blob(); }).then(blobToJpeg); });
}
function fetchBmp(url){ /* ImageBitmap for canvas composition (map tiles) */
  return fetch(url).then(function(r){ if(!r.ok) throw 0; return r.blob(); })
    .then(function(b){ return createImageBitmap(b); });
}
function wikiAction(q){
  /* Stricter image lookup: only return an image when Wikipedia actually has a
     matching article with a real page image. This prevents wrong-image bugs
     (e.g. a food query returning an unrelated thumbnail) by checking the page
     isn't a "missing" stub and the title reasonably matches the query. */
  return fetch('https://en.wikipedia.org/w/api.php?action=query&prop=pageimages|info&piprop=thumbnail&pithumbsize=640&redirects=1&format=json&origin=*&titles='+encodeURIComponent(q))
    .then(function(r){return r.json();}).then(function(d){
      var pgs=d.query&&d.query.pages; if(!pgs) return null;
      var k=Object.keys(pgs)[0]; var pg=pgs[k];
      if(!pg || pg.missing!==undefined) return null;           /* no such article */
      if(!pg.thumbnail || !pg.thumbnail.source) return null;    /* article has no image */
      /* sanity: the returned title should share a keyword with the query, else
         it's likely a loose/incorrect match — skip rather than show a wrong pic */
      var qWords=String(q).toLowerCase().split(/[\s,]+/).filter(function(w){return w.length>3;});
      var title=String(pg.title||'').toLowerCase();
      var overlap=qWords.some(function(w){ return title.indexOf(w)>=0; });
      if(qWords.length && !overlap) return null;
      return pg.thumbnail.source;
    }).catch(function(){return null;});
}
function openverseThumb(q){
  return fetch('https://api.openverse.org/v1/images/?q='+encodeURIComponent(q)+'&page_size=1&license_type=all')
    .then(function(r){return r.json();}).then(function(d){
      return (d.results&&d.results[0]&&(d.results[0].thumbnail||d.results[0].url))||null;
    }).catch(function(){return null;});
}
function imgTry(getters){ /* iterate candidate URL getters until a download succeeds */
  if(!getters.length) return Promise.resolve(null);
  var g=getters.shift();
  return Promise.resolve().then(g).then(function(u){
    if(!u) return imgTry(getters);
    return fetchImg64(u).catch(function(){ return imgTry(getters); });
  }).catch(function(){ return imgTry(getters); });
}
function wikiAny(q, alt){ /* REST summary (proxy-safe) -> alt REST -> action -> openverse */
  return wikiThumb(q).then(function(u){ if(u) return u; return alt? wikiThumb(alt):null; })
    .then(function(u){ if(u) return u; return wikiAction(q); })
    .then(function(u){ if(u) return u; return alt? wikiAction(alt):null; })
    .then(function(u){ if(u) return u; return openverseThumb(q); });
}
var EMG_NUM={india:'112 all-in-one / 108 ambulance',thailand:'191 police / 1669 medical',japan:'110 police / 119 fire-med',usa:'911',uk:'999',france:'112',italy:'112',spain:'112',germany:'112',indonesia:'112',vietnam:'113 police / 115 medical',uae:'999 / 998 ambulance',nepal:'100 police / 102 ambulance','sri lanka':'119 / 110',turkey:'112',greece:'112',iceland:'112',singapore:'999 / 995',malaysia:'999',portugal:'112',netherlands:'112',switzerland:'112',austria:'112',mexico:'911',brazil:'190 / 192',australia:'000','new zealand':'111',egypt:'122 / 123',morocco:'19 / 15'};
function emgFor(c){ c=String(c||'').toLowerCase();
  for(var k in EMG_NUM){ if(c.indexOf(k)>-1) return EMG_NUM[k]; } return '112 (global GSM standard)'; }
function gcode(q){
  return fetch('https://geocoding-api.open-meteo.com/v1/search?name='+encodeURIComponent(q)+'&count=1&language=en')
    .then(function(r){return r.json();}).then(function(d){ var h=d.results&&d.results[0];
      return h? {lat:h.latitude, lon:h.longitude} : null; }).catch(function(){return null;});
}
/* Colours pulled straight from the app's own palette (app.css :root) so a
   downloaded itinerary reads as unmistakably RoamWise, not a generic PDF —
   deep = one of the app's dark backgrounds (--bg/--bg2/--bg3), acc = one of
   the app's five accent colours (--gold/--gold2/--teal/--pm/--crim/--crim2),
   each used once so the six themes stay visually distinct. */
var PDF_THEMES={
 beach:{deep:[12,16,32],acc:[22,191,150],line:'Sun, salt and slow mornings'},      /* --bg2, --teal */
 metro:{deep:[7,9,15],acc:[155,89,245],line:'Neon nights, skyline days'},          /* --bg, --pm */
 sacred:{deep:[18,24,40],acc:[200,145,62],line:'Bells, rivers and quiet dawns'},   /* --bg3, --gold */
 tech:{deep:[7,9,15],acc:[234,90,80],line:'Glass towers, future streets'},         /* --bg, --crim2 */
 peak:{deep:[18,24,40],acc:[196,48,43],line:'Thin air, tall silence'},             /* --bg3, --crim */
 classic:{deep:[12,16,32],acc:[232,186,108],line:'Old roads, new eyes'}};          /* --bg2, --gold2 */
function hueRGB(h,s,l){ s/=100; l/=100; var k=function(n){return (n+h/30)%12;},
  a=s*Math.min(l,1-l), f=function(n){return l-a*Math.max(-1,Math.min(k(n)-3,Math.min(9-k(n),1)));};
  return [Math.round(255*f(0)),Math.round(255*f(8)),Math.round(255*f(4))]; }
function themeFor(d){
  var key=detectTheme(d);
  var h=0, s=String(d.name||'x'); for(var i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))>>>0;
  if(key==='classic'){ key=['beach','metro','sacred','tech','peak','classic'][h%6]; }
  var hue=h%360;
  return { key:key,
    acc: hueRGB(hue, 62, 56),
    deep: hueRGB(hue, 48, 13),
    line: PDF_THEMES[key].line };
}
function detectTheme(d){
  var j=((d.tags||[]).concat(d.interests||[]).join(' ')+' '+(d.name||'')).toLowerCase();
  if(/beach|island|coast|surf|goa|bali|maldiv/.test(j)) return 'beach';
  if(/night|neon|party|club|vegas|bangkok|tokyo|dubai/.test(j)) return 'metro';
  if(/temple|spiritual|pilgrim|yoga|sacred|varanasi|rishikesh|kyoto/.test(j)) return 'sacred';
  if(/tech|futur|cyber|modern|singapore|shenzhen/.test(j)) return 'tech';
  if(/trek|mountain|himalaya|alpine|snow|leh|spiti|manali/.test(j)) return 'peak';
  return 'classic';
}
function drawMotif(pdf,key,acc,cx,cy){
  pdf.setDrawColor(acc[0],acc[1],acc[2]); pdf.setFillColor(acc[0],acc[1],acc[2]); pdf.setLineWidth(2);
  if(key==='beach'){ pdf.circle(cx-90,cy-16,14,'F');
    pdf.line(cx-56,cy+2,cx-8,cy+2); pdf.line(cx-48,cy+12,cx-16,cy+12); pdf.line(cx-52,cy+22,cx-12,cy+22);
    pdf.line(cx+70,cy+18,cx+78,cy-26);
    [[-24,-34],[22,-38],[-16,-16],[18,-18]].forEach(function(l){ pdf.line(cx+76,cy-26,cx+78+l[0],cy+l[1]); });
  } else if(key==='metro'){ var xs=[-100,-70,-36,0,36,72]; var hs=[26,44,34,52,30,42];
    xs.forEach(function(x0,i){ pdf.rect(cx+x0,cy+20-hs[i],26,hs[i],'F'); });
    pdf.circle(cx+112,cy+10,6,'F'); pdf.line(cx+118,cy+10,cx+118,cy-22); pdf.line(cx+118,cy-22,cx+130,cy-18);
  } else if(key==='sacred'){ [[46,0],[34,-14],[22,-28]].forEach(function(t){ pdf.triangle(cx-t[0],cy+18+t[1],cx+t[0],cy+18+t[1],cx,cy-34+t[1],'F'); });
    pdf.circle(cx,cy+30,4,'F');
  } else if(key==='tech'){ [[-90,34],[-52,52],[-14,40],[24,58],[62,44]].forEach(function(b){ pdf.rect(cx+b[0],cy+20-b[1],30,b[1],'S'); });
    pdf.line(cx-90,cy+30,cx+100,cy+30); [-60,-10,40,90].forEach(function(x0){ pdf.circle(cx+x0,cy+30,3,'F'); });
  } else if(key==='peak'){ pdf.triangle(cx-96,cy+22,cx-24,cy+22,cx-60,cy-30,'F'); pdf.triangle(cx-30,cy+22,cx+60,cy+22,cx+15,cy-40,'F'); pdf.triangle(cx+40,cy+22,cx+104,cy+22,cx+72,cy-22,'F');
    pdf.setFillColor(255,255,255); pdf.triangle(cx+5,cy-28,cx+25,cy-28,cx+15,cy-40,'F');
  } else { pdf.circle(cx,cy,26,'S'); pdf.circle(cx,cy,18,'S');
    [[0,-34],[0,34],[-34,0],[34,0]].forEach(function(p2){ pdf.line(cx,cy,cx+p2[0],cy+p2[1]); }); }
}
function wikiThumb(q){
  /* The REST summary already returns a working thumbnail URL. The old code
     rewrote its size to /640px- which produced a path that often 404s (and
     404s harder through the image proxy) — return the URL as-is. */
  return fetch('https://en.wikipedia.org/api/rest_v1/page/summary/'+encodeURIComponent(q))
    .then(function(r){return r.json();})
    .then(function(d){ return (d.thumbnail&&d.thumbnail.source) || null; })
    .catch(function(){ return null; });
}
