// @ts-nocheck
// PARTNER CODE REDEMPTION — extracted verbatim from app.js (modularization
// round 4). Pro-entitlement/Firestore code; relocated per CLAUDE.md (file
// location isn't sensitive for this refactor, only behavior changes are —
// zero logic changed in this move). openPartnerRedeem() lets a user redeem
// a one-time partner claim code (e.g. NMIMS-XXXXXX) for Pro via the
// two-sequential-writes pattern firestore.rules requires (see inline
// comments). Depends on runtime globals from app.js (rwForm, showToast,
// openLogin, user/db/isPro, lsSet, refreshProUI, esc2) and
// js/pricing/referral.js (rwSanitizeRefCode) — all resolved at call time.
/* ============================================================
   PARTNER CODE REDEMPTION (rw-v115) — NMIMS + future partners
   User enters code like NMIMS-A1B2C3 in Settings → gets Pro.
   Admin can see all claims in the admin console.
   ============================================================ */
function openPartnerRedeem(){
  rwForm('&#127891; Redeem a partner code',[
    /* key:/placeholder: — rwFormSubmit reads out[field.key] and renders
       field.placeholder; id:/ph: silently read back undefined. */
    {key:'code', label:'Enter your pass code (from your card or email)', placeholder:'NMIMS-STU-0123-XXXXXXXXXXXXX', value:(window.__rwPendingRedeem||'')}
  ], async function(v){
    window.__rwPendingRedeem='';
    var code=rwSanitizeRefCode(v.code);
    if(!code){ showToast('Enter your code first'); return; }
    if(!user){ openLogin(); return; }
    if(!db){ showToast('Not connected — try again in a moment'); return; }
    /* partnerClaims' doc ID IS the code itself (rw-v116 hardening) — fetch by
       known path with .doc(), not a `where('code','==',...)` query. Firestore
       rules can only validate a specific doc by path (get()/exists()), never
       an arbitrary query, so this is also what lets the rules confirm — via
       isRedeemedByCaller() — that THIS caller already redeemed this exact
       code before granting Pro below (see the two-step write further down). */
    var claimRef=db.collection('partnerClaims').doc(code);
    var snap=await claimRef.get().catch(function(){return null;});
    if(!snap||!snap.exists){ showToast('Code not found. Check it and try again, or email founder@roamwise.co.in'); return; }
    var data=snap.data()||{};
    /* EVENT COUPONS (bearer:true, no email): one-time, any verified account, one coupon per account.
       Never consume a coupon for an account that already has Pro. */
    var isCoupon=(data.bearer===true);
    if(isCoupon && !data.proRedeemed){
      if(typeof isPro!=='undefined' && isPro){ showToast('Your account already has Pro, so this code was not used. Give it to a friend instead.'); return; }
      if(user.emailVerified===false){ showToast('Verify your email address first, then enter the code again.'); return; }
    }
    // Soft UX check only — only the person who was emailed the code SHOULD
    // redeem it, but the real security boundary against replay/reuse now
    // lives in firestore.rules (one-time redemption via two sequential,
    // awaited writes — see below), not in this client-side email comparison.
    if(!isCoupon && data.email && user.email && data.email.toLowerCase()!==user.email.toLowerCase()){
      showToast('This code was claimed with a different email. Sign in with '+data.email.split('@')[0]+'@…');
      return;
    }
    // A claim already flipped to redeemed by THIS SAME uid is not "nothing to
    // do" — it means a PRIOR attempt got as far as flipping partnerClaims but
    // then failed on the users/{uid} grant write below (see the create-vs-
    // update gap explained next to that write). That must be resumable on a
    // later attempt, not treated as a dead end, so only block here when the
    // code was redeemed by a DIFFERENT uid.
    var alreadyRedeemedByMe = !!(data.proRedeemed && data.redeemedUid===user.uid);
    if(data.proRedeemed && !alreadyRedeemedByMe){
      showToast('Code already redeemed — your Pro is active. Check your profile.');
      return;
    }
    // Claim codes are issued inside a time-boxed campaign window (e.g. the
    // NMIMS 30-day claim window) and shouldn't be redeemable indefinitely
    // after that — expiresAt is a Firestore Timestamp set at claim time
    // (see nmims/index.html). Absent expiresAt (older claims predating this
    // field) is treated as no expiry, same precedent as proRedeemed above.
    // Skip this check when alreadyRedeemedByMe: that means partnerClaims was
    // already validly flipped to redeemed by this exact user BEFORE expiry,
    // and this attempt is only resuming the Pro-grant write that failed last
    // time — firestore.rules already allows that retry regardless of
    // subsequent expiry, so blocking it here would defeat that fix.
    if(!alreadyRedeemedByMe && data.expiresAt && typeof data.expiresAt.toMillis==='function' && data.expiresAt.toMillis()<Date.now()){
      showToast('This code’s claim window has expired. Email founder@roamwise.co.in if you believe this is a mistake.');
      return;
    }
    /* Flip the claim to redeemed FIRST, as its own separate, AWAITED write,
       THEN grant Pro on users/{uid} — in that exact order, NOT as one atomic
       batch. firestore.rules' users/{uid} partner-grant rule now calls
       isRedeemedByCaller(code), which get()s partnerClaims/{code} and only
       approves the grant once proRedeemed==true and redeemedUid==this uid
       are ALREADY committed — a get() inside a security rule only ever sees
       already-committed state, never a sibling pending write in the same
       batch, so batching these two writes together would make the grant
       rule reject every time. Sequencing them like this (redeem, await,
       then grant) is what actually stops a code being redeemed twice: once
       the flip commits, isRedeemedByCaller() only ever matches this one uid,
       so no other account can replay the same code again. The users/{uid}
       write must touch ONLY pro/proAt/proMethod/proCode — that exact field
       set is what the rules' partner-redeem exception checks for; anything
       else in this write (e.g. the old proPartner/proAmount fields) would be
       rejected.
       Skip this flip entirely when alreadyRedeemedByMe — partnerClaims'
       update rule only allows proRedeemed false/absent -> true (see
       firestore.rules), so re-sending it once it's already true would be
       REJECTED by the rules, aborting this retry before it ever reaches the
       grant step below that actually needs resuming. */
    if(!alreadyRedeemedByMe){
      try{
        var flip={proRedeemed:true, redeemedAt:new Date().toISOString(), redeemedUid:user.uid};
        if(isCoupon) flip.email=user.email||'';   /* rules require the caller's verified email on a coupon */
        await claimRef.update(flip);
      }catch(e){
        showToast('Redemption error: '+(e.message||'try again'));
        return;
      }
    }
    try{
      /* CodeRabbit-flagged gap: set(data,{merge:true}) against a users/{uid}
         doc that does NOT yet exist is a CREATE, not an update, in Firestore
         semantics — and the users/{uid} create rule explicitly forbids
         pro/proAt/proMethod/proPayId on create (users can never self-grant
         Pro at signup). If this profile doc hadn't been created yet (e.g.
         the onAuthStateChanged first-sign-in write, ~line 9582, hadn't landed
         yet), this whole write used to be silently rejected — AFTER the
         claim above was already flipped to redeemed, permanently, with no
         path to ever retry it (a create can only happen once, and it would
         always be rejected the same way).
         Fix: explicitly check existence first. If missing, create the SAME
         bare minimal profile shape used on first sign-in (no pro fields —
         satisfies the create rule) as its own separate write, THEN grant Pro
         via a genuine update() (not a merge-set) — since the doc now exists,
         this is a real update and the isRedeemedByCaller()-gated update rule
         applies normally, same as the already-exists case. */
      var userRef=db.collection('users').doc(user.uid);
      var uSnap=await userRef.get();
      if(!uSnap.exists){
        await userRef.set({email:user.email||'', phone:user.phoneNumber||'', name:user.displayName||'', created:firebase.firestore.FieldValue.serverTimestamp()}, {merge:true});
      }
      await userRef.update({
        pro:true, proAt:new Date().toISOString(),
        proMethod:'partner', proCode:code
      });
      /* FOUNDER SEAT COUNTING BUG FIX: a partner-redeemed seat is still one
         of the shared 1,000 lifetime-Pro seats \u2014 it must count against that
         same pool, not sit on top of it as 1,000 extra (see CLAUDE.md's
         Founder-offer notes). Before this, NOTHING in this function ever
         touched a shared counter: firestore.rules' meta/founderSeats is
         isAdmin()-only to write, and this runs as an ordinary signed-in
         user, so that doc was never reachable from here. firestore.rules'
         pricing/{doc} match block already carves out exactly this case \u2014
         a signed-in user may move pricing/founder.count by exactly +1 and
         nothing else \u2014 but no caller ever used it until now (see that
         rule's own comment: "this carve-out exists for a future write
         path, not a currently-exercised one"). This IS that path. Best-
         effort and non-blocking: the seat is already genuinely granted by
         the update() above, so a failure here (e.g. the doc not existing
         yet on a brand-new deployment) must never undo or block the user's
         Pro access \u2014 it would only make the PUBLIC counter briefly stale,
         which self-corrects on the next successful redemption or admin
         payment. */
      /* NMIMS seats live in their own reserved pool of 500 (see js/pricing/founder-seats.js),
         so they must NOT also move the shared paid-seat counter, or the public number would
         subtract them twice. Other partners still count against the 1,000. */
      if(String(code).indexOf('NMIMS-')!==0){
        db.collection('pricing').doc('founder').update({
          count: firebase.firestore.FieldValue.increment(1)
        }).catch(function(){});
      }
      showToast('\ud83c\udf89 Partner Pass activated! Welcome, '+esc2(data.name?data.name.split(' ')[0]:(user.displayName?user.displayName.split(' ')[0]:'friend'))+'.');
      try{ rwPartnerShare(String(code).indexOf('NMIMS-')===0); }catch(e){}
      window._proUnlocked=true;
      /* Reuse the SAME UI-refresh path a real Firestore pro:true write
         triggers (the users/{uid} onSnapshot listener, ~line 9403, calls this
         too) — there is no separate applyPro() anywhere in the app; calling
         it here used to be a guaranteed crash (ReferenceError) that no UI
         caller had ever exercised. Set rw_pro_method locally too (not just via
         the snapshot round-trip) so rwStatusLabel() shows "PARTNER PASS", not
         a paid-sounding badge, the instant this resolves. */
      isPro=true; lsSet('rwPro','1'); lsSet('rw_pro_uid',user.uid); lsSet('rw_pro_method','partner'); refreshProUI();
    }catch(e){
      /* The claim is ALREADY marked redeemed at this point (the first write
         above succeeded) — it cannot be silently retried by re-running this
         flow, since the code now shows as redeemed. Surface that clearly
         instead of a generic error so the user contacts support rather than
         assuming the code is simply broken. */
      showToast('Your code was redeemed, but activating Pro failed — contact founder@roamwise.co.in with your code so we can finish this manually.');
    }
  }, 'Enter the NMIMS-XXXXXX code you received after claiming on the partnership page.');
}



