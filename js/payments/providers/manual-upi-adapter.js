// @ts-nocheck
/* Manual UPI is an explicitly reviewed fallback. A syntactically valid UTR is
   NOT payment proof. Never unlock an entitlement until an independently
   reconciled payment is approved through the existing admin flow. */
var UPI_VPA = 'roamwise@ybl', UPI_NAME = 'RoamWise Pro', UPI_AMT = '100', UPI_NOTE = 'RoamWise Pro';
var qrBuilt = false;
var _qrBuiltAmt = null;

function _upiSignedIn(){ return typeof user !== 'undefined' && !!user && !!user.uid; }
function _upiRequireAccount(){
  if(_upiSignedIn()) return true;
  if(typeof requireLogin === 'function') requireLogin();
  else if(typeof showToast === 'function') showToast('Sign in before opening a payment method.');
  return false;
}
function _upiParams(){
  return 'pa='+UPI_VPA+'&pn='+encodeURIComponent(UPI_NAME)+'&am='+UPI_AMT+'&cu=INR&tn='+encodeURIComponent(UPI_NOTE);
}
function copyUpiPaymentDetails(){
  if(!_upiRequireAccount()) return;
  var text = UPI_VPA+' | INR '+UPI_AMT+' | '+UPI_NOTE;
  function done(){showToast('UPI ID and ₹'+UPI_AMT+' amount copied ✓');}
  try{
    if(navigator.clipboard && navigator.clipboard.writeText)
      return navigator.clipboard.writeText(text).then(done).catch(function(){window.prompt('Copy UPI payment details:',text);});
  }catch(e){ /* clipboard may not be available */ }
  window.prompt('Copy UPI payment details:',text);
}

