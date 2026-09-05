// @ts-nocheck
/* Moved verbatim from app.js (Phase 5b modularization). See js/itinerary/CLAUDE-CODE-MERGE-NOTES.md-style
   convention: this file is loaded via a classic <script> tag before app.js in index.html,
   so its functions/vars are plain globals other files (including app.js) already call. */

/* ---- from app.js lines 2810-3026: adaptive "for you" rendering (useBump, FORYOU_DEFS, renderForYou) + shared card photo painter (RW_PHOTOS, rwLoadPhotoMap, rwPaintPhotos) ---- */
/* ===== ADAPTIVE "FOR YOU" (usage-aware UI) ===== */
function useBump(k){ try{ var u=JSON.parse(lsGet('rw_use')||'{}'); u[k]=(u[k]||0)+1; lsSet('rw_use',JSON.stringify(u)); }catch(e){ /* parse best-effort, ignore malformed/missing data */ } }
var FORYOU_DEFS={copilot:['\ud83e\udded Copilot',function(){cpFocusHero();}],map:['\ud83d\uddfa\ufe0f Map',function(){openMapExplorer();}],group:['\ud83e\udd1d Group',function(){openGroupPlanner();}],trips:['\u2708\ufe0f Trips',function(){openVault();}],plan:['\ud83e\udded Plan',function(){tabGo('plan');}],treks:['\u26f0 Treks',function(){tabGo('explore');scrollToId('treks');}],card:['\ud83d\uddfa Card',function(){tabGo('explore');scrollToId('jlog');}],events:['\ud83c\udfdf Events',function(){tabGo('explore');scrollToId('events');}],store:['\ud83d\udecd Store',function(){tabGo('home');scrollToId('store');}],pdf:['\ud83d\udcd5 PDF',function(){tabGo('plan');}],search:['\ud83d\udd0d Search',function(){ssOpen();}],profile:['\ud83d\udc64 Profile',function(){openProfile();}]};
function renderForYou(){
  var host=el('brief'); if(!host) return;
  var u={}; try{u=JSON.parse(lsGet('rw_use')||'{}');}catch(e){ /* parse best-effort, ignore malformed/missing data */ }
  var keys=Object.keys(FORYOU_DEFS).sort(function(a,b){return (u[b]||0)-(u[a]||0);});
  var wrap=document.createElement('div');
  var tiles=keys.map(function(k){
    var d2=FORYOU_DEFS[k], parts=d2[0].split(' ');
    return '<div class="ftile" onclick="useBump(\''+k+'\');FORYOU_DEFS[\''+k+'\'][1]()"><span class="fi">'+parts[0]+'</span><span class="fl">'+parts.slice(1).join(' ')+'</span></div>';
  }).join('');
  wrap.innerHTML='<div class="rowhead"><b>Quick start</b><a onclick="ssOpen()">Search \u2192</a></div><div class="ftrow">'+tiles+'</div>';
  host.insertBefore(wrap, host.firstChild);
  /* Popular now — image-first media row from the destination DB */
  try{
    var live=activeEvents(), evCity=live.length? live[0].city:null;
    var curM=new Date().getMonth();
    var isClosedNow=function(d){ return d.closedM && d.closedM.indexOf(curM+1)>-1; };
    var seedH=function(str){var x=0;for(var i=0;i<str.length;i++)x=(x*31+str.charCodeAt(i))>>>0;return (x+new Date().getDate())%97;};
    /* Month-aware: in-season (bestM) first, LIVE-event city pinned, daily-shuffled —
       genuinely different by season AND by day, and it scales as DB grows. */
    var pool=(typeof DB!=='undefined'? DB:[]).slice()
      .filter(function(d){ return !isClosedNow(d); });
    pool.sort(function(a,b){
      var ea=(evCity===a.name)?-200:0, eb=(evCity===b.name)?-200:0;
      var sa=((a.bestM||[]).indexOf(curM+1)>-1)?-100:0, sb=((b.bestM||[]).indexOf(curM+1)>-1)?-100:0;
      return (ea+sa+seedH(a.name))-(eb+sb+seedH(b.name)); });
    /* "In season" and "Easy visa" are specialty rows that starve fast if generic
       rows (Popular-now, Low-crowd) get first pick of the shared pool \u2014 so they
       claim their up-to-10 picks from the FULL pool first, and everything else
       becomes filler for the generic rows via the shared `used` map. */
    var EASY_VISA_TYPES={'visa free':1,'free e-visa':1,'free visa on arrival':1,'eta':1,'eta online':1,'nzeta':1,'tourist card fmm':1};
    function isEasyVisaFor(d){
      if(!d || d.country==='India' || !d.visa || d.visa.type==='None') return false;
      var t=(d.visa.type||'').toLowerCase();
      if(EASY_VISA_TYPES[t]) return true;
      /* A plain "E-Visa"/"E-Visa Required" usually means a multi-day document-
         upload process (Vietnam, Japan) \u2014 not low-friction. The one exception
         is a country whose own visa note confirms genuinely instant/same-day
         approval (Turkey's e-Visa is instant online). */
      if(t==='e-visa' && /instant/i.test(d.visa.note||'')) return true;
      return false;
    }
    var used={};
    var inSeason=pool.filter(function(d){ return (d.bestM||[]).indexOf(curM+1)>-1; }).slice(0,10)
      .map(function(d){ d._tag='\ud83c\udf1e'; used[d.name]=1; return d; });
    var visaEasy=pool.filter(function(d){ return isEasyVisaFor(d) && !used[d.name]; }).slice(0,10)
      .map(function(d){ d._tag='\ud83d\udec2'; used[d.name]=1; return d; });
    var picks=pool.filter(function(d){ return !used[d.name]; }).slice(0,10);
    picks.forEach(function(d){ used[d.name]=1; });
    var EMO={beach:'\ud83c\udfd6\ufe0f',metro:'\ud83c\udf06',sacred:'\ud83d\uded5',tech:'\ud83c\udf03',peak:'\ud83c\udfd4\ufe0f',classic:'\ud83e\udded'};
    var row=document.createElement('div');
    row.innerHTML='<div class="rowhead"><b>Popular now</b><a onclick="tabGo(\'explore\')">All \u2192</a></div><div class="prow">'
      + picks.map(function(d2){
          var th=themeFor(d2), a2=th.acc, dp2=th.deep, k2=th.key;
          var badge = (evCity===d2.name)? '<span class="pb">LIVE</span>' : '';
          return '<div class="pcard" style="background:linear-gradient(160deg, rgb('+a2[0]+','+a2[1]+','+a2[2]+') 0%, rgb('+dp2[0]+','+dp2[1]+','+dp2[2]+') 85%)" onclick="el(\'destInput\').value=\''+d2.name.replace(/'/g,'')+'\';tabGo(\'plan\');runSearch()">'
            + badge + '<span class="pe">'+(EMO[k2]||EMO.classic)+'</span><span class="pn">'+d2.name+'</span></div>';
        }).join('') + '</div>';
    row.className='v v-home';
    var bb=el('promoTop');
    if(bb && bb.parentNode) bb.parentNode.insertBefore(row, bb.nextSibling);
    /* --- three more dynamic rows, below the copilot hero --- */
    try{
      var MOx=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      function miniRow(title, list){
        if(!list.length) return null;
        var r=document.createElement('div'); r.className='v v-home';
        r.innerHTML='<div class="rowhead"><b>'+title+'</b></div><div class="prow">'
          + list.map(function(d3){
              var t3=themeFor(d3), a3=t3.acc, dp3=t3.deep;
              return '<div class="pcard" style="background:linear-gradient(160deg, rgb('+a3[0]+','+a3[1]+','+a3[2]+') 0%, rgb('+dp3[0]+','+dp3[1]+','+dp3[2]+') 85%)" onclick="cpGoPlan(\''+d3.name.replace(/'/g,'')+'\')">'
                +'<span class="pe">'+(d3._tag||'')+'</span><span class="pn">'+d3.name+'</span></div>';
            }).join('')+'</div>';
        setTimeout(function(){ rwPaintPhotos(r, list); }, 900); /* stagger behind Popular-now's queue */
        return r;
      }
      /* inSeason and visaEasy were already carved out of the full pool above,
         before Popular-now/picks ran \u2014 this row only needs the leftover-based
         Low-crowd list; used{} already reflects inSeason+visaEasy+picks. */
      var lowCrowd=pool.filter(function(d){ return d.crowd && !used[d.name] && !isClosedNow(d); })
        .sort(function(a,b){ return a.crowd[curM]-b.crowd[curM]; }).slice(0,10)
        .map(function(d){ d._tag=d.crowd[curM]+'%'; used[d.name]=1; return d; });
      var hero=el('copilotHero'), after=hero;
      [miniRow('\ud83c\udf1e In season \u2014 '+MOx[curM], inSeason),
       miniRow('\ud83e\udd2b Low-crowd escapes this month', lowCrowd),
       miniRow('\ud83d\udec2 Easy visa for Indians', visaEasy)].forEach(function(r){
        if(r && after && after.parentNode){ after.parentNode.insertBefore(r, after.nextSibling); after=r; }
      });
    }catch(e){ /* best-effort, ignore */ }
    /* real photos over the gradients — SEQUENTIAL queue (weserv rate-limit safe) */
    rwPaintPhotos(row, picks);
    var cards=row.querySelectorAll('.pcard');
    function proxOf(u){ return 'https://images.weserv.nl/?w=300&h=500&fit=cover&q=78&output=jpg&url='+encodeURIComponent(String(u).replace(/\/thumb\/([0-9a-f]\/[0-9a-f]{2}\/[^\/]+)\/\d+px-[^\/]+$/,'/$1').replace(/^https?:\/\//,'')); }
    function paintCard(ci,prox){ if(!cards[ci]) return; cards[ci].style.background='url('+prox+')'; var pe=cards[ci].querySelector('.pe'); if(pe) pe.style.display='none'; }
    function loadOne(u,ci){ return new Promise(function(res){
      var prox=proxOf(u), im=new Image(), tries=0;
      im.onload=function(){ if(im.naturalWidth>10){ paintCard(ci,prox); res(true); } else res(false); };
      im.onerror=function(){ if(tries++<2){ setTimeout(function(){ im.src=prox+'&_='+Date.now(); }, 1100*tries); } else res(false); };
      im.src=prox;
    }); }
    function findURL(d3){
      var key='rw_pimg_'+d3.name.toLowerCase().replace(/[^a-z0-9]/g,'');
      var cached=lsGet(key); if(cached) return Promise.resolve({key:key,u:cached});
      var seen=null;
      function grab(q){ if(seen) return Promise.resolve(); return wikiAny(q,q).then(function(u){ if(u&&/wikimedia|wikipedia/.test(u)&&!seen) seen=u; }); }
      return grab(d3.name).then(function(){ return grab(d3.name+' '+(d3.country||'')); })
        .then(function(){ return grab((d3.photos&&d3.photos[0])||d3.name); })
        .then(function(){ return {key:key,u:seen}; });
    }
    /* photo painting handled by rwPaintPhotos(row, picks) above */
    }catch(e){ /* storage best-effort, ignore */ }
}

/* ===== SHARED CARD PHOTO PAINTER =====
   Same Wikimedia -> weserv pipeline the Popular-now row uses, extracted so every
   carousel (In season / Low-crowd / Easy visa) gets real photos too. Sequential
   with backoff to stay inside weserv's rate limit; caches the resolved URL per
   destination so repeat visits paint instantly. */
/* Destination photos are RESOLVED AT BUILD TIME into destination-photos.json
   (generated by agent/photo-refresh.js and verified to load through the image
   proxy). Runtime API lookups were the reason cards showed flat gradients on
   real devices: Wikipedia rate-limits a burst of requests at page load, and
   several destinations are disambiguation pages with no image at all. Shipping
   the resolved URLs means the common case needs zero network round-trips. */
var RW_PHOTOS = null;
function rwLoadPhotoMap(){
  if(RW_PHOTOS) return Promise.resolve(RW_PHOTOS);
  /* Loaded by <script src="destination-photos.js"> — see that file for why it
     is not fetched as JSON. */
  RW_PHOTOS = window.RW_PHOTOS_DATA || {};
  return Promise.resolve(RW_PHOTOS);
}
function rwPaintPhotos(rowEl, list){
  if(!rowEl || !list || !list.length) return;
  var cards = rowEl.querySelectorAll('.pcard');
  /* The weserv proxy was 404-ing on Wikimedia thumbnail paths (their %-encoded
     filenames don't survive proxying). Wikimedia URLs load DIRECTLY in the
     browser with proper CORS, so we skip the proxy entirely — faster and it
     actually works. Resolved URL is cached per destination. */
  function paint(ci,url){
    if(!cards[ci]) return;
    cards[ci].style.background='linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,.55)), url('+url+')';
    cards[ci].style.backgroundSize='cover';
    cards[ci].style.backgroundPosition='center';
    var pe=cards[ci].querySelector('.pe'); if(pe) pe.style.textShadow='0 2px 12px rgba(0,0,0,.9)';
    var pn=cards[ci].querySelector('.pn'); if(pn) pn.style.textShadow='0 2px 12px rgba(0,0,0,.95)';
  }
  function proxied(url){
    if(/images\.weserv\.nl/.test(url)) return url;  /* already a proxy URL */
    /* Wikimedia serves these to servers but rejects the browser's hotlink
       request; the weserv image proxy fetches server-side and re-serves with
       open CORS. The critical detail my first attempt got wrong: the ENTIRE
       source URL must be percent-encoded (encodeURIComponent), otherwise the
       %-sequences already in Wikimedia filenames corrupt the proxy request. */
    return 'https://images.weserv.nl/?url='+encodeURIComponent(url)+'&w=340&h=460&fit=cover&output=jpg&q=80';
  }
  function loadInto(url, ci){
    return new Promise(function(res){
      var prox=proxied(url), im=new Image();
      im.onload=function(){ if(im.naturalWidth>10){ paint(ci,prox); res(true); } else res(false); };
      im.onerror=function(){
        /* proxy failed — last resort, try the raw URL directly */
        var im2=new Image();
        im2.onload=function(){ if(im2.naturalWidth>10){ paint(ci,url); res(true); } else res(false); };
        im2.onerror=function(){ res(false); };
        im2.src=url;
      };
      im.src=prox;
    });
  }
  function findURL(d, attempt){
    var key='rw_pimg_'+d.name.toLowerCase().replace(/[^a-z0-9]/g,'');
    if(RW_PHOTOS && RW_PHOTOS[d.name]) return Promise.resolve(RW_PHOTOS[d.name]);
    var cached=lsGet(key);
    if(cached) return Promise.resolve(cached);
    /* Some destinations have no Wikipedia lead image under their bare name
       (small towns especially). Widen the net before giving up, otherwise those
       cards stay as flat gradients forever. */
    /* NOTE: do NOT treat cached==='' as a hard no here. At page load a burst of
       wikiAny calls gets rate-limited by Wikipedia's REST API and returns null,
       which previously got cached as '' and stuck forever. Retry a couple of
       times with backoff before giving up. */
    attempt = attempt||0;
    var tries = [
      d.name,
      d.name+' '+(d.country||''),
      d.name+' city',
      (d.country||'')+' landmark'
    ].filter(function(x,i,a){ return x && x.trim() && a.indexOf(x)===i; });
    function tryAt(k){
      if(k>=tries.length) return Promise.resolve(null);
      return wikiAny(tries[k], tries[k]).then(function(u){ return u || tryAt(k+1); });
    }
    return tryAt(0).then(function(u){
      if(u) return u;
      if(attempt<2) return new Promise(function(r){ setTimeout(r, 700*(attempt+1)); }).then(function(){ return findURL(d, attempt+1); });
      return null;
    });
  }
  rwLoadPhotoMap().then(function(){ next(0); });
  function next(i){
    if(i>=list.length) return;
    var d=list[i], key='rw_pimg_'+d.name.toLowerCase().replace(/[^a-z0-9]/g,'');
    findURL(d).then(function(url){
      if(url){ loadInto(url,i).then(function(ok){ if(ok) lsSet(key, url); /* only cache successes */ setTimeout(function(){next(i+1);}, 350); }); }
      else {
        /* No image anywhere — give the card a readable label treatment so it
           looks designed, not broken. */
        if(cards[i]){ var pe=cards[i].querySelector('.pe'); if(pe) pe.style.opacity='.9'; }
        setTimeout(function(){ next(i+1); }, 250);
      }
    });
  }
}

/* ---- fold: crisp by default, full detail one tap away ----
   Moved from js/social/group-chat.js (final modularization pass) — this is
   a generic fold/unfold accordion helper with no chat-specific logic; it
   just happened to be defined in group-chat.js historically. Shared by
   js/copilot/rich-reply.js, js/copilot/tusk-persona.js and
   js/copilot/answer-cards.js as well as this file, hence living here with
   other shared card-rendering helpers rather than under one caller. */
function tkFold(label, inner){
  return '<div class="tk-foldwrap"><button class="tk-foldbtn" onclick="tkToggle(this)"><span>'+label+'</span><b class="tk-arr">\u25be</b></button>'
    +'<div class="tk-fold">'+inner+'</div></div>';
}
function tkToggle(btn){
  var w=btn.parentNode, f=w.querySelector('.tk-fold');
  var open=w.classList.toggle('open');
  btn.querySelector('.tk-arr').textContent = open? '\u25b4':'\u25be';
}
