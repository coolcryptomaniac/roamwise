// @ts-nocheck
// Moved verbatim from app.js (Phase 5c) — Pro/tier status display code.
// This is a zero-logic-change relocation: entitlement gating itself
// (isPro / hasFeature(), the latter already living in js/pricing/tiers.js)
// is untouched; only the "what text/UI does the user see for their current
// status" layer moved. rwStatusLabel() is the single honest-label source
// of truth (see its own comment below); refreshProUI() is the DOM-facing
// consumer that paints the Pro button/free-bar/promo-bar from it and is
// called both at boot and after every entitlement-changing action.

/* ===== HONEST STATUS LABEL — the ONLY place a Pro/tier status is turned
   into user-facing text. This exists because a client-side 7-day founder
   trial (never written as pro:true in Firestore — see the trialUntil
   comment near line 9382) used to render the exact same "Pro Active" badge
   as a genuinely paid/granted account, which is actively misleading: a real
   user saw "PRO ACTIVE" on-device while an admin panel correctly showed
   them as FREE. This function computes the TRUE current state and returns a
   distinct, never-ambiguous label for each one. It changes NOTHING about
   feature gating — isPro / hasFeature() stay exactly as they were; this is
   purely about what text gets shown. Every call site that used to hardcode
   "Pro Active"/"PRO ACTIVE" must call this instead. */
function rwStatusLabel(){
  var trialUntil = parseInt(lsGet('rw_trial_until')||'0',10);
  var trialActive = !!(trialUntil && trialUntil > Date.now());
  var method = lsGet('rw_pro_method')||'';
  var tierId = lsGet('rw_tier')||'';

  if(trialActive){
    var daysLeft = Math.max(1, Math.ceil((trialUntil-Date.now())/864e5));
    return { code:'trial', text:'TRIAL · '+daysLeft+'d left',
      sentence:'Your free founding-traveler trial is active — '+daysLeft+' day'+(daysLeft===1?'':'s')+' of Pro left' };
  }
  if(typeof isPro==='undefined' || !isPro){
    return { code:'free', text:'FREE', sentence:'No active Pro entitlement — you’re on the Free plan' };
  }
  if(method==='partner'){
    return { code:'partner', text:'PARTNER PASS',
      sentence:'Your Partner Pass Pro is active — granted via a free partner/campaign code, not a purchase' };
  }
  if(tierId){
    var t = (typeof RWPricing!=='undefined') ? RWPricing.tierById(tierId) : null;
    var lbl = (t ? t.label : tierId).toUpperCase();
    return { code:tierId, text:lbl, sentence:'Your '+lbl+' plan is active' };
  }
  /* isPro, but no rw_tier / partner method / active trial → legacy ₹100
     lifetime founder-offer buyer, grandfathered to elite forever. */
  return { code:'founder', text:'FOUNDER',
    sentence:'Your lifetime Founder Pro (₹100 offer) is active' };
}

/* PRO UI STATE */
function refreshProUI(){
  isPro = lsGet('rwPro')==='1';
  var btn=el('proBtn'), bar=el('freeBar'), promo=el('promoBar');
  if(isPro){
    var st=rwStatusLabel();
    if(btn){ btn.textContent=st.text; btn.className='btn btn-pro active'; btn.onclick=function(){ showToast(st.sentence); }; }
    if(bar) bar.classList.add('hide');
    if(promo) promo.classList.add('hide');
  } else {
    if(btn){ btn.textContent='Pro '+proPriceLabel(100); btn.className='btn btn-pro'; btn.onclick=openPay; }
    if(bar) bar.classList.remove('hide');
    if(promo) promo.classList.remove('hide');
    el('freeCount').textContent = freeLeft;
  }
}
