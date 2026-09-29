// @ts-nocheck
/* ==================== PAID-AD ATTRIBUTION (anonymous counters) ====================
   Answers one question: "did the people who clicked a paid ad sign up / pay?"
   - On landing, if the URL carries utm_source AND utm_medium in {cpc,paid,ads,ppc},
     remember it in localStorage for 30 days. No PII, nothing per-user is sent.
   - Bumps three anonymous daily counters via the existing track() writer:
       ad_visits     first landing from a paid link (once per browser session)
       ad_signups    a 'signups' event fired while attribution is still fresh
       ad_purchases  a paid / UTR-submitted event while attribution is fresh
   - Never uses utm_content: js/pricing/referral.js reads utm_content as a REFERRAL
     CODE, so ad links must not set it (see ADS-CHATGPT-LAUNCH.md).
   Wraps window.track only; auth, payment and entitlement code are untouched.
   Everything is best-effort — any failure is swallowed so it can never break the app. */
(function(){
  var KEY='rw_ad_attrib', TTL=30*24*3600*1000, PAID={cpc:1,paid:1,ads:1,ppc:1};
  function read(){
    try{
      var v=JSON.parse(localStorage.getItem(KEY)||'null');
      if(v && v.t && Date.now()-v.t<TTL) return v;
    }catch(e){ /* storage unavailable, ignore */ }
    return null;
  }
  function capture(){
    try{
      var q=new URLSearchParams(location.search);
      var s=(q.get('utm_source')||'').toLowerCase().slice(0,40);
      var m=(q.get('utm_medium')||'').toLowerCase();
      if(!s || !PAID[m]) return;
      var rec={s:s,m:m,c:(q.get('utm_campaign')||'').slice(0,60),t:Date.now()};
      try{ localStorage.setItem(KEY,JSON.stringify(rec)); }catch(e){ /* ignore */ }
      if(!sessionStorage.getItem('rw_ad_visit')){
        sessionStorage.setItem('rw_ad_visit','1');
        setTimeout(function(){ try{ window.track('ad_visits'); }catch(e){ /* ignore */ } }, 1500);
      }
    }catch(e){ /* best-effort */ }
  }
  var PURCHASE={cashfree_paid:1,pdf_paid:1,utr_submits:1};
  function wrap(){
    var orig=window.track;
    if(typeof orig!=='function' || orig.__rwAd) return;
    var w=function(ev){
      var r=orig.apply(this,arguments);
      try{
        if(read()){
          if(ev==='signups') orig('ad_signups');
          else if(PURCHASE[ev] || /^payment_/.test(String(ev))) orig('ad_purchases');
        }
      }catch(e){ /* best-effort */ }
      return r;
    };
    w.__rwAd=true;
    window.track=w;
  }
  wrap();
  capture();
  window.RW_AD_ATTRIB={get:read};
})();
