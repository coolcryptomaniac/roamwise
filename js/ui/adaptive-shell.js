// @ts-nocheck
/* Moved verbatim from app.js (Phase 5b modularization). See js/itinerary/CLAUDE-CODE-MERGE-NOTES.md-style
   convention: this file is loaded via a classic <script> tag before app.js in index.html,
   so its functions/vars are plain globals other files (including app.js) already call. */

/* ---- from app.js lines 2319-2365: device detection & adaptive UI (RW_DEVICE, rwDetectDevice, rwInitDevice) ---- */
/* ==================== DEVICE DETECTION & ADAPTIVE UI ====================
   Browsers deliberately hide exact hardware (you cannot read "MacBook Air" vs
   "Pro", or a phone's model, from the web — it's a privacy boundary). What we
   CAN detect reliably: OS, device class (phone/tablet/desktop), touch, screen
   size, notch/safe-area, and reduced-motion. We adapt the UI to those, which is
   what actually improves the experience. Sets classes on <html> for CSS + a
   global RW_DEVICE object for JS. */
var RW_DEVICE = {};
function rwDetectDevice(){
  var ua = navigator.userAgent||'';
  var uaLower = ua.toLowerCase();
  var plat = (navigator.platform||'');
  var maxTouch = navigator.maxTouchPoints||0;
  var w = window.innerWidth, h = window.innerHeight;
  var os='other', devclass;
  // --- OS ---
  if(/iphone|ipod/.test(uaLower)) os='ios';
  else if(/ipad/.test(uaLower) || (plat==='MacIntel' && maxTouch>1)) os='ipados'; // modern iPad reports as Mac + touch
  else if(/android/.test(uaLower)) os='android';
  else if(/mac/.test(uaLower)) os='mac';
  else if(/win/.test(uaLower)) os='windows';
  else if(/linux|ubuntu|x11/.test(uaLower)) os='linux';
  else if(/cros/.test(uaLower)) os='chromeos';
  // --- device class ---
  var touch = maxTouch>0 || 'ontouchstart' in window;
  if(os==='ios' || (os==='android' && /mobile/.test(uaLower))) devclass='phone';
  else if(os==='ipados' || (os==='android' && !/mobile/.test(uaLower))) devclass='tablet';
  else if(touch && w<900) devclass='phone';
  else if(touch && w<1200) devclass='tablet';
  else devclass='desktop';
  // small-desktop refinement by width for laptops
  var sizeClass = w<430?'xs' : w<768?'sm' : w<1024?'md' : w<1440?'lg' : 'xl';
  RW_DEVICE = { os:os, devclass:devclass, touch:touch, w:w, h:h, size:sizeClass,
    ios:(os==='ios'||os==='ipados'), apple:(os==='ios'||os==='ipados'||os==='mac'),
    reducedMotion: (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) };
  // apply classes to <html>
  var r=document.documentElement;
  r.classList.remove('is-phone','is-tablet','is-desktop','os-ios','os-ipados','os-android','os-mac','os-windows','os-linux','os-chromeos','is-touch','no-touch');
  r.classList.add('is-'+devclass, 'os-'+os, touch?'is-touch':'no-touch', 'sz-'+sizeClass);
  if(RW_DEVICE.reducedMotion) r.classList.add('reduce-motion');
  return RW_DEVICE;
}
function rwInitDevice(){
  rwDetectDevice();
  var _t; window.addEventListener('resize', function(){ clearTimeout(_t); _t=setTimeout(rwDetectDevice, 200); });
}


/* ---- from app.js lines 7997-8124: adaptive shell + RW icon system (IS_APP/IS_STANDALONE/IS_TOUCH_MOBILE, applyShell, rwSetIconTheme, openIconThemePicker, rwIcon, RW_ICON_PATHS) ---- */
/* ===== ADAPTIVE SHELL =====
   APK sets UA "RoamWiseApp"; mobile browsers & installed PWAs get the same
   app-style shell; desktop keeps the classic top navigation. */
