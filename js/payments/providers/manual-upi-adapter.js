// @ts-nocheck
/* MANUAL UPI PAYMENT ADAPTER — js/payments/providers/manual-upi-adapter.js
   ============================================================================
   Implements the RWPaymentGateway provider interface (js/payments/
   gateway-adapter.js — read that file first) for RoamWise's real, currently
   live default checkout: a plain UPI deep-link/QR flow with a manual,
   honor-system claim — the user pastes their UPI transaction reference
   (UTR) after paying, an admin verifies it in the admin console, same trust
   model used since launch. This is NOT a Razorpay integration; see
   gateway-adapter.js's header for why an earlier draft of this task assumed
   otherwise and how that was corrected against the real code.

   Every function body below is moved VERBATIM (zero logic changes) from:
     - js/payments/plan-picker.js: upiParams()/payVia()/buildQR() and the
       module state UPI_VPA/UPI_NAME/UPI_AMT/qrBuilt/_qrBuiltAmt that used
       to live there.
     - app.js: submitUtr()'s full body, and the `var qrBuilt = false;`
       declaration that used to sit in app.js's top-of-file state block
       (see the one-line marker left at each original location).
   plan-picker.js's payVia()/buildQR()/pickPlan() call this adapter directly
   (RWPaymentGateway.provider('manual_upi') — manual UPI is a permanent,
   always-offered baseline, never swapped out by RW_PAYMENT_PROVIDER; see
   gateway-adapter.js's header for why, added in the subscription-vs-one-off
   Cashfree gating pass) and app.js's submitUtr() is a thin wrapper around
   this adapter's verifyPayment(). The public, onclick="..."-referenced
   function names (payVia, buildQR, pickPlan, submitUtr) are unchanged —
   only what runs inside them moved.

   SUBSEQUENT CHANGE (Cashfree fulfillment-gap fix): verifyPayment()'s
   per-product tier derivation (which RWPricing tier a specific purchased
   plan grants) was extracted into js/payments/plan-picker.js's
   rwTierForPlan() so Cashfree's real-time PAID confirmation can reuse the
   exact same, proven logic instead of a blanket Pro grant — see that
   function's header. Zero behavior change here: same inputs, same outputs.

   Depends on runtime globals from app.js / js/pricing/subscription-plans.js
   + one-off-plans.js / js/pricing/referral.js (el, showToast, requireLogin,
   IS_TOUCH_MOBILE, IS_APP, user, db, AUTH_READY, isPro, lsSet, track,
   closePay, refreshProUI, rwRefStamp, rwRefLookup, OWNER_NOTIFY_EMAIL,
   firebase, QRCode) and on _selectedPlan/rwTierForPlan
   (js/payments/plan-picker.js) — all resolved at call time, same
   cross-file pattern this codebase already relies on throughout the
   modularization (see plan-picker.js's own header comment). */

var UPI_VPA = 'roamwise@ybl', UPI_NAME = 'RoamWise Pro', UPI_AMT = '100', UPI_NOTE='RoamWise Pro';
var qrBuilt = false;
var _qrBuiltAmt = null;

function _upiParams(){ return 'pa='+UPI_VPA+'&pn='+encodeURIComponent(UPI_NAME)+'&am='+UPI_AMT+'&cu=INR&tn='+encodeURIComponent(UPI_NOTE); }
function copyUpiPaymentDetails(){
  var text=UPI_VPA+' | INR '+UPI_AMT+' | '+UPI_NOTE;
  function done(){showToast('UPI ID and ₹'+UPI_AMT+' amount copied ✓');}
  try{if(navigator.clipboard&&navigator.clipboard.writeText)return navigator.clipboard.writeText(text).then(done).catch(function(){window.prompt('Copy UPI payment details:',text);});}catch(e){ /* clipboard may be unavailable */ }
  window.prompt('Copy UPI payment details:',text);
}

