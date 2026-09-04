// @ts-nocheck
/* ============================================================================
   LAYOUT MODES (rw-v56) — three genuinely different ways to use RoamWise.
   ============================================================================
   These are NOT colour themes (that's the separate 🎨 Theme picker). A mode
   changes the LAYOUT and information hierarchy — what you see first and how
   the app is shaped around you.

   SAFETY BY DESIGN: a mode only adds ONE class to <body>. All the actual
   change is CSS. No DOM is restructured, no feature is disabled, nothing is
   re-rendered. If a mode's CSS ever misbehaves, switching back to Classic
   removes the class and the app is byte-for-byte what it was. That is why
   this cannot "mess up" the working build.
   ========================================================================== */
var RW_MODES=[
  { id:'classic', name:'Classic',   icon:'\ud83c\udfe0',
    tag:'Feed-first',
    desc:'What you have today. Everything on one scrollable home, Tusk at the top.',
    best:'Best when you like seeing everything at once.' },
  { id:'atlas',   name:'Atlas',     icon:'\ud83d\uddfa\ufe0f',
    tag:'Map-first',
    desc:'The map leads. Your trip becomes a column of place-cards beside it, so you always see WHERE things are, not just what they are.',
    best:'Best for planning routes and multi-stop trips.' },
  { id:'story',   name:'Storyboard', icon:'\ud83d\udcd6',
    tag:'Editorial',
    desc:'Big type, one thing at a time, generous whitespace. Reads like a travel magazine rather than a dashboard.',
    best:'Best for dreaming, reading and slow planning.' }
];
function rwMode(){ try{ return lsGet('rw_mode')||'classic'; }catch(e){ return 'classic'; } }
function rwApplyMode(id){
  id=id||rwMode();
  var b=document.body; if(!b) return;
  RW_MODES.forEach(function(m){ b.classList.remove('rw-mode-'+m.id); });
  if(id!=='classic') b.classList.add('rw-mode-'+id);
  try{ b.setAttribute('data-mode', id); }catch(e){}
}
function rwSetMode(id){
  try{ lsSet('rw_mode', id); }catch(e){}
  rwApplyMode(id);
  try{ rwHaptic('heavy'); }catch(e){}
  var m=RW_MODES.filter(function(x){ return x.id===id; })[0];
  showToast((m?m.icon+' '+m.name:'Mode')+' \u00b7 '+(m?m.tag:''));
  try{ openModePicker(); }catch(e){}
}
function openModePicker(){
  var cur=rwMode();
  var ov=el('modeOv');
  if(!ov){ ov=document.createElement('div'); ov.id='modeOv'; ov.className='overlay'; ov.style.zIndex='3200';
    ov.onclick=function(e){ if(e.target===ov) rwOverlayClose('modeOv'); }; document.body.appendChild(ov); }
  ov.innerHTML='<div class="sheet" style="max-width:420px"><div class="sheet-h"><b>\ud83e\udded Layout mode</b>'
    +'<button onclick="rwOverlayClose(\'modeOv\')" class="tact">\u2715</button></div>'
    +'<p style="font-size:12px;color:var(--t2);margin:2px 0 14px">Three different shapes for the same app. Switch any time \u2014 nothing is lost, and Classic is always exactly what you had.</p>'
    + RW_MODES.map(function(m){
        var on=cur===m.id;
        return '<button class="rw-mode-card'+(on?' on':'')+'" onclick="rwSetMode(\''+m.id+'\')">'
          +'<div class="rw-mode-top"><span class="rw-mode-ic">'+m.icon+'</span>'
          +'<span style="flex:1"><b>'+m.name+'</b> <span class="rw-mode-tag">'+m.tag+'</span></span>'
          +(on?'<span style="color:var(--gold);font-weight:800">\u2713</span>':'')+'</div>'
          +'<div class="rw-mode-desc">'+m.desc+'</div>'
          +'<div class="rw-mode-best">'+m.best+'</div></button>';
      }).join('')
    +'<div style="font-size:10.5px;color:var(--t3);margin-top:10px;line-height:1.55">Layout mode changes the shape of the app. Colours are separate \u2014 see \ud83c\udfa8 Theme &amp; look.</div></div>';
  ov.classList.add('open');
}