var IS_APP = /RoamWiseApp/i.test(navigator.userAgent);
var IS_STANDALONE = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
var IS_TOUCH_MOBILE = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent) || (window.matchMedia && matchMedia('(max-width:768px)').matches);
function applyShell(){
  /* Desktop used to render every section in one endless scroll — the same
     clutter complaint people had on mobile before the shell. The tabbed view
     system now runs everywhere; desktop just gets more room inside each view. */
  document.body.classList.add('shell');
  if(IS_APP || IS_STANDALONE) document.body.classList.add('in-app');
  if(!document.body.dataset.view) document.body.dataset.view='home';
}
applyShell();
/* Must run AFTER the RW_TABS assignment further down this file — function
   declarations hoist but `/* ========================= RW ICON SYSTEM =========================
   Custom line-icons unique to RoamWise. One coherent visual language:
   24x24 viewBox, 1.75 stroke, round caps/joins, currentColor — so they
   inherit text colour and the active-tab tint automatically. Designed to
   feel warm + premium (not generic emoji). Call rwIcon('home') etc. */
/* rwIcon(name,size) — renders a RoamWise icon in the user's chosen icon theme.
   Themes: 'line' (clean), 'neon' (cyberpunk glow), 'mythic' (ember/magic glow).
   Cinematic themes use SVG gradients + a soft glow filter + a breathing/shimmer
   animation. All vector, all lightweight — sharp at any size, unlike raster art. */
