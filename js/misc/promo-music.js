// @ts-nocheck
// PROMO FILM + MUSIC PANEL — extracted verbatim from app.js (modularization
// round 4). The self-hosted promo-video player (renderPromo/filmPlayerHTML/
// filmAttachDiagnostics/playPromo, plus the rwOpenSite/openExternally
// web-to-app link helpers it shares with the drawer's site links) and the
// "My Music" Spotify/JioSaavn panel (openMusic/musRender). PROMO_MP4_URL/
// PROMO_EXT_URL/SPOTIFY_ARTIST_ID/SPOTIFY_PLAYLIST_ID/JIOSAAVN_URL are
// plain globals that js/boot/init.js's remote-config loader reassigns at
// runtime (not parse time), so load order relative to that file doesn't
// matter. Called from js/boot/init.js's boot sequence and from the drawer/
// site-search/copilot "My Music" entry points.
/* ===== MUSIC PANEL ===== */
var MUSIC_YT_PLAYLIST=''; /* optional extra: paste a YouTube playlist ID for a second player */
var SPOTIFY_ARTIST_ID='2qbS0OT9WF0Wpf2WnggrKS';
var SPOTIFY_PLAYLIST_ID='4tO1PY5vyjXhwLFepr8VIF';
var JIOSAAVN_URL='https://www.saavn.com/s/artist/mohit-pandey-albums/s0TzZzm4XaE_';
var PROMO_YT_ID='3MRlvs9bdPQ'; /* official RoamWise promo */
function renderPromo(){
  var top=el('promoTop'), box=el('promoBox');
  /* The film section below already renders the player; a second copy in the
     billboard meant two players in one view. Billboard only shows on Home. */
  // eslint-disable-next-line no-constant-condition, no-constant-binary-expression -- intentional kill-switch: block below is deliberately disabled (see comment above), not a stray leftover
  if(false && PROMO_YT_ID && top){
    top.innerHTML='<div class="bb" id="promoBB" onclick="playPromo(this)">'
     +'<img id="promoThumb" alt="RoamWise film" style="opacity:0;transition:opacity .5s ease">'
     +'<div class="ov"><div class="t2">THE OFFICIAL FILM</div><div class="t1">RoamWise \u2014 born in the Himalayas</div></div>'
     +'<div class="try">\u25b6 Play</div></div>';
    /* preload best available thumb: maxres(often missing) -> sd -> hq. YouTube returns a
       120x90 grey stub for missing sizes, so we check real dimensions, not just onload. */
    var sizes=['maxresdefault','sddefault','hqdefault'], si=0, imgEl=el('promoThumb');
    (function tryThumb(){
      if(si>=sizes.length){ if(imgEl){ imgEl.src='https://img.youtube.com/vi/'+PROMO_YT_ID+'/hqdefault.jpg'; imgEl.style.opacity='1'; } return; }
      var pre=new Image();
      pre.onload=function(){
        if(pre.naturalWidth>=200){ imgEl.src=pre.src; imgEl.style.opacity='1'; var bb=el('promoBB'); if(bb) bb.style.animation='none'; }
        else { si++; tryThumb(); }   /* grey stub -> next size */
      };
      pre.onerror=function(){ si++; tryThumb(); };
      pre.src='https://img.youtube.com/vi/'+PROMO_YT_ID+'/'+sizes[si]+'.jpg';
    })();
  }
  if(box){
    /* Same single player as the billboard — no second implementation. */
    box.innerHTML = filmPlayerHTML()
     +'<a class="tact" style="display:block;text-align:center;text-decoration:none;margin-top:10px;font-size:12px;opacity:.85" href="https://youtube.com/@mohucool?sub_confirmation=1" target="_blank" rel="noopener">More films on @mohucool \u2192</a>';
    filmAttachDiagnostics();

  }
}
/* ===== General pattern: try in-app playback first, fall back to external only
   on real failure. Used for the film billboard, reusable for any future embed. ===== */
/* In the APK the page loads from file:///android_asset/, so a relative link to
   creators/ 404s (ERR_FILE_NOT_FOUND). Website-only pages must be opened as an
   absolute URL in the browser. */
