// @ts-nocheck
/* ============================================================================
   THE OPENING (rw-v54) — the first twenty seconds
   ============================================================================
   Why this exists: RoamWise has ~50 features. A first-time visitor sees a wall
   of tiles and leaves before understanding any of it. Every app people
   genuinely love is almost embarrassingly simple on first contact.

   So: one question, one breath, one real answer. No signup, no tour, no tiles.
   We DELIVER value before asking for anything, then let the app appear behind
   it. The 5-slide tour is demoted to a menu item for people who want it.
   ========================================================================== */
var RW_DREAMS=[
  'somewhere green and quiet','the mountains, cheaply','a beach with no crowds',
  'a city that stays up late','snow, for the first time','where my friends can all afford'
];
function rwOpeningSeen(){ try{ return lsGet('rw_opening')==='1'; }catch(e){ return true; } }
function rwOpeningShow(force){
  if(!force && rwOpeningSeen()) return;
  var ov=el('rwOpening');
  if(!ov){ ov=document.createElement('div'); ov.id='rwOpening'; document.body.appendChild(ov); }
  ov.className='rw-open';
  var ph=RW_DREAMS[Math.floor(Math.random()*RW_DREAMS.length)];
  ov.innerHTML=
     '<div class="rw-open-sky"></div>'
    +'<div class="rw-open-inner">'
    +  '<div class="rw-open-mark">RoamWise</div>'
    +  '<h1 class="rw-open-q">Where do you<br><em>dream</em> of going?</h1>'
    +  '<div class="rw-open-field">'
    +    '<input id="rwOpenIn" autocomplete="off" placeholder="'+esc2(ph)+'">'
    +    '<button onclick="rwOpeningGo()" aria-label="Go">\u2192</button>'
    +  '</div>'
    +  '<div class="rw-open-hint">One line is enough. No signup, no email \u2014 ever.</div>'
    +  '<button class="rw-open-skip" onclick="rwOpeningDone()">I\u2019ll look around myself</button>'
    +'</div>';
  document.body.style.overflow='hidden';
  setTimeout(function(){ var i=el('rwOpenIn'); if(i){ i.focus(); i.addEventListener('keydown',function(e){ if(e.key==='Enter') rwOpeningGo(); }); } }, 700);
}
function rwOpeningGo(){
  var v=(el('rwOpenIn')&&el('rwOpenIn').value||'').trim();
  if(!v){ var i=el('rwOpenIn'); if(i){ i.focus(); i.classList.add('rw-shake'); setTimeout(function(){ i.classList.remove('rw-shake'); },500);} return; }
  var ov=el('rwOpening'); if(!ov) return;
  var inner=ov.querySelector('.rw-open-inner');
  inner.innerHTML='<div class="rw-open-think"><div class="rw-cine-orb"></div>'
    +'<div class="rw-open-thinktxt">Reading the map for<br><b>'+esc2(v.slice(0,60))+'</b></div></div>';
  /* Give a REAL answer, not a loading screen followed by a tour. */
  var prompt='A traveller said they dream of: "'+v+'". In under 55 words: name ONE specific place in India that fits, say the single best month to go, an honest rough budget in rupees for 3-4 days, and one detail only a local would tell them. Warm, concrete, no preamble.';
  var done=false;
  var finish=function(text){
    if(done) return; done=true;
    inner.innerHTML='<div class="rw-open-reveal">'
      +'<div class="rw-open-mark">RoamWise</div>'
      +'<div class="rw-open-answer">'+esc2(text)+'</div>'
      +'<button class="rw-open-cta" onclick="rwOpeningEnter(\''+String(v).replace(/'/g,"\\'").slice(0,60)+'\')">Plan this properly \u2192</button>'
      +'<button class="rw-open-skip" onclick="rwOpeningDone()">Just let me in</button>'
      +'</div>';
  };
  setTimeout(function(){ finish('India has a place for exactly that \u2014 let\u2019s find it together. Tell Tusk the same thing inside and it\u2019ll build you a full day-by-day plan with real numbers.'); }, 9000);
  try{
    if(typeof aiCallAny==='function'){
      aiCallAny(prompt, 160, function(err, txt){
        if(txt && String(txt).trim().length>30) finish(String(txt).trim());
        else finish('India has a place for exactly that. Tell Tusk the same line inside and it\u2019ll build the whole trip \u2014 days, budget, and a map.');
      });
    }
  }catch(e){ /* best-effort, ignore */ }
}
function rwOpeningEnter(seed){
  rwOpeningDone();
  setTimeout(function(){
    try{
      var i=el('heroInput'); if(i){ i.value=seed; i.focus(); }
      if(typeof tabGo==='function') tabGo('home');
      showToast('\u2728 Ask Tusk \u2014 it already knows what you want');
    }catch(e){ /* toast is a nice-to-have, ignore */ }
  }, 420);
}
function rwOpeningDone(){
  try{ lsSet('rw_opening','1'); }catch(e){ /* storage best-effort, ignore */ }
  var ov=el('rwOpening'); if(!ov) return;
  ov.classList.add('rw-open-out');
  document.body.style.overflow='';
  setTimeout(function(){ if(ov&&ov.parentNode) ov.parentNode.removeChild(ov); }, 720);
}
function rwOpeningReplay(){ rwOpeningShow(true); }