var RW_ICON_THEME = (function(){ try{ return lsGet('rw_icontheme')||'line'; }catch(e){ return 'line'; } })();
function rwSetIconTheme(t){
  RW_ICON_THEME=t; try{ lsSet('rw_icontheme',t); }catch(e){ /* storage best-effort, ignore */ }
  try{ renderTabbar(); }catch(e){ /* non-critical render step, ignore */ }
  try{ document.querySelectorAll('[data-rwicon]').forEach(function(n){ n.innerHTML=rwIcon(n.getAttribute('data-rwicon')); }); }catch(e){ /* best-effort, ignore */ }
}
function openIconThemePicker(){
  var themes=[
    ['emoji','\ud83c\udf08 Original Emoji','The classic vibe (default)'],
    ['line','\u270f\ufe0f Clean Line','Minimal, no glow'],
    ['neon','\u26a1 Neon Cyberpunk','Electric glow, animated'],
    ['mythic','\ud83d\udd25 Mythic Fantasy','Ember gold, shimmer']
  ];
  var body=themes.map(function(t){
    var on=RW_ICON_THEME===t[0];
    var preview = t[0]==='emoji' ? '\ud83c\udfd4\ufe0f' : rwIconThemed(t[0],'home',30);
    return '<button class="theme-opt" onclick="rwSetIconTheme(\''+t[0]+'\');rwOverlayClose(\'iconThemeOv\');showToast(\'Icon style: '+t[1].replace(/'/g,'').replace(/\ud83c[\udf00-\udfff]|\u26a1|\u270f\ufe0f|\ud83d[\udd00-\uddff]/g,'').trim()+'\')" style="'+(on?'background:rgba(232,186,108,.12)':'')+'">'
      +'<span class="ti" style="width:34px;height:34px;display:inline-flex;align-items:center;justify-content:center;font-size:22px">'+preview+'</span>'
      +'<span class="theme-txt"><b>'+t[1]+'</b><small>'+t[2]+'</small></span>'
      +(on?'<span style="margin-left:auto;color:var(--gold,#E8BA6C)">\u2713</span>':'')+'</button>';
  }).join('');
  var ov=el('iconThemeOv');
  if(!ov){ ov=document.createElement('div'); ov.id='iconThemeOv'; ov.className='overlay'; ov.onclick=function(e){ if(e.target===ov) rwOverlayClose('iconThemeOv'); }; document.body.appendChild(ov); }
  ov.innerHTML='<div class="sheet" style="max-width:360px"><div class="sheet-h"><b>\u2728 Icon style</b><button onclick="rwOverlayClose(\'iconThemeOv\')" class="tact">\u2715</button></div>'
    +'<p style="font-size:12px;color:var(--t2);margin:2px 0 12px">Choose your icon look \u2014 clean, or cinematic + animated.</p>'+body+'</div>';
  ov.classList.add('open');
}
/* render a specific icon in a specific theme (for the picker preview) */
function rwIconThemed(theme,name,size){
  var prev=RW_ICON_THEME; RW_ICON_THEME=theme; var out=rwIcon(name,size); RW_ICON_THEME=prev; return out;
}
var _rwIconDefsInjected=false;
function rwEnsureIconDefs(){
  if(_rwIconDefsInjected) return;
  var svg='<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>'
    /* neon cyberpunk gradient + glow */
    +'<linearGradient id="rwgNeon" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#22d3ee"/><stop offset="0.5" stop-color="#a855f7"/><stop offset="1" stop-color="#ec4899"/></linearGradient>'
    +'<filter id="rwGlowNeon" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="1.1" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
    /* mythic ember gradient + glow */
    +'<linearGradient id="rwgMythic" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fde68a"/><stop offset="0.5" stop-color="#f59e0b"/><stop offset="1" stop-color="#b45309"/></linearGradient>'
    +'<radialGradient id="rwgMythicGlow" cx="0.5" cy="0.4" r="0.7"><stop offset="0" stop-color="#7dd3fc"/><stop offset="1" stop-color="#f59e0b"/></radialGradient>'
    +'<filter id="rwGlowMythic" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="0.9" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
    +'</defs></svg>';
  var d=document.createElement('div'); d.innerHTML=svg; document.body.appendChild(d.firstChild);
  _rwIconDefsInjected=true;
}
function rwIcon(name, size){
  size = size || 24;
  var P = RW_ICON_PATHS[name] || RW_ICON_PATHS.dot;
  var th = RW_ICON_THEME;
  if(th==='line'){
    return '<svg class="rwi" viewBox="0 0 24 24" width="'+size+'" height="'+size+'" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+P+'</svg>';
  }
  try{ rwEnsureIconDefs(); }catch(e){ /* best-effort, ignore */ }
  var grad = th==='mythic' ? 'rwgMythic' : 'rwgNeon';
  var glow = th==='mythic' ? 'rwGlowMythic' : 'rwGlowNeon';
  var cls  = 'rwi rwi-cine rwi-'+th;
  return '<svg class="'+cls+'" viewBox="0 0 24 24" width="'+size+'" height="'+size+'" fill="none" '
    +'stroke="url(#'+grad+')" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" '
    +'filter="url(#'+glow+')" aria-hidden="true">'+P+'</svg>';
}
var RW_ICON_PATHS = {
  /* home: a peak-roof house — nods to the Himalayan brand */
  home:'<path d="M4 11.5 12 5l8 6.5"/><path d="M6 10.5V19a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-8.5"/><path d="M10 20v-4.5a2 2 0 0 1 4 0V20"/>',
  /* plan: paper plane, tilted for motion */
  plan:'<path d="M21 4 3 11l6 2.5L12 20l3-7.5L21 4Z"/><path d="M9 13.5 21 4"/>',
  /* copilot: compass with N-S needle — guidance */
  copilot:'<circle cx="12" cy="12" r="8.5"/><path d="m12 7 2 5-2 5-2-5 2-5Z"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>',
  /* explore: mountains + sun */
  explore:'<circle cx="17" cy="7" r="2"/><path d="M2 19h20"/><path d="m3 19 5.5-8L13 17"/><path d="m11 19 4-5.5L21 19"/>',
  /* map: folded map with a pin */
  map:'<path d="M9 5 3.5 7v12L9 17l6 2 5.5-2V5L15 7 9 5Z"/><path d="M9 5v12M15 7v12"/>',
  /* store: shopping bag */
  store:'<path d="M6 8h12l-1 11a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  /* film: clapperboard */
  film:'<rect x="3.5" y="9" width="17" height="10.5" rx="1.5"/><path d="M3.8 9 7 4.8l3.2 3.4M9.5 8.6 12.7 4.4M15 8.6l3.2-4.2 1.9 2.4"/>',
  /* ratings: star */
  ratings:'<path d="m12 4 2.35 4.9 5.4.7-3.95 3.7 1 5.35L12 16.9 7.2 18.65l1-5.35L4.25 9.6l5.4-.7L12 4Z"/>',
  /* trips: suitcase */
  trips:'<rect x="4" y="8" width="16" height="12" rx="2"/><path d="M9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M12 12v4"/>',
  /* group: two travellers */
  group:'<circle cx="8.5" cy="8" r="2.5"/><circle cx="16" cy="9" r="2"/><path d="M4 19v-1a4.5 4.5 0 0 1 9 0v1M14.5 19v-1a4 4 0 0 1 5.5-3.7"/>',
  /* chat: speech bubble with dots */
  chat:'<path d="M4 6.5A1.5 1.5 0 0 1 5.5 5h13A1.5 1.5 0 0 1 20 6.5v8A1.5 1.5 0 0 1 18.5 16H9l-4 3.5V6.5Z"/><path d="M8.5 10.5h.01M12 10.5h.01M15.5 10.5h.01"/>',
  /* pro: crown */
  pro:'<path d="M4 8l3.5 3L12 5.5 16.5 11 20 8l-1.5 9h-13L4 8Z"/>',
  /* settings: gear (simplified, clean) */
  settings:'<circle cx="12" cy="12" r="3"/><path d="M12 3v2.5M12 18.5V21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M3 12h2.5M18.5 12H21M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8"/>',
  /* more: three-line menu with rounded ends */
  more:'<path d="M4 7h16M4 12h16M4 17h16"/>',
  /* near: location pin with pulse */
  near:'<path d="M12 21s6.5-5.5 6.5-10.5a6.5 6.5 0 0 0-13 0C5.5 15.5 12 21 12 21Z"/><circle cx="12" cy="10.5" r="2.25"/>',
  /* green: leaf */
  green:'<path d="M5 19c0-8 6-13 14-13 0 8-5 14-13 14M5 19c2-4 5-6.5 8.5-8"/>',
  /* fitness: dumbbell */
  fitness:'<path d="M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10"/>',
  dot:'<circle cx="12" cy="12" r="8.5"/>'
};

/* Tabbar is rendered on DOMContentLoaded (not inline) because function
   declarations hoist but `var RW_TABS = {...}` does not, so calling
   renderTabbar() inline here silently produced an empty bar. DOMContentLoaded
   fires after all deferred script has executed, which is exactly what we want. */

/* ---- from app.js lines 8126-8338: back-button confirmation + customizable bottom nav + drawer (rwInitStatusBar, rwInitBackButton, rwCloseTopOverlay, RW_TABS, renderTabbar, rwTabGo, tabGo, openDrawer/drToggle/closeDrawer/drawerAccount) ---- */
/* ===== BACK BUTTON CONFIRMATION (report #4) =====
   In the app, pressing hardware back on the home screen closed instantly. Now:
   if a modal/overlay is open, back closes THAT; on the home screen, back asks to
   confirm exit (double-tap within 2s, or a dialog in Capacitor). */
var _rwBackArmed=false;
function rwInitStatusBar(){
  try{
    if(window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.StatusBar){
      var SB=Capacitor.Plugins.StatusBar;
      SB.setOverlaysWebView({overlay:false});
      SB.setStyle({style:'DARK'});
      SB.setBackgroundColor({color:'#07090F'});
    }
  }catch(e){ /* best-effort, ignore */ }
}
function rwInitBackButton(){
  /* Capacitor hardware back */
  if(window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.App){
    try{
      Capacitor.Plugins.App.addListener('backButton', function(){
        if(rwCloseTopOverlay()) return;              /* close any open sheet first */
        if(_rwBackArmed){ Capacitor.Plugins.App.exitApp(); return; }
        _rwBackArmed=true; showToast('Press back again to exit');
        setTimeout(function(){ _rwBackArmed=false; }, 2000);
      });
    }catch(e){ /* toast is a nice-to-have, ignore */ }
  }
  /* Browser/PWA back */
  try{
    history.pushState({rw:1}, '');
    window.addEventListener('popstate', function(){
      if(rwCloseTopOverlay()){ history.pushState({rw:1}, ''); return; }
      if(_rwBackArmed) return; /* allow real back */
      _rwBackArmed=true; showToast('Press back again to leave');
      history.pushState({rw:1}, '');
      setTimeout(function(){ _rwBackArmed=false; }, 2000);
    });
  }catch(e){ /* toast is a nice-to-have, ignore */ }
}
/* Close the top-most open overlay if any. Returns true if one was closed. */
function rwCloseTopOverlay(){
  var ids=['rwOnboardOv','rwFormOverlay','sizeSettingsOv','iconThemeOv','chatOverlay','tripMapSection','nearmeSection','fitStaySection','tribeSection','moneySection'];
  for(var i=0;i<ids.length;i++){
    var o=el(ids[i]);
    if(o && (o.classList.contains('open') || (o.style.display!=='none' && o.style.display!==''))){
      if(o.classList.contains('overlay')) o.classList.remove('open'); else o.style.display='none';
      return true;
    }
  }
  return false;
}
if(window.matchMedia){ try{ matchMedia('(max-width:768px)').addEventListener('change', function(){ IS_TOUCH_MOBILE = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent) || matchMedia('(max-width:768px)').matches; applyShell(); }); }catch(e){ /* best-effort, ignore */ } }

