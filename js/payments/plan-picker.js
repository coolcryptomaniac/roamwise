// @ts-nocheck
// PAY MODAL / PLAN PICKER — extracted verbatim from app.js (modularization
// round 4). Pro-entitlement/payment UI code; relocated per CLAUDE.md (file
// location isn't sensitive for this refactor, only behavior changes are —
// zero logic changed in this move). Covers: the UPI QR/deep-link payment
// helpers (upiParams/payVia/buildQR), the plan-grid picker (pickPlan/
// backToPlanPicker/_renderPlanFeatures/renderPlanGrid), the founder-offer
// real countdown banner (rwFounderDeadline/rwCountdownParts/
// rwFounderBannerHTML/rwCountdownCells/rwStartCountdown/rwStopCountdown),
// rotating testimonials (rwRotateTesti), and the pay/success overlay
// lifecycle (openPay/closePay/_adminUnlock/activatePro/closeSuccess/
// goHome/confetti). submitUtr() — the function that actually WRITES a
// payment claim to Firestore — deliberately stays in app.js, same as prior
// phases: this file only builds and drives the picker UI. Depends on
// runtime globals from app.js/js/pricing/tiers.js (RWPricing, el, showToast,
// isPro, user, db, lsGet/lsSet, track, rwHaptic, refreshProUI,
// rwStatusLabel, badgeAwardFounder, requireLogin, cryptoConfigured/
// cryptoPanelHTML, rwRefBadgeHTML, qrBuilt, MONTHS) — all resolved at call
// time, so load order relative to those files doesn't matter.
var UPI_VPA = 'coolmohit@ybl', UPI_NAME = 'RoamWise Pro', UPI_AMT = '100';
var _selectedPlan = null; /* set by pickPlan() — drives the amount/label for whatever the user is actually buying */
/* Renders the real feature checklist for whatever the user just picked, into
   #planFeatures, reusing the same .features-grid/.feat-item/.feat-ck markup
   the static pre-selection teaser uses so it looks native. tierId is the
   RWPricing.CONFIG.TIERS id whose benefits this purchase actually grants —
   every purchasable option (monthly/yearly tier, long-term pass, short-term
   pass, or the legacy founder offer) maps to one, so this never renders blank. */
