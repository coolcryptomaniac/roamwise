// @ts-nocheck
/* ==================== ENGAGEMENT: TICKER, TRACKING, NUDGE, PULSE ====================
   Moved verbatim from app.js (modularization round 5) — these five
   originally-adjacent app.js sections (TRAVEL ECONOMY LIVE TICKER, SYNC
   CIRCLE, FUNNEL TRACKER, CONVERSION NUDGE, TRAVEL PULSE) are grouped
   here because they share one real, pre-existing theme: anonymous,
   no-PII home-screen engagement signals and conversion nudges, each
   already labeled as such by app.js's own section comments below — not
   an artificial grouping invented for this move.

   All are plain functions (no top-level DOM queries), except the
   one-time visit-tracking IIFE near the end of the FUNNEL TRACKER
   section: it only touches `sessionStorage` and schedules a `track()`
   call inside a `setTimeout`, with no DOM dependency at all, so — unlike
   the true boot IIFEs in js/ui/currency-budget.js and
   js/ui/dest-autocomplete.js — it needed no deferred-init wrapping to
   relocate safely; it runs unchanged, just earlier in real time (this
   file loads as a plain synchronous script, well before app.js, which is
   deferred). That's a behavior-invisible timing shift: the flag is
   idempotent per session either way. */

/* ===== TRAVEL ECONOMY LIVE TICKER ===== */
function renderTicker(){
  var host=el('brief'); if(!host) return;
  var t=document.createElement('div');
  t.style.cssText='text-align:center;font-size:11px;color:var(--t2);margin:6px 0 2px';
  t.innerHTML='\ud83c\udf0d Global travel economy this year: <b id="ecoTick" style="color:#16BF96;font-variant-numeric:tabular-nums">$0</b> <span style="color:var(--t3)">and counting (WTTC-basis)</span>';
  host.insertBefore(t, host.firstChild);
  var Y=new Date(new Date().getFullYear(),0,1).getTime(), RATE=11.5e12/31536000; /* ~$11.5T/yr */
  setInterval(function(){ var v=(Date.now()-Y)/1000*RATE;
    el('ecoTick').textContent = v>=1e12? '$'+(v/1e12).toFixed(3)+' Trillion' : '$'+(v/1e9).toFixed(1)+' Billion';
  }, 1000);
}

/* ===== SYNC CIRCLE — anonymous "I'm going" intent counts (no PII) ===== */
function syncGo(name){
  if(!AUTH_READY || !user){ showToast('Sign in first \u2014 Sync Circle is for real accounts'); return; }
  var m=(el('month')||{}).value||'soon';
  var key=(name+'_'+m).toLowerCase().replace(/[^a-z0-9]+/g,'_').slice(0,60);
  var inc={}; inc[key]=firebase.firestore.FieldValue.increment(1);
  var ref=db.collection('pulse').doc('intents');
  ref.set(inc,{merge:true}).then(function(){ return ref.get(); }).then(function(d2){
    var n=(d2.exists && d2.data()[key])||1;
    showToast('\ud83e\udd1d You + '+(n-1)+' traveler'+(n===2?'':'s')+' planning '+name+' in '+m+' \u2014 open Trip Squads to find them');
    xpAdd(5,'Joined a Sync Circle');
    openSquads(name, m);
  }).catch(function(){ showToast('Sync Circle needs the pulse rules published'); });
}


/* ===== FUNNEL TRACKER — anonymous daily counters for the owner dashboard ===== */
function track(ev){
  if(!AUTH_READY) return;
  try{
    var day = new Date().toISOString().slice(0,10);
    var inc = {}; inc[ev] = firebase.firestore.FieldValue.increment(1);
    /* .set() rejects ASYNCHRONOUSLY — the surrounding try/catch never sees it,
       so a blocked write used to fail completely silently and the admin funnel
       just stayed empty with no clue why. Record the last failure so it can be
       surfaced instead of guessed at. */
    db.collection('stats').doc(day).set(inc, {merge:true})
      .catch(function(e){ try{ lsSet('rw_track_err', (e.code||'')+' '+(e.message||e)); }catch(_){ /* storage best-effort, ignore */ } });
  }catch(e){ /* best-effort Firestore write, ignore */ }
}
/* Per-response thumbs up/down on Ailon Tusk bot bubbles (see cpFinish). No
   per-message record and no user identity — just bumps the same anonymous
   daily counter track() already writes, under two new event names. Also
   visually locks the row so a bubble can't be voted twice. */
