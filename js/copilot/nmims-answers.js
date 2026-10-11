// @ts-nocheck
/* ============================================================================
   js/copilot/nmims-answers.js - fixed answers Ailon Tusk gives without any AI call
   ============================================================================
   1. Startup Garage / NMIMS / E-Cell questions: funny, but only facts that are true and decided:
      15 Oct 2026, SBM NMIMS Mumbai, organised by E-Cell SBM NMIMS Mumbai, 500 passes (50 organisers +
      450 students/audience), pass code comes from E-Cell, one-time, 30-day window, redeem with the same
      verified email, anyone without a pass can still get Founder Pro for Rs 100, NMIMS2026 referral code
      does not change the price. No venue room, time or speaker is invented.
   2. Creators and stay owners: the short way in (two forms, plus a WhatsApp share link).
   Being fixed text it costs nothing under load and cannot hallucinate. Hooked in from core.js (copilotSend).
   ============================================================================ */
(function(){
  var NMIMS_RE=/\bnmims\b|startup\s*garage|\be-?cell\b/i;
  var CREATOR_RE=/\b(creator|influencer|vlogger|youtuber)\b.{0,60}\b(join|register|sign ?up|collab|barter|match|free)\b|\b(join|register|become|apply)\b.{0,30}\b(creator|influencer)\b|\b(list|add|join|register)\b.{0,30}\b(my|our)\b.{0,20}\b(stay|homestay|property|villa|resort|hotel|cottage)\b|\b(own|have|run)\b.{0,25}\b(stay|homestay|property|villa|resort|cottage)\b.{0,60}\b(list|creator|collab|barter|partner)|\bcreators?\b.{0,40}\b(my|our)\b.{0,20}\b(stay|homestay|property|villa|resort|cottage)|\bcreator.{0,30}property|property.{0,30}creator|\bbarter\b/i;
  var GOLD='color:var(--gold2,#C8913E)';
  function pick(a){ return a[Math.floor(Math.random()*a.length)]; }
  function link(href,label){ return '<a style="'+GOLD+';font-weight:700" target="_blank" rel="noopener" href="'+href+'">'+label+'</a>'; }

  function passAnswer(){
    var openers=[
      'Free lifetime Pro? Haan bhai, but pehle pass chahiye. Jugaad se nahi, E-Cell se.',
      'Startup Garage mein founders bolenge, aur RoamWise free Pro dega. Pass-holders ke liye, bas.',
      'Pass hai toh Pro free, life bhar. Pass nahi hai toh bhi sasta: ₹100. Chai se bhi kam mein trip planner.'];
    return '<b>'+pick(openers)+'</b>'
      +'<br><br><b>How it works, in 4 lines</b>'
      +'<br>1. Your personal pass code comes from E-Cell, SBM NMIMS Mumbai. It looks like <code>NMIMS-STU-0123-XXXXXXXXXXXXX</code>. A poster QR never gives a pass.'
      +'<br>2. Sign in to RoamWise with Google or email and verify it. <b>No registration with E-Cell first</b>: the code is all you need.'
      +'<br>3. Tap <b>I have a pass → Redeem</b> on the home card and paste the code.'
      +'<br>4. Redeem before the "valid until" date on your code (30 days from when the codes were created). One code, one person, one time. Keep it private: the first account to redeem it gets the pass.'
      +'<br><br>No pass? Founder Pro is ₹100 for life for the first 1,000 members. If you buy, type <code>NMIMS2026</code> as the referral code so E-Cell gets the credit. It does not change your price.'
      +'<br><br>'+link('/nmims/redeem/','Full steps ↗')+' · <a style="'+GOLD+';font-weight:700" href="#" onclick="try{openPartnerRedeem()}catch(e){}return false">Redeem a pass ↗</a>';
  }
  function eventAnswer(){
    return '<b>Startup Garage · 15 October 2026 · SBM NMIMS Mumbai</b>'
      +'<br>Organised by E-Cell, SBM NMIMS Mumbai. It is a founder speaker session: people who built startups from scratch talk to students who want to. Past editions had founders like Shiva Dhawan of Attentive AI.'
      +'<br><br>My job there: be the travel friend who never cancels plans. 😄 RoamWise is the travel partner, and pass-holders get Founder Pro free for life.'
      +'<br><br>Exact rooms and timings come from E-Cell, so I will not guess them. Check with your E-Cell coordinator.'
      +'<br><br>'+link('/nmims/redeem/','Pass steps ↗');
  }
  function funAnswer(){
    var jokes=[
      'Startup idea: ek app jo bata de trip ka budget aur dost ka mood. Wait, that is RoamWise. Idea chori nahi, ghar ka hai.',
      'Mumbai mein startup banana aasan hai. Mumbai mein time pe pahunchna? Woh asli startup hai.',
      'Pitch deck 20 slides ka, chai 1 cup ki. Dono ka balance zaroori hai.',
      'Founders ki ek hi problem hoti hai: ideas bahut, weekend ek. Isliye Ailon Tusk hai.'];
    return '<b>Startup Garage, 15 Oct, SBM NMIMS Mumbai. Main wahin ka mascot hoon (unofficial, free).</b> 🌱'
      +'<br>'+pick(jokes)
      +'<br><br>Seriously useful bits: pass-holders get <b>free lifetime Founder Pro</b>. Ask me <i>"how do I redeem my pass?"</i> or <i>"what is Startup Garage?"</i> and I will walk you through.'
      +'<br><br><a style="'+GOLD+';font-weight:700" href="#" onclick="try{openPartnerRedeem()}catch(e){}return false">I have a pass → Redeem ↗</a> · '+link('/nmims/redeem/','How it works ↗');
  }
  /* RoamWise business WhatsApp (India, +91). wa.me needs the country code, so the number is 91 + 9987379730. */
  var WA_CHAT='https://wa.me/919987379730';
  function creatorAnswer(t){
    var wantsStay=/\b(stay|homestay|property|villa|resort|hotel|cottage|host)\b/i.test(t)&&!/\b(i am|i'm|im)\s+a\s+(travel\s+)?(creator|influencer)/i.test(t);
    var origin='https://roamwise.co.in';
    var creatorUrl=origin+'/creators/match.html?role=creator&invite=founding', propUrl=origin+'/creators/match.html?role=property';
    var shareC='https://wa.me/?text='+encodeURIComponent('Travel creators: get matched with verified stays for hosted barter, hybrid or paid collabs on RoamWise. Takes about 2 minutes: '+creatorUrl);
    var shareP='https://wa.me/?text='+encodeURIComponent('Stay owners: list your stay on RoamWise and meet travel creators who fit it. Takes about 3 minutes: '+propUrl);
    return '<b>Short version: one form, two minutes. Seriously.</b>'
      +'<br><br><b>I am a creator</b> → '+link('/creators/match.html?role=creator&invite=founding','Register free ↗')+' · '+link(shareC,'Send on WhatsApp ↗')
      +'<br><b>I own a stay or experience</b> → '+link('/creators/match.html?role=property','Tell us what content you want ↗')+' · '+link(shareP,'Send on WhatsApp ↗')
      +'<br><br>Creators say what they make and what they want (hosted barter, hybrid or paid). Hosts say what content they want and what they can offer. The host decides. RoamWise matches, and does not hold anyone\'s payment.'
      +(wantsStay?'<br><br>Full partner listing (photos, rooms, booking route) takes about 3 minutes: '+link('/partner/join/','Join as a partner ↗'):'')
      +'<br><br>Prefer to chat? '+link(WA_CHAT+'?text='+encodeURIComponent(wantsStay?'Hi RoamWise, I own a stay and want to meet travel creators.':'Hi RoamWise, I am a travel creator and want to be matched with stays.'),'Message RoamWise on WhatsApp ↗')+' · '+link('https://chat.whatsapp.com/EofM9cGCVkoCtdG6Ozhh1G','Community group ↗');
  }

  /* Writes the fixed answer straight into its bubble. cpFinish() needs a full trip-intent object and throws on this one,
     which left the bubble stuck on the loading dots. Nothing here calls the AI or any network. */
  window.rwNmimsShow=function(bubble,html){
    if(!bubble) return;
    bubble.style.whiteSpace='normal';
    bubble.innerHTML=html;
    try{ var log=bubble.parentNode; if(log){ var top=bubble.offsetTop-8; log.scrollTop=top>0?top:0; } }catch(e){ /* scroll is cosmetic */ }
  };

  window.rwNmimsAnswer=function(text){
    var t=String(text||'');
    if(t.length>600) return null;
    if(NMIMS_RE.test(t)){
      if(/\b(pass|passes|code|coupon|redeem|free|pro|claim|lifetime|how)\b/i.test(t)) return passAnswer();
      if(/\b(when|where|date|venue|time|what|event|speaker|who)\b/i.test(t)) return eventAnswer();
      return funAnswer();
    }
    if(CREATOR_RE.test(t)) return creatorAnswer(t);
    return null;
  };
})();