var ManualUpiAdapter = {
  id: 'manual_upi',

  /* Moved verbatim from the top of plan-picker.js's pickPlan(): sets the
     same module state pickPlan() used to set directly, and forces a QR
     rebuild exactly like the original inline code did. amount is a plain
     rupee number/string (priceINR) — this flow has never dealt in paise. */
  createOrder: function(amount, meta){
    meta = meta || {};
    UPI_AMT = String(amount);
    UPI_NOTE = ('RoamWise '+(meta.label||'Pro')).replace(/[^A-Za-z0-9 ._-]/g,' ').replace(/\s+/g,' ').trim().slice(0,70);
    qrBuilt = false; /* force QR rebuild for the new amount */
    var qc = el('qrcode'); if(qc) qc.innerHTML='';
    var note=el('upiPrefillNote');if(note)note.innerHTML='Opens your app with <strong>₹'+UPI_AMT+' to '+UPI_VPA+'</strong> pre-filled. Confirm that your bank shows a valid payee before approving. If one UPI app declines, copy the UPI ID or use another bank/UPI app.';
    var help=el('utrHelp');if(help)help.innerHTML='After paying ₹'+UPI_AMT+', open the transaction and copy the 12-digit <strong>UTR / UPI Ref No</strong>. Email verification is not required to submit a genuine payment.';
    return {amountINR: amount, vpa: UPI_VPA, name: UPI_NAME, planId: meta.planId, tierId: meta.tierId, label: meta.label, category: meta.category};
  },

  /* Moved verbatim from plan-picker.js's buildQR(). `order` is accepted for
     interface conformance but, like the original, this reads its state
     from the module vars above rather than the order object. */
  buildQR: function(order){
    if(qrBuilt && _qrBuiltAmt===UPI_AMT) return; /* real fix: previously this hardcoded am=100
      regardless of the selected tier — Supporter/other tiers showed a ₹100 QR by mistake */
    try{
      if(typeof QRCode!=='undefined'){
        var qc=el('qrcode'); if(qc) qc.innerHTML='';
        new QRCode(el('qrcode'), {text:'upi://pay?'+_upiParams(), width:134, height:134, colorDark:'#000', colorLight:'#fff', correctLevel:QRCode.CorrectLevel.M});
        qrBuilt = true; _qrBuiltAmt = UPI_AMT;
        var lbl=el('qrAmtLbl'); if(lbl) lbl.textContent='📷 Scan • ₹'+UPI_AMT+' • UPI: '+UPI_VPA;
      }
    }catch(e){ /* best-effort, ignore */ }
  },

  /* Moved verbatim from plan-picker.js's payVia(), minus the requireLogin()
     gate and the app==='generic50'/'generic10' micro-flows, which stay in
     plan-picker.js's payVia() wrapper — they are generic UI concerns (login
     gate) or a standalone flow not tied to any selected plan/order,
     respectively, not gateway-specific logic. `order` is accepted for
     interface conformance; `method` is payVia's original `app` argument. */
  openCheckout: function(order, method){
    if(!IS_TOUCH_MOBILE && !IS_APP){ showToast('Scan the QR below with your phone camera or any UPI app'); var q=document.querySelector('.qr-wrap'); if(q) q.scrollIntoView({behavior:'smooth',block:'center'}); return; }
    var generic = 'upi://pay?' + _upiParams();
    var deep = generic;
    if(method==='gpay') deep = 'tez://upi/pay?' + _upiParams();
    if(method==='phonepe') deep = 'phonepe://pay?' + _upiParams();
    if(method==='whatsapp') {
      deep = generic;
      showToast('If WhatsApp is not in the picker: WhatsApp → any chat → 📎 → Payment → pay ₹'+UPI_AMT+' to '+UPI_VPA);
    }
    var t0 = Date.now();
    /* try the app-specific scheme; if nothing handles it in ~1.2s, fall back to the generic UPI chooser */
    window.location.href = deep;
    if(deep !== generic){
      setTimeout(function(){ if(Date.now()-t0 < 2200 && !document.hidden){ window.location.href = generic; } }, 1200);
    }
    setTimeout(function(){ showToast('After paying, come back and paste your UTR below ⬇️'); }, 3000);
  },

  /* Moved verbatim from app.js's submitUtr(). Reads its own DOM
     (#utrInput/#utrMsg/#utrBtn) and globals exactly as the original did —
     this adapter, like the original function, drives the UI directly and
     takes no parameters. */
  verifyPayment: function(){
    if(!requireLogin()) return;
    var utr = (el('utrInput').value||'').trim().replace(/\s/g,'');
    var msg = el('utrMsg');
    function say(t, ok){ msg.textContent=t; msg.style.display='block'; msg.style.color=ok?'#16BF96':'#D84F4F'; msg.style.background=ok?'rgba(22,191,150,.08)':'rgba(216,79,79,.08)'; }
    if(!/^\d{12}$/.test(utr)) return say('A real UPI UTR is exactly 12 digits — find it in your payment app under the ₹'+UPI_AMT+' transaction’s details.', false);
    if(!AUTH_READY) return say('Owner hasn’t enabled account unlocks yet — hold on to your UTR and try again soon.', false);
    var b = el('utrBtn'); b.disabled=true; b.textContent='Sending…';
    /* Email verification is not a proof of payment. A signed-in buyer may
       submit a UTR while unverified; duplicate/rejected-claim controls below
       and founder review remain the actual payment fraud gates. */
    /* fraud gate: rejected-before accounts and duplicate UTRs are blocked */
    db.collection('claims').where('uid','==',user.uid).get().then(function(snap){
      var mine = snap.docs.map(function(d){return d.data();});
      if(mine.some(function(c){return c.status==='rejected';})){
        b.disabled=false; b.textContent='Submit ➤';
        return say('A previous claim from this account was rejected. Contact the owner via YouTube @mohucool with payment proof to unlock.', false);
      }
      if(mine.some(function(c){return c.utr===utr;})){
        b.disabled=false; b.textContent='Submit ➤';
        return say('You already submitted this UTR — it’s in the verification queue.', false);
      }
      var _ref = {};
      try{ _ref = rwRefStamp(); }catch(e){ /* best-effort, ignore */ }
      var _bonusDays=0;
      try{
        var _terms=window.RW_REFERRAL_TERMS||{};
        if(_ref.refCode && _terms.active!==false){ _bonusDays=parseInt(_terms.buyerBonusDays||30,10)||30; _ref.buyerBonusDays=_bonusDays; }
      }catch(e){ /* best-effort, ignore */ }
      return db.collection('claims').doc(user.uid+'_'+utr).set(Object.assign({
      uid:user.uid, email:user.email||user.phoneNumber||'', utr:utr, amount:parseInt(UPI_AMT,10)||100,
      tier:(UPI_AMT==='299'?'supporter':'pro'), plan:(_selectedPlan&&_selectedPlan.id)||'legacy100', planLabel:(_selectedPlan&&_selectedPlan.label)||'Legacy ₹100',
      status:'pending', created:firebase.firestore.FieldValue.serverTimestamp()
    }, _ref)).then(function(){
      /* Firestore Web's DocumentReference.set() resolves successfully with
         undefined. Do not treat that normal result as a blocked write: doing
         so silently skipped the provisional Pro grant after a genuine claim. */
      b.disabled=false; b.textContent='Submit ➤'; el('utrInput').value='';
      try{ track('utr_submits'); }catch(e){ /* analytics best-effort, ignore */ }
      try{ if(_bonusDays>0&&_ref.refCode){ var _who=rwRefLookup(_ref.refCode); setTimeout(function(){ showToast('Referred by '+(_who?_who.name:'your friend')+' - you get '+_bonusDays+' bonus days of Pro when verified!'); },2200); } }catch(e){ /* toast is a nice-to-have, ignore */ }
      /* A verified/OAuth identity may receive the existing 24-hour provisional
         unlock while founder review runs. Unverified password accounts can
         still pay and submit the claim, but do not receive client-trusted Pro
         from an arbitrary 12-digit value; that closes disposable-account
         farming without putting email verification back in front of checkout. */
      if(user&&user.emailVerified){
        lsSet('rw_pro_temp', String(Date.now()+864e5));
        lsSet('rw_pro_temp_uid', user.uid);
        /* Store which plan was actually bought so RWPricing.currentTier() reflects
           it correctly — a founder/legacy buyer is 'elite' forever as promised;
           anyone buying a specific tier gets exactly that tier, not everything.
           rwTierForPlan() (js/payments/plan-picker.js) is this exact branching
           logic, extracted so any other confirmed-payment path (e.g. Cashfree's
           real-time PAID check) can share it instead of re-deriving it —
           zero behavior change here, same lookup, same result. */
        lsSet('rw_tier', rwTierForPlan(_selectedPlan && _selectedPlan.id));
        isPro=true; lsSet('rwPro','1'); lsSet('rw_pro_uid',user.uid); refreshProUI();
        say('🎉 Pro unlocked INSTANTLY for your account! Verification completes in the background — nothing more to do.', true);
      } else if(user){
        say('Payment claim submitted ✓ Your UTR is queued for review and Pro will activate after payment confirmation. You can keep using all free features now.', true);
      } else {
        say('Submitted ✓ Verification completes shortly — Pro activates on your account automatically.', true);
      }
      setTimeout(closePay, 1800);
      if(OWNER_NOTIFY_EMAIL){
        fetch('https://formsubmit.co/ajax/'+OWNER_NOTIFY_EMAIL, {method:'POST',
          headers:{'Content-Type':'application/json','Accept':'application/json'},
          body: JSON.stringify({_subject:'RoamWise: new ₹'+UPI_AMT+' UPI claim', user:(user&&user.email)||'', utr:utr})
        }).catch(function(){});
      }
    }); }).catch(function(){
      b.disabled=false; b.textContent='Submit ➤';
      say('Could not send — check your connection and try again.', false);
    });
  }
};

RWPaymentGateway.register('manual_upi', ManualUpiAdapter);
