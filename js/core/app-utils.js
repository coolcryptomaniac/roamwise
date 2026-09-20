// @ts-nocheck
/* ==================== CORE: APP UTILITIES ====================
   Extracted verbatim from app.js (final modularization pass).

   These are small, generic, cross-cutting helpers invoked from
   `onclick="..."` attributes and from function bodies throughout
   the entire codebase. Keep them available before the app modules load. */

/* Subtle haptic feedback — makes taps feel responsive & premium. No-op where
   unsupported. Called on key actions (send, pin, pay-success). */
function rwHaptic(kind){
  try{
    if(window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.Haptics){
      Capacitor.Plugins.Haptics.impact({style: kind==='heavy'?'HEAVY':'LIGHT'});
    } else if(navigator.vibrate){ navigator.vibrate(kind==='heavy'?18:8); }
  }catch(e){ /* best-effort, ignore */ }
  try{ rwPlayCue(kind==='heavy' ? 'success_feedback' : 'tap_feedback'); }catch(e){ /* best-effort, ignore */ }
}

/* TOAST — wrap complete error messages, including payment errors, instead of
   the old nowrap text that extended beyond Android Chrome's viewport. */
function showToast(msg){
  var t = document.createElement('div');
  t.style.cssText = 'position:fixed;top:max(62px,env(safe-area-inset-top));left:50%;transform:translateX(-50%);background:#9B59F5;color:#fff;padding:10px 18px;border-radius:10px;font-weight:600;font-size:13px;line-height:1.45;z-index:9999;box-shadow:0 4px 20px rgba(155,89,245,.4);width:max-content;max-width:calc(100vw - 24px);box-sizing:border-box;text-align:center;pointer-events:none;white-space:normal;overflow-wrap:anywhere';
  t.textContent = msg;
  t.setAttribute('role','status');
  document.body.appendChild(t);
  setTimeout(function(){ t.remove(); }, String(msg).length > 110 ? 6500 : 3500);
}

/* Smooth-scrolls to a section, switching tabs first if needed (shell mode). */
var VIEW_OF={promofilm:'film',creator:'film',store:'store',ratings:'extras',treks:'explore',exps:'explore',circuits:'explore',ev:'explore',events:'explore',hubspoke:'explore',basecamp:'explore',jlog:'explore',app:'plan',brief:'home',aipulse:'explore',newspulse:'explore'};
function scrollToId(id){
  if(document.body.classList.contains('shell') && VIEW_OF[id]){
    tabGo(VIEW_OF[id]);
    setTimeout(function(){ var s=el(id); if(s) window.scrollTo({top:s.offsetTop-56,behavior:'smooth'}); },60);
    return;
  }
  var s=el(id); if(s) window.scrollTo({top:s.offsetTop-56,behavior:'smooth'});
}

/* "Your file was saved — open it now?" prompt shown after a certificate/PDF/
   collage save (native RW bridge on Android, plain <a download> on web). */
function offerOpen(label){
  var ov=el('openPromptOv');
  if(!ov){ ov=document.createElement('div'); ov.id='openPromptOv'; ov.className='overlay';
    ov.innerHTML='<div class="modal" style="max-width:340px;text-align:center"><div class="modal-body" id="openPromptBody"></div></div>';
    document.body.appendChild(ov); }
  el('openPromptBody').innerHTML=
     '<div style="font-size:34px;margin-bottom:8px">📕</div>'
    +'<div style="font-weight:700;font-size:15.5px;color:var(--t1);margin-bottom:4px">'+label+' saved</div>'
    +'<div style="font-size:12.5px;color:var(--t3);margin-bottom:16px">to Downloads/RoamWise</div>'
    +'<div style="display:flex;gap:8px">'
    +'<button class="tact" style="flex:1" onclick="el(\'openPromptOv\').classList.remove(\'open\')">Later</button>'
    +'<button class="rzp-main-btn" style="flex:1;margin:0" onclick="_doOpenNow()">👁 Open now</button>'
    +'</div>';
  ov.classList.add('open');
}
function _doOpenNow(){
  el('openPromptOv').classList.remove('open');
  try{ if(window.RW && RW.openLastSaved) RW.openLastSaved(); else showToast('Check Downloads/RoamWise to open it'); }
  catch(e){ showToast('Check Downloads/RoamWise to open it'); }
}
function saveOrDownload(dataUrl, filename){
  if(window.RW && RW.saveCard){ RW.saveCard(dataUrl); showToast('Saving to Downloads/RoamWise…'); return; }
  var a=document.createElement('a'); a.href=dataUrl; a.download=filename; a.click();
}
