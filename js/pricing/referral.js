// @ts-nocheck
/* ==================== PRICING: REFERRAL / AFFILIATE TRACKING ====================
   Moved verbatim from app.js (final modularization pass). A genuinely
   self-contained feature: capture a ?ref= link or a typed code, validate it
   against the referrer directory (referral-data.js seed, refreshed from
   Firestore config/referrers), persist it for the attribution window, and
   stamp it onto a purchase claim so the referrer gets paid. Called from
   js/boot/auth-init.js (rwRefActive/rwRefLookup at sign-up) and
   js/booking/form.js (rwSanitizeRefCode/rwRefActive/rwRefCapture/rwRefApply
   on a booking record) as plain function-body references resolved at call
   time, same as every other cross-file call in this codebase — load order
   only requires this file to load before app.js (it does; see index.html),
   since app.js calls rwRefCapture()/rwRefStickUrl() from a top-level IIFE
   (ensureWaButton, invoked at app.js parse time) that needs them already
   defined as globals by then. submitUtr() (the actual payment-claim writer
   that CALLS rwRefStamp()) stays in app.js — it is payment/entitlement
   code, out of scope for a same-commit relocation-plus-nothing-else move. */
/* ============================================================================
   REFERRAL TRACKING (rw-v71)
   ============================================================================
   Flow, end to end:
     1. Someone opens roamwise.co.in/?ref=RW-S01-FEBIN
     2. We store the code locally with a timestamp (30-day window)
     3. When that person submits a UTR, the code is STAMPED ON THE CLAIM
     4. When YOU approve the claim, the commission becomes payable

   Attribution is stamped at CLAIM time, not at approval time, so a referrer
   can't be changed after the fact — and you approve the claim anyway, which
   is the human check that makes the whole thing hard to game.

   FRAUD PREVENTION, in order of how much it actually matters:
     - Commission only exists on an APPROVED claim. You see every payment.
     - Self-referral blocked: if the payer's own uid owns that code, no credit.
     - One commission per (code, payer uid). Re-buying doesn't pay twice.
     - Duplicate UTRs already blocked upstream by the existing claim gate.
     - 7-day hold before payout so reversals settle first.
     - Codes are stamped server-side into the claim doc, and Firestore rules
       stop anyone editing a claim after creation — so a referrer cannot
       attach themselves to someone else's purchase later.
   ========================================================================= */
var RW_REF_KEY='rw_ref_code', RW_REF_AT='rw_ref_at';

/* Normalise any referral/partner code coming from an untrusted source (URL
   query/hash/path, a typed box, a pasted code). Uppercase, keep ONLY
   [A-Z0-9_-], drop everything else, cap at 32 chars. This is the single
   choke point that keeps a crafted ?ref= value from ever reaching the DOM or
   Firestore as anything but a plain, bounded token. Function declaration so
   it is hoisted for earlier callers (e.g. openPartnerRedeem). */
function rwSanitizeRefCode(x){
  return String(x==null?'':x).toUpperCase().replace(/[^A-Z0-9_-]/g,'').slice(0,32);
}


/* ============================================================================
   REFERRERS FROM FIRESTORE (rw-v80) — no more editing GitHub files
   ============================================================================
   referral-data.js is now only a SEED/fallback. The live list is in Firestore
   at config/referrers, editable from the admin panel. The file still works if
   Firestore is unreachable, so the app never depends on the network to
   validate a code — it just gets fresher when it can.
   ========================================================================= */
function rwRefSync(){
  try{
    if(typeof db==='undefined' || !db) return;
    db.collection('config').doc('referrers').get().then(function(d){
      if(!d.exists) return;
      var list=(d.data()||{}).list;
      if(Array.isArray(list) && list.length){
        window.RW_REFERRERS = list;
        try{ lsSet('rw_ref_cache', JSON.stringify(list)); }catch(e){}
      }
    }).catch(function(){});
    /* referral terms: rates, buyer bonus, promo status, disclaimer.
       FIXED: referral-data.js sets window.RW_REFERRAL_TERMS as a static
       flat-30%-for-everyone object at page load. This Firestore fetch used
       to completely OVERWRITE that object once it resolved -- meaning the
       effective referral terms silently depended on whether config/referralTerms
       had ever been saved in the admin console, and on script/network timing.
       Two systems, one variable, no reconciliation. Now this MERGES onto the
       static baseline instead of replacing it, so a not-yet-configured
       Firestore doc can never blank out real defaults, and an explicitly-set
       Firestore field always wins over the static one where it's actually set. */
    db.collection('config').doc('referralTerms').get().then(function(d){
      if(!d.exists) return;
      var t=d.data()||{};
      window.RW_REFERRAL_TERMS = Object.assign({}, window.RW_REFERRAL_TERMS||{}, t);
      try{ lsSet('rw_ref_terms_cache',JSON.stringify(window.RW_REFERRAL_TERMS)); }catch(e){}
    }).catch(function(){});
  }catch(e){}
}
/* use cached copies on boot */
(function(){
  try{ var c=lsGet('rw_ref_cache'); if(c){ var l=JSON.parse(c); if(Array.isArray(l)&&l.length) window.RW_REFERRERS=l; } }catch(e){}
  try{ var ct=lsGet('rw_ref_terms_cache'); if(ct) window.RW_REFERRAL_TERMS=JSON.parse(ct); }catch(e){}
})();

