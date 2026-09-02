/* RoamWise audio-only v1. No Firestore, haptics, auth, payment or startup coupling. */
(function(){'use strict';
  var SRC='/assets/audio/rave-to-hell-theme-10s.mp3';
  var KEY='rw_audio_enabled';
  var DEFAULT_VOLUME=0.24;
  var audio=null, unlocked=false, unlockBound=false;

  function enabled(){
    try { var v=localStorage.getItem(KEY); return v===null ? true : v!=='0'; }
    catch(_){ return true; }
  }
  function remember(v){ try { localStorage.setItem(KEY,v?'1':'0'); } catch(_){} }
  function getAudio(){
    if(audio) return audio;
    audio=new Audio(SRC);
    audio.loop=true;
    audio.preload='metadata';
    audio.volume=DEFAULT_VOLUME;
    audio.setAttribute('playsinline','');
    return audio;
  }
  function stop(){ if(audio){ audio.pause(); audio.currentTime=0; } }
  function play(){
    if(!enabled()) return Promise.resolve(false);
    var a=getAudio();
    var p=a.play();
    if(p&&typeof p.then==='function'){
      return p.then(function(){ unlocked=true; return true; }).catch(function(){ bindUnlock(); return false; });
    }
    unlocked=true; return Promise.resolve(true);
  }
  function bindUnlock(){
    if(unlockBound||!enabled()) return;
    unlockBound=true;
    function unlock(){
      if(!enabled()) return cleanup();
      play().finally(cleanup);
    }
    function cleanup(){
      unlockBound=false;
      document.removeEventListener('pointerdown',unlock,true);
      document.removeEventListener('touchend',unlock,true);
      document.removeEventListener('keydown',unlock,true);
    }
    document.addEventListener('pointerdown',unlock,true);
    document.addEventListener('touchend',unlock,true);
    document.addEventListener('keydown',unlock,true);
  }
  function setEnabled(v){
    remember(!!v);
    updateSetting();
    if(v) play(); else stop();
  }
  function updateSetting(){
    var b=document.getElementById('rwAudioToggle');
    if(!b) return;
    var on=enabled();
    b.textContent=on?'On':'Off';
    b.setAttribute('aria-pressed',on?'true':'false');
    b.style.background=on?'linear-gradient(135deg,#a35dff,#df57c9)':'#222533';
    b.style.color='#fff';
  }
  function mountSetting(){
    if(document.getElementById('rwAudioSetting')) return;
    var overlay=document.getElementById('settingsOverlay');
    if(!overlay) return;
    var host=overlay.querySelector('.modal')||overlay.querySelector('.settings')||overlay.firstElementChild;
    if(!host) return;
    var row=document.createElement('div');
    row.id='rwAudioSetting';
    row.style.cssText='display:flex;align-items:center;justify-content:space-between;gap:16px;margin:14px 0 4px;padding:13px 14px;border:1px solid rgba(255,255,255,.09);border-radius:14px;background:rgba(255,255,255,.035);font:500 14px/1.35 Outfit,system-ui,sans-serif;color:#f4eef8';
    row.innerHTML='<div><div style="font-weight:700">Theme music</div><div style="font-size:11px;opacity:.65;margin-top:2px">Rave to Hell · stored only on this device</div></div><button id="rwAudioToggle" type="button" aria-label="Toggle RoamWise theme music" style="border:0;border-radius:999px;padding:8px 15px;font-weight:800;cursor:pointer"></button>';
    host.appendChild(row);
    row.querySelector('button').addEventListener('click',function(){setEnabled(!enabled());});
    updateSetting();
  }
  function init(){
    mountSetting();
    if(enabled()) play();
    var mo=new MutationObserver(function(){ if(!document.getElementById('rwAudioSetting')) mountSetting(); });
    if(document.body) mo.observe(document.body,{childList:true,subtree:true});
  }

  window.RWAudio={play:play,stop:stop,setEnabled:setEnabled,isEnabled:enabled};
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();
