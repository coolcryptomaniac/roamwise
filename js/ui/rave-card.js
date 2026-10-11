// @ts-nocheck
/* ============================================================================
   js/ui/rave-card.js - "Rave to Hell" anthem card on the home page
   ============================================================================
   The founder's own track, hosted in assets/audio/rave-to-hell-lite.mp3 (about 1.9 MB, 80 kbps). Nothing downloads
   until the visitor taps Play (preload none), so it costs slow connections nothing. The audio element lives
   in the page, so js/audio/focus.js pauses other audio when it starts. Streaming buttons are the song's own links
   (YouTube Music, Spotify, Apple Music, Amazon Music) plus the artist/profile pages. Add more platforms to
   LINKS below only with the real URL. No tracking, no third-party embeds, no data collected.
   ============================================================================ */
(function(){
  var SRC='/assets/audio/rave-to-hell-lite.mp3';
  var LINKS=[
    ['YouTube Music','https://music.youtube.com/watch?v=L-U-A-o1G6Q'],
    ['Spotify','https://open.spotify.com/track/1yS4k1NPpxxKsX6DxFOCsm'],
    ['Apple Music','https://music.apple.com/in/song/rave-to-hell/6772573897'],
    ['Amazon Music','https://amazon.com/music/player/albums/B0H2QZ1FNL?marketplaceId=ATVPDKIKX0DER&musicTerritory=US'],
    ['More songs','https://open.spotify.com/artist/2qbS0OT9WF0Wpf2WnggrKS'],
    ['All songs playlist','https://open.spotify.com/playlist/4tO1PY5vyjXhwLFepr8VIF'],
    ['JioSaavn','https://www.saavn.com/s/artist/mohit-pandey-albums/s0TzZzm4XaE_'],
    ['YouTube','https://www.youtube.com/@mohucool']
  ];
  var CSS='#rwRaveCard{position:relative;overflow:hidden;margin:12px 14px 16px;max-width:760px;box-sizing:border-box;padding:18px;border-radius:20px;border:1px solid rgba(214,99,127,.55);background:radial-gradient(110% 100% at 0 0,#3a0f2a 0,#12081a 55%,#07090f 100%);color:#F2EFE6;box-shadow:0 10px 34px rgba(150,20,60,.3)}'
   +'@media (min-width:800px){#rwRaveCard{margin-left:auto;margin-right:auto}}'
   +'#rwRaveCard .rv-k{font-size:11px;font-weight:900;letter-spacing:.2em;text-transform:uppercase;color:#d6637f}'
   +'#rwRaveCard .rv-t{font:900 clamp(28px,8vw,40px)/1.05 Georgia,serif;color:#FFE0AE;margin:6px 0 2px;text-shadow:0 0 22px rgba(232,186,108,.4)}'
   +'#rwRaveCard .rv-s{font-size:13px;color:#d8d5ce}'
   +'#rwRaveCard .rv-row{display:flex;align-items:center;gap:12px;margin:14px 0 8px}'
   +'#rwRaveCard .rv-play{flex:0 0 auto;width:58px;height:58px;border-radius:50%;border:0;cursor:pointer;font-size:22px;color:#07090f;background:linear-gradient(135deg,#ff7b8a,#E8BA6C);box-shadow:0 0 0 0 rgba(255,120,120,.6)}'
   +'#rwRaveCard.on .rv-play{animation:rvPulse 1.4s ease-out infinite}'
   +'@keyframes rvPulse{to{box-shadow:0 0 0 16px rgba(255,120,120,0)}}'
   +'#rwRaveCard .rv-mid{flex:1;min-width:0}'
   +'#rwRaveCard .rv-eq{display:flex;align-items:flex-end;gap:3px;height:26px}'
   +'#rwRaveCard .rv-eq i{width:5px;height:6px;border-radius:2px;background:linear-gradient(#E8BA6C,#d6637f)}'
   +'#rwRaveCard.on .rv-eq i{animation:rvEq .9s ease-in-out infinite alternate}'
   +'#rwRaveCard .rv-eq i:nth-child(2){animation-delay:-.2s}#rwRaveCard .rv-eq i:nth-child(3){animation-delay:-.5s}#rwRaveCard .rv-eq i:nth-child(4){animation-delay:-.7s}#rwRaveCard .rv-eq i:nth-child(5){animation-delay:-.35s}#rwRaveCard .rv-eq i:nth-child(6){animation-delay:-.6s}#rwRaveCard .rv-eq i:nth-child(7){animation-delay:-.1s}#rwRaveCard .rv-eq i:nth-child(8){animation-delay:-.8s}'
   +'@keyframes rvEq{from{height:5px}to{height:26px}}'
   +'#rwRaveCard .rv-bar{height:6px;border-radius:3px;background:rgba(255,255,255,.14);margin-top:8px;cursor:pointer;overflow:hidden}'
   +'#rwRaveCard .rv-bar b{display:block;height:100%;width:0;background:linear-gradient(90deg,#d6637f,#E8BA6C)}'
   +'#rwRaveCard .rv-time{font-size:11.5px;color:#c9c6cf;margin-top:4px;font-variant-numeric:tabular-nums}'
   +'#rwRaveCard .rv-links{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}'
   +'#rwRaveCard .rv-links a,#rwRaveCard .rv-links button{border-radius:999px;padding:10px 14px;font:800 12.5px/1 inherit;text-decoration:none;color:#F2EFE6;background:rgba(255,255,255,.08);border:1px solid rgba(232,186,108,.45);cursor:pointer}'
   +'#rwRaveCard .rv-note{font-size:11px;color:#a9a6b0;margin-top:8px}'
   +'@media (prefers-reduced-motion:reduce){#rwRaveCard.on .rv-play,#rwRaveCard.on .rv-eq i{animation:none}}';
  function node(tag,cls,txt){ var e=document.createElement(tag); if(cls) e.className=cls; if(txt!=null) e.textContent=txt; return e; }
  function fmt(s){ s=Math.max(0,Math.floor(s||0)); return Math.floor(s/60)+':'+(s%60<10?'0':'')+(s%60); }
  function build(){
    var st=document.createElement('style'); st.textContent=CSS; (document.head||document.documentElement).appendChild(st);
    var c=document.createElement('section'); c.id='rwRaveCard'; c.setAttribute('aria-label','Rave to Hell, the RoamWise anthem');
    c.appendChild(node('div','rv-k','The RoamWise anthem'));
    c.appendChild(node('div','rv-t','Rave to Hell'));
    c.appendChild(node('div','rv-s','Original track by Mohit Pandey, the founder. Press play, then go plan something reckless (within budget).'));
    var row=node('div','rv-row'), play=node('button','rv-play','▶'); play.type='button'; play.setAttribute('aria-label','Play Rave to Hell');
    var mid=node('div','rv-mid'), eq=node('div','rv-eq'); for(var i=0;i<8;i++) eq.appendChild(document.createElement('i'));
    var bar=node('div','rv-bar'), fill=document.createElement('b'); bar.appendChild(fill);
    var time=node('div','rv-time','0:00'); mid.appendChild(eq); mid.appendChild(bar); mid.appendChild(time);
    row.appendChild(play); row.appendChild(mid); c.appendChild(row);
    var audio=document.createElement('audio'); audio.preload='none'; audio.setAttribute('playsinline',''); c.appendChild(audio);
    var armed=false;
    function toggle(){
      if(!armed){ audio.src=SRC; armed=true; }
      if(audio.paused){ var p=audio.play(); if(p&&p.catch) p.catch(function(){ time.textContent='Could not start. Check your connection.'; }); }
      else audio.pause();
    }
    play.onclick=toggle;
    audio.addEventListener('play',function(){ c.classList.add('on'); play.textContent='❚❚'; play.setAttribute('aria-label','Pause'); });
    function off(){ c.classList.remove('on'); play.textContent='▶'; play.setAttribute('aria-label','Play Rave to Hell'); }
    audio.addEventListener('pause',off); audio.addEventListener('ended',off);
    audio.addEventListener('waiting',function(){ time.textContent='Buffering…'; });
    audio.addEventListener('timeupdate',function(){ var d=audio.duration||0; fill.style.width=d?Math.min(100,100*audio.currentTime/d)+'%':'0'; time.textContent=fmt(audio.currentTime)+(d?' / '+fmt(d):''); });
    bar.onclick=function(e){ if(!armed||!audio.duration) return; var r=bar.getBoundingClientRect(); audio.currentTime=audio.duration*Math.min(1,Math.max(0,(e.clientX-r.left)/r.width)); };
    var links=node('div','rv-links');
    LINKS.forEach(function(l){ var a=node('a',null,l[0]+' ↗'); a.href=l[1]; a.target='_blank'; a.rel='noopener'; links.appendChild(a); });
    var share=node('button',null,'Share ↗'); share.type='button';
    share.onclick=function(){
      var text='Rave to Hell, the RoamWise anthem by Mohit Pandey: https://roamwise.co.in/';
      try{ if(navigator.share){ navigator.share({title:'Rave to Hell',text:text}); return; } }catch(e){}
      window.open('https://wa.me/?text='+encodeURIComponent(text),'_blank','noopener');
    };
    links.appendChild(share); c.appendChild(links);
    c.appendChild(node('div','rv-note','Streams from RoamWise only when you tap play (about 2 MB). The platform buttons open Rave to Hell itself; More songs, playlist, JioSaavn and YouTube open the artist pages.'));
    return c;
  }
  function mount(){
    if(document.getElementById('rwRaveCard')) return true;
    var anchor=document.getElementById('musicEventsIndia')||document.getElementById('quickGrid');
    if(!anchor||!anchor.parentNode) return false;
    anchor.parentNode.insertBefore(build(),anchor);
    return true;
  }
  var tries=0;
  (function wait(){ if(mount()||++tries>30) return; setTimeout(wait,400); })();
})();