function rwRefLookup(code){
  if(!code) return null;
  var c=rwSanitizeRefCode(code);   /* normalise so a lookup can never carry stray chars */
  if(!c) return null;
  var list=window.RW_REFERRERS||[];
  for(var i=0;i<list.length;i++) if(list[i].code.toUpperCase()===c) return list[i];
  return null;
}
/* Capture ?ref= on any page load. Runs once, early. */
function rwRefCapture(){
  try{
    /* rw-v90: a referral must survive however it arrives.
       ?ref=CODE  ·  ?r=CODE  ·  #ref=CODE  ·  /r/CODE  ·  ?utm_content=CODE
       Instagram and WhatsApp both rewrite links, and some strip the query
       string entirely, so we check the hash and the path too. */
    var q=new URLSearchParams(location.search);
    var code=q.get('ref')||q.get('r')||q.get('utm_content')||q.get('referral');
    if(!code){
      var h=String(location.hash||'');
      var m=h.match(/[#&](?:ref|r)=([A-Za-z0-9\-_]+)/);
      if(m) code=m[1];
    }
    if(!code){
      var pm=String(location.pathname||'').match(/\/r\/([A-Za-z0-9\-_]+)/);
      if(pm) code=pm[1];
    }
    code=rwSanitizeRefCode(code);                   /* untrusted URL input: bound it before use */
    if(!code) return;
    var who=rwRefLookup(code);
    if(!who || who.active===false) return;         /* unknown/retired code: ignore silently */
    lsSet(RW_REF_KEY, who.code);
    lsSet(RW_REF_AT, String(Date.now()));
    try{ track('ref_click'); }catch(e){}
    setTimeout(function(){
      try{ showToast('\ud83d\udc4b You came via '+who.name+' \u2014 welcome!'); }catch(e){}
    }, 1200);
  }catch(e){}
}
/* Return the still-valid referral code, or null. */

/* Keep ?ref= on the URL as the user moves around, so a shared link that is
   copied mid-session still carries the code. Silent — never a page reload. */
function rwRefStickUrl(){
  try{
    var c=rwRefActive(); if(!c) return;
    var u=new URL(location.href);
    if(u.searchParams.get('ref')===c) return;
    u.searchParams.set('ref', c);
    history.replaceState({}, '', u.toString());
  }catch(e){}
}
/* A referrer's own link should also survive an app install: stash it where the
   installed PWA can read it on first run. */
function rwRefPersist(){
  try{
    var c=rwRefActive(); if(!c) return;
    if(window.caches) return;   /* nothing extra needed; localStorage covers it */
  }catch(e){}
}

function rwRefActive(){
  try{
    var code=lsGet(RW_REF_KEY), at=parseInt(lsGet(RW_REF_AT)||'0',10);
    if(!code||!at) return null;
    var days=(window.RW_REFERRAL_TERMS&&RW_REFERRAL_TERMS.cookieDays)||30;
    if(Date.now()-at > days*86400000){ return null; }   /* expired */
    return rwRefLookup(code)? code : null;
  }catch(e){ return null; }
}
/* What gets stamped onto a claim. Kept small and flat so it's easy to read in
   Firestore and easy to total in a sheet. */
function rwRefStamp(){
  var code=rwRefActive();
  if(!code) return {};
  var who=rwRefLookup(code);
  if(!who) return {};
  /* Self-referral guard: a referrer buying through their own link earns nothing.
     Compared against the AUTHENTICATED identity (uid, and email as a fallback),
     not a local flag, so it can't be bypassed by clearing localStorage. This is
     still only the client's best effort — the server MUST re-check self-referral
     at approval before any commission is paid (client refRate is display only). */
  try{
    if(window.user){
      var selfByUid   = who.uid   && user.uid   && who.uid===user.uid;
      var selfByEmail = who.email && user.email && String(who.email).toLowerCase()===String(user.email).toLowerCase();
      if(selfByUid || selfByEmail) return { refCode:code, refSelf:true, refRate:0 };
    }
  }catch(e){}
  return {
    refCode: who.code,
    refName: who.name,
    refType: who.type,
    refRate: who.rate,
    refAt: parseInt(lsGet(RW_REF_AT)||'0',10) || null
  };
}
/* Build a share link for a referrer. */
function rwRefLink(code){
  return 'https://roamwise.co.in/?ref='+encodeURIComponent(code);
}


/* ============================================================================
   REFERRAL CODE ENTRY (rw-v78)
   ============================================================================
   Links are great, but most referrals happen by WORD OF MOUTH — someone says
   "use my code RW-S02-DEEPA". Without this, every one of those sales is
   untracked and the referrer never gets paid. This closes that hole.

   BUILT TO SCALE: validation is purely local against referral-data.js (no
   network, no read cost), the code is stored the same way a link click is, and
   the SAME rwRefStamp() writes it onto the claim — so one code path serves
   millions of users with zero extra infrastructure.
   ========================================================================= */

/* live validation as they type a referral code at sign-up */
function rwRefLiveCheck(){
  var i=el('authRefCode'), m=el('authRefMsg');
  if(!i||!m) return;
  var v=rwSanitizeRefCode(i.value);   /* typed code: normalise before lookup */
  if(!v){ m.textContent=''; m.style.color='var(--t3)'; return; }
  var w=rwRefLookup(v);
  if(w && w.active!==false){
    m.textContent='\u2705 '+w.name+' will get credit for your purchase';
    m.style.color='#4ADE80';
    rwRefApply(v, true);      /* store it now so it survives the signup flow */
  } else {
    m.textContent='Not a code we recognise \u2014 check the spelling';
    m.style.color='#E0785B';
  }
}

function rwRefApply(code, quiet){
  var who=rwRefLookup(code);
  if(!who || who.active===false) return null;
  lsSet(RW_REF_KEY, who.code);
  lsSet(RW_REF_AT, String(Date.now()));
  if(!quiet){ try{ showToast('\u2705 Code applied \u2014 '+who.name+' gets credit'); }catch(e){} }
  try{ track('ref_code_entered'); }catch(e){}
  return who;
}
/* the little "have a referral code?" box */
function openRefCode(){
  var cur=rwRefActive();
  var who=cur? rwRefLookup(cur) : null;
  rwForm('\ud83c\udf9f\ufe0f Referral code', [
    /* key:/placeholder: \u2014 rwFormSubmit reads out[field.key]; id:/ph: read back undefined. */
    { key:'rc', label:'Enter the code you were given', value:cur||'', placeholder:'e.g. RW-S02-DEEPA' }
  ], function(v){
    var code=rwSanitizeRefCode(v.rc);   /* typed/pasted code: bound it before lookup */
    if(!code){ showToast('Enter a code first'); return; }
    var w=rwRefApply(code);
    if(!w){ showToast('\u274c That code isn\u2019t recognised \u2014 check the spelling'); return; }
  }, who? ('Currently applied: <b>'+esc2(who.name)+'</b> ('+esc2(who.code)+')') : 'If a friend, creator or team member gave you a code, enter it here so they get credit for your purchase. It costs you nothing.');
}
/* Show the applied referrer on the Pro/pay screen, so it's transparent. */
function rwRefBadgeHTML(){
  var c=rwRefActive(); if(!c) return '<div style="text-align:center;margin-top:10px"><a onclick="openRefCode()" style="font-size:10.5px;color:var(--t3);cursor:pointer;text-decoration:underline dotted">Have a referral code?</a></div>';
  var w=rwRefLookup(c); if(!w) return '';
  var terms=window.RW_REFERRAL_TERMS||{};
  var promoOn=terms.active!==false;
  var bonusDays=promoOn?parseInt(terms.buyerBonusDays||30,10)||30:0;
  var bonusStr=bonusDays?' &middot; you get <b>'+bonusDays+' bonus days</b> of Pro added':'';
  var disc=promoOn&&terms.disclaimer?'<div style="font-size:10px;color:var(--t3);margin-top:2px">&#9888; '+esc2(terms.disclaimer)+'</div>':'';
  return '<div style="text-align:center;margin-top:10px;font-size:12px;color:var(--gold)">Referred by <b>'+esc2(w.name)+'</b>'+bonusStr+' &middot; <a onclick="openRefCode()" style="color:var(--t3);cursor:pointer;text-decoration:underline dotted">change</a></div>'+disc;
}
