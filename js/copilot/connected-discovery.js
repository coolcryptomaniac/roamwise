// @ts-nocheck
/* Ailon Tusk Connected Discovery
   Promote only public, founder-approved/signed RoamWise supply and published artists.
   Matching is geographic + context-sensitive, not a claim of live inventory.
   No CRM leads, private contact data, speculative prices or checkout links. */
(function(root){
  var PARTNERS=[
    {id:'p_corbett_jungle_view',name:'Corbett Jungle View Homestay',category:'stay',
     region:'lansdowne',description:'Ghildiyal Gaon near Lansdowne · founder-introduced · enquiry only',
     href:'/stays/lansdowne/',image:'/assets/property-photos/corbett-jungle-view-front.jpg',
     status:'Enquiry only · agreement pending'},
    {id:'p_woodbook_devine',name:'Woodbook The Devine Homestay',category:'stay',
     region:'himachal',description:'Treehouse and cottages near Banjar / Tirthan Valley · signed partner',
     href:'/stays/tirthan-valley/',image:'/assets/property-photos/woodbook-treehouse.webp',
     status:'Signed partner · confirm availability'},
    {id:'p_big_bro_hotel',name:'Big Bro Hotel · Almora Workation',category:'nomad',
     region:'almora',description:'Long-stay workation option · host-stated Wi-Fi and power backup',
     href:'/workation/almora/',image:'/assets/property-photos/big-bro-meal.webp',
     status:'Confirm connectivity, rates and rooms'}
  ];
  var ARTISTS=[
    {id:'natasha-guleria',name:'Natasha Guleria · Bhavitavya Kala',category:'artist',
     region:'himachal',description:'Himachal artist · paintings, commissions and Himalayan cultural art',
     href:'/creators/artists.html',image:'/assets/img/natasha/natasha-with-painting.jpg',
     status:'Published artist profile · contact directly'},
    {id:'aipan-art-rakhi',name:'Aipan Art Rakhi',category:'artist',
     region:'almora',description:'Kumaoni Aipan painting and heritage artwork · Haldwani',
     href:'/creators/aipan-art-rakhi/',image:null,
     status:'Published artist profile · contact directly'}
  ];
  var REGION_WORDS={
    lansdowne:/\b(lansdowne|lansdown|pauri|bansi|ghildiyal)\b|लैंसडाउन|पौड़ी/i,
    himachal:/\b(himachal|himanchal|manali|kullu|banjar|tirthan|jibhi|kasol|shimla|dalhousie|dharamshala|kinnaur|spiti|kalpa|chitkul)\b|हिमाचल|मनाली|कुल्लू|तीर्थन|जीभी|शिमला/i,
    almora:/\b(almora|kasar devi|binsar|ranikhet|kausani|kumaon|haldwani)\b|अल्मोड़ा|अल्मोड़ा|बिनसर|रानीखेत|कौसानी|कुमाऊँ|हल्द्वानी/i
  };
  function regionFor(text){
    var q=String(text||'');
    for(var k in REGION_WORDS)if(REGION_WORDS[k].test(q))return k;
    return '';
  }
  function intentFor(text){
    var q=String(text||'').toLowerCase();
    return {
      nomad:/\b(nomad|workation|work from|remote work|cowork|digital nomad|long stay|monthly stay)\b|वर्केशन|वर्क फ्रॉम/i.test(q),
      culture:/\b(art|artist|painting|culture|craft|handmade|heritage|local experience|workshop|creator)\b|कला|कलाकार|संस्कृति|पेंटिंग/i.test(q),
      stay:/\b(stay|hotel|homestay|room|accommodation|book|booking|where to sleep)\b|होटल|होमस्टे|कमरा|रहना/i.test(q),
      exclude:/\b(otp|password|refund|payment failed|cancel booking|emergency|sos|ambulance)\b|आपातकाल/i.test(q)
    };
  }
  function partnerEligible(id){
    var items=root && root.RW_PARTNER_SEED;
    if(!Array.isArray(items))return false; // no data => no partner claim
    var p=items.find(function(x){return x.id===id;});
    if(!p)return false;
    if(typeof root.rwStayPublicEligible==='function')return !!root.rwStayPublicEligible(p);
    return p.listingReady===true && (p.verified==='signed' ||
      (p.verified==='founder-approved' && p.enquiryOnly===true && !!p.founderApproval));
  }
  function picks(text,intents){
    var flags=intentFor(text);
    if(flags.exclude)return [];
    var region=regionFor((intents&&intents.dest||'')+' '+text);
    if(!region)return [];
    var includePartner=flags.stay||flags.nomad||(!flags.culture);
    var includeArtists=flags.culture||!flags.stay;
    var out=[];
    PARTNERS.forEach(function(p){
      if(p.region!==region||!includePartner||!partnerEligible(p.id))return;
      if(p.category==='nomad' && !flags.nomad && !flags.stay)return;
      out.push(p);
    });
    ARTISTS.forEach(function(p){
      if(p.region===region&&includeArtists)out.push(p);
    });
    /* Public creator matching entry, never a claim that a particular creator is contracted. */
    if(/\b(creator|creators|influencer|vlogger|content collaboration)\b|क्रिएटर/i.test(String(text||''))){
      out.push({id:'creator-network',name:'RoamWise Creator Network',category:'creator',
        region:region,description:'Meet local creators and propose collaborations with stays and artists',
        href:'/creators/match.html',image:null,status:'Explore collaborations · both sides approve terms'});
    }
    // For broad Himachal queries, show local art first; for explicitly lodging requests stays first.
    if(region==='himachal'&&!flags.stay)out.sort(function(a,b){return a.category==='artist'?-1:b.category==='artist'?1:0;});
    return out.slice(0,3).map(function(p){return Object.assign({},p);});
  }
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function html(text,intents){
    var list=picks(text,intents);
    if(!list.length)return '';
    return '<section class="rw-connected" aria-label="Local RoamWise discoveries"><h3>✦ Discover more with RoamWise</h3>'
      +'<p class="rw-connected-note">Related local listings · availability and collaborations require confirmation</p><div class="rw-connected-grid">'
      +list.map(function(p){
        return '<a class="rw-connected-item" href="'+esc(p.href)+'">'
          +(p.image?'<img src="'+esc(p.image)+'" alt="" loading="lazy" width="180" height="120">':'')
          +'<span class="rw-connected-detail"><b>'+esc(p.name)+'</b><small>'+esc(p.description)+'</small>'
          +'<em>'+esc(p.status)+'</em></span></a>';
      }).join('')+'</div></section>';
  }
  function renderInto(node,text,intents){
    if(!node||typeof document==='undefined')return 0;
    var items=picks(text,intents);
    if(!items.length)return 0;
    var section=document.createElement('section');section.className='rw-connected rw-connected-studio';
    section.setAttribute('aria-label','Related RoamWise local discoveries');
    var heading=document.createElement('h3');heading.textContent='✦ Local connections';section.appendChild(heading);
    items.forEach(function(p){
      var link=document.createElement('a');link.className='rw-connected-item';link.href=p.href;
      if(p.image){var img=document.createElement('img');img.src=p.image;img.alt='';img.loading='lazy';link.appendChild(img);}
      var content=document.createElement('span');content.className='rw-connected-detail';
      var title=document.createElement('b');title.textContent=p.name;content.appendChild(title);
      var desc=document.createElement('small');desc.textContent=p.description;content.appendChild(desc);
      var status=document.createElement('em');status.textContent=p.status;content.appendChild(status);
      link.appendChild(content);section.appendChild(link);
    });
    node.appendChild(section);return items.length;
  }
  var api={regionFor:regionFor,intentFor:intentFor,picks:picks,html:html,renderInto:renderInto};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.RWConnectedDiscovery=api;
})(typeof window!=='undefined'?window:null);
