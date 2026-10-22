// @ts-nocheck
/* ==================== COPILOT: ?ask= LINK ====================
   A page on this site (for example /packages/) can open the app with a question already typed in the Ailon Tusk box:
   https://roamwise.co.in/?ask=<question>. It only fills the box and focuses it; the person presses send themselves.
   Text is trimmed, stripped of markup characters and limited to 600 characters. Classic-script globals, no modules. */
function rwAskFromSearch(search){
  var m = String(search||'').match(/[?&]ask=([^&#]*)/);
  if(!m) return '';
  var raw = '';
  try{ raw = decodeURIComponent(m[1].replace(/\+/g,' ')); }catch(e){ return ''; }
  return raw.replace(/[<>\u0000-\u001f]+/g,' ').replace(/\s+/g,' ').trim().slice(0,600);
}
function rwApplyAskLink(){
  var q = rwAskFromSearch(location.search), input = document.getElementById('heroInput');
  if(!q || !input) return;
  input.value = q;
  try{ cpFocusHero(); }catch(e){ /* the question is still in the box */ }
  try{ history.replaceState(null,'',location.pathname+location.hash); }catch(e){ /* keep the URL */ }
}
if(typeof window!=='undefined'){
  window.rwAskFromSearch = rwAskFromSearch;
  if(document.readyState==='complete') setTimeout(rwApplyAskLink,300);
  else window.addEventListener('load', function(){ setTimeout(rwApplyAskLink,300); });
}