/* Congratulations card after a partner pass is activated, with a WhatsApp share. No data is sent anywhere
   by the app; the button just opens WhatsApp with a pre-written message the person can edit or ignore. */
function rwPartnerShare(isNmims){
  var text=(isNmims
    ? 'I just unlocked RoamWise Founder Pro (lifetime) through E-Cell NMIMS! \ud83c\udf89 It plans trips with AI, offline maps and more. Check it out: '
    : 'I just unlocked RoamWise Pro! \ud83c\udf89 AI trip planning for India: ')+'https://www.roamwise.co.in/';
  var ov=document.getElementById('rwShareOverlay');
  if(ov) ov.remove();
  ov=document.createElement('div'); ov.id='rwShareOverlay';
  ov.style.cssText='position:fixed;inset:0;z-index:4000;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:20px';
  ov.innerHTML='<div style="max-width:360px;width:100%;background:var(--bg2,#14141a);border:1px solid var(--b2,#2a2a36);border-radius:18px;padding:22px;text-align:center;color:inherit">'
    +'<div style="font-size:40px">\ud83c\udf89</div>'
    +'<div style="font-size:18px;font-weight:800;margin:6px 0">Founder Pro is active!</div>'
    +'<div style="font-size:13px;opacity:.8;margin-bottom:16px">Congratulations. Your pass is yours for life. Want to tell a friend?</div>'
    +'<a id="rwShareWa" target="_blank" rel="noopener" style="display:block;background:#25D366;color:#06260f;font-weight:800;border-radius:12px;padding:12px;text-decoration:none;margin-bottom:8px">Share on WhatsApp</a>'
    +'<button id="rwShareClose" style="width:100%;border:1px solid var(--b2,#2a2a36);background:transparent;color:inherit;border-radius:12px;padding:11px;font:inherit">Close</button></div>';
  document.body.appendChild(ov);
  document.getElementById('rwShareWa').href='https://wa.me/?text='+encodeURIComponent(text);
  document.getElementById('rwShareClose').onclick=function(){ ov.remove(); };
}
