// @ts-nocheck
/* Optional public web lookup and honest AI-outage response for Ailon Tusk.
   Loaded as a classic script before core.js. No API secrets or personal data. */
/* Keep the main app on Firebase. This is only a public, read-only source
   lookup against the SAME Cloudflare Worker other RoamWise features use.
   Never send Firebase tokens, cookies or private trip memory to this URL. */
/* Public lookup is NOT for account, booking or contact details. Keep the
   same screening in the browser before calling *any* third-party search. */
function rwTuskIsPublicQuery(q){
 var raw=String(q==null?'':q);
 if(raw.length<5||raw.length>180||/[\r\n<>\u0000-\u001f]/.test(raw))return false;
 var normalized=typeof raw.normalize==='function'?raw.normalize('NFKC'):raw;
 if(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(normalized))return false;
 if(/(?:\+?\d[\d\s().-]{9,}\d)/.test(normalized))return false;
 if(/\b(?:password|api[ _-]?key|private key|access token|auth(?:orization)? token|otp|account number|credit card|upi pin)\b/i.test(normalized))return false;
 if(/\b(?:my|our)\s+(?:booking|reservation|account|payment|refund|wallet|order|ticket|flight|hotel|stay|trip history|itinerary)\b|मेरी\s*(?:बुकिंग|टिकट|यात्रा)|मेरा\s*(?:रिफंड|पेमेंट|अकाउंट)|ನನ್ನ\s*(?:ಬುಕಿಂಗ್|ಖಾತೆ|ಟಿಕೆಟ್)|ನಮ್ಮ\s*(?:ಬುಕಿಂಗ್|ಖಾತೆ)/i.test(normalized))return false;
 if(/\b(?:sk-[a-z0-9_-]{12,}|ghp_[a-z0-9]{20,}|AIza[a-z0-9_-]{30,})\b/i.test(normalized))return false;
 return normalized.trim().length>=5;
}
function rwTuskPublicSearchEndpoint(){
 var fromRuntime=null;
 try{if(typeof rwApi==='function')fromRuntime=rwApi('tusk/search');}catch(e){}
 if(fromRuntime)return fromRuntime;
 var configured='';
 try{configured=String(window.RW_CONFIG&&window.RW_CONFIG.workerUrl||'').trim();}catch(e){}
 // Accept a future app-approved HTTPS Worker URL, but never a private HTTP
 // origin from visitor input. The production default below is already used
 // by the homepage trek and stay public catalogues.
 if(/^https:\/\/[a-z0-9.-]+\.workers\.dev\/?$/i.test(configured))
   return configured.replace(/\/+$/,'')+'/tusk/search';
 return 'https://roamwise-api.founder-f53.workers.dev/tusk/search';
}
function rwTuskWorkerSearch(q,out){
 var endpoint=rwTuskPublicSearchEndpoint();
 if(!endpoint)return Promise.resolve();
 // Public-only retrieval. Do not send PII or secrets to the search endpoint.
 // Server applies a second independent guard.
 var question=String(q||'').trim();
 if(!rwTuskIsPublicQuery(question))return Promise.resolve();
 var language='en-IN';
 try{var picker=document.getElementById('rwHomeVoiceLang');if(picker)language=picker.value||language;}catch(e){}
 return fetch(endpoint+'?q='+encodeURIComponent(question)+'&lang='+encodeURIComponent(language),{
   credentials:'omit',referrerPolicy:'no-referrer',mode:'cors',cache:'no-store'
 })
 .then(function(r){if(!r.ok)throw new Error('Search unavailable');return r.json();})
 .then(function(data){
   if(!data||!data.available)return;
   var hits=Array.isArray(data.hits)?data.hits.slice(0,4):[];
   var trustworthy=data.route==='curated'||data.route==='approved-vector';
   // Officially reviewed facts trump an unrelated DDG abstract even when
   // requests finish in a different order.
   if(data.summary && (trustworthy||!out.abs)){
     out.abs=String(data.summary).slice(0,650);
     out.absSrc=String(data.source||'Public sources').slice(0,70);
     out.trustedSummary=trustworthy;
     if(data.checkedAt)out.checkedAt=String(data.checkedAt).slice(0,20);
   }
   if(data.requiresLiveVerification)out.liveVerificationRequired=true;
   hits.forEach(function(hit){
     try{
       var url=new URL(hit.url);
       if(url.protocol!=='https:'||url.username||url.password)return;
       var item={t:String(hit.title||'').slice(0,110)+(hit.description?' — '+String(hit.description).slice(0,140):''),u:url.href,s:String(hit.source||data.source||'Public source').slice(0,50)};
       out.hits.unshift(item);
       if(trustworthy && !out._rwPrimarySource){out.absUrl=url.href;out._rwPrimarySource=true;}
       else if(!out.absUrl)out.absUrl=url.href;
     }catch(e){/* reject non-HTTPS or malformed source */ }
   });
 }).catch(function(){/* other sources remain available */});
}
/* Local structured answer when remote AI is down. No PII is sent to public search,
   and no price, availability or supplier acceptance is invented. */