function _renderPlanFeatures(tierId){
  var box = el('planFeatures'); if(!box) return;
  var tier = RWPricing.tierById(tierId);
  var labels = RWPricing.FEATURE_LABELS;
  box.innerHTML = (tier.features||[]).map(function(f){
    return '<div class="feat-item"><span class="feat-ck">✓</span>'+(labels[f]||f)+'</div>';
  }).join('');
}
function pickPlan(planId, priceINR, label, tierId){
  _selectedPlan = {id:planId, priceINR:priceINR, label:label, tierId:tierId};
  UPI_AMT = String(priceINR); UPI_NAME = 'RoamWise '+label;
  qrBuilt = false; /* force QR rebuild for the new amount */
  var qc = el('qrcode'); if(qc) qc.innerHTML='';
  buildQR();
  var ph = el('planHeader'); if(ph) ph.textContent = label+' \u2014 \u20b9'+priceINR;
  /* Founder offer (and any legacy call site that doesn't pass a tierId) grants
     the same lifetime benefits legacy \u20b9100 buyers get \u2014 see currentTier(). */
  _renderPlanFeatures(tierId || 'elite');
  var teaser = el('staticFeaturesTeaser'); if(teaser) teaser.style.display='none';
  var picker = el('planPicker'); if(picker) picker.style.display='none';
  var methods = el('payMethods'); if(methods){
    methods.style.display='block';
    var cp = el('cryptoPanel');
    if(!cp && cryptoConfigured()){ cp=document.createElement('div'); cp.id='cryptoPanel'; methods.appendChild(cp); }
    if(cp) cp.innerHTML = cryptoPanelHTML();
    /* referral badge / "have a code?" prompt, right where money happens */
    var rb = el('refBadge');
    if(!rb){ rb=document.createElement('div'); rb.id='refBadge'; methods.appendChild(rb); }
    try{ rb.innerHTML = rwRefBadgeHTML(); }catch(e){}
  }
}
function backToPlanPicker(){
  var picker = el('planPicker'); if(picker) picker.style.display='block';
  var methods = el('payMethods'); if(methods) methods.style.display='none';
  var teaser = el('staticFeaturesTeaser'); if(teaser) teaser.style.display='';
}
/* setTier() removed — replaced by pickPlan(), which drives the full tier grid */
function upiParams(){ return 'pa='+UPI_VPA+'&pn='+encodeURIComponent(UPI_NAME)+'&am='+UPI_AMT+'&cu=INR&tn='+encodeURIComponent('RoamWise Pro Lifetime'); }
function payVia(app){
  if(app==='generic50'){
    var deep50='upi://pay?pa='+UPI_VPA+'&pn='+encodeURIComponent(UPI_NAME)+'&am=50&cu=INR&tn=RoamWise%20Movie';
    location.href=deep50; showToast('Pay \u20b950, then come back and tap Render'); return;
  }
  if(app==='generic10'){
    var deep10='upi://pay?pa='+UPI_VPA+'&pn='+encodeURIComponent(UPI_NAME)+'&am=10&cu=INR&tn=RoamWise%20PDF';
    location.href=deep10; showToast('Pay \u20b910, then come back and tap Generate'); return;
  }
  if(!requireLogin()) return;
  if(!IS_TOUCH_MOBILE && !IS_APP){ showToast('Scan the QR below with your phone camera or any UPI app'); var q=document.querySelector('.qr-wrap'); if(q) q.scrollIntoView({behavior:'smooth',block:'center'}); return; }
  var generic = 'upi://pay?' + upiParams();
  var deep = generic;
  if(app==='gpay') deep = 'tez://upi/pay?' + upiParams();
  if(app==='phonepe') deep = 'phonepe://pay?' + upiParams();
  if(app==='whatsapp') {
    deep = generic;
    showToast('If WhatsApp is not in the picker: WhatsApp \u2192 any chat \u2192 \ud83d\udcce \u2192 Payment \u2192 pay \u20b9100 to coolmohit@ybl');
  }
  var t0 = Date.now();
  /* try the app-specific scheme; if nothing handles it in ~1.2s, fall back to the generic UPI chooser */
  window.location.href = deep;
  if(deep !== generic){
    setTimeout(function(){ if(Date.now()-t0 < 2200 && !document.hidden){ window.location.href = generic; } }, 1200);
  }
  setTimeout(function(){ showToast('After paying, come back and paste your UTR below \u2b07\ufe0f'); }, 3000);
}
var _qrBuiltAmt = null;
function buildQR(){
  if(qrBuilt && _qrBuiltAmt===UPI_AMT) return; /* real fix: previously this hardcoded am=100
    regardless of the selected tier — Supporter/other tiers showed a ₹100 QR by mistake */
  try{
    if(typeof QRCode!=='undefined'){
      var qc=el('qrcode'); if(qc) qc.innerHTML='';
      new QRCode(el('qrcode'), {text:'upi://pay?'+upiParams(), width:134, height:134, colorDark:'#000', colorLight:'#fff', correctLevel:QRCode.CorrectLevel.M});
      qrBuilt = true; _qrBuiltAmt = UPI_AMT;
      var lbl=el('qrAmtLbl'); if(lbl) lbl.textContent='\ud83d\udcf7 Scan \u2022 \u20b9'+UPI_AMT+' \u2022 UPI: '+UPI_VPA;
    }
  }catch(e){}
}

/* ==================== FOUNDER OFFER — REAL COUNTDOWN ====================
   Everything here is driven by the SERVER's gate (pricing/founder + the
   increment-only signupCounter). That matters legally as well as ethically:
   India's CCPA Guidelines for Prevention and Regulation of Dark Patterns (2023)
   name "false urgency" explicitly. A timer that resets on reload, or a seat
   count that invents scarcity, is a dark pattern. This one counts down to a
   real date the founder set, and shows the real number of seats taken \u2014 so
   when it hits zero it STAYS zero. */