function rwOpenSite(path){
  var url = 'https://roamwise.co.in/' + String(path||'').replace(/^\//,'');
  if(IS_APP || IS_STANDALONE){ try{ return openExternally(url); }catch(e){ /* best-effort, ignore */ } }
  window.open(url, '_blank', 'noopener');
}
function openExternally(url){
  if(window.RW && RW.openExternal){ RW.openExternal(url); }
  else { window.open(url, '_blank', 'noopener'); }
}
var PROMO_MP4_URL = 'https://roamwise.co.in/promo.mp4';
var PROMO_EXT_URL = '';  /* optional external watch link from config */ /* self-hosted film — Mohit uploads promo.mp4 to the repo root (see PROJECT-STATE.md) */
function filmPlayerHTML(){
  /* ONE player, used by both the billboard and the film section — there were
     two competing implementations before, which is why behaviour differed
     depending on where you tapped. */
  return '<div style="border-radius:18px;overflow:hidden;border:1px solid var(--b2,#2A2A36);background:#000">'
    +'<video id="filmInline" controls playsinline preload="metadata" '
    +'poster="https://img.youtube.com/vi/'+PROMO_YT_ID+'/hqdefault.jpg" '
    +'style="width:100%;display:block;aspect-ratio:16/9;background:#000">'
    +'<source src="'+PROMO_MP4_URL+'" type="video/mp4"></video></div>'
    +'<div id="filmFallback"></div>';
}
function filmAttachDiagnostics(){
  var v=el('filmInline'); if(!v) return;
  function fail(){
    var code = (v.error && v.error.code) || 0;
    var names = {0:'no media loaded', 1:'aborted', 2:'network error', 3:'decode error', 4:'format not supported'};
    var fb=el('filmFallback'); if(!fb) return;
    /* Say WHAT failed and offer the device's own player before YouTube —
       a vague "watch on YouTube" hid the real cause for several releases. */
    fb.innerHTML='<div style="font-size:11.5px;color:var(--t3);padding:9px 2px;line-height:1.6">'
      +'Inline playback failed \u2014 <b>'+(names[code]||('code '+code))+'</b>.<br>'
      +'<span style="opacity:.75;word-break:break-all">'+esc2(PROMO_MP4_URL)+'</span><br>'
      +'<button class="tact" style="font-size:11px;padding:5px 10px;margin-top:6px" onclick="openExternally(PROMO_MP4_URL)">Open in device player</button> '
      +'<button class="tact" style="font-size:11px;padding:5px 10px;margin-top:6px" onclick="openExternally(\'https://www.youtube.com/watch?v=\'+PROMO_YT_ID)">YouTube</button></div>';
  }
  v.addEventListener('error', fail, true);
  /* <source> failures fire on the source element, not the video — listen there too */
  var srcEl=v.querySelector('source'); if(srcEl) srcEl.addEventListener('error', fail);
  v.addEventListener('loadedmetadata', function(){ var fb=el('filmFallback'); if(fb) fb.innerHTML=''; });
}
function playPromo(host){
  var wrap=document.createElement('div');
  wrap.id='promoPlayerBox';
  wrap.innerHTML=filmPlayerHTML();
  if(host && host.parentNode) host.parentNode.replaceChild(wrap, host);
  else if(el('promoTop')) el('promoTop').appendChild(wrap);
  filmAttachDiagnostics();
  var v=el('filmInline'); if(v){ try{ v.play(); }catch(e){ /* best-effort, ignore */ } }
  try{ track('video_opens'); }catch(e){ /* analytics best-effort, ignore */ }
}
function openMusic(mode){
  useBump('music');
  mode = mode || lsGet('rw_mus_mode') || 'playlist';
  var ov=el('musOverlay');
  if(!ov){ ov=document.createElement('div'); ov.id='musOverlay'; ov.className='overlay';
    ov.innerHTML='<div class="modal" style="max-width:440px"><button class="modal-close" onclick="el(\'musOverlay\').classList.remove(\'open\')">\u00d7</button>'
     +'<div class="modal-head"><div class="modal-title">\ud83c\udfb5 Music by Mohit Pandey</div><div class="modal-sub">Kumaoni folk \u00d7 phonk \u00d7 travel beats \u2014 live from Spotify</div></div>'
     +'<div class="modal-body" id="musBody"></div></div>';
    document.body.appendChild(ov); }
  musRender(mode);
  ov.classList.add('open');
}
function musRender(mode){
  lsSet('rw_mus_mode', mode);
  var spotifyEmbedId = mode==='artist'? SPOTIFY_ARTIST_ID : SPOTIFY_PLAYLIST_ID;
  var spotifyEmbedKind = mode==='artist'? 'artist' : 'playlist';
  el('musBody').innerHTML=
   '<div class="mus-eq"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>'
   +'<div class="mus-tabs">'
   +'<div class="mus-tab'+(mode==='playlist'?' on':'')+'" onclick="musRender(\'playlist\')">\ud83c\udfa7 All Songs</div>'
   +'<div class="mus-tab'+(mode==='artist'?' on':'')+'" onclick="musRender(\'artist\')">\ud83c\udfa4 Artist Page</div>'
   +'</div>'
   +'<div class="mus-frame"><div class="mus-inner">'
   +'<iframe key="'+spotifyEmbedKind+'" style="border-radius:12px" src="https://open.spotify.com/embed/'+spotifyEmbedKind+'/'+spotifyEmbedId+'?utm_source=generator&theme=0" width="100%" height="'+(mode==='artist'?'352':'352')+'" frameBorder="0" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"></iframe>'
   +'</div></div>'
   +'<div style="display:flex;gap:8px;margin-top:10px">'
   +'<a class="tact" style="flex:1;text-align:center;text-decoration:none;background:linear-gradient(135deg,#1DB95422,transparent)" href="https://open.spotify.com/artist/'+SPOTIFY_ARTIST_ID+'" target="_blank" rel="noopener">\ud83c\udfa7 Open in Spotify</a>'
   +'<a class="tact" style="flex:1;text-align:center;text-decoration:none" href="'+JIOSAAVN_URL+'" target="_blank" rel="noopener">JioSaavn</a>'
   +'</div>'
   +'<a class="tact" style="display:block;text-align:center;text-decoration:none;margin-top:8px" href="https://youtube.com/@mohucool" target="_blank" rel="noopener">\u25b6 Also on YouTube @mohucool</a>';
}

