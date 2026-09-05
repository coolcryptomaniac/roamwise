// @ts-nocheck
// Moved verbatim from app.js — In-app form modal (rwForm/rwFormSubmit)
// replacing browser prompt(). Widely called across js/social, js/booking,
// js/game and js/audio — see call sites.
/* ==================== IN-APP FORM MODAL ====================
   Replaces browser prompt() (the ugly "page at file:// says" boxes) with a
   styled sheet. rwForm(title, fields, onSubmit) where fields = [{key,label,
   placeholder,type,value}]. onSubmit gets an object of {key:value}. Cancel =
   no callback. Works in the APK (file://) and on the web identically. */
function rwForm(title, fields, onSubmit){
  var ov=el('rwFormOverlay');
  if(!ov){
    ov=document.createElement('div'); ov.id='rwFormOverlay'; ov.className='overlay';
    ov.innerHTML='<div class="sheet" style="max-width:420px"><div class="sheet-head"><b id="rwFormTitle"></b><button class="x" onclick="rwOverlayClose(\'rwFormOverlay\')">\u2715</button></div><div id="rwFormBody" style="padding:6px 4px 16px"></div></div>';
    document.body.appendChild(ov);
  }
  ov.style.zIndex='3000';   /* always above the chat (panel or full) */
  el('rwFormTitle').textContent=title;
  var body=el('rwFormBody');
  /* Optional leading read-only notice (e.g. a viewing-only / preview banner).
     Additive and non-breaking: callers that don't set fields._notice render as before.
     esc2() keeps it safe even if the text ever comes from data. */
  var _notice = fields._notice
    ? '<div style="background:var(--bg3,#1A1A20);border:1px solid var(--b2,#2A2A36);border-radius:12px;padding:10px 12px;margin:2px 2px 8px;font-size:12px;line-height:1.45;color:var(--t2,#B9B9C6)">'+esc2(fields._notice)+'</div>'
    : '';
  body.innerHTML = _notice + fields.map(function(f,i){
    var common='width:100%;box-sizing:border-box;background:var(--bg3,#1A1A20);border:1px solid var(--b2,#2A2A36);border-radius:12px;padding:12px 13px;color:inherit;font:inherit;font-size:16px;outline:none;margin-bottom:4px';
    var inp = f.type==='textarea'
      ? '<textarea id="rwf_'+i+'" rows="3" placeholder="'+esc2(f.placeholder||'')+'" style="'+common+';resize:vertical">'+esc2(f.value||'')+'</textarea>'
      : f.type==='select'
      ? '<select id="rwf_'+i+'" style="'+common+'">'+(f.options||[]).map(function(o){ var v=(o.value!=null?o.value:o), l=(o.label!=null?o.label:o); return '<option value="'+esc2(v)+'"'+(String(f.value)===String(v)?' selected':'')+'>'+esc2(l)+'</option>'; }).join('')+'</select>'
      : '<input id="rwf_'+i+'" type="'+(f.type||'text')+'" inputmode="'+(f.type==='number'?'numeric':'text')+'" placeholder="'+esc2(f.placeholder||'')+'" value="'+esc2(f.value||'')+'" style="'+common+'">';
    return '<label style="display:block;font-size:12px;color:var(--t2);font-weight:600;margin:10px 2px 5px">'+esc2(f.label)+'</label>'+inp
      +(f.hint?'<div style="font-size:10.5px;color:var(--t3);margin:0 2px 2px">'+esc2(f.hint)+'</div>':'');
  }).join('')
  + '<button class="rzp-main-btn" style="width:100%;margin-top:14px" onclick="rwFormSubmit()">'+(fields._submit||'Add')+'</button>';
  window._rwFormFields=fields; window._rwFormCb=onSubmit;
  rwOverlayOpen('rwFormOverlay');
  setTimeout(function(){ var f0=el('rwf_0'); if(f0) f0.focus(); }, 120);
}
function rwFormSubmit(){
  var fields=window._rwFormFields||[], out={};
  for(var i=0;i<fields.length;i++){
    var elm=el('rwf_'+i); out[fields[i].key]=elm?elm.value.trim():'';
  }
  rwOverlayClose('rwFormOverlay');
  if(typeof window._rwFormCb==='function') window._rwFormCb(out);
}