function rwTuskOfflinePlanningCard(question){
 var q=String(question||'');
 if(!/(?:itinerary|plan|trip|travel|stay|hotel|homestay|tour|holiday|weekend|destination|transport|taxi|flight|train|bus|यात्रा|योजना|सफ़र|ट्रिप|होटल)/i.test(q))return '';
 // Account, payment and booking reference checks must stay on authenticated rails.
 if(/(?:\b(?:password|otp|token|pin|payment|refund|account number|booking reference|confirmation code|credit card)\b|[\w.+-]+@[\w.-]+\.[a-z]{2,}|\+?\d[\d\s().-]{9,}\d)/i.test(q))return '';
 var transport=/(?:transport|taxi|flight|train|bus|transfer|vehicle|cab|रेल|बस|टैक्सी)/i.test(q);
 var hotel=/(?:stay|hotel|homestay|room|resort|होटल)/i.test(q);
 var heading=transport?'🚆 Transport plan':hotel?'🏡 Stay shortlist':'🗺️ Trip planning draft';
 var main=transport
   ?'<ol><li>Tell me your origin and destination.</li><li>Add departure and return dates, and traveller count.</li><li>Compare train, bus, flight and taxi routes; prioritise electric options where verified.</li><li>Review provider-confirmed availability and payable fares before booking.</li></ol>'
   :hotel
   ?'<ol><li>Choose destination, check-in, check-out and number of guests.</li><li>Compare listed properties by location, amenities and confirmed rates.</li><li>Select room and payment option only after the provider confirms availability.</li></ol>'
   :'<ol><li>Choose destination, travel dates, travellers and total budget.</li><li>Build a day-by-day route with travel time, meals and experiences.</li><li>Compare available stays and transport. Mark missing arrangements.</li><li>Save the plan, then request supplier confirmation before paying.</li></ol>';
 return '<div class="tk-card rw-tusk-offline" role="status"><div class="tk-head"><div class="tk-place">'+heading+'</div></div><div class="tk-sec"><p><b>Planning mode</b> — live AI is temporarily unavailable, so these are safe next steps, not a verified itinerary or booking.</p>'+main+'<div class="tk-chips"><a class="tk-chip" href="/packages/">Explore packages ↗</a><a class="tk-chip" href="/?rw_open=itineraries">Saved itineraries ↗</a><a class="tk-chip" href="/wallet/">Wallet ↗</a></div></div></div>';
}
function rwTuskSearchFailure(thinking,t,intents,err){
 // Avoid made-up dates, schedules and unrelated trek cards if paid AI is down.
 var known=cpSmartAnswer(t)||'';
 var note=(typeof rwAiDownNote==='function')?rwAiDownNote(err,false):'<span class="rw-note">AI unavailable: showing source links.</span>';
 intents._noGenericActions=true;
 if(known&&!/^<b>Explore /i.test(known)){
   cpFinish(thinking,known+'<br>'+note,intents,t);return;
 }
 var localPlan=rwTuskOfflinePlanningCard(t);
 if(localPlan){cpFinish(thinking,localPlan+'<br>'+note,intents,t);return;}
 if(!rwTuskIsPublicQuery(t)){
   cpFinish(thinking,'<div class="tk-card"><div class="tk-head"><div class="tk-place">🔒 Private question</div></div><div class="tk-sec"><p>Public web lookup was skipped to protect personal or booking details. Remove private details for a general search, or use your secure RoamWise booking page.</p></div></div><br>'+note,intents,t);
   return;
 }
 Promise.resolve().then(function(){return rwMiniSearch(t);}).then(function(res){
   var html=res?rwWebAnswerHTML(t,res):'<div class="tk-card"><div class="tk-head"><div class="tk-place">🔎 Unable to verify this answer</div></div><div class="tk-sec"><p>Available AI and public sources could not confirm this. Please refine the question or check a primary source.</p><div class="tk-chips"><a class="tk-chip" target="_blank" rel="noopener" href="https://www.google.com/search?q='+encodeURIComponent(t)+'">Google Search ↗</a><a class="tk-chip" target="_blank" rel="noopener" href="https://duckduckgo.com/?q='+encodeURIComponent(t)+'">DuckDuckGo ↗</a></div></div></div>';
   cpFinish(thinking,html+'<br>'+note,intents,t);
 }).catch(function(){cpFinish(thinking,'<b>Could not verify that answer.</b> Try a more specific question. '+note,intents,t);});
}
