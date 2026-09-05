// @ts-nocheck
/* ================= UPI SETTLEMENT (rw-v50) =================================
   The last mile of group money. The settle engine already works out exactly
   who owes whom to the paisa — but people still had to open GPay, type a
   number, type an amount, and hope they got it right.
   A UPI deep link ("upi://pay?...") is a real Android/iOS intent understood by
   GPay, PhonePe, Paytm, BHIM and every other UPI app, so one tap opens the
   payment PRE-FILLED with payee, amount and note.

   HONEST LIMITS, stated in the UI too:
     - only works on a phone with a UPI app installed (desktop shows a QR/copy)
     - RoamWise is NOT a payment processor and never touches the money
     - we cannot confirm a payment landed, so settling is user-confirmed
   ========================================================================== */
function rwUpiValid(v){ return /^[a-zA-Z0-9._-]{2,64}@[a-zA-Z]{2,32}$/.test(String(v||'').trim()); }
function rwUpiMine(){ try{ return lsGet('rw_upi')||''; }catch(e){ return ''; } }
function rwUpiSetMine(){
  rwForm('\ud83d\udcb3 Your UPI ID', [
    {key:'vpa', label:'UPI ID (so friends can pay you back)', value:rwUpiMine(), placeholder:'yourname@okhdfcbank'}
  ], function(v){
    var vpa=(v.vpa||'').trim();
    if(vpa && !rwUpiValid(vpa)){ showToast('That doesn\u2019t look like a UPI ID \u2014 e.g. name@okicici'); return; }
    try{ lsSet('rw_upi', vpa); }catch(e){ /* storage best-effort, ignore */ }
    /* share it to the group so the "pay" buttons can find it */
    if(vpa && _chatRoom && user && typeof db!=='undefined' && db){
      db.collection('users').doc(user.uid).set({upi:vpa, name:(user.displayName||'Traveller')},{merge:true}).catch(function(){});
    }
    showToast(vpa? 'UPI ID saved \u00b7 friends can now pay you in one tap' : 'UPI ID cleared');
    try{ rwMoneyRender(); }catch(e){ /* best-effort, ignore */ }
    try{ chatRenderPins(); }catch(e){ /* best-effort, ignore */ }
  });
}
/* Build the standard UPI intent URL. */
function rwUpiLink(vpa, name, amount, note){
  var q='pa='+encodeURIComponent(vpa)
      +'&pn='+encodeURIComponent(String(name||'RoamWise').slice(0,40))
      +'&am='+encodeURIComponent(Number(amount).toFixed(2))
      +'&cu=INR'
      +'&tn='+encodeURIComponent(String(note||'RoamWise trip settle').slice(0,50));
  return 'upi://pay?'+q;
}
/* Look up a payee's saved UPI id (group members store it on their user doc). */
var _upiCache={};
function rwUpiLookup(name, cb){
  if(_upiCache[name]!==undefined){ cb(_upiCache[name]); return; }
  if(typeof db==='undefined'||!db){ cb(null); return; }
  db.collection('users').where('name','==',name).limit(1).get().then(function(qs){
    var vpa=null; qs.forEach(function(d){ vpa=(d.data()||{}).upi||null; });
    _upiCache[name]=vpa; cb(vpa);
  }).catch(function(){ cb(null); });
}
/* The pay button shown on each "A owes B" row. */
function rwUpiPay(toName, amount, note){
  rwUpiLookup(toName, function(vpa){
    if(!vpa){
      showToast(toName+' hasn\u2019t added a UPI ID yet');
      rwUpiAskFor(toName, amount);
      return;
    }
    rwUpiOpen(vpa, toName, amount, note);
  });
}
function rwUpiOpen(vpa, name, amount, note){
  var url=rwUpiLink(vpa, name, amount, note);
  var isMobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent||'');
  if(isMobile){
    try{ window.location.href=url; }catch(e){ /* best-effort, ignore */ }
    /* if no UPI app handles it, nothing visibly happens — give a way out */
    setTimeout(function(){ rwUpiFallback(vpa, name, amount, url); }, 1800);
  } else {
    rwUpiFallback(vpa, name, amount, url);
  }
}
function rwUpiFallback(vpa, name, amount, url){
  var ov=el('upiOv');
  if(!ov){ ov=document.createElement('div'); ov.id='upiOv'; ov.className='overlay'; ov.style.zIndex='3200';
    ov.onclick=function(e){ if(e.target===ov) rwOverlayClose('upiOv'); }; document.body.appendChild(ov); }
  var amt=Number(amount).toFixed(2);
  ov.innerHTML='<div class="sheet" style="max-width:380px;text-align:center"><div class="sheet-h" style="text-align:left"><b>\ud83d\udcb3 Pay '+esc2(name)+'</b>'
    +'<button onclick="rwOverlayClose(\'upiOv\')" class="tact">\u2715</button></div>'
    +'<div style="font-size:30px;font-weight:900;color:var(--gold,#E8BA6C);margin:10px 0 2px">\u20b9'+esc2(amt)+'</div>'
    +'<div style="font-size:12.5px;color:var(--t2);margin-bottom:14px">to <b>'+esc2(vpa)+'</b></div>'
    +'<a class="tact" style="display:block;width:100%;font-weight:800;background:linear-gradient(135deg,var(--gold,#E8BA6C),var(--gold2,#C8913E));color:#0A0A0C;border:none;padding:13px;text-decoration:none;margin-bottom:8px" href="'+esc2(url)+'">Open my UPI app</a>'
    +'<button class="tact" style="width:100%;margin-bottom:8px" onclick="rwCopy(\''+esc2(vpa)+'\');showToast(\'UPI ID copied\')">Copy UPI ID</button>'
    +'<div style="font-size:11px;color:var(--t3);line-height:1.55;margin-top:6px">Opens your own UPI app (GPay, PhonePe, Paytm\u2026) with the amount filled in. RoamWise never handles the money and can\u2019t see whether it went through \u2014 mark it settled once it\u2019s done.</div></div>';
  ov.classList.add('open');
}
function rwCopy(t){ try{ navigator.clipboard.writeText(t); }catch(e){ /* clipboard best-effort, ignore */ } }
function rwUpiAskFor(name, amount){
  if(!_chatRoom){ return; }
  try{
    chatPost('text', null, '\ud83d\udcb3 '+ (name||'Someone') +', can you drop your UPI ID here? Settling up \u20b9'+Number(amount).toFixed(0)+'.');
  }catch(e){ /* best-effort, ignore */ }
}