/* ==================== CUSTOMISABLE BOTTOM NAV ====================
   The tab bar used to be hardcoded, so reaching Store/Copilot/Settings meant
   digging through the drawer. Now every destination is registered once here and
   the traveller picks which five live on the bar (Settings -> Bottom bar).
   Adding a destination = one RW_TABS entry, nothing else. */
var RW_TABS = {
  home:     {icon:'\ud83c\udfd4\ufe0f', label:'Home',     run:function(){ tabGo('home'); }},
  plan:     {icon:'\u2708\ufe0f',      label:'Plan',     run:function(){ tabGo('plan'); }},
  copilot:  {icon:'\ud83e\udded',      label:'Copilot',  run:function(){ tabGo('copilot'); setTimeout(function(){ var i=el('heroInput'); if(i) i.focus(); },300); }},
  explore:  {icon:'\u26e9\ufe0f',      label:'Explore',  run:function(){ tabGo('explore'); }},
  map:      {icon:'\ud83d\uddfa\ufe0f',label:'Map',      run:function(){ if(window._lastItin && _lastItin.name){ openTripMap(_lastItin.name,null); } else { openMapExplorer(); } }},
  store:    {icon:'\ud83d\udecd\ufe0f',label:'Store',    run:function(){ tabGo('store'); }},
  film:     {icon:'\ud83c\udfac',      label:'Film',     run:function(){ tabGo('film'); }},
  ratings:  {icon:'\u2b50',            label:'Reviews',  run:function(){ tabGo('extras'); }},
  trips:    {icon:'\ud83e\uddf3',      label:'Trips',    run:function(){ openVault(); }},
  group:    {icon:'\ud83e\udd1d',      label:'Group',   run:function(){ openGroupPlanner(); }},
  chat:     {icon:'\ud83d\udcac',      label:'Chat',    run:function(){ openGroupChat(); }},
  pro:      {icon:'\ud83d\udc51',      label:'Pro',      run:function(){ openPay(); }},
  settings: {icon:'\u2699\ufe0f',      label:'Settings', run:function(){ openSettings(); }},
  more:     {icon:'\u2630',            label:'More',     run:function(){ openDrawer(); }}
};
var RW_TABS_DEFAULT = ['home','plan','copilot','store','more'];
function rwTabIds(){
  try{
    var v=JSON.parse(lsGet('rw_tabs')||'null');
    if(v && v.length>=3 && v.every(function(k){ return RW_TABS[k]; })) return v.slice(0,5);
  }catch(e){ /* parse best-effort, ignore malformed/missing data */ }
  return RW_TABS_DEFAULT;
}
function renderTabbar(){
  var nav=el('tabbar'); if(!nav) return;
  var ids=rwTabIds();
  nav.style.gridTemplateColumns='repeat('+ids.length+',1fr)';
  nav.innerHTML = ids.map(function(k){
    var t=RW_TABS[k];
    var ic = (RW_ICON_THEME!=='emoji' && typeof rwIcon==='function' && RW_ICON_PATHS[k]) ? rwIcon(k) : t.icon;
    return '<button id="tb-'+k+'" onclick="rwTabGo(\''+k+'\')"><span class="ti">'+ic+'</span>'+t.label+'</button>';
  }).join('');
  rwTabMark(lsGet('rw_last_tab')||'home');
}
function rwTabGo(k){
  var t=RW_TABS[k]; if(!t) return;
  rwTabMark(k); lsSet('rw_last_tab', k);
  try{ t.run(); }catch(e){ /* best-effort, ignore */ }
  /* A view whose sections all failed to render used to leave a blank screen
     with nothing but the background animation — indistinguishable from a crash.
     Check after paint and say something useful instead. */
  setTimeout(function(){ rwEmptyViewGuard(); }, 350);
}
function rwEmptyViewGuard(){
  var v = document.body.dataset.view;
  if(!v || v==='home') return;
  var vis = [].slice.call(document.querySelectorAll('.v-'+v)).filter(function(n){ return n.offsetParent!==null && n.offsetHeight>20; });
  var host = el('emptyViewNote');
  if(vis.length){ if(host) host.remove(); return; }
  if(!host){
    host=document.createElement('div'); host.id='emptyViewNote'; host.className='v';
    host.style.cssText='margin:60px 18px;text-align:center;color:var(--t3);font-size:13px;line-height:1.7';
    document.body.appendChild(host);
  }
  host.innerHTML='Nothing to show here yet.<br><button class="tact" style="margin-top:10px;padding:7px 14px" onclick="rwTabGo(\'home\')">Back to Home</button>';
}
function rwTabMark(k){
  rwTabIds().forEach(function(id){ var b=el('tb-'+id); if(b) b.classList.toggle('on', id===k); });
}
function rwTabPickerHTML(){
  var cur=rwTabIds();
  return '<div class="key-box"><div class="key-box-name">\ud83d\udcf1 Bottom bar \u2014 pick up to 5</div>'
    +'<div class="key-box-hint">Tap to add or remove. These are the shortcuts you reach with one thumb.</div>'
    +'<div id="tabPick" style="display:flex;flex-wrap:wrap;gap:7px;margin-top:9px">'
    + Object.keys(RW_TABS).map(function(k){
        var on=cur.indexOf(k)>-1;
        return '<button onclick="rwTabToggle(\''+k+'\')" style="font-size:11.5px;padding:6px 11px;border-radius:999px;cursor:pointer;'
          +'border:1px solid '+(on?'var(--gold,#E8BA6C)':'var(--b2,#2A2A36)')+';'
          +'background:'+(on?'rgba(232,186,108,.16)':'transparent')+';color:'+(on?'var(--gold,#E8BA6C)':'var(--t3)')+'">'
          +RW_TABS[k].icon+' '+RW_TABS[k].label+'</button>';
      }).join('')
    +'</div></div>';
}
function rwTabToggle(k){
  var cur=rwTabIds().slice();
  var i=cur.indexOf(k);
  if(i>-1){ if(cur.length<=3){ showToast('Keep at least 3'); return; } cur.splice(i,1); }
  else { if(cur.length>=5){ showToast('Five is the max \u2014 remove one first'); return; } cur.push(k); }
  lsSet('rw_tabs', JSON.stringify(cur));
  renderTabbar();
  var host=el('tabPickWrap'); if(host) host.innerHTML=rwTabPickerHTML();
}
function tabGo(t){
  /* Major screen/view transition — the manifest's card_transition_or_modal_open cue. */
  try{ rwPlayCue('card_transition_or_modal_open'); }catch(e){ /* best-effort, ignore */ }
  try{useBump('tab_'+t);}catch(e){ /* best-effort, ignore */ }
  try{ if(window._rvAll) _rvAll(); }catch(e){ /* best-effort, ignore */ }
  try{ rwTabMark(t); }catch(e){ /* best-effort, ignore */ }
  if(t==='pro'){ openPay(); return; }
  if(t==='more'){ openDrawer(); return; }
  if(document.body.classList.contains('shell')){
    /* Only real views may be set. 'treks' was being passed here (it is a
       SECTION inside Explore, not a view), which set data-view to something no
       section matches — every section hid and the screen went blank. */
    var VALID = ['home','plan','copilot','explore','store','film','extras'];
    if(VALID.indexOf(t)===-1){
      var host = VIEW_OF && VIEW_OF[t];
      if(host){ document.body.dataset.view = host; setTimeout(function(){ scrollToId(t); }, 120); return; }
      t = 'home';
    }
    document.body.dataset.view = t;
    window.scrollTo({top:0,behavior:'auto'});
    /* Drawer links call tabGo directly, so the guard cannot live only in
       rwTabGo — that is how a blank screen slipped through. */
    setTimeout(function(){ try{ rwEmptyViewGuard(); }catch(e){ /* best-effort, ignore */ } }, 350);
  } else {
    if(t==='home') window.scrollTo({top:0,behavior:'smooth'});
    if(t==='plan'){ var a=el('app'); if(a) window.scrollTo({top:a.offsetTop-58,behavior:'smooth'}); }
    if(t==='explore') scrollToId('treks');
  }
}
/* keep Home/Plan tab in sync with scroll */
(function(){
  var ticking=false;
  window.addEventListener('scroll', function(){
    if(ticking) return; ticking=true;
    requestAnimationFrame(function(){
      ticking=false;
      if(document.body.classList.contains('shell')) return; /* tabbed views: no scrollspy */
      var payOpen = el('payOverlay').classList.contains('open');
      var drOpen = el('drawer').classList.contains('open');
      if(payOpen||drOpen) return;
      var a=el('app'), tk=el('treks'); if(!a) return;
      var y=window.scrollY;
      var inTrek = tk && y >= tk.offsetTop-140;
      var inPlan = !inTrek && y >= a.offsetTop-120;
      var h=el('tb-home'), p=el('tb-plan'), tb=el('tb-treks');
      if(h) h.classList.toggle('on', !inPlan && !inTrek);
      if(p) p.classList.toggle('on', inPlan);
      if(tb) tb.classList.toggle('on', inTrek);
      var pr=el('tb-pro'), m=el('tb-more'); if(pr)pr.classList.remove('on'); if(m)m.classList.remove('on');
    });
  }, {passive:true});
})();

