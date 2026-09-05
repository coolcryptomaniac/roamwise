// @ts-nocheck
/* Moved verbatim from app.js (Phase 5b modularization). See js/itinerary/CLAUDE-CODE-MERGE-NOTES.md-style
   convention: this file is loaded via a classic <script> tag before app.js in index.html,
   so its functions/vars are plain globals other files (including app.js) already call. */

/* ---- from app.js lines 2366-2441: theme engine (RW_UI_THEMES, rwSetTheme/rwToggleThemeMenu/rwInitTheme) + drawer theme/lang pickers (drThemePick, drLangPick, drThemeSync) ---- */
/* ==================== THEMES ====================
   6 themes via a data-theme attribute on <html>. All colors are CSS vars in
   app.css, so switching just swaps the attribute. Remembered per device. */
var RW_UI_THEMES = [
  {id:'midnight', name:'Midnight', sub:'Default dark', dot:'#07090F'},
  {id:'obsidian', name:'Obsidian', sub:'Pure black (OLED)', dot:'#000000'},
  {id:'forest',   name:'Forest',   sub:'Deep green dark', dot:'#0A1410'},
  {id:'daylight', name:'Daylight', sub:'Warm light', dot:'#F7F6F3'},
  {id:'paper',    name:'Paper',    sub:'Sepia reading', dot:'#FBF7EF'},
  {id:'minimal',  name:'Minimal',  sub:'Clean white', dot:'#FFFFFF'},
  /* --- Restyle options (rw-v40). Added as CHOICES so the existing look is
     untouched — switch freely, nothing else in the app changes. --- */
  {id:'nova',     name:'Nova',     sub:'Modern violet \u00b7 new', dot:'#7C6BFF'},
  {id:'sunset',   name:'Sunset',   sub:'Warm coral \u00b7 new', dot:'#FF6B9D'},
  {id:'crisp',    name:'Crisp',    sub:'Bright & clean \u00b7 new', dot:'#3B5BFF'}
];
function rwSetTheme(id){
  if(id==='midnight'){ document.documentElement.removeAttribute('data-theme'); }
  else{ document.documentElement.setAttribute('data-theme', id); }
  try{ lsSet('rw_theme', id); }catch(e){ /* storage best-effort, ignore */ }
  /* keep the mobile status-bar color in sync */
  try{
    var th=RW_UI_THEMES.filter(function(x){return x.id===id;})[0];
    var mt=document.querySelector('meta[name="theme-color"]');
    if(mt && th) mt.setAttribute('content', th.dot);
  }catch(e){ /* best-effort, ignore */ }
  try{ var lbl=el('themeLabel'); if(lbl){ var T=RW_UI_THEMES.filter(function(x){return x.id===id;})[0]; lbl.textContent=T?T.name:'Theme'; } }catch(e){ /* best-effort, ignore */ }
}
function rwToggleThemeMenu(){
  var m=el('themeMenu'); if(!m) return;
  m.style.display = m.style.display==='block'?'none':'block';
}
function rwInitTheme(){
  var saved=''; try{ saved=lsGet('rw_theme'); }catch(e){ /* storage best-effort, ignore */ }
  var m=el('themeMenu');
  if(m){
    m.innerHTML = RW_UI_THEMES.map(function(T){
      return '<button class="theme-opt" onclick="rwSetTheme(\''+T.id+'\');rwToggleThemeMenu()">'
        +'<span class="theme-dot" style="background:'+T.dot+'"></span>'
        +'<span class="theme-txt"><b>'+T.name+'</b><small>'+T.sub+'</small></span></button>';
    }).join('');
  }
  /* also populate the in-drawer lists (mobile) */
  var dl=el('drThemeList');
  if(dl){
    dl.innerHTML = RW_UI_THEMES.map(function(T){
      return '<a class="dr-link" style="padding:9px 10px" onclick="rwSetTheme(\''+T.id+'\');drThemeSync()"><span class="theme-dot" style="width:15px;height:15px;background:'+T.dot+'"></span> '+T.name+'</a>';
    }).join('');
  }
  rwSetTheme(saved || 'midnight');
  try{ drThemeSync(); }catch(e){ /* best-effort, ignore */ }
}
function drThemePick(){
  var l=el('drThemeList'); if(!l) return;
  if(!l.innerHTML.trim()){
    l.innerHTML = RW_UI_THEMES.map(function(T){
      return '<a class="dr-link" style="padding:9px 10px" onclick="rwSetTheme(\''+T.id+'\');drThemeSync()"><span class="theme-dot" style="width:15px;height:15px;background:'+T.dot+'"></span> '+T.name+'</a>';
    }).join('');
  }
  l.style.display = l.style.display==='none'?'block':'none';
}
function drLangPick(){
  var l=el('drLangList'); if(!l) return;
  if(!l.innerHTML){
    l.innerHTML = RW_LANGS.map(function(L){
      return '<a class="dr-link" style="padding:9px 10px" onclick="rwSetLang(\''+L.code+'\');drThemeSync()">'+L.native+' <small style="color:var(--t3)">'+L.label+'</small></a>';
    }).join('');
  }
  l.style.display = l.style.display==='none'?'block':'none';
}
function drThemeSync(){
  try{
    var tv=el('drThemeVal'); if(tv){ var T=RW_UI_THEMES.filter(function(x){return x.id===(lsGet('rw_theme')||'midnight');})[0]; tv.textContent=T?T.name:''; }
    var lv=el('drLangVal'); if(lv){ var L=RW_LANGS.filter(function(x){return x.code===RW_LANG;})[0]; lv.textContent=L?L.native:''; }
  }catch(e){ /* storage best-effort, ignore */ }
}

