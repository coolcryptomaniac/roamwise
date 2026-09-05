// @ts-nocheck
// Moved verbatim from app.js — Overlay history stack: pushes browser history
// on overlay open so Android's back button closes the overlay instead of
// leaving the app. Called from almost every overlay-opening feature file.
/* --- Overlay history stack ---
   Android's back button was leaving the app because overlays never touched
   history. Each open pushes a state; back pops it and closes the top overlay. */
var _rwOvStack=[];
function rwOverlayOpen(id, closeFn){
  var ov=el(id); if(!ov) return;
  ov.classList.add('open'); document.body.style.overflow='hidden';
  _rwOvStack.push({id:id, close:closeFn});
  try{ history.pushState({rwOverlay:id}, ''); }catch(e){}
}
function rwOverlayClose(id){
  var ov=el(id); if(ov) ov.classList.remove('open');
  _rwOvStack = _rwOvStack.filter(function(o){ return o.id!==id; });
  if(!_rwOvStack.length) document.body.style.overflow='';
}
window.addEventListener('popstate', function(){
  var top=_rwOvStack.pop();
  if(top){ var ov=el(top.id); if(ov) ov.classList.remove('open'); if(!_rwOvStack.length) document.body.style.overflow=''; }
});