function openDrawer(){
  try{ var q=el('drSearch'); if(q){ q.value=''; drFilter(''); } }catch(e){ /* best-effort, ignore */ } el('drawer').classList.add('open'); el('drawerBk').classList.add('open'); }
function drToggle(btn){
  var grp=btn.parentElement;
  document.querySelectorAll('.dr-grp.open').forEach(function(g){ if(g!==grp) g.classList.remove('open'); });
  grp.classList.toggle('open');
}
function closeDrawer(){ el('drawer').classList.remove('open'); el('drawerBk').classList.remove('open'); var m=el('tb-more'); if(m)m.classList.remove('on'); }
function drawerAccount(u){
  var box = el('drAcct'); if(!box) return;
  if(u){
    var pic = u.photoURL || ('https://api.dicebear.com/9.x/initials/svg?seed='+encodeURIComponent(u.email||'RW'));
    box.innerHTML = '<div class="dr-acct"><img src="'+pic+'" alt=""><div><div class="n">'+((u.displayName||'Traveler').replace(/[<>]/g,''))+'</div><div class="e">'+((u.email||'').replace(/[<>]/g,''))+'</div></div></div>'+
      '<a class="dr-link dr-signout" onclick="closeDrawer();authMenu()"><span class="ic">&#8618;</span>Sign out</a>'+
      '<a class="dr-link" style="color:var(--t3);font-size:11px" onclick="deleteAccount()"><span class="ic">&#128465;&#65039;</span>Delete my account</a>';
  } else {
    box.innerHTML = '<button class="dr-signin" onclick="closeDrawer();openAuth()">Sign in / Create account</button>';
  }
}

/* ---- from app.js lines 8340-8340: drawer Escape-key close listener ---- */
document.addEventListener('keydown', function(ev){ if(ev.key==='Escape') closeDrawer(); });