var ManualUpiAdapter = {
  id: 'manual_upi',
  createOrder: function(amount, meta){
    meta = meta || {};
    UPI_AMT = String(amount);
    UPI_NOTE = ('RoamWise '+(meta.label||'Pro')).replace(/[^A-Za-z0-9 ._-]/g,' ').replace(/\s+/g,' ').trim().slice(0,70);
    qrBuilt = false;
    _qrBuiltAmt = null;
    var qc=el('qrcode'); if(qc) qc.replaceChildren();
    var note=el('upiPrefillNote');
    if(note){
      if(_upiSignedIn()) note.innerHTML='Opens your app with <strong>₹'+UPI_AMT+' to '+UPI_VPA+'</strong> pre-filled. Verify the recipient in your UPI app before approving.';
      else note.textContent='Sign in before opening a payment app or seeing payment instructions.';
    }
    var help=el('utrHelp');
    if(help) help.innerHTML='After paying ₹'+UPI_AMT+', copy the 12-digit <strong>UTR / UPI Ref No</strong>. A claim remains pending until the payment is independently verified.';
    return {amountINR:amount,vpa:UPI_VPA,name:UPI_NAME,planId:meta.planId,tierId:meta.tierId,label:meta.label,category:meta.category};
  },
  buildQR: function(order){
    var qc=el('qrcode');
    if(!_upiSignedIn()){
      qrBuilt=false; _qrBuiltAmt=null;
      if(qc) qc.textContent='Sign in to display the payment QR.';
      var hiddenLabel=el('qrAmtLbl'); if(hiddenLabel) hiddenLabel.textContent='Sign in to pay';
      return;
    }
    if(!order || !Number.isFinite(Number(order.amountINR)) || Number(order.amountINR)<=0) return;
    if(qrBuilt && _qrBuiltAmt===UPI_AMT) return;
    try{
      if(typeof QRCode!=='undefined' && qc){
        qc.replaceChildren();
        new QRCode(qc,{text:'upi://pay?'+_upiParams(),width:134,height:134,colorDark:'#000',colorLight:'#fff',correctLevel:QRCode.CorrectLevel.M});
        qrBuilt=true; _qrBuiltAmt=UPI_AMT;
        var lbl=el('qrAmtLbl'); if(lbl) lbl.textContent='Scan • ₹'+UPI_AMT+' • UPI: '+UPI_VPA;
      }
    }catch(e){ /* QR is a convenience, not proof of a payment */ }
  },
  openCheckout: function(order, method){
    if(!_upiRequireAccount()) return;
    if(!order || !Number.isFinite(Number(order.amountINR)) || Number(order.amountINR)<=0){
      showToast('Choose a plan before opening payment.');return;
    }
    if(!IS_TOUCH_MOBILE && !IS_APP){
      showToast('Scan the QR below with your phone or any UPI app');
      this.buildQR(order);
      var q=document.querySelector('.qr-wrap'); if(q) q.scrollIntoView({behavior:'smooth',block:'center'});
      return;
    }
    var generic='upi://pay?'+_upiParams(),deep=generic;
    if(method==='gpay') deep='tez://upi/pay?'+_upiParams();
    if(method==='phonepe') deep='phonepe://pay?'+_upiParams();
    if(method==='whatsapp') showToast('If WhatsApp is missing: WhatsApp → chat → Payment → ₹'+UPI_AMT+' to '+UPI_VPA);
    var t0=Date.now();
    window.location.href=deep;
    if(deep!==generic){
      setTimeout(function(){if(Date.now()-t0<2200&&!document.hidden&&_upiSignedIn())window.location.href=generic;},1200);
    }
    setTimeout(function(){if(_upiSignedIn())showToast('After paying, return to submit your UTR for verification.');},3000);
  },
  verifyPayment: function(){
    if(!_upiRequireAccount()) return;
    var msg=el('utrMsg'),inp=el('utrInput'),b=el('utrBtn');
    if(!msg||!inp||!b) return;
    function say(text,ok){
      msg.textContent=text;msg.style.display='block';msg.style.color=ok?'#16BF96':'#D84F4F';
      msg.style.background=ok?'rgba(22,191,150,.08)':'rgba(216,79,79,.08)';
    }
    var utr=(inp.value||'').trim().replace(/\s/g,'');
    if(!/^\d{12}$/.test(utr)) return say('Enter the 12-digit UTR from the ₹'+UPI_AMT+' transaction. A UTR alone does not verify payment.',false);
    if(typeof AUTH_READY==='undefined'||!AUTH_READY) return say('Account verification is not ready. Keep your UTR and retry when signed in.',false);
    if(!window.db) return say('Payment review is temporarily unavailable. Keep your UTR.',false);
    b.disabled=true;b.textContent='Sending…';
    db.collection('claims').where('uid','==',user.uid).get().then(function(snap){
      var mine=snap.docs.map(function(d){return d.data();});
      if(mine.some(function(c){return c.status==='rejected';})){
        b.disabled=false;b.textContent='Submit ➤';
        return say('A previous claim needs review. Contact RoamWise support with your payment receipt.',false);
      }
      if(mine.some(function(c){return c.utr===utr;})){
        b.disabled=false;b.textContent='Submit ➤';
        return say('This UTR is already in your verification queue. Do not pay again.',false);
      }
      var referral={};
      try{referral=rwRefStamp();}catch(e){ /* optional attribution */ }
      if(referral.refCode){
        try{
          var terms=window.RW_REFERRAL_TERMS||{};
          if(terms.active!==false) referral.buyerBonusDays=parseInt(terms.buyerBonusDays||30,10)||30;
        }catch(e){ /* optional attribution */ }
      }
      return db.collection('claims').doc(user.uid+'_'+utr).set(Object.assign({
        uid:user.uid,email:user.email||user.phoneNumber||'',utr:utr,
        amount:parseInt(UPI_AMT,10)||100,
        tier:(UPI_AMT==='299'?'supporter':'pro'),
        plan:(_selectedPlan&&_selectedPlan.id)||'legacy100',
        planLabel:(_selectedPlan&&_selectedPlan.label)||'Legacy ₹100',
        status:'pending',created:firebase.firestore.FieldValue.serverTimestamp()
      },referral)).then(function(){
        b.disabled=false;b.textContent='Submit ➤';inp.value='';
        try{track('utr_submits');}catch(e){ /* optional analytics */ }
        say('Payment claim received. Your plan will activate only after RoamWise verifies the payment. Keep the UTR and do not send another payment.',true);
        setTimeout(closePay,2500);
        if(OWNER_NOTIFY_EMAIL){
          fetch('https://formsubmit.co/ajax/'+OWNER_NOTIFY_EMAIL,{
            method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},
            body:JSON.stringify({_subject:'RoamWise: pending ₹'+UPI_AMT+' UPI claim',user:user.email||'',utr:utr})
          }).catch(function(){});
        }
      });
    }).catch(function(){
      b.disabled=false;b.textContent='Submit ➤';
      say('Could not submit the claim. Keep your UTR and retry after checking the connection.',false);
    });
  }
};
RWPaymentGateway.register('manual_upi',ManualUpiAdapter);
