// @ts-nocheck
/* Optional public web lookup and honest AI-outage response for Ailon Tusk.
   Loaded as a classic script before core.js. No API secrets or personal data. */
function rwTuskWorkerSearch(q,out){
 var endpoint=(typeof rwApi==='function')?rwApi('tusk/search'):null;
 if(!endpoint)return Promise.resolve();
 // Public-only retrieval. Do not send PII or secrets to the search endpoint.
 // Server applies a second independent guard.
 var question=String(q||'').trim().slice(0,180);
 if(!question||/[\\r\\n<>]/.test(question)||/[\\w.+-]+@[\\w.-]+\\.[a-z]{2,}/i.test(question))return Promise.resolve();
 var language='en-IN';
 try{var picker=document.getElementById('rwHomeVoiceLang');if(picker)language=picker.value||language;}catch(e){}
 return fetch(endpoint+'?q='+encodeURIComponent(question)+'&lang='+encodeURIComponent(language))
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
       if(!out.absUrl)out.absUrl=url.href;
     }catch(e){/* reject non-HTTPS or malformed source */ }
   });
 }).catch(function(){/* other sources remain available */});
}
function rwTuskSearchFailure(thinking,t,intents,err){
 // Avoid made-up dates, schedules and unrelated trek cards if paid AI is down.
 var known=cpSmartAnswer(t)||'';
 var note=(typeof rwAiDownNote==='function')?rwAiDownNote(err,false):'<span class="rw-note">AI unavailable: showing source links.</span>';
 intents._noGenericActions=true;
 if(known&&!/^<b>Explore /i.test(known)){
   cpFinish(thinking,known+'<br>'+note,intents,t);return;
 }
 Promise.resolve().then(function(){return rwMiniSearch(t);}).then(function(res){
   var html=res?rwWebAnswerHTML(t,res):'<div class="tk-card"><div class="tk-head"><div class="tk-place">🔎 Unable to verify this answer</div></div><div class="tk-sec"><p>Available AI and public sources could not confirm this. Please refine the question or check a primary source.</p><div class="tk-chips"><a class="tk-chip" target="_blank" rel="noopener" href="https://www.google.com/search?q='+encodeURIComponent(t)+'">Google Search ↗</a><a class="tk-chip" target="_blank" rel="noopener" href="https://duckduckgo.com/?q='+encodeURIComponent(t)+'">DuckDuckGo ↗</a></div></div></div>';
   cpFinish(thinking,html+'<br>'+note,intents,t);
 }).catch(function(){cpFinish(thinking,'<b>Could not verify that answer.</b> Try a more specific question. '+note,intents,t);});
}