function rwTuskFeedback(btn, helpful){
  try{
    var row = btn && btn.closest ? btn.closest('.tk-fb') : (btn && btn.parentNode);
    if(row){
      if(row.dataset && row.dataset.voted) return; /* already voted, ignore repeat taps */
      if(row.dataset) row.dataset.voted='1';
      [].forEach.call(row.querySelectorAll('button'), function(b){
        b.disabled = true; b.style.cursor='default'; b.style.opacity = (b===btn)? '1':'.3';
      });
      if(btn && btn.style) btn.style.transform='scale(1.3)';
    }
    track(helpful? 'tusk_helpful' : 'tusk_unhelpful');
  }catch(e){ /* analytics best-effort, ignore */ }
}
/* Closes the loop the daily tusk-daily.yml Action was built for but never
   received data for: log the place name whenever Ailon Tusk's curated engine
   recognises a destination-shaped query but has nothing for it. Anonymous —
   place name only, keyed by a slug, so repeats just increment a counter
   instead of piling up per-user records. An admin can export this collection
   into data/misses.txt to feed the existing OpenStreetMap resolver. */
function rwTuskMiss(place){
  if(!AUTH_READY || !place) return;
  try{
    var slug = String(place).toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,80);
    if(!slug) return;
    db.collection('tuskMisses').doc(slug).set({
      place: String(place).slice(0,80),
      count: firebase.firestore.FieldValue.increment(1),
      lastAsked: firebase.firestore.FieldValue.serverTimestamp()
    }, {merge:true}).catch(function(){});
  }catch(e){ /* best-effort Firestore write, ignore */ }
}
(function(){ try{
  if(!sessionStorage.getItem('rw_v')){ sessionStorage.setItem('rw_v','1'); setTimeout(function(){ track('visits'); }, 1500); }
}catch(e){ /* analytics best-effort, ignore */ } })();

/* ===== CONVERSION NUDGE — one-time, after the user has felt the value ===== */
function maybeNudge(){
  try{
    if(isPro || PLAY_MODE || lsGet('rw_nudged')) return;
    var n = parseInt(lsGet('rw_searches')||'0',10)+1; lsSet('rw_searches', String(n));
    if(n === 2){
      lsSet('rw_nudged','1');
      setTimeout(function(){
        var d=document.createElement('div');
        d.id='nudgeSheet';
        d.style.cssText='position:fixed;left:12px;right:12px;bottom:76px;z-index:900;background:linear-gradient(135deg,#171227,#1B0F14);border:1px solid rgba(232,186,108,.45);border-radius:18px;padding:16px;box-shadow:0 12px 40px rgba(0,0,0,.6);animation:fadeup .4s ease';
        d.innerHTML='<div style="font-size:14px;font-weight:700;margin-bottom:4px">\ud83e\udd77 You just planned like a shinobi.</div>'
          +'<div style="font-size:12px;color:#B8B4A8;line-height:1.6;margin-bottom:11px">Lock <b style="color:#E8BA6C">lifetime Pro at the \u20b9100 launch price</b> \u2014 unlimited searches, full itineraries, every hack. One payment, forever.</div>'
          +'<div style="display:flex;gap:8px"><button onclick="track(\'nudge_yes\');document.getElementById(\'nudgeSheet\').remove();openPay()" style="flex:2;padding:12px;border-radius:11px;border:none;background:linear-gradient(135deg,#E8BA6C,#C8913E);color:#0A0A12;font-weight:800;font-family:Outfit;font-size:13px;cursor:pointer">Unlock \u20b9100</button>'
          +'<button onclick="document.getElementById(\'nudgeSheet\').remove()" style="flex:1;padding:12px;border-radius:11px;border:1px solid #2A2A34;background:transparent;color:#8A8880;font-family:Outfit;font-size:12px;cursor:pointer">Later</button></div>';
        document.body.appendChild(d);
        track('nudge_shown');
      }, 2500);
    }
  }catch(e){ /* analytics best-effort, ignore */ }
}

/* ===== TRAVEL PULSE — anonymous aggregate demand (no identities, no contact) ===== */
function pulseKey(name,month){ return (name+'_'+month).toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,80); }
function pulseBump(name,month){
  if(!AUTH_READY || !user) return;
  try{ db.collection('pulse').doc(pulseKey(name,month)).set({
    n:String(name).slice(0,60), m:month, count: firebase.firestore.FieldValue.increment(1),
    at: firebase.firestore.FieldValue.serverTimestamp()},{merge:true}); }catch(e){ /* best-effort Firestore write, ignore */ }
}
function pulseShow(name,month,elId){
  if(!AUTH_READY) return;
  try{ db.collection('pulse').doc(pulseKey(name,month)).get().then(function(d){
    if(!d.exists) return;
    var c=d.data().count||0; if(c<2) return;
    var t=el(elId); if(t){ t.style.display=''; t.innerHTML='\ud83d\udd25 <b>'+c+' travelers</b> planned '+name+' for '+month+' recently \u2014 you\u2019re in good company'; }
  }); }catch(e){ /* best-effort Firestore write, ignore */ }
}