var _cdTimer = null;
function rwFounderDeadline(){
  var g = (RWPricing.founderGate && RWPricing.founderGate()) || null;
  if(g && g.closesOn){
    var t = Date.parse(g.closesOn + 'T23:59:59Z');
    if(!isNaN(t)) return t;
  }
  /* fallback: launch date + the configured window */
  var C = RWPricing.CONFIG;
  var launch = Date.parse((g && g.launchDate) || C.LAUNCH_DATE);
  if(isNaN(launch)) return null;
  return launch + C.FOUNDER_OFFER.maxDays*86400000;
}
function rwCountdownParts(){
  var end = rwFounderDeadline();
  if(end==null) return null;
  var ms = end - Date.now();
  if(ms <= 0) return {over:true};
  return {
    over:false,
    d: Math.floor(ms/86400000),
    h: Math.floor(ms/3600000)%24,
    m: Math.floor(ms/60000)%60,
    s: Math.floor(ms/1000)%60
  };
}
function rwFounderBannerHTML(){
  var C = RWPricing.CONFIG, seats = window._rwSeats;
  var left = (typeof seats==='number') ? Math.max(0, C.FOUNDER_OFFER.maxUsers - seats) : null;
  return '<div style="text-align:center">'
    +'<div style="font-size:10px;letter-spacing:.14em;text-transform:uppercase;opacity:.9">Founding members only</div>'
    +'<div style="font-size:20px;font-weight:900;margin:3px 0 1px">\u20b9'+C.FOUNDER_OFFER.priceINR+' \u00b7 Pro for life</div>'
    +'<div style="font-size:11.5px;opacity:.92">One payment. This price does not come back.</div>'
    +'<div id="cdWrap" style="display:flex;gap:6px;justify-content:center;margin:9px 0 4px"></div>'
    +(left!==null
        ? '<div style="font-size:11px;opacity:.92">'
          +'<b>'+left.toLocaleString('en-IN')+'</b> of '+C.FOUNDER_OFFER.maxUsers.toLocaleString('en-IN')+' seats left'
          +'<div style="height:5px;background:rgba(0,0,0,.25);border-radius:3px;margin-top:5px;overflow:hidden">'
          +'<div style="width:'+Math.min(100, Math.round((seats/C.FOUNDER_OFFER.maxUsers)*100))+'%;height:100%;background:rgba(255,255,255,.85)"></div></div></div>'
        : '')
    +'</div>';
}
function rwCountdownCells(p){
  function cell(v,l){
    return '<div style="background:rgba(0,0,0,.28);border-radius:9px;padding:5px 8px;min-width:44px">'
      +'<div style="font-size:17px;font-weight:900;line-height:1.1">'+String(v).padStart(2,'0')+'</div>'
      +'<div style="font-size:8.5px;letter-spacing:.08em;text-transform:uppercase;opacity:.8">'+l+'</div></div>';
  }
  return cell(p.d,'days')+cell(p.h,'hrs')+cell(p.m,'min')+cell(p.s,'sec');
}
function rwStartCountdown(){
  rwStopCountdown();
  function tick(){
    var wrap = el('cdWrap'); if(!wrap) return rwStopCountdown();
    var p = rwCountdownParts();
    if(!p){ wrap.style.display='none'; return; }
    if(p.over){
      /* the window genuinely ended — close the offer in the UI immediately
         rather than letting a stale banner keep selling it */
      rwStopCountdown();
      var fb = el('founderBanner'); if(fb) fb.style.display='none';
      renderPlanGrid(false);
      return;
    }
    wrap.innerHTML = rwCountdownCells(p);
  }
  tick();
  _cdTimer = setInterval(tick, 1000);
}
function rwStopCountdown(){ if(_cdTimer){ clearInterval(_cdTimer); _cdTimer=null; } }
/* stop the ticker when the paywall closes so it isn't burning cycles */
(function(){
  var origClose = window.closePay;
  window.closePay = function(){ rwStopCountdown(); if(typeof origClose==='function') return origClose.apply(this, arguments); };
})();

/* PAYMENT */
/* ===== TESTIMONIALS: edit this list with REAL user quotes when you have them.
   Each = [quote, who]. They rotate each time the pay modal opens. ===== */