/* ---- from app.js lines 11503-11624: Living Themes (RW_THEMES, rwPickTheme, rwApplyTheme, rwStartFx/rwStopFx) ---- */
/* ==================== LIVING THEMES — season, time & festival aware =========
   16 base themes picked from (season x time-of-day) + Indian festival windows,
   each with a background gradient and a live particle effect (rain in monsoon,
   snow on winter nights, petals in spring, diyas at Diwali, tricolor on Aug 15,
   confetti at Holi/New Year...). Canvas is fixed, pointer-transparent, capped
   at ~80 particles, pauses when the tab hides, and fully disables under
   prefers-reduced-motion. Manual override survives in rw_theme_mode. */
var RW_THEMES = {
  winter_day:   {bg:'linear-gradient(180deg,#0A0E16,#0E1420 60%,#101826)', fx:'snow',    tint:'#9CC4E4'},
  winter_night: {bg:'linear-gradient(180deg,#05070D,#0A0F1A)',             fx:'snow',    tint:'#7FA8D0'},
  summer_day:   {bg:'linear-gradient(180deg,#0C0A08,#141008)',             fx:'sunhaze', tint:'#F0C070'},
  summer_night: {bg:'linear-gradient(180deg,#070609,#100C14)',             fx:'fireflies',tint:'#D9F99D'},
  monsoon_day:  {bg:'linear-gradient(180deg,#080B10,#0C1219 60%,#0A1016)', fx:'rain',    tint:'#5CC8FF'},
  monsoon_night:{bg:'linear-gradient(180deg,#05070B,#080D14)',             fx:'rain',    tint:'#3E8BB8'},
  autumn_day:   {bg:'linear-gradient(180deg,#0D0A07,#150F08)',             fx:'leaves',  tint:'#E8A25C'},
  autumn_night: {bg:'linear-gradient(180deg,#080605,#100B07)',             fx:'leaves',  tint:'#C07840'},
  spring_day:   {bg:'linear-gradient(180deg,#0A0C0A,#0F140E)',             fx:'petals',  tint:'#F5A9C4'},
  spring_night: {bg:'linear-gradient(180deg,#060806,#0B100B)',             fx:'petals',  tint:'#C77A9A'},
  dawn:         {bg:'linear-gradient(180deg,#120C10,#1A0F12 50%,#0C0A10)', fx:'clouds',  tint:'#F0A0A0'},
  dusk:         {bg:'linear-gradient(180deg,#100A14,#170D18 50%,#0A0810)', fx:'stars',   tint:'#C8A0F0'},
  holi:         {bg:'linear-gradient(180deg,#0C080E,#120A14)',             fx:'confetti',tint:'#FF6EC7'},
  diwali:       {bg:'linear-gradient(180deg,#0E0906,#160E06)',             fx:'diyas',   tint:'#FFB84D'},
  independence: {bg:'linear-gradient(180deg,#081008,#0A0E14)',             fx:'tricolor',tint:'#FF9933'},
  newyear:      {bg:'linear-gradient(180deg,#080810,#100A18)',             fx:'confetti',tint:'#E8BA6C'}
};
function rwPickTheme(now){
  now = now || new Date();
  var m=now.getMonth()+1, d=now.getDate(), h=now.getHours();
  /* Festival windows (2026 dates; ranges keep them right for +/- a year) */
  if(m===3 && d>=2 && d<=5) return 'holi';
  if(m===11 && d>=6 && d<=13) return 'diwali';
  if(m===8 && d>=14 && d<=16) return 'independence';
  if((m===12 && d>=30) || (m===1 && d<=2)) return 'newyear';
  if((m===12 && d>=23 && d<=26)) return 'winter_night';
  if(h>=5 && h<8) return 'dawn';
  if(h>=17 && h<20) return 'dusk';
  var night = (h>=20 || h<5);
  var season = (m>=12||m<=2)?'winter' : (m>=3&&m<=5)?'spring' : (m>=6&&m<=9)?'monsoon' : (m>=10&&m<=11)?'autumn' : 'summer';
  if(m>=4 && m<=6 && season==='spring') season = (m>=4)?'summer':'spring'; /* Indian summer Apr-Jun */
  return season+'_'+(night?'night':'day');
}
var _fxRAF=null,_fxParts=[],_fxCanvas=null;
function rwApplyTheme(key){
  var th=RW_THEMES[key]; if(!th) return;
  document.documentElement.style.background=th.bg;
  document.body.style.background='transparent';
  document.body.dataset.rwtheme=key;
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduced){ rwStopFx(); return; }
  rwStartFx(th.fx, th.tint);
}
function rwStopFx(){ if(_fxRAF) cancelAnimationFrame(_fxRAF); _fxRAF=null; if(_fxCanvas){ _fxCanvas.remove(); _fxCanvas=null; } _fxParts=[]; }
function rwStartFx(kind, tint){
  rwStopFx();
  var c=document.createElement('canvas'); c.id='rwFx';
  c.style.cssText='position:fixed;inset:0;z-index:-1;pointer-events:none;opacity:.55';
  document.body.appendChild(c); _fxCanvas=c;
  var ctx=c.getContext('2d'), W,H;
  function size(){ W=c.width=innerWidth; H=c.height=innerHeight; } size();
  addEventListener('resize', size);
  var N = kind==='rain'? 80 : kind==='snow'? 60 : kind==='confetti'||kind==='tricolor'? 70 : kind==='stars'? 70 : 40;
  var TRI=['#FF9933','#FFFFFF','#138808'];
  for(var i=0;i<N;i++){
    _fxParts.push({x:Math.random()*innerWidth, y:Math.random()*innerHeight,
      v:.4+Math.random()*(kind==='rain'?7:1.4), r:1+Math.random()*(kind==='confetti'||kind==='tricolor'?3.5:2.5),
      w:Math.random()*1.4-.7, a:.25+Math.random()*.6, hue:Math.random()*360, tw:Math.random()*6.28});
  }
  function frame(t){
    ctx.clearRect(0,0,W,H);
    _fxParts.forEach(function(p2){
      if(kind==='rain'){
        ctx.strokeStyle='rgba(120,180,230,'+(p2.a*.7)+')'; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(p2.x,p2.y); ctx.lineTo(p2.x+p2.w*2,p2.y+9+p2.v); ctx.stroke();
        p2.y+=p2.v+7; p2.x+=p2.w; if(p2.y>H){p2.y=-12;p2.x=Math.random()*W;}
      } else if(kind==='snow'){
        ctx.fillStyle='rgba(220,235,250,'+p2.a+')';
        ctx.beginPath(); ctx.arc(p2.x,p2.y,p2.r,0,6.29); ctx.fill();
        p2.y+=p2.v; p2.x+=Math.sin((t/900)+p2.tw)*.6; if(p2.y>H){p2.y=-6;p2.x=Math.random()*W;}
      } else if(kind==='leaves'||kind==='petals'){
        ctx.fillStyle=kind==='leaves'?'rgba(216,150,80,'+p2.a+')':'rgba(240,170,200,'+p2.a+')';
        ctx.save(); ctx.translate(p2.x,p2.y); ctx.rotate((t/700)+p2.tw);
        ctx.beginPath(); ctx.ellipse(0,0,p2.r+2,p2.r,0,0,6.29); ctx.fill(); ctx.restore();
        p2.y+=p2.v*.8; p2.x+=Math.sin((t/1100)+p2.tw)*1.1; if(p2.y>H){p2.y=-8;p2.x=Math.random()*W;}
      } else if(kind==='stars'||kind==='fireflies'){
        var tw=.5+.5*Math.sin((t/(kind==='stars'?1400:600))+p2.tw);
        ctx.fillStyle=kind==='stars'?'rgba(230,230,255,'+(p2.a*tw)+')':'rgba(217,249,157,'+(p2.a*tw)+')';
        ctx.beginPath(); ctx.arc(p2.x,p2.y,p2.r*.9,0,6.29); ctx.fill();
        if(kind==='fireflies'){ p2.x+=Math.sin((t/800)+p2.tw)*.5; p2.y+=Math.cos((t/900)+p2.tw)*.4; }
      } else if(kind==='confetti'||kind==='tricolor'){
        ctx.fillStyle=kind==='tricolor'? TRI[Math.floor(p2.hue)%3] : 'hsla('+p2.hue+',80%,65%,'+p2.a+')';
        ctx.save(); ctx.translate(p2.x,p2.y); ctx.rotate((t/500)+p2.tw); ctx.fillRect(-p2.r,-p2.r/2,p2.r*2,p2.r); ctx.restore();
        p2.y+=p2.v; p2.x+=Math.sin((t/700)+p2.tw); if(p2.y>H){p2.y=-8;p2.x=Math.random()*W;}
      } else if(kind==='diyas'){
        var g=.6+.4*Math.sin((t/500)+p2.tw);
        ctx.fillStyle='rgba(255,184,77,'+(p2.a*g*.8)+')';
        ctx.beginPath(); ctx.arc(p2.x,p2.y,p2.r*1.6,0,6.29); ctx.fill();
        ctx.fillStyle='rgba(255,220,150,'+(p2.a*g)+')';
        ctx.beginPath(); ctx.arc(p2.x,p2.y,p2.r*.6,0,6.29); ctx.fill();
        p2.y-=p2.v*.25; if(p2.y<-8){p2.y=H+8;p2.x=Math.random()*W;}
      } else if(kind==='clouds'||kind==='sunhaze'){
        ctx.fillStyle=kind==='sunhaze'?'rgba(240,192,112,'+(p2.a*.12)+')':'rgba(180,180,200,'+(p2.a*.10)+')';
        ctx.beginPath(); ctx.arc(p2.x,p2.y,p2.r*16,0,6.29); ctx.fill();
        p2.x+=p2.v*.15; if(p2.x>W+60){p2.x=-60;}
      }
    });
    _fxRAF=requestAnimationFrame(frame);
  }
  _fxRAF=requestAnimationFrame(frame);
  document.addEventListener('visibilitychange', function(){
    if(document.hidden){ if(_fxRAF) cancelAnimationFrame(_fxRAF), _fxRAF=null; }
    else if(_fxCanvas && !_fxRAF) _fxRAF=requestAnimationFrame(frame);
  });
}
(function(){
  function boot(){
    try{
      var mode=lsGet('rw_theme_mode');
      rwApplyTheme(mode && RW_THEMES[mode] ? mode : rwPickTheme());
    }catch(e){ /* storage best-effort, ignore */ }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

