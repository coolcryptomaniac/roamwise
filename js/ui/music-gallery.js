// @ts-nocheck
/* ============================================================================
   js/ui/music-gallery.js - "Kasar Music Fest 2.0" gallery inside #musicEventsIndia
   ============================================================================
   Theme: dark crimson mist, gold hairlines, a Kumaon ridge line and an equaliser pulse (an original RoamWise look).
   - PHOTOS: the founder's own photos (resized, EXIF/GPS removed, lazy). Captions for people are the founder's words.
   - CLIPS: public videos/posts shown with the platform's OWN embed, only after a tap (nothing third-party loads
     before that). Only add a clip whose owner allows embedding, and keep the credit line. Allowed hosts: YouTube
     (id) and Instagram (post/reel shortcode). Empty today: no public Kasar Music Fest 2.0 clip was verified.
   - Also: Rave to Hell video (tap to load) and a "not announced yet" note.
   Animation is switched off for prefers-reduced-motion and for slow networks / low-end phones.
   Text is set with textContent only. Keep each photo under about 90 KB.
   ============================================================================ */
(function(){
  var PHOTOS=[
    {src:'/assets/img/music/kasar-fest-2026-nupur-pant.jpg',cap:'With Nupur Pant at Kasar Music Fest 2.0',big:1},
    {src:'/assets/img/music/kasar-fest-2026-rahgir.jpg',cap:'With Rahgir at Kasar Music Fest 2.0',big:1},
    {src:'/assets/img/music/kasar-fest-2026-stage-1.jpg',cap:'Main stage under the Kasar Music Fest 2.0 banner'},
    {src:'/assets/img/music/kasar-fest-2026-stage-3.jpg',cap:'Singer and band, Kasar Music Fest 2.0'},
    {src:'/assets/img/music/kasar-fest-2026-stage-2.jpg',cap:'Stage lights, evening set'},
    {src:'/assets/img/music/kasar-fest-2026-crowd.jpg',cap:'The crowd, 4 October 2026'}
  ];
  /* {type:'youtube',id:'XXXXXXXXXXX',credit:'Channel name'} or {type:'instagram',code:'Cxxxxxxxxxx',credit:'@handle'} */
  var CLIPS=[
    {type:'instagram',code:'DeHWhRFBQSR'},{type:'instagram',code:'DaNuRbnzEJE'},{type:'instagram',code:'DeTxaeEMNYj'},
    {type:'instagram',code:'DePDZ5kqnN_'},{type:'instagram',code:'DeGK88PsYLV'},{type:'instagram',code:'DeHgm31KW_b'}
  ]; /* reels supplied by the founder; tracking parameters removed */
  var VIDEO_ID='L-U-A-o1G6Q', WA='https://wa.me/919987379730';
  var net=window.__RW_NET||{}, calm=/slow|vslow/.test(net.tier||'')||net.lowEnd||(window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches);
  var CSS='#rwMusicGallery{position:relative;margin:0 0 14px;padding:16px 14px 14px;border-radius:20px;overflow:hidden;border:1px solid rgba(214,99,127,.5);background:#09060d;color:#F2EFE6}'
   +'#rwMusicGallery .mg-mist{position:absolute;inset:-30%;pointer-events:none;background:radial-gradient(40% 30% at 20% 25%,rgba(170,20,60,.55),transparent 70%),radial-gradient(35% 28% at 80% 70%,rgba(232,186,108,.22),transparent 70%),radial-gradient(45% 35% at 60% 10%,rgba(110,10,50,.5),transparent 70%)}'
   +'#rwMusicGallery:not(.calm) .mg-mist{animation:mgMist 18s ease-in-out infinite alternate}'
   +'@keyframes mgMist{to{transform:translate3d(6%,4%,0) rotate(6deg)}}'
   +'#rwMusicGallery .mg-in{position:relative}'
   +'#rwMusicGallery .mg-k{font-size:10.5px;font-weight:900;letter-spacing:.22em;text-transform:uppercase;color:#d6637f}'
   +'#rwMusicGallery h3{font:900 clamp(22px,6.4vw,30px)/1.1 Georgia,serif;margin:6px 0 2px;color:#FFE0AE;text-shadow:0 0 22px rgba(232,186,108,.35)}'
   +'#rwMusicGallery .mg-s{font-size:12px;color:#cfc9d6;margin:0 0 8px}'
   +'#rwMusicGallery .mg-eq{display:flex;align-items:flex-end;gap:3px;height:18px;margin:8px 0 10px}'
   +'#rwMusicGallery .mg-eq i{width:4px;height:5px;border-radius:2px;background:linear-gradient(#E8BA6C,#d6637f)}'
   +'#rwMusicGallery:not(.calm) .mg-eq i{animation:mgEq 1s ease-in-out infinite alternate}'
   +'@keyframes mgEq{from{height:4px}to{height:18px}}'
   +'#rwMusicGallery .mg-eq i:nth-child(3n){animation-delay:-.3s}#rwMusicGallery .mg-eq i:nth-child(3n+1){animation-delay:-.6s}#rwMusicGallery .mg-eq i:nth-child(5n){animation-delay:-.9s}'
   +'#rwMusicGallery .mg-strip{display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x mandatory;padding:6px 2px 10px;-webkit-overflow-scrolling:touch}'
   +'#rwMusicGallery .mg-ph{position:relative;flex:0 0 60%;max-width:230px;scroll-snap-align:center;padding:0;border:1px solid rgba(232,186,108,.55);border-radius:12px;overflow:hidden;background:#000;cursor:pointer;aspect-ratio:3/4;transition:transform .35s,box-shadow .35s}'
   +'#rwMusicGallery .mg-ph.big{flex-basis:68%;max-width:260px;border-color:#d6637f;box-shadow:0 0 22px rgba(214,99,127,.35)}'
   +'#rwMusicGallery .mg-ph:hover,#rwMusicGallery .mg-ph:focus-visible{transform:translateY(-4px) rotate(-1deg);box-shadow:0 10px 26px rgba(214,99,127,.45)}'
   +'#rwMusicGallery .mg-ph img{display:block;width:100%;height:100%;object-fit:cover}'
   +'#rwMusicGallery .mg-ph b{position:absolute;left:0;right:0;bottom:0;padding:22px 9px 8px;font:700 11.5px/1.3 inherit;text-align:left;color:#fff;background:linear-gradient(transparent,rgba(0,0,0,.85))}'
   +'#rwMusicGallery:not(.calm) .mg-ph::after{content:"";position:absolute;top:0;bottom:0;width:40%;left:-60%;background:linear-gradient(100deg,transparent,rgba(255,224,174,.28),transparent);animation:mgSweep 6s ease-in-out infinite}'
   +'@keyframes mgSweep{0%,70%{left:-60%}100%{left:130%}}'
   +'#rwMusicGallery .mg-box{margin-top:10px;border-radius:14px;overflow:hidden;border:1px solid rgba(214,99,127,.45);background:linear-gradient(135deg,#3a0f2a,#07090f);aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;position:relative}'
   +'#rwMusicGallery .mg-box iframe{position:absolute;inset:0;width:100%;height:100%;border:0}'
   +'#rwMusicGallery .mg-go{border:0;border-radius:999px;padding:12px 18px;font:800 13px/1 inherit;color:#07090f;background:linear-gradient(135deg,#ff7b8a,#E8BA6C);cursor:pointer}'
   +'#rwMusicGallery .mg-h{font:800 13px/1.3 inherit;margin:14px 0 2px;color:#FFE0AE}'
   +'#rwMusicGallery .mg-n{font-size:11.5px;line-height:1.5;color:#b9b3c2;margin:4px 0 0}'
   +'#rwMusicGallery a,#rwMusicSoon a{color:#E8BA6C}'
   +'#rwMusicSoon{margin-top:10px;padding:12px;border:1px dashed var(--b2,#2A2A36);border-radius:14px;font-size:12px;line-height:1.55;color:var(--t2,#d8d5ce)}'
   +'#rwMusicGallery .mg-reel{position:relative;flex:0 0 66%;max-width:250px;scroll-snap-align:center;height:470px;border:1px solid rgba(214,99,127,.5);border-radius:14px;overflow:hidden;background:linear-gradient(160deg,#3a0f2a,#07090f);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px}'
   +'#rwMusicGallery .mg-reel iframe{position:absolute;inset:0;width:100%;height:100%;border:0;background:#000}'
   +'#rwMusicGallery .mg-reel a{font-size:11.5px}'
   +'#rwMgBox{position:fixed;inset:0;z-index:100000;background:rgba(6,2,10,.94);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:14px}'
   +'#rwMgBox img{max-width:100%;max-height:78vh;border-radius:10px;border:1px solid rgba(232,186,108,.5)}'
   +'#rwMgBox p{color:#e8e5ee;font-size:12.5px;margin:8px 0 0;text-align:center}'
   +'#rwMgBox .mg-row{display:flex;gap:10px;margin-top:10px}'
   +'#rwMgBox button{border:0;border-radius:999px;padding:10px 18px;font-weight:800;cursor:pointer}';
  function node(tag,cls,txt){ var e=document.createElement(tag); if(cls) e.className=cls; if(txt!=null) e.textContent=txt; return e; }
  function link(href,txt){ var a=node('a',null,txt); a.href=href; a.target='_blank'; a.rel='noopener'; return a; }
  function lightbox(i){
    var old=document.getElementById('rwMgBox'); if(old) old.remove();
    var b=document.createElement('div'); b.id='rwMgBox'; b.setAttribute('role','dialog'); b.setAttribute('aria-modal','true');
    var im=document.createElement('img'), cap=node('p'), row=node('div','mg-row');
    var prev=node('button',null,'‹ Prev'), next=node('button',null,'Next ›'), x=node('button',null,'Close');
    [prev,next,x].forEach(function(t){ t.type='button'; });
    function show(n){ i=(n+PHOTOS.length)%PHOTOS.length; im.src=PHOTOS[i].src; im.alt=PHOTOS[i].cap; cap.textContent=PHOTOS[i].cap; b.setAttribute('aria-label',PHOTOS[i].cap); }
    function close(){ b.remove(); document.removeEventListener('keydown',key); }
    function key(e){ if(e.key==='Escape') close(); else if(e.key==='ArrowRight') show(i+1); else if(e.key==='ArrowLeft') show(i-1); }
    prev.onclick=function(){ show(i-1); }; next.onclick=function(){ show(i+1); }; x.onclick=close;
    b.onclick=function(e){ if(e.target===b) close(); }; document.addEventListener('keydown',key);
    row.appendChild(prev); row.appendChild(x); row.appendChild(next);
    b.appendChild(im); b.appendChild(cap); b.appendChild(row); show(i); document.body.appendChild(b); x.focus();
  }
  function facade(label,make){
    var box=node('div','mg-box'), go=node('button','mg-go',label); go.type='button';
    go.onclick=function(){ var f=make(); box.textContent=''; box.appendChild(f); };
    box.appendChild(go); return box;
  }
  function frame(src,title,allow){ var f=document.createElement('iframe'); f.src=src; f.title=title; f.allow=allow||'autoplay; encrypted-media; picture-in-picture'; f.allowFullscreen=true; f.referrerPolicy='strict-origin-when-cross-origin'; f.loading='lazy'; return f; }
  function build(){
    var st=document.createElement('style'); st.textContent=CSS; (document.head||document.documentElement).appendChild(st);
    var g=document.createElement('div'); g.id='rwMusicGallery'; if(calm) g.className='calm';
    g.appendChild(node('div','mg-mist'));
    var in_=node('div','mg-in'); g.appendChild(in_);
    in_.appendChild(node('div','mg-k','RoamWise music memories · Kasar Devi, Almora'));
    in_.appendChild(node('h3',null,'Kasar Music Fest 2.0'));
    in_.appendChild(node('p','mg-s','A festival weekend under the Kumaon sky, October 2026. Photos by Mohit Pandey, the founder. Tap one to open.'));
    var eq=node('div','mg-eq'); for(var k=0;k<24;k++) eq.appendChild(document.createElement('i')); in_.appendChild(eq);
    var strip=node('div','mg-strip');
    PHOTOS.forEach(function(p,i){
      var b=document.createElement('button'); b.type='button'; b.className='mg-ph'+(p.big?' big':''); b.setAttribute('aria-label','Open photo: '+p.cap);
      var im=document.createElement('img'); im.src=p.src; im.alt=p.cap; im.loading='lazy'; im.decoding='async'; im.width=230; im.height=307;
      b.appendChild(im); b.appendChild(node('b',null,p.cap)); b.onclick=function(){ lightbox(i); }; strip.appendChild(b);
    });
    in_.appendChild(strip);
    in_.appendChild(node('div','mg-h','Clips from the weekend'));
    if(CLIPS.length){
      var reels=node('div','mg-strip mg-reels');
      CLIPS.forEach(function(c,i){
        var tile=node('div','mg-reel');
        var url=c.type==='instagram'?'https://www.instagram.com/reel/'+c.code+'/':'https://www.youtube.com/watch?v='+c.id;
        var go=node('button','mg-go','▶ Play reel '+(i+1)); go.type='button';
        go.onclick=function(){
          tile.textContent='';
          tile.appendChild(c.type==='instagram'
            ?frame('https://www.instagram.com/reel/'+encodeURIComponent(c.code)+'/embed','Kasar Music Fest 2.0 reel '+(i+1)+' on Instagram','encrypted-media; picture-in-picture')
            :frame('https://www.youtube-nocookie.com/embed/'+encodeURIComponent(c.id)+'?autoplay=1&rel=0','Kasar Music Fest 2.0 clip on YouTube'));
        };
        tile.appendChild(go); tile.appendChild(link(url,'Original on '+(c.type==='instagram'?'Instagram':'YouTube')+' ↗'));
        reels.appendChild(tile);
      });
      in_.appendChild(reels);
      in_.appendChild(node('p','mg-n','Reels by their original creators, shown with Instagram\'s own player. Nothing loads from Instagram until you tap, and each reel links back to its poster. If a reel will not play, use the link under it.'));
    } else {
      var n=node('p','mg-n','No public clip of the festival is embedded yet. Shot something at Kasar Music Fest 2.0? '); n.appendChild(link(WA+'?text='+encodeURIComponent('Hi RoamWise, here is my Kasar Music Fest 2.0 clip/photo link, and you may feature it with credit: '),'Send it on WhatsApp ↗')); in_.appendChild(n);
    }
    in_.appendChild(node('div','mg-h','Rave to Hell · the RoamWise anthem'));
    in_.appendChild(facade('▶ Watch Rave to Hell',function(){ return frame('https://www.youtube-nocookie.com/embed/'+VIDEO_ID+'?autoplay=1&rel=0','Rave to Hell on YouTube'); }));
    var alt=node('p','mg-n','Video loads from YouTube only when you tap. '); alt.appendChild(link('https://music.youtube.com/watch?v='+VIDEO_ID,'Open in YouTube Music ↗')); in_.appendChild(alt);
    return g;
  }
  function soon(){
    var d=document.createElement('div'); d.id='rwMusicSoon';
    d.appendChild(document.createTextNode('Not announced when we last checked (Oct 2026): the next NH7 Weekender, Vh1 Supersonic, Magnetic Fields Nomads and Ziro Festival of Music. We add a festival only after the organiser confirms dates. Planning something earlier? '));
    d.appendChild(link(WA+'?text='+encodeURIComponent('Hi RoamWise, I want help planning a trip around a live music event.'),'Message RoamWise on WhatsApp ↗'));
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
