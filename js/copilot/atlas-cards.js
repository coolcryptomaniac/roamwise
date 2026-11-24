/* Read-only, HTML-escaped RoamWise atlas cards. Loaded before core.js. */
/* Compact mobile-native atlas card. No live quotes and no unlicensed photo
   hotlinks. Every string from the Worker is escaped before insertion. */
function rwAtlasAnswerHTML(q,res){
  var a=res&&res.atlas||{};
  function safeUrl(input){
    try{var u=new URL(String(input||''));return u.protocol==='https:'&&!u.username&&!u.password?u.href:'';}catch(e){return '';}
  }
  var days=(Array.isArray(a.itinerary)?a.itinerary:[]).slice(0,5);
  var foods=(Array.isArray(a.food)?a.food:[]).slice(0,6);
  var people=(Array.isArray(a.people)?a.people:[]).slice(0,8);
  var highlights=(Array.isArray(a.highlights)?a.highlights:[]).slice(0,8);
  var facts=(Array.isArray(a.facts)?a.facts:[]).slice(0,5);
  var verified=a.status==='source-backed-overview';
  var link=safeUrl((res.hits&&res.hits[0]&&res.hits[0].u)||a.photo&&a.photo.referencePage);
  var title='<div class="tk-head"><div class="tk-place">🏔 '+esc2(String(a.name||'Destination'))+'</div>'
    +'<div class="tk-meta">'+esc2(String(a.region||''))+' · '+(verified?'Source-backed overview':'Editorial destination lead')+'</div></div>';
  var html='<div class="tk-card rw-atlas-result">'+title+'<div class="tk-sec">';
  html+='<p class="rw-atlas-intro">'+esc2(String(res.abs||'').slice(0,360))+'</p>';
  if(days.length){
    html+='<div class="rw-atlas-section-title">Suggested 3-day itinerary <small>Flexible draft</small></div><div class="rw-atlas-days">';
    days.forEach(function(d){html+='<div class="rw-atlas-day"><b>Day '+(Number(d.day)||1)+'</b><span>'+esc2(String(d.description||''))+'</span></div>';});
    html+='</div>';
  }
  if(facts.length)html+='<div class="rw-atlas-section-title">Source-backed quick facts</div><ul class="rw-atlas-facts">'+facts.map(function(x){return '<li>'+esc2(x)+'</li>';}).join('')+'</ul>';
  if(highlights.length)html+='<div class="rw-atlas-section-title">Explore</div><div class="rw-atlas-tags">'+highlights.map(function(x){return '<span>'+esc2(x)+'</span>';}).join('')+'</div>';
  if(foods.length)html+='<div class="rw-atlas-section-title">Regional food to try <small>Availability varies</small></div><div class="rw-atlas-tags">'+foods.map(function(x){return '<span>'+esc2(x)+'</span>';}).join('')+'</div>';
  if(people.length){
    html+='<div class="rw-atlas-section-title">People & culture</div>';
    people.forEach(function(p){html+='<p class="rw-atlas-person"><strong>'+esc2(p.name)+'</strong> · '+esc2(p.context)+'</p>';});
  }
  if(link){
    html+='<a class="rw-atlas-photo" href="'+esc2(link)+'" target="_blank" rel="noopener noreferrer">↗ Travel source & photo reference</a>'
      +'<p class="rw-atlas-rights">Photographs are not embedded: image usage rights have not been cleared.</p>';
  }
  html+='<p class="rw-atlas-caution">These are editorial travel ideas, not a live quote, guaranteed route, activity opening, supplier acceptance or confirmed booking. Check conditions and accessibility before travelling.</p>';
  html+='<div class="tk-chips"><a class="tk-chip" href="/packages/">Explore RoamWise trips ↗</a><a class="tk-chip" href="/?rw_open=itineraries">My itineraries ↗</a></div></div></div>';
  return html;
}

/* Deterministic guide and booking scope: no AI key or external lookup required.
 * Prefer an explicitly mentioned place; never silently use the previous city. */
