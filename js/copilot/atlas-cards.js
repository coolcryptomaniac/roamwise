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
    html+='<a class="rw-atlas-photo" href="'+esc2(link)+'" target="_blank" rel="noopener noreferrer">↗ Official tourism page & photo reference</a>'
      +'<p class="rw-atlas-rights">Photographs are not embedded: image usage rights have not been cleared.</p>';
  }
  html+='<p class="rw-atlas-caution">These are editorial travel ideas, not a live quote, guaranteed route, activity opening, supplier acceptance or confirmed booking. Check conditions and accessibility before travelling.</p>';
  html+='<div class="tk-chips"><a class="tk-chip" href="/packages/">Explore RoamWise trips ↗</a><a class="tk-chip" href="/?rw_open=itineraries">My itineraries ↗</a></div></div></div>';
  return html;
}
