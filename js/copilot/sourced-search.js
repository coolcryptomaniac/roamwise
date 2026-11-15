// @ts-nocheck
/* Optional public web lookup and honest AI-outage response for Ailon Tusk.
   Loaded as a classic script before core.js. No API secrets or personal data. */
function rwTuskWorkerSearch(q,out){
 var endpoint=(typeof rwApi==='function')?rwApi('tusk/search'):null;
 if(!endpoint)return Promise.resolve();
 return fetch(endpoint+'?q='+encodeURIComponent(q)).then(function(r){
   if(!r.ok)throw new Error('Search provider unavailable');
   return r.json();
 }).then(function(data){
   if(data&&Array.isArray(data.hits))data.hits.slice(0,4).forEach(function(hit){
     try{
       var url=new URL(hit.url);
       if(url.protocol!=='https:')return;
       out.hits.unshift({t:String(hit.title||'').slice(0,120)+(hit.description?' — '+String(hit.description).slice(0,140):''),u:url.href,s:'Brave Search'});
     }catch(e){/* skip invalid external result */}
   });
 }).catch(function(){/* DDG and Wikipedia remain available as a fallback */});
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
