/* RoamWise sound + haptics manager. Theme source: user-supplied Rave to Hell / Kumaon Shadow Rite. */
(function(){'use strict';
var SRC='/assets/audio/rave-to-hell-theme-10s.mp3';
var K={music:'rw_audio_enabled',sfx:'rw_sfx_enabled',haptics:'rw_haptics_enabled'};
function read(k,d){try{var v=localStorage.getItem(k);return v===null?d:v!=='0'}catch(e){return d}}
function write(k,v){try{localStorage.setItem(k,v?'1':'0')}catch(e){}}
var state={music:read(K.music,true),sfx:read(K.sfx,true),haptics:read(K.haptics,true),unlocked:false,pending:null};
var theme=new Audio(SRC);theme.preload='auto';theme.loop=true;theme.volume=.42;
var seg={opening:[0,6.6],action:[2.2,2.2],transition:[4.4,1.4],success:[6.0,2.0],tap:[8.0,.24]};
function haptic(kind){if(!state.haptics)return;try{if(window.RW&&typeof RW.haptic==='function'){RW.haptic(kind||'light');return}if(navigator.vibrate){navigator.vibrate(kind==='heavy'?[18,18,28]:kind==='success'?[10,24,12]:8)}}catch(e){}}
function playSfx(name,vol){if(!state.sfx)return Promise.resolve(false);var s=seg[name]||seg.tap;try{var a=new Audio(SRC);a.preload='auto';a.volume=vol==null?.28:vol;a.currentTime=s[0];var p=a.play();if(p&&p.catch)p.catch(function(){});setTimeout(function(){try{a.pause();a.src=''}catch(e){}},Math.ceil(s[1]*1000));return p||Promise.resolve(true)}catch(e){return Promise.resolve(false)}}
function soundHint(on){
  try{
    var root=document.getElementById('rwOpening');if(!root)return;
    var old=document.getElementById('rwAudioUnlockHint');
    if(!on){if(old)old.remove();return}
    if(old)return;
    var b=document.createElement('div');b.id='rwAudioUnlockHint';b.setAttribute('aria-live','polite');b.textContent='🔊 Tap once for sound';b.style.cssText='position:absolute;left:max(14px,env(safe-area-inset-left));top:max(16px,calc(env(safe-area-inset-top) + 8px));z-index:30;padding:9px 12px;border-radius:999px;background:rgba(7,9,15,.68);border:1px solid rgba(255,255,255,.18);backdrop-filter:blur(12px);color:#fff;font:700 11px/1.2 Outfit,system-ui,sans-serif;pointer-events:none;box-shadow:0 8px 24px rgba(0,0,0,.25)';root.appendChild(b);
  }catch(e){}
}
function playTheme(name){if(!state.music)return Promise.resolve(false);var s=seg[name]||seg.opening;try{theme.loop=false;theme.currentTime=s[0];theme.volume=name==='opening'?.50:.34;var p=theme.play();if(p&&p.then){return p.then(function(){state.unlocked=true;soundHint(false);setTimeout(function(){if(!theme.loop)theme.pause()},s[1]*1000);return true}).catch(function(){state.pending=name;if(name==='opening')soundHint(true);return false})}return Promise.resolve(true)}catch(e){state.pending=name;if(name==='opening')soundHint(true);return Promise.resolve(false)}}
function ambient(on){if(on===false||!state.music){try{theme.pause()}catch(e){};return}try{theme.loop=true;theme.currentTime=0;theme.volume=.16;var p=theme.play();if(p&&p.catch)p.catch(function(){state.pending='ambient'})}catch(e){}}
function unlock(){if(state.unlocked)return;state.unlocked=true;soundHint(false);var p=state.pending;state.pending=null;if(p==='ambient')ambient(true);else if(p)playTheme(p)}
function toggle(key,val){state[key]=!!val;write(K[key],state[key]);if(key==='music'&&!val){try{theme.pause()}catch(e){}soundHint(false)}syncUI()}
function syncUI(){['music','sfx','haptics'].forEach(function(k){var e=document.getElementById('rw-'+k+'-toggle');if(e)e.checked=state[k]})}
function injectSettings(){var body=document.querySelector('#settingsOverlay .modal-body');if(!body||document.getElementById('rwSoundSettings'))return;var box=document.createElement('div');box.id='rwSoundSettings';box.className='key-section';box.innerHTML='<div class="key-sec-title">Sound & haptics</div><div style="display:grid;gap:10px;font-size:13px;color:var(--t2)"><label><input id="rw-music-toggle" type="checkbox"> Theme music — Rave to Hell</label><label><input id="rw-sfx-toggle" type="checkbox"> UI sound effects</label><label><input id="rw-haptics-toggle" type="checkbox"> Haptic feedback</label><div style="font-size:11px;color:var(--t3);line-height:1.5">Android app playback starts with the cinematic opening. Browsers that block autoplay show a “Tap once for sound” hint. Your choices stay on this device.</div></div>';body.appendChild(box);[['music','rw-music-toggle'],['sfx','rw-sfx-toggle'],['haptics','rw-haptics-toggle']].forEach(function(x){var e=document.getElementById(x[1]);e.addEventListener('change',function(){toggle(x[0],e.checked)})});syncUI()}
window.RWAudio={state:state,playTheme:playTheme,playSfx:playSfx,ambient:ambient,haptic:haptic,toggle:toggle,unlock:unlock};
window.rwHaptic=haptic;
document.addEventListener('pointerdown',unlock,{once:true,capture:true});
document.addEventListener('click',function(e){var t=e.target&&e.target.closest&&e.target.closest('button,.tact,.rzp-main-btn,.tabbar button,.auth-btn,.exp,.trek');if(!t)return;playSfx(t.classList.contains('rzp-main-btn')?'action':'tap',t.classList.contains('rzp-main-btn')?.24:.12);haptic(t.classList.contains('rzp-main-btn')?'heavy':'light')},true);
window.addEventListener('rw:success',function(){playSfx('success',.32);haptic('success')});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',injectSettings);else injectSettings();
})();