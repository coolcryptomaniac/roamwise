// @ts-nocheck
/* ============================================================================
   js/ui/music-gallery.js - photo strip, video and "not announced yet" note for #musicEventsIndia
   ============================================================================
   Adds to the "Plan a trip around live music" section (event list itself is the EVENTS array in index.html):
   - A "Kasar Music Fest 2.0" photo strip: the founder's own photos, resized, EXIF/GPS removed, lazy-loaded.
     Only stage and crowd shots are used; no close-ups of people. Tap a photo to enlarge.
   - A "Rave to Hell" video: nothing from YouTube loads until the visitor taps (privacy-friendly youtube-nocookie
     embed on tap, plus a plain link as the fallback).
   - A short note on big festivals whose 2027 dates were not announced when the list was last checked.
   Text is set with textContent only. Add photos to PHOTOS; keep each under about 80 KB.
   ============================================================================ */
(function(){
  var PHOTOS=[
    ['/assets/img/music/kasar-fest-2026-stage-1.jpg','Kasar Music Fest 2.0 main stage, Kasar Devi, October 2026'],
    ['/assets/img/music/kasar-fest-2026-stage-3.jpg','Singer and band under the Kasar Music Fest 2.0 banner'],
    ['/assets/img/music/kasar-fest-2026-stage-2.jpg','Stage lights during the Kasar Music Fest 2.0 evening set'],
    ['/assets/img/music/kasar-fest-2026-crowd.jpg','The crowd at Kasar Music Fest 2.0, 4 October 2026']
  ];
  var VIDEO_ID='L-U-A-o1G6Q';
  var CSS='#rwMusicGallery{margin:0 0 14px}'
   +'#rwMusicGallery h3{font:800 15px/1.3 inherit;margin:0 0 2px;color:var(--t1,#F2EFE6)}'
   +'#rwMusicGallery .mg-s{font-size:11.5px;color:var(--t3,#a9a6b0);margin:0 0 8px}'
   +'#rwMusicGallery .mg-strip{display:flex;gap:8px;overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:6px;-webkit-overflow-scrolling:touch}'
   +'#rwMusicGallery .mg-strip button{flex:0 0 62%;max-width:240px;scroll-snap-align:start;padding:0;border:1px solid var(--b2,#2A2A36);border-radius:14px;overflow:hidden;background:#000;cursor:pointer;aspect-ratio:3/4}'
   +'#rwMusicGallery .mg-strip img{display:block;width:100%;height:100%;object-fit:cover}'
   +'#rwMusicGallery .mg-vid{margin-top:10px;position:relative;border-radius:14px;overflow:hidden;border:1px solid rgba(214,99,127,.45);background:linear-gradient(135deg,#3a0f2a,#07090f);aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;text-align:center}'
   +'#rwMusicGallery .mg-vid iframe{position:absolute;inset:0;width:100%;height:100%;border:0}'
   +'#rwMusicGallery .mg-go{border:0;border-radius:999px;padding:12px 18px;font:800 13px/1 inherit;color:#07090f;background:linear-gradient(135deg,#ff7b8a,#E8BA6C);cursor:pointer}'
   +'#rwMusicGallery .mg-alt{display:block;font-size:11.5px;margin-top:6px}'
   +'#rwMusicGallery .mg-alt a,#rwMusicSoon a{color:var(--gold2,#C8913E)}'
   +'#rwMusicSoon{margin-top:10px;padding:12px;border:1px dashed var(--b2,#2A2A36);border-radius:14px;font-size:12px;line-height:1.55;color:var(--t2,#d8d5ce)}'
   +'#rwMgBox{position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,.92);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:14px}'
   +'#rwMgBox img{max-width:100%;max-height:82vh;border-radius:10px}'
   +'#rwMgBox p{color:#e8e5ee;font-size:12px;margin:8px 0 0;text-align:center}'
   +'#rwMgBox button{margin-top:10px;border:0;border-radius:999px;padding:10px 20px;font-weight:800;cursor:pointer}';
  function node(tag,cls,txt){ var e=document.createElement(tag); if(cls) e.className=cls; if(txt!=null) e.textContent=txt; return e; }
  function lightbox(src,alt){
    var old=document.getElementById('rwMgBox'); if(old) old.remove();
    var b=document.createElement('div'); b.id='rwMgBox'; b.setAttribute('role','dialog'); b.setAttribute('aria-label',alt);
    var im=document.createElement('img'); im.src=src; im.alt=alt; b.appendChild(im); b.appendChild(node('p',null,alt));
    var x=node('button',null,'Close'); x.type='button'; b.appendChild(x);
    function close(){ b.remove(); document.removeEventListener('keydown',key); }
    function key(e){ if(e.key==='Escape') close(); }
    b.onclick=function(e){ if(e.target!==im) close(); }; document.addEventListener('keydown',key);
    document.body.appendChild(b); x.focus();
  }
  function link(href,txt){ var a=node('a',null,txt); a.href=href; a.target='_blank'; a.rel='noopener'; return a; }
  function build(){
    var st=document.createElement('style'); st.textContent=CSS; (document.head||document.documentElement).appendChild(st);
    var g=document.createElement('div'); g.id='rwMusicGallery';
    g.appendChild(node('h3',null,'Last weekend in Kasar Devi: Kasar Music Fest 2.0'));
    g.appendChild(node('p','mg-s','Photos by Mohit Pandey, the founder. Tap to enlarge.'));
    var strip=node('div','mg-strip');
    PHOTOS.forEach(function(p){
      var b=document.createElement('button'); b.type='button'; b.setAttribute('aria-label','Enlarge photo: '+p[1]);
      var im=document.createElement('img'); im.src=p[0]; im.alt=p[1]; im.loading='lazy'; im.decoding='async'; im.width=240; im.height=320;
      b.appendChild(im); b.onclick=function(){ lightbox(p[0],p[1]); }; strip.appendChild(b);
    });
    g.appendChild(strip);
    var vid=node('div','mg-vid'), go=node('button','mg-go','▶ Watch Rave to Hell'); go.type='button';
    go.onclick=function(){
      var f=document.createElement('iframe'); f.src='https://www.youtube-nocookie.com/embed/'+VIDEO_ID+'?autoplay=1&rel=0';
      f.title='Rave to Hell on YouTube'; f.allow='autoplay; encrypted-media; picture-in-picture'; f.allowFullscreen=true; f.referrerPolicy='strict-origin-when-cross-origin';
      vid.textContent=''; vid.appendChild(f);
    };
    vid.appendChild(go); g.appendChild(vid);
    var alt=node('span','mg-alt','Video loads from YouTube only when you tap. '); alt.appendChild(link('https://music.youtube.com/watch?v='+VIDEO_ID,'Open in YouTube Music ↗')); g.appendChild(alt);
    return g;
  }
  function soon(){
    var d=document.createElement('div'); d.id='rwMusicSoon';
    d.appendChild(document.createTextNode('Not announced when we last checked (Oct 2026): the next NH7 Weekender, Vh1 Supersonic, Magnetic Fields Nomads and Ziro Festival of Music. We add a festival only after the organiser confirms dates. Planning something earlier? '));
    d.appendChild(link('https://wa.me/919987379730?text='+encodeURIComponent('Hi RoamWise, I want help planning a trip around a live music event.'),'Message RoamWise on WhatsApp ↗'));
    return d;
  }
  function mount(){
    var sec=document.getElementById('musicEventsIndia'), list=document.getElementById('musicEventList');
    if(!sec||sec.hidden||!list) return !!(sec&&sec.hidden);
    if(document.getElementById('rwMusicGallery')) return true;
    list.parentNode.insertBefore(build(),list);
    list.parentNode.insertBefore(soon(),list.nextSibling);
    return true;
  }
  var tries=0;
  (function wait(){ if(mount()||++tries>30) return; setTimeout(wait,400); })();
})();