function rwLocalAtlasRecord(raw,intents){
  var rows=Array.isArray(window.RW_LOCAL_ATLAS)?window.RW_LOCAL_ATLAS:[];
  var norm=function(s){return String(s||'').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();};
  var q=norm(raw);
  if(!q||q.length>180||intents&&(intents.multi||intents._route||intents._country&&!intents.dest))return null;
  var matches=[];
  rows.forEach(function(d){
    var keys=[d.name,d.id.replace(/-/g,' ')].concat(d.aliases||[]).map(norm).filter(Boolean);
    var found=keys.filter(function(k){return (' '+q+' ').includes(' '+k+' ');}).sort(function(a,b){return b.length-a.length;})[0];
    if(found)matches.push({d:d,key:found});
  });
  // "South Goa" is more specific than "Goa"; distinct locations are not merged.
  var precise=matches.filter(function(m){return !matches.some(function(other){return other!==m&&other.key.length>m.key.length&&(' '+other.key+' ').includes(' '+m.key+' ');});});
  if(precise.length===1)return precise[0].d;
  if(precise.length>1)return null;
  if(intents&&intents._inherited&&!intents._weakDest&&!intents._needsPlaceVerification){
    var name=norm(intents.dest);
    return rows.find(function(d){return [d.name,d.id.replace(/-/g,' ')].concat(d.aliases||[]).map(norm).includes(name);})||null;
  }
  return null;
}
function rwLocalAtlasSafe(raw,record){
  var q=String(raw||'').trim();
  if(!record||!q||q.length>180||typeof rwTuskIsPublicQuery!=='function')return false;
  if(/\b(?:sos|emergency|ambulance|police|injury|medical|suicide|self harm|assault|scam|fraud|refund|cancel|complaint|password|otp|payment|booking status|weather|forecast|traffic|flight|train|bus|visa|permit|open today|closed today|live price|current price)\b|आपातकाल|इमरजेंसी|रिफंड/i.test(q))return false;
  return rwTuskIsPublicQuery(q.length<5?'Guide to '+q:q);
}
function rwLocalAtlasSimple(raw,record){
  var q=String(raw||'').trim().toLowerCase().replace(/[,.!?]/g,' ').replace(/\s+/g,' ').trim();
  var keys=[record.name,record.id.replace(/-/g,' ')].concat(record.aliases||[]).map(function(s){return String(s).toLowerCase();});
  return keys.some(function(k){return [k,k+' '+record.country.toLowerCase(),'plan a trip to '+k,'plan a trip to '+k+' '+record.country.toLowerCase(),'visit '+k,'explore '+k,'travel to '+k,'trip to '+k,'guide to '+k].includes(q);});
}
function rwLocalAtlasHTML(record){
  var d=record;
  var html=rwAtlasAnswerHTML(d.name,{abs:d.summary,hits:[{u:d.source}],atlas:{name:d.name,region:d.region,status:d.status,itinerary:d.itinerary,food:d.food,people:d.people,highlights:d.highlights,facts:d.facts}});
  var dest=encodeURIComponent(d.name),safe=esc2(d.name);
  var media=window.RW_DEST_MEDIA&&window.RW_DEST_MEDIA[d.id];
  var art='';
  if(media&&media.status==='published'&&['owned','licensed','public-domain'].includes(media.rightsStatus)&&typeof media.licenseProof==='string'&&media.licenseProof.length>=12&&/^(?:\/(?:assets|media)\/[a-zA-Z0-9_./%-]+|https:\/\/assets\.roamwise\.co\.in\/media\/[a-zA-Z0-9_./%-]+)$/.test(media.src||'')&&!String(media.src).includes('..')){
    art='<img src="'+esc2(media.src)+'" alt="'+esc2(media.alt||safe)+'" loading="lazy" style="width:100%;max-height:200px;object-fit:cover;border-radius:12px" onerror="this.remove()">';
  }
  return '<section class="tk-card rw-local-atlas" aria-label="Destination guide"><div class="tk-head" style="background:linear-gradient(135deg,#30304e,#203c43)"><div class="tk-place">'+safe+'</div><div class="tk-meta">RoamWise local guide · works without hosted AI</div></div><div class="tk-sec">'+art+
    '<div class="tk-chips"><a class="tk-chip" href="/escapes/?zone='+dest+'#request-quote">Find or request stays</a><a class="tk-chip" href="/packages/">Browse RoamWise packages</a></div>'+
    '<p style="font-size:11px;color:var(--t3)">Select dates, guests and budget for a tailored plan. Only matching live RoamWise listings can be purchased directly.</p></div></section>'+html;
}
function rwLocalAtlasReply(bubble,intents,raw,allowDetailed){
  var d=rwLocalAtlasRecord(raw,intents);
  if(!rwLocalAtlasSafe(raw,d)||(!allowDetailed&&!rwLocalAtlasSimple(raw,d)))return false;
  if(intents._eventTrip||intents._stayDesk||intents._offers||intents.smalltalk||intents._noGenericActions)return false;
  intents.dest=d.name;
  intents._rwDestinationId=d.id;
  intents._rwAllowDestinationCommerce=true;
  // Rich local guide replaces the generic duplicate action card.
  intents._noGenericActions=true;
  cpFinish(bubble,rwLocalAtlasHTML(d),intents,raw);
  return true;
}
