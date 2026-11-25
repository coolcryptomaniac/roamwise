// @ts-nocheck
/* Included Cloudflare chat. Firebase proves account identity; no provider key
   or client-owned counter grants access. Paid /ai and BYOK remain separate. */
var rwBasicAIUsage=null;
function rwBasicAIUser(){
  try{return typeof firebase!=='undefined'&&firebase.auth?firebase.auth().currentUser:null;}catch(e){return null;}
}
function rwBasicAIEndpoint(){
  var c=window.RW_CONFIG&&window.RW_CONFIG.basicAI;
  return c&&c.enabled===true&&/^https:\/\//.test(c.url||'')?c.url:'';
}
function rwBasicAIAvailable(){var u=rwBasicAIUser();return !!(rwBasicAIEndpoint()&&u&&!u.isAnonymous);}
function rwBasicAIStatusText(){
  var u=rwBasicAIUser(),q=rwBasicAIUsage;
  if(!rwBasicAIEndpoint())return 'Included AI is not enabled yet. Search and saved guides are available.';
  if(!u||u.isAnonymous)return 'Sign in for up to 10 included AI answers per day. No API key needed.';
  if(q&&q.uid===u.uid&&q.message)return q.message;
  if(q&&q.uid===u.uid&&Number.isFinite(q.remaining))return q.remaining+' of '+q.limit+' included AI answers left today. Resets at 05:30 IST.';
  return 'Up to 10 included AI answers daily, subject to shared availability. No API key needed.';
}
function rwBasicAIPaint(){var e=document.getElementById('rwBasicAIStatus');if(e)e.textContent=rwBasicAIStatusText();}
async function rwBasicAIRequest(prompt){
  var user=rwBasicAIUser(),url=rwBasicAIEndpoint();
  if(!user||user.isAnonymous||!url)throw new Error('Sign in to use included AI answers.');
  var controller=new AbortController(),timer=setTimeout(function(){controller.abort();},15000);
  try{
    var token=await user.getIdToken();
    var options={method:prompt===undefined?'GET':'POST',headers:{Authorization:'Bearer '+token},signal:controller.signal,credentials:'omit',redirect:'error'};
    if(prompt!==undefined){options.headers['Content-Type']='application/json';options.body=JSON.stringify({prompt:String(prompt).slice(-4000)});}
    var r=await fetch(url,options),out=await r.json();
    if(!rwBasicAIUser()||rwBasicAIUser().uid!==user.uid)throw new Error('Your account changed. Please ask again.');
    if(!r.ok){
      var messages={daily_limit:'Today\'s included AI answers are used. Resets at 05:30 IST.',shared_budget:'The shared AI pool is used today. Try again after 05:30 IST.',slow_down:'Please wait a minute before asking again.',busy:'Ailon is busy. Please try again in a minute.',verified_account_required:'Verify your email or use a verified phone account for included AI.',retry_limit:'Too many failed AI attempts today. Please try again tomorrow.'};
      var message=messages[out.error]||'Included AI is temporarily unavailable. Search and saved guides still work.';
      rwBasicAIUsage={uid:user.uid,message:message};rwBasicAIPaint();throw new Error(message);
    }
    if(Number.isFinite(out.remaining))rwBasicAIUsage={uid:user.uid,remaining:out.remaining,limit:out.limit,resetsAt:out.resetsAt};
    rwBasicAIPaint();return out;
  }finally{clearTimeout(timer);}
}
function rwBasicAICall(prompt,cb){
  rwBasicAIRequest(prompt).then(function(out){
    if(!out.text)throw new Error('Included AI returned no answer.');
    lastAiSource={prov:'smart',route:out.route,model:out.model,remaining:out.remaining,limit:out.limit,cached:out.cached,basic:true};
    cb(null,out.text);
  }).catch(function(e){lastAiSource=null;cb('Included AI: '+String(e.message||e),null);});
}
function rwBasicAIBadge(){
  var s=typeof lastAiSource==='undefined'?null:lastAiSource;
  return s&&s.basic&&Number.isFinite(s.remaining)?'<br><span class="rw-note">'+s.remaining+' of '+s.limit+' included AI answers left today.</span>':'';
}
function rwBasicAICompactPrompt(facts,question){
  // Preserve the latest question; omit the long duplicate browser persona.
  return 'Traveller context (may be incomplete):\n'+String(facts||'').slice(-1800)+'\n\nLatest question:\n'+String(question||'').slice(-1800);
}
function rwMountBasicAISetting(){
  if(!(window.RW_CONFIG&&window.RW_CONFIG.basicAI))return;
  var host=document.querySelector('#settingsOverlay .modal-body');if(!host)return;
  var box=document.getElementById('rwBasicAISetting');
  if(!box){
    box=document.createElement('div');box.id='rwBasicAISetting';box.className='mode-box';box.style.marginBottom='12px';
    var title=document.createElement('b');title.textContent='Ailon Tusk · Included AI';box.appendChild(title);
    var status=document.createElement('p');status.id='rwBasicAIStatus';status.setAttribute('aria-live','polite');box.appendChild(status);
    var note=document.createElement('small');note.textContent='Short chat and travel plans. Requests use RoamWise\'s Cloudflare service. Daily availability is shared; search and saved guides remain available.';box.appendChild(note);
    var credits=document.createElement('a');credits.href='/ai-credits/';credits.textContent='Explore AI credit packs · ₹10–₹1,000';credits.style.display='block';credits.style.marginTop='8px';box.appendChild(credits);
    host.insertBefore(box,host.firstChild);
  }
  rwBasicAIPaint();if(rwBasicAIAvailable())rwBasicAIRequest().catch(function(){rwBasicAIPaint();});
}
