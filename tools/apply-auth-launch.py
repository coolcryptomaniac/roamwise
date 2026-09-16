#!/usr/bin/env python3
"""Coordinated, fail-closed auth/NMIMS release patch; run once on a feature branch."""
from pathlib import Path
from importlib import import_module
import sys
ROOT=Path(__file__).resolve().parent.parent
sys.path.insert(0,str(ROOT/'tools'))
prepare=import_module('prepare-auth-referral-rules')

def once(s,old,new,label):
    count=s.count(old)
    if count!=1: raise RuntimeError(f'{label}: expected one source match, got {count}')
    return s.replace(old,new,1)

def main():
    rules_path=ROOT/'firestore.rules'
    auth_path=ROOT/'js/boot/auth-init.js'
    nmims_path=ROOT/'nmims/index.html'
    rules=rules_path.read_text(encoding='utf-8')
    auth=auth_path.read_text(encoding='utf-8')
    nmims=nmims_path.read_text(encoding='utf-8')
    if 'async function submitClaim()' not in nmims or 'RoamWise × E-Cell NMIMS' not in nmims:
        raise RuntimeError('NMIMS page changed; refuse potentially destructive replacement')
    rules=prepare.candidate(rules)
    rules=once(rules,
        '// REVIEW CANDIDATE ONLY (2026-09-16): do not publish until the anonymous\n// NMIMS issuance flow has moved to verified server-side issuance,\n// and Firestore Emulator + web/Android regression tests pass.\n',
        '// 2026-09-16: NMIMS proposed, not live. Partner claims require trusted/admin\n// issuance and verified claimant email. Full replace only after emulator tests.\n',
        'release header')
    old='''function rwSendVerificationAndSignOut(u,email,message){
  var failed='';
  var settings=window.RWAuthSecurity?RWAuthSecurity.actionCodeSettings():undefined;
  return u.sendEmailVerification(settings).catch(function(e){failed=friendly(e);}).then(function(){return firebase.auth().signOut().catch(function(){});})
    .then(function(){
      rwShowVerificationPane(email,failed?'We could not send another link: '+failed+' You can try Resend in a minute.':message);
      return {verificationPending:true};
    });
}'''
    new='''// A failed verification send does NOT undo account creation. Preserve the UID.
function rwSendVerificationAndSignOut(u,email,message){
  var settings=window.RWAuthSecurity?RWAuthSecurity.actionCodeSettings():undefined;
  var send=u.sendEmailVerification(settings).catch(function(e){
    var code=String(e&&e.code||'');
    // Retry once with Firebase's default action URL only for an invalid continue URL.
    if(/unauthorized-continue-uri|invalid-continue-uri|missing-continue-uri/.test(code))return u.sendEmailVerification();
    throw e;
  });
  return send.then(function(){return {sent:true};},function(e){return {sent:false,error:e};})
    .then(function(result){return firebase.auth().signOut().catch(function(){}).then(function(){return result;});})
    .then(function(result){
      var display=result.sent
        ? message+' Firebase accepted the request; check inbox and spam. Delivery is not guaranteed.'
        : 'Your account exists, but Firebase could not send the verification link: '+friendly(result.error)
          +' Sign in with the SAME email and password to retry. Do not create another account.';
      rwShowVerificationPane(email,display);
      return {verificationPending:true,verificationSent:result.sent};
    });
}'''
    auth=once(auth,old,new,'verification send')
    old='''  var p=creating?firebase.auth().createUserWithEmailAndPassword(em,pw).then(function(c){
      try{track('signups');}catch(e){ /* analytics best-effort, ignore */ }
      try{if(rwRefActive())lsSet('rw_ref_pending_signup_uid',c.user.uid);}catch(e){ /* retry after verification */ }
      return rwSendVerificationAndSignOut(c.user,em,'Verification email sent. Open the link, then return and sign in.');
    }):firebase.auth().signInWithEmailAndPassword(em,pw).then(function(c){
      return c.user.reload().catch(function(){}).then(function(){return c;});
    }).then(function(c){
      if(rwIsUnverifiedPasswordUser(c.user))return rwSendVerificationAndSignOut(c.user,em,'Your email is not verified yet. We sent a fresh verification link.');
      if(window.RWAuthSecurity)RWAuthSecurity.rememberProvider('password');return c;
    });'''
    new='''  function afterPasswordSignIn(c){
    return c.user.reload().catch(function(){}).then(function(){
      if(rwIsUnverifiedPasswordUser(c.user))return rwSendVerificationAndSignOut(c.user,em,'Verification request accepted. Open the link and return to sign in.');
      if(window.RWAuthSecurity)RWAuthSecurity.rememberProvider('password');return c;
    });
  }
  var p=creating?firebase.auth().createUserWithEmailAndPassword(em,pw).then(function(c){
      try{track('signups');}catch(e){ /* analytics best-effort, ignore */ }
      try{if(rwRefActive())lsSet('rw_ref_pending_signup_uid',c.user.uid);}catch(e){ /* retry after verification */ }
      return rwSendVerificationAndSignOut(c.user,em,'Verification request accepted. Open the link and return to sign in.');
    }).catch(function(e){
      if(String(e&&e.code||'').indexOf('email-already-in-use')===-1)throw e;
      // Only the correct existing password recovers the original UID. Never merge
      // Google accounts, delete users, or award new referral credit on retries.
      return firebase.auth().signInWithEmailAndPassword(em,pw).then(afterPasswordSignIn).catch(function(loginError){
        var code=String(loginError&&loginError.code||'');
        if(/invalid-credential|wrong-password|user-not-found/.test(code))throw e;
        throw loginError;
      });
    }):firebase.auth().signInWithEmailAndPassword(em,pw).then(afterPasswordSignIn);'''
    auth=once(auth,old,new,'existing account recovery')
    auth=once(auth,
        '    .catch(function(e){authError(friendly(e));})\n    .then(function(){rwEmailAuthBusy=false;rwSetAuthBusy(false);});',
        "    .catch(function(e){if(String(e&&e.code||'').indexOf('email-already-in-use')>-1){authMode='in';rwApplyAuthModeUI();}authError(friendly(e));})\n    .then(function(){rwEmailAuthBusy=false;rwSetAuthBusy(false);});",
        'existing account UI')
    proposed='''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>NMIMS × RoamWise | Proposed partnership</title><meta name="description" content="NMIMS × RoamWise is proposed, not live. No passes or codes are being issued.">
<style>:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:radial-gradient(ellipse at top,#252034,#090b13 70%);color:#f6efe4;font:16px/1.6 system-ui,sans-serif}main{max-width:600px;padding:clamp(26px,6vw,48px);border:1px solid #6b4a4a;border-radius:24px;background:#141620;box-shadow:0 20px 90px #0008}.tag{color:#e8ba6c;font-weight:700;letter-spacing:.08em;text-transform:uppercase;font-size:12px}h1{font-size:clamp(27px,5vw,42px);line-height:1.15}p{color:#c5c1c9}a{color:#e8ba6c}footer{margin-top:26px;color:#a8a0b3;font-size:13px}</style></head><body><main><div class="tag">Proposal · Not live</div>
<h1>NMIMS × RoamWise</h1><p>This collaboration is still being discussed. No registrations, promotional passes, referral claims or partner codes are available yet.</p>
<p>Please do not send personal details or payments to anyone claiming to issue an NMIMS RoamWise pass. If confirmed, RoamWise will publish official eligibility, dates, and a verified claim process here.</p>
<a href="https://www.roamwise.co.in/">Return to RoamWise</a><footer>RoamWise · Proposed partnership information only</footer></main></body></html>
'''
    # Write only after all source checks have passed; no production access.
    rules_path.write_text(rules,encoding='utf-8')
    auth_path.write_text(auth,encoding='utf-8')
    nmims_path.write_text(proposed,encoding='utf-8')
    print('Canonical rules + existing-account recovery + NMIMS proposal-only page ready')

if __name__=='__main__': main()