/* Chat kitty works in uids, so look the payee's UPI up by uid. */
function rwUpiPayUid(uid, amount){
  if(typeof db==='undefined'||!db){ showToast('Need a connection'); return; }
  db.collection('users').doc(uid).get().then(function(d){
    var u=d.exists? (d.data()||{}) : {};
    if(!u.upi){
      showToast((u.name||'They')+' haven\u2019t added a UPI ID yet');
      try{ chatPost('text', null, '\ud83d\udcb3 Can you drop your UPI ID here? Settling up \u20b9'+Number(amount).toFixed(0)+'.'); }catch(e){ /* best-effort, ignore */ }
      return;
    }
    rwUpiOpen(u.upi, u.name||'Traveller', amount, 'RoamWise trip settle');
  }).catch(function(){ showToast('Could not look that up'); });
}

/* Renders the pay button for one settle row (used in both money layer + chat). */
function rwUpiRowBtn(from, to, amount, note){
  var me=((user&&user.displayName)||'').split(' ')[0];
  var iOwe = from===me || from==='You';
  if(!iOwe) return '';   /* only show "pay" on rows where YOU are the one paying */
  return '<button class="tact" style="padding:5px 11px;font-size:11.5px;font-weight:700;margin-left:8px;background:linear-gradient(135deg,var(--gold,#E8BA6C),var(--gold2,#C8913E));color:#0A0A0C;border:none" '
    +'onclick="rwUpiPay(\''+String(to).replace(/'/g,"\\'")+'\','+Number(amount)+',\''+String(note||'').replace(/'/g,"\\'")+'\')">Pay \u20b9'+Number(amount).toLocaleString('en-IN')+'</button>';
}