var RW_TESTIMONIALS = [
  ['Planned our whole Manali trip in one evening \u2014 the budget split alone saved us so many arguments.', '\u2014 Priya, group trip to Himachal'],
  ['The \u20b9100 was the easiest yes ever. Made a 5-day Goa plan with costs in minutes.', '\u2014 Rahul, Bengaluru'],
  ['Finally a planner that gets Indian trips \u2014 crowds, budgets, everything in one place.', '\u2014 Sneha, Delhi']
];
var _rwTestiIdx = 0;
function rwRotateTesti(){
  if(!RW_TESTIMONIALS.length) return;
  var t = RW_TESTIMONIALS[_rwTestiIdx % RW_TESTIMONIALS.length];
  _rwTestiIdx++;
  var q=el('testiQuote'), w=el('testiWho');
  if(q) q.innerHTML='\u201c'+t[0]+'\u201d';
  if(w) w.innerHTML=t[1];
}
function openPay(){
  try{ track('pay_opens'); }catch(e){}
  if(typeof PLAY_MODE!=='undefined' && PLAY_MODE && !window.RWBilling){
    showToast('\ud83c\udf89 Pro is FREE for early adopters on this version \u2014 already active on your account!');
    return;
  }
  if(isPro){ showToast(rwStatusLabel().sentence); return; }
  try{ rwRotateTesti(); }catch(e){}
  el('payOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  var picker=el('planPicker'); if(picker) picker.innerHTML='<div style="text-align:center;font-size:12px;color:var(--t3);padding:10px">Loading plans\u2026</div>';
  el('payMethods').style.display='none';
  /* Founder-offer eligibility needs the live signup count — read it, but never
     block the picker for more than a moment: fail toward showing tiers if the
     read is slow, since the tiers are always valid regardless. */
  var settled=false;
  var to=setTimeout(function(){ if(!settled){ settled=true; renderPlanGrid(false); } }, 2500);
  /* FIXED (rw-v71): the founder SEAT count must come from paid seats, not from
     meta/signupCounter — that counter tracks every new SIGN-UP (for the 7-day
     free trial) and was making the offer look far more sold than it was.
     meta/founderSeats is incremented only when a claim is APPROVED. */
  (window.db? RWPricing.founderGateLoad().then(function(){ return db.collection('meta').doc('founderSeats').get(); }) : Promise.reject()).then(function(snap){
    if(settled) return; settled=true; clearTimeout(to);
    var count = snap && snap.exists ? (snap.data().count||0) : 0;
    window._rwSeats = count;
    renderPlanGrid(RWPricing.founderOfferOpen(count));
  }).catch(function(){ if(settled) return; settled=true; clearTimeout(to); renderPlanGrid(RWPricing.founderOfferOpen()); });
}
function renderPlanGrid(founderOpen){
  var C = RWPricing.CONFIG;
  var fb = el('founderBanner');
  if(founderOpen){
    fb.style.display='block';
    fb.innerHTML = rwFounderBannerHTML();
    rwStartCountdown();
  } else { fb.style.display='none'; rwStopCountdown(); }

  var html='';
  if(founderOpen){
    html += '<button class="pay-tab on" style="width:100%;margin-bottom:14px" onclick="pickPlan(\'founder\','+C.FOUNDER_OFFER.priceINR+',\'Founder Pro \u2014 Lifetime\',\'elite\')">'
      +'\ud83c\udf1f Founder Pro \u2014 \u20b9'+C.FOUNDER_OFFER.priceINR+' <small>One payment, forever \u2014 this exact price never comes back</small></button>';
  }

  /* Monthly / yearly tiers */
  var yearly = lsGet('rw_pay_yearly')==='1';
  /* Headline "save up to N%" — derived from the real ladder (Pro yearly is ~30%
     off, the biggest), so this can never drift out of sync with TIERS again. */
  var maxSave = 0;
  C.TIERS.forEach(function(t){ var s=RWPricing.yearlySavingsPct(t); if(s>maxSave) maxSave=s; });
  html += '<div style="display:flex;align-items:center;justify-content:center;gap:10px;margin:6px 0 12px">'
    +'<span style="font-size:12px;color:'+(!yearly?'var(--gold2)':'var(--t3)')+'">Monthly</span>'
    +'<label style="position:relative;display:inline-block;width:38px;height:20px">'
    +'<input type="checkbox" id="yearlyToggle" '+(yearly?'checked':'')+' onchange="lsSet(\'rw_pay_yearly\',this.checked?\'1\':\'0\');renderPlanGrid('+(founderOpen?'true':'false')+')" style="opacity:0;width:0;height:0">'
    +'<span style="position:absolute;inset:0;background:'+(yearly?'var(--gold2)':'#333')+';border-radius:20px;transition:.2s"></span>'
    +'<span style="position:absolute;left:'+(yearly?'20px':'2px')+';top:2px;width:16px;height:16px;background:#fff;border-radius:50%;transition:.2s"></span>'
    +'</label><span style="font-size:12px;color:'+(yearly?'var(--gold2)':'var(--t3)')+'">Yearly <b style="color:#16BF96">(save up to '+maxSave+'%)</b></span></div>';

  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">';
  C.TIERS.filter(function(t){return t.id!=='free';}).forEach(function(t){
    var price = yearly? t.priceYearly : t.priceMonthly;
    var per = yearly? '/yr' : '/mo';
    var save = RWPricing.yearlySavingsPct(t);
    html += '<button class="tact" style="text-align:left;padding:12px" onclick="pickPlan(\''+t.id+(yearly?'_y':'_m')+'\','+price+',\''+t.label+' '+(yearly?'Yearly':'Monthly')+'\',\''+t.id+'\')">'
      +'<div style="font-weight:800;color:var(--gold2);font-size:13px">'+t.label+'</div>'
      +'<div style="font-size:17px;font-weight:800;margin-top:2px">\u20b9'+price+'<span style="font-size:11px;color:var(--t3);font-weight:400">'+per+'</span></div>'
      +(yearly&&save>0? '<div style="font-size:10px;color:#16BF96">save '+save+'%</div>' : '')
      +'</button>';
  });
  html += '</div>';

  /* Long-term one-time passes */
  html += '<div class="section-label">\ud83d\udcc5 Long-term one-time passes \u2014 no renewals</div>'
    +'</div>';
  C.LONG_TERM.forEach(function(group){
    html += '<div style="font-size:11.5px;font-weight:700;color:var(--gold2);margin-bottom:6px">'+group.tierLabel+'-tier long-term</div>'
      +'<div style="display:flex;gap:8px;margin-bottom:12px">';
    group.options.forEach(function(p){
      /* A lifetime pass renders with its own label instead of "99-Year", and its
         pickPlan title reads "<Tier> Lifetime". Non-lifetime passes are unchanged. */
      var topLabel = p.label || (p.years+'-Year');
      var payTitle = group.tierLabel+' '+(p.lifetime? 'Lifetime' : p.years+'-Year Pass');
      html += '<button class="tact" style="flex:1;text-align:center;padding:10px 6px" onclick="pickPlan(\''+p.id+'\','+p.priceINR+',\''+payTitle+'\',\''+group.tier+'\')">'
        +'<div style="font-size:12px;font-weight:700">'+topLabel+'</div><div style="font-size:14px;font-weight:800;color:var(--gold2)">\u20b9'+p.priceINR+'</div></button>';
    });
    html += '</div>';
  });

  /* Short-term micro-passes */
  html += '<div class="section-label">\u26a1 Just need it for one trip?</div>'
    +'<div style="display:flex;gap:8px;margin-bottom:6px">';
  C.SHORT_TERM.forEach(function(p){
    html += '<button class="tact" style="flex:1;text-align:center;padding:10px 6px" onclick="pickPlan(\''+p.id+'\','+p.priceINR+',\''+p.label+'\',\'pro\')">'
      +'<div style="font-size:12px;font-weight:700">'+p.label+'</div><div style="font-size:14px;font-weight:800;color:var(--gold2)">\u20b9'+p.priceINR+'</div></button>';
  });
  html += '</div>';

  el('planPicker').innerHTML = html;
}
function closePay(){ el('payOverlay').classList.remove('open'); document.body.style.overflow=''; }









/* Keep old manual TXN ID as an admin backdoor only — hidden from UI */
function _adminUnlock(code){
  if(code === 'ROAMWISE_ADMIN_2025'){ activatePro('admin','admin'); }
}

function activatePro(payId, method){
  isPro=true; lsSet('rwPro','1'); lsSet('rw_pro_uid',(user&&user.uid)||'device'); lsSet('rwPayId', payId||'manual');
  try{ badgeAwardFounder(); }catch(e){}
  try{ rwHaptic('heavy'); }catch(e){}
  closePay(); el('successOverlay').classList.add('open');
  confetti(); refreshProUI();
}

function closeSuccess(){
  el('successOverlay').classList.remove('open');
  document.body.style.overflow='';
  goHome();
}

/* Returns the user to a clean home view — closes any open overlay, scrolls to top */
function goHome(){
  ['payOverlay','successOverlay','settingsOverlay'].forEach(function(id){
    var o = el(id); if(o) o.classList.remove('open');
  });
  document.body.style.overflow='';
  window.scrollTo({ top:0, behavior:'smooth' });
}

function confetti(){
  var cols=['#C8913E','#9B59F5','#16BF96','#E1306C','#FFD700'];
  for(var i=0;i<50;i++){
    var e2 = document.createElement('div');
    e2.className = 'conf';
    e2.style.cssText = `left:${Math.random()*100}vw;top:-10px;background:${cols[Math.floor(Math.random()*cols.length)]};width:${6+Math.random()*8}px;height:${6+Math.random()*8}px;border-radius:${Math.random()>0.5?'50%':'2px'};animation-duration:${1.5+Math.random()*2}s;animation-delay:${Math.random()*0.8}s`;
    document.body.appendChild(e2);
    setTimeout((function(e3){ return function(){ e3.remove(); }; })(e2), 3500);
  }
}

