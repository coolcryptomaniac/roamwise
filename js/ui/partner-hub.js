// @ts-nocheck
/* ============================================================================
   js/ui/partner-hub.js - "Partner with RoamWise" role chooser on the home page
   ============================================================================
   One place for every kind of partner to find the right door: travel creators, stays, painting artists, music
   artists, transport providers, colleges and local businesses. Pick a role and see what the match is based on,
   what to have ready and the one next step. Creator, stay, artist and business doors open the real forms that
   already exist; roles without a form yet (music, transport, college) open a pre-written email to the founder.

   Insights are public-data only: counts read from files this site already serves (partners-data.js and
   creators/artists-data.json). A number is shown only when it was really read; otherwise it is left out.
   The creator door carries ?src=<tag>, which the creator form already records, so the admin hub can show
   which door a sign-up came from. Nothing is collected on this page and no personal data is read.
   ============================================================================ */
(function(){
  var MAIL='founder@roamwise.co.in';
  var ROLES=[
    {id:'creator',eng:'creator',ico:'🎥',name:'Travel creator',
     match:['Your niche and the places you shoot','Barter, hybrid or paid, whichever you are open to','Followers checked against your public profile','Stays whose hosts want that kind of content'],
     ready:['Instagram or YouTube link','Where you want to travel','What you can deliver (reels, stories, photos)'],
     next:'Register free in about 2 minutes. RoamWise verifies the profile before any match is sent.',
     cta:'Register as a creator',href:'/creators/match.html?role=creator&invite=founding&src=home-creator',stat:'creators'},
    {id:'stay',ico:'🏡',name:'Stay or property',
     match:['Your town, room count and price band','How many nights and meals you can offer a creator','Whether you want content, long stays or both','Creators whose niche fits your property'],
     ready:['Property name and town','Room count and starting price','A photo or Google Maps link'],
     next:'Apply in about 3 minutes. Hosts and creators approve the same terms before anything is agreed.',
     cta:'List your stay',href:'/partner/join/?src=home-stay',stat:'stays'},
    {id:'artist',eng:'painter',ico:'🎨',name:'Painting artist',
     match:['Your themes, such as Shiva, yantra, Devi or landscapes','Hotels, cafes and resorts that look for wall art','Commission, exhibition or workshop, whichever you offer','Buyers who enquire for your style'],
     ready:['A few clear photos of your work','Sizes and your price range','Instagram or website link'],
     next:'Founding artists get a free page. Buyers enquire with you directly and you agree price and delivery yourself.',
     cta:'Open your artist page',href:'/creators/join-artist.html?src=home-artist',stat:'artists'},
    {id:'music',eng:'music',ico:'🎶',name:'Music artist',
     match:['Your genre and mood','Stays, cafes and events that want live or ambient music','Travel creators who need original tracks for reels','Festivals and campaigns in the hills'],
     ready:['Links to two or three tracks','Your city and where you can perform','Whether you own the rights to what you share'],
     next:'There is no music form yet. Send a short brief by email and the founder replies personally.',
     cta:'Email a music brief',mail:{subject:'Music artist partnership with RoamWise',body:'Hi RoamWise team,\n\nI am a music artist and would like to partner.\n\nName:\nGenre and mood:\nCity:\nTrack links:\nI own the rights to the tracks I am sharing: yes / no\nBest way to reach me:\n'}},
    {id:'transport',eng:'transport',ico:'🚕',name:'Transport provider',
     match:['The routes and towns you cover','Vehicle type and seats','Pickup points near the stays travellers book','Season and availability'],
     ready:['Vehicle types and seat counts','Routes you drive','Your permit and licence details to share when asked'],
     next:'There is no transport form yet. Send a short brief by email and the founder replies personally. Rates are agreed directly with you.',
     cta:'Email a transport brief',mail:{subject:'Transport partnership with RoamWise',body:'Hi RoamWise team,\n\nI provide transport and would like to partner.\n\nName / business:\nBase town:\nRoutes covered:\nVehicle types and seats:\nPermit / licence available on request: yes / no\nBest way to reach me:\n'}},
    {id:'college',eng:'college',ico:'🎓',name:'College or campus',
     match:['Student community size and events','Interest in travel, creator and entrepreneurship programmes','Campus creators who can join the network','In-kind terms both sides agree in writing'],
     ready:['Name of the club, cell or department','Event dates you are planning','Who signs on behalf of the college'],
     next:'See how a campus partnership is structured, then email a short brief. Terms are agreed in writing with the college.',
     cta:'Email a campus brief',mail:{subject:'Campus partnership with RoamWise',body:'Hi RoamWise team,\n\nWe would like to explore a campus partnership.\n\nCollege / club:\nCity:\nEvent or programme and dates:\nApproximate student reach:\nContact person and role:\n'},more:{href:'/nmims/',label:'See the NMIMS proposal'}},
    {id:'business',ico:'🏪',name:'Cafe, shop or restaurant',
     match:['Your town and what you sell','New opening or established place','Local creators near you first','What you can offer in exchange for content'],
     ready:['Business name and town','What you can offer a creator','Instagram or Maps link'],
     next:'Tell us what you offer and meet local creators near you first.',
     cta:'Get matched with creators',href:'/local-business/?src=home-business'}
  ];
  var CSS='#rwPartnerHub{margin:26px 14px 8px;max-width:760px;box-sizing:border-box;color:#F2EFE6}@media(min-width:800px){#rwPartnerHub{margin-left:auto;margin-right:auto}}'
   +'#rwPartnerHub .ph-eb{display:inline-flex;align-items:center;gap:8px;font-size:11px;letter-spacing:.14em;font-weight:700;color:#e8ba6c;margin:0 0 6px}'
   +'#rwPartnerHub h2{font:800 24px/1.15 Georgia,serif;margin:0 0 6px;color:#FFE0AE}#rwPartnerHub h2 em{font-style:italic;color:#e8ba6c}'
   +'#rwPartnerHub .ph-sub{margin:0 0 14px;font-size:13.5px;line-height:1.5;opacity:.85}'
   +'#rwPartnerHub .ph-ins{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 14px;padding:0;list-style:none}'
   +'#rwPartnerHub .ph-ins li{flex:1 1 96px;min-width:0;padding:9px 10px;border-radius:14px;border:1px solid rgba(232,186,108,.3);background:rgba(232,186,108,.07)}'
   +'#rwPartnerHub .ph-ins b{display:block;font:800 22px/1.1 Georgia,serif;color:#e8ba6c}#rwPartnerHub .ph-ins span{font-size:11.5px;opacity:.8}'
   +'#rwPartnerHub .ph-tabs{display:flex;gap:8px;overflow-x:auto;margin:0 -14px 12px;padding:2px 14px 6px;scrollbar-width:none;scroll-snap-type:x proximity}#rwPartnerHub .ph-tabs::-webkit-scrollbar{display:none}'
   +'#rwPartnerHub .ph-t{flex:none;scroll-snap-align:start;min-height:44px;padding:8px 14px;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.05);color:#F2EFE6;font:600 13px system-ui,sans-serif;cursor:pointer;white-space:nowrap;transition:background .2s,border-color .2s,transform .2s}'
   +'#rwPartnerHub .ph-t:hover{border-color:rgba(232,186,108,.6)}#rwPartnerHub .ph-t:active{transform:scale(.97)}'
   +'#rwPartnerHub .ph-t[aria-selected=true]{background:#e8ba6c;color:#1a1208;border-color:#e8ba6c}'
   +'#rwPartnerHub .ph-t:focus-visible,#rwPartnerHub .ph-go:focus-visible,#rwPartnerHub .ph-more:focus-visible{outline:2px solid #FFE0AE;outline-offset:2px}'
   +'#rwPartnerHub .ph-p{padding:16px;border-radius:20px;border:1px solid rgba(232,186,108,.35);background:radial-gradient(120% 90% at 0% 0%,rgba(232,186,108,.12),transparent 55%),linear-gradient(160deg,#1b1226,#0f0a18);box-shadow:0 14px 30px -18px rgba(0,0,0,.8)}'
   +'#rwPartnerHub .ph-p[hidden]{display:none}'
   +'#rwPartnerHub .ph-cols{display:grid;grid-template-columns:minmax(0,1fr);gap:14px}@media(min-width:640px){#rwPartnerHub .ph-cols{grid-template-columns:repeat(2,minmax(0,1fr))}}'
   +'#rwPartnerHub .ph-k{font-size:10.5px;letter-spacing:.14em;font-weight:800;color:#e8ba6c;margin:0 0 6px;text-transform:uppercase}'
   +'#rwPartnerHub ul.ph-l{margin:0;padding:0 0 0 18px;font-size:13px;line-height:1.55}#rwPartnerHub ul.ph-l li{margin:0 0 3px}'
   +'#rwPartnerHub .ph-nx{margin:14px 0 12px;font-size:13.5px;line-height:1.5}'
   +'#rwPartnerHub .ph-acts{display:flex;flex-wrap:wrap;gap:10px;align-items:center}'
   +'#rwPartnerHub .ph-go{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:0 20px;border-radius:14px;background:linear-gradient(135deg,#f0c77d,#e8ba6c);color:#1a1208;font:800 14px system-ui,sans-serif;text-decoration:none;box-shadow:0 8px 20px -10px rgba(232,186,108,.7);transition:transform .2s}'
   +'#rwPartnerHub .ph-go:active{transform:scale(.97)}'
   +'#rwPartnerHub .ph-more{font-size:13px;color:#e8ba6c;font-weight:700}'
   +'#rwPartnerHub .ph-fine{margin:12px 0 0;font-size:11.5px;line-height:1.5;opacity:.65}'
   +'#rwPartnerHub .ph-nojs{font-size:13px;line-height:1.9}#rwPartnerHub .ph-nojs a{color:#e8ba6c}'
   +'#rwPartnerHub .ph-q{margin:14px 0 0}#rwPartnerHub .ph-q label{display:block;font-size:12.5px;font-weight:700;color:#FFE0AE;margin:0 0 6px}#rwPartnerHub .ph-qr{display:flex;gap:8px;flex-wrap:wrap}#rwPartnerHub .ph-qr input{flex:1 1 140px;min-width:0;min-height:46px;box-sizing:border-box;padding:0 14px;border-radius:12px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.06);color:#F2EFE6;font:500 14px system-ui,sans-serif}#rwPartnerHub .ph-qr button{border:0;cursor:pointer}'
   +'#rwPartnerHub .ph-m{margin:10px 0 0;padding:10px 12px;border-radius:14px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1)}#rwPartnerHub .ph-m b{display:block;font-size:14px}#rwPartnerHub .ph-m small{display:block;font-size:11.5px;opacity:.7;margin-bottom:4px}#rwPartnerHub .ph-none{font-size:13px;line-height:1.5;margin:10px 0 0}'
   +'@media(prefers-reduced-motion:reduce){#rwPartnerHub *{transition:none!important}}';

  function el(tag,cls,html){var n=document.createElement(tag);if(cls)n.className=cls;if(html!=null)n.innerHTML=html;return n;}
  function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function list(a){return '<ul class="ph-l">'+a.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul>';}

  // Public-data counts. Returns only what was actually read.
  function readStays(){
    try{
      var a=window.RW_PARTNERS;
      if(!Array.isArray(a)||!a.length)return null;
      var nomad=a.filter(function(p){return p&&p.nomad&&p.nomad.enabled;}).length;
      return {total:a.length,nomad:nomad};
    }catch(_){return null;}
  }
  function readArtists(){
    return fetch('/creators/artists-data.json',{cache:'no-cache'}).then(function(r){return r.ok?r.json():null;})
      .then(function(d){return d&&Array.isArray(d.artists)?d.artists.length:null;}).catch(function(){return null;});
  }

  function mailHref(m){return 'mailto:'+MAIL+'?subject='+encodeURIComponent(m.subject)+'&body='+encodeURIComponent(m.body);}

  function renderPanel(panel,role){
    var act=role.mail?'<a class="ph-go" href="'+esc(mailHref(role.mail))+'">'+esc(role.cta)+'</a>':'<a class="ph-go" href="'+esc(role.href)+'">'+esc(role.cta)+' &rarr;</a>';
    var feat='<a class="ph-more" href="/feature/">Get featured from \u20B9500</a>';
    var more=role.more?'<a class="ph-more" href="'+esc(role.more.href)+'">'+esc(role.more.label)+'</a>':'';
    panel.innerHTML='<div class="ph-cols"><div><p class="ph-k">What the match is based on</p>'+list(role.match)+'</div><div><p class="ph-k">Have ready</p>'+list(role.ready)+'</div></div>'
      +(role.eng?'<form class="ph-q" novalidate><label for="phTown">Try the match engine: which town?</label><div class="ph-qr"><input id="phTown" maxlength="40" placeholder="e.g. Almora" autocomplete="off"><button type="submit" class="ph-go">Show my matches</button></div><div class="ph-res" aria-live="polite"></div></form>':'')
      +'<p class="ph-nx">'+esc(role.next)+'</p><div class="ph-acts">'+act+more+feat+'</div>'
      +'<p class="ph-fine">Matches are suggestions, not promises. Both sides approve the terms, and money is never moved automatically. Your details are used only to find you a match.</p>';
    var f=panel.querySelector('.ph-q');if(f)f.addEventListener('submit',function(e){e.preventDefault();runMatch(role,f.querySelector('input').value.trim(),f.querySelector('.ph-res'));});
  }

  function runMatch(role,town,out){
    var stays=(window.RW_PARTNERS||[]).filter(function(p){return typeof window.rwStayPublicEligible==='function'?window.rwStayPublicEligible(p):true;});
    out.textContent='Matching\u2026';
    import('/creators/partner-match-core.mjs').then(function(m){
      var r=m.matchStays(role.eng,{town:town},stays,3);
      if(!r.length){out.innerHTML='<p class="ph-none">No strong match yet'+(town?' in '+esc(town):'')+'. We would rather say so than force one. Join and we will match you as stays and partners are added.</p>';return;}
      out.innerHTML=r.map(function(x){return '<div class="ph-m"><b>'+esc(x.name)+'</b><small>'+esc(x.town)+' &middot; '+x.score+'/100 fit signals</small><ul class="ph-l">'+x.reasons.slice(0,3).map(function(y){return '<li>'+esc(y)+'</li>';}).join('')+'</ul></div>';}).join('')+'<p class="ph-fine">Fit signals come from each listing\u2019s public details. They are not a prediction of sales or enquiries. Both sides approve before anything is agreed.</p>';
    }).catch(function(){out.textContent='The match tool could not load. Please try again.';});
  }
  function build(host){
    var s=el('style');s.textContent=CSS;document.head.appendChild(s);
    host.innerHTML='<span class="ph-eb">PARTNER WITH ROAMWISE</span><h2>Find your <em>right match</em></h2>'
      +'<p class="ph-sub">Pick who you are. See what we match on and take the one next step. Direct partnerships, no middlemen.</p>'
      +'<ul class="ph-ins" id="phIns" aria-label="Network at a glance" hidden></ul>'
      +'<div class="ph-tabs" role="tablist" aria-label="Choose who you are"></div><div class="ph-p" id="phPanel" role="tabpanel" aria-live="polite"></div>';
    var tabs=host.querySelector('.ph-tabs'),panel=host.querySelector('#phPanel');
    function pick(id,focus){
      var role=ROLES.filter(function(r){return r.id===id;})[0]||ROLES[0];
      [].forEach.call(tabs.children,function(b){var on=b.dataset.id===role.id;b.setAttribute('aria-selected',on?'true':'false');b.tabIndex=on?0:-1;if(on&&focus)b.focus();});
      renderPanel(panel,role);
    }
    ROLES.forEach(function(r){
      var b=el('button','ph-t',r.ico+' '+esc(r.name));b.type='button';b.id='phT-'+r.id;b.dataset.id=r.id;b.setAttribute('role','tab');
      b.setAttribute('aria-controls','phPanel');b.addEventListener('click',function(){pick(r.id);});
      b.addEventListener('keydown',function(e){
        var i=ROLES.map(function(x){return x.id;}).indexOf(r.id),n=null;
        if(e.key==='ArrowRight')n=(i+1)%ROLES.length;else if(e.key==='ArrowLeft')n=(i+ROLES.length-1)%ROLES.length;
        if(n!=null){e.preventDefault();pick(ROLES[n].id,true);}
      });
      tabs.appendChild(b);
    });
    var want=(location.hash.match(/^#partner-(\w+)$/)||[])[1];
    pick(ROLES.some(function(r){return r.id===want;})?want:'creator');
    insights(host.querySelector('#phIns'));
  }

  function insights(ul){
    var items=[],stays=readStays();
    if(stays){items.push([stays.total,'stays in the directory']);if(stays.nomad)items.push([stays.nomad,'ready for long nomad stays']);}
    readArtists().then(function(n){
      if(n)items.push([n,n===1?'painting artist with a page':'painting artists with a page']);
      if(!items.length)return;
      ul.innerHTML=items.map(function(i){return '<li><b>'+esc(i[0])+'</b><span>'+esc(i[1])+'</span></li>';}).join('');
      ul.hidden=false;
    });
  }

  function init(){
    var host=document.getElementById('rwPartnerHub');
    if(!host||host.dataset.ready)return;
    host.dataset.ready='1';
    build(host);
  }
  // Deferred scripts run before DOMContentLoaded; wait so partners-data.js (loaded later in the page) is ready.
  if(document.readyState==='complete')init();else{document.addEventListener('DOMContentLoaded',init);window.addEventListener('load',init);}
  window.RW_PARTNER_ROLES=ROLES;
})();
