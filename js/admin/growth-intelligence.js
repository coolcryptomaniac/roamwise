/* RoamWise Admin — Growth & Intelligence.
   Founder-only operating layer for distribution, retention, supply density and
   source-backed strategic intelligence. Private operating targets live inside
   the existing admin-only CRM collection; public research stays source-linked.
   "Interested" means an actual CRM response/meeting/interest signal — never a
   fit score or inferred private intent. */
(function(){
  'use strict';

  var started=false, feed=null, research=[], interest=[], moatStats={days:0,trip_saved:0,tusk_stay_handoff:0,tusk_helpful:0,tusk_unhelpful:0,visits:0,searches:0};
  var ACTUAL_INTEREST=['replied','response','meeting','interested','diligence','term','committed'];
  var PLAN_DEFAULTS={
    primaryMarket:'Kumaon / Uttarakhand',
    northStar:'Completed useful trips and verified bookings with repeat or referral signal',
    weeklyActiveTarget:0,
    verifiedPartnerTarget:0,
    completedBookingTarget:0,
    weeklyExperimentTarget:0,
    notes:''
  };

  function el(id){return document.getElementById(id)}
  function clean(v,n){return String(v==null?'':v).trim().slice(0,n||500)}
  function num(id){var node=el(id),v=Number(node&&node.value||0);return Number.isFinite(v)&&v>=0?Math.round(v):0}
  function ms(v){try{if(!v)return 0;var d=v.toDate?v.toDate():new Date(v);return d.getTime()||0}catch(e){return 0}}
  function safeUrl(v){try{var u=new URL(String(v||''),location.href);return u.protocol==='https:'?u.href:''}catch(e){return ''}}
  function fmtDate(v){var t=ms(v);if(!t)return 'date not recorded';return new Date(t).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
  function statusLabel(s){return clean(s,40).replace(/_/g,' ').replace(/\b\w/g,function(x){return x.toUpperCase()})}
  function liveUsers(){return typeof USERS!=='undefined'&&Array.isArray(USERS)?USERS:[]}
  function livePartners(){return typeof DIRECT_PARTNERS!=='undefined'&&Array.isArray(DIRECT_PARTNERS)?DIRECT_PARTNERS:[]}
  function liveReferrers(){return typeof REFERRERS_LIVE!=='undefined'&&Array.isArray(REFERRERS_LIVE)?REFERRERS_LIVE:[]}
  function liveOrders(){return typeof CASHFREE_ORDERS!=='undefined'&&Array.isArray(CASHFREE_ORDERS)?CASHFREE_ORDERS:[]}
  function liveBookings(){return typeof DIRECT_BOOKINGS!=='undefined'&&Array.isArray(DIRECT_BOOKINGS)?DIRECT_BOOKINGS:[]}

  function activeMeshCount(){
    return liveUsers().filter(function(u){
      var lic=ms(u.trailMeshLicenseUntil),trial=ms(u.trailMeshTrialUntil);
      var operator=(u.trailMeshPlan==='operator'||u.trailMeshPlan==='enterprise')&&(!lic||lic>Date.now());
      var selectedTrial=u.trailMeshTrialSelected===true&&trial>Date.now();
      return operator||selectedTrial;
    }).length;
  }

  function auditedPartnerCount(){
    return livePartners().filter(function(p){
      return p&&p.verified===true&&
        p.pricingAudit&&p.pricingAudit.status==='passed'&&
        p.qualityReview&&p.qualityReview.status==='passed'&&
        p.verification&&p.verification.overall==='verified';
    }).length;
  }

  async function loadMoatStats(){
    var refs=[],now=new Date();
    for(var i=0;i<7;i++){
      var d=new Date(now.getTime()-i*864e5),id=d.toISOString().slice(0,10);
      refs.push(db.collection('stats').doc(id).get());
    }
    try{
      var docs=await Promise.all(refs),sum={days:docs.length,trip_saved:0,tusk_stay_handoff:0,tusk_helpful:0,tusk_unhelpful:0,visits:0,searches:0};
      docs.forEach(function(d){
        var x=d.exists?d.data():{};
        Object.keys(sum).forEach(function(k){if(k!=='days')sum[k]+=Number(x[k]||0)});
      });
      moatStats=sum;
    }catch(e){
      moatStats={days:0,trip_saved:0,tusk_stay_handoff:0,tusk_helpful:0,tusk_unhelpful:0,visits:0,searches:0};
    }
    renderMoatLedger();
  }

  function renderMoatLedger(){
    var partners=livePartners(),verified=partners.filter(function(p){return p&&p.verified===true}).length,audited=auditedPartnerCount();
    var mesh=activeMeshCount(),refs=liveReferrers().filter(function(r){return r&&r.active!==false&&r.status!=='inactive'&&r.status!=='retired'}).length;
    var fb=moatStats.tusk_helpful+moatStats.tusk_unhelpful;
    var helpful=fb?Math.round(moatStats.tusk_helpful/fb*100):null;
    var completed=liveBookings().filter(function(b){return /completed|complete|fulfilled|stayed/i.test(String(b&&b.status||''))}).length;
    var set=function(id,value,note){if(el(id))el(id).textContent=value;if(note&&el(id+'Note'))el(id+'Note').textContent=note};
    set('giMoatSupply',verified+' verified',partners.length+' direct partner records');
    set('giMoatData',audited+' audited','pricing + quality + identity/property verification passed');
    set('giMoatTrips',String(moatStats.trip_saved),'7-day anonymous trip-save events; personal vault stays on device');
    set('giMoatTusk',String(moatStats.tusk_stay_handoff),'7-day Ailon Tusk → stay handoffs; not claimed as bookings');
    set('giMoatMesh',String(mesh),'active selected trials / operator entitlements');
    set('giMoatTrust',helpful==null?'—':helpful+'%',fb?fb+' Tusk feedback votes in 7 days':'no feedback votes in the last 7 days');
    set('giMoatDistribution',String(refs),'active referral / creator distribution routes');
    if(el('giMoatCompleted'))el('giMoatCompleted').textContent=String(completed);
  }

  function renderSnapshot(){
    var users=liveUsers(),partners=livePartners(),refs=liveReferrers(),orders=liveOrders(),bookings=liveBookings();
    var tracked=users.filter(function(u){return ms(u.lastActive)>0}),cutoff=Date.now()-7*864e5;
    var active7=tracked.filter(function(u){return ms(u.lastActive)>=cutoff}).length;
    var verified=partners.filter(function(p){return p&&p.verified===true}).length;
    var activeRefs=refs.filter(function(r){return r&&r.active!==false&&r.status!=='inactive'&&r.status!=='retired'}).length;
    var completed=bookings.filter(function(b){return /completed|complete|fulfilled|stayed/i.test(String(b&&b.status||''))}).length;

    if(el('giReliability'))el('giReliability').textContent=orders.length?orders.length+' review':'clear';
    if(el('giSupply'))el('giSupply').textContent=verified+'/'+partners.length;
    if(el('giRetention'))el('giRetention').textContent=tracked.length?active7+'/'+tracked.length:'—';
    if(el('giDistribution'))el('giDistribution').textContent=String(activeRefs);
    if(el('giReliabilityNote'))el('giReliabilityNote').textContent=orders.length?'Cashfree orders needing review':'No active/unfulfilled payment order in the admin queue';
    if(el('giSupplyNote'))el('giSupplyNote').textContent='verified direct partners / total';
    if(el('giRetentionNote'))el('giRetentionNote').textContent=tracked.length?'7-day active / users with activity timestamps':'activity tracking has no timestamped users yet';
    if(el('giDistributionNote'))el('giDistributionNote').textContent='active referrer / creator routes';
    if(el('giCompletedObserved'))el('giCompletedObserved').textContent=completed.toLocaleString('en-IN');
    renderMoatLedger();
  }

  function fillPlan(p){
    p=Object.assign({},PLAN_DEFAULTS,p||{});
    var map={
      giPrimaryMarket:'primaryMarket',giNorthStar:'northStar',giWeeklyActiveTarget:'weeklyActiveTarget',
      giVerifiedPartnerTarget:'verifiedPartnerTarget',giCompletedBookingTarget:'completedBookingTarget',
      giWeeklyExperimentTarget:'weeklyExperimentTarget',giPlanNotes:'notes'
    };
    Object.keys(map).forEach(function(id){var node=el(id);if(node&&document.activeElement!==node)node.value=p[map[id]]==null?'':p[map[id]]});
    if(el('giPlanState'))el('giPlanState').textContent=p.updatedAt?'Last saved '+fmtDate(p.updatedAt):'Private founder plan · not saved yet';
  }

  async function loadPlan(){
    try{
      var d=await db.collection('crm').doc('_growth_operating_plan').get();
      fillPlan(d.exists?d.data():PLAN_DEFAULTS);
    }catch(e){
      fillPlan(PLAN_DEFAULTS);
      if(el('giPlanState'))el('giPlanState').textContent='Plan could not load: '+(e.message||e);
    }
  }

  async function savePlan(){
    if(!CURRENT_ADMIN)return toast('Founder-admin sign-in required.',true);
    var payload={
      seg:'system',type:'growth_operating_plan',
      primaryMarket:clean(el('giPrimaryMarket')&&el('giPrimaryMarket').value,120),
      northStar:clean(el('giNorthStar')&&el('giNorthStar').value,240),
      weeklyActiveTarget:num('giWeeklyActiveTarget'),
      verifiedPartnerTarget:num('giVerifiedPartnerTarget'),
      completedBookingTarget:num('giCompletedBookingTarget'),
      weeklyExperimentTarget:num('giWeeklyExperimentTarget'),
      notes:clean(el('giPlanNotes')&&el('giPlanNotes').value,2500),
      updatedAt:FV.serverTimestamp(),updatedBy:CURRENT_ADMIN.uid
    };
    if(!payload.primaryMarket||!payload.northStar)return toast('Add a primary market and north-star outcome.',true);
    try{
      await db.collection('crm').doc('_growth_operating_plan').set(payload,{merge:true});
      toast('90-day growth plan saved privately.');
      await loadPlan();
    }catch(e){toast(typeof friendlyError==='function'?friendlyError(e):(e.message||'Could not save plan.'),true)}
  }

  function signalRows(){
    var rows=[];
    if(feed&&Array.isArray(feed.signals))rows=rows.concat(feed.signals);
    if(feed&&Array.isArray(feed.collaborationRoutes))rows=rows.concat(feed.collaborationRoutes.map(function(x){
      return Object.assign({category:'collaboration',publishedAt:feed.checkedAt,source:'Official programme route — recheck current terms'},x);
    }));
    return rows;
  }

  function renderSignals(){
    var host=el('growthIntelSignals');if(!host)return;
    var filter=(el('growthIntelFilter')&&el('growthIntelFilter').value)||'all';
    var rows=signalRows().filter(function(x){return filter==='all'||x.category===filter});
    if(el('growthIntelChecked'))el('growthIntelChecked').textContent=feed&&feed.checkedAt?'Source scan checked '+fmtDate(feed.checkedAt):'No completed source scan loaded';
    host.innerHTML=rows.slice(0,30).map(function(x){
      var url=safeUrl(x.url),source=clean(x.source||x.company||'source',140),cat=clean(x.category||'signal',40);
      return '<div class="row"><div class="grow"><strong>'+esc(clean(x.title||x.company||'Official signal',180))+
        ' <span class="tag '+(cat==='ai-agent'?'good':'')+'">'+esc(cat)+'</span></strong><div class="meta">'+
        esc(source)+' · '+esc(fmtDate(x.publishedAt||feed&&feed.checkedAt))+'</div></div><div class="actions">'+
        (url?'<a class="btn small" href="'+esc(url)+'" target="_blank" rel="noopener">Open source</a>':'')+'</div></div>';
    }).join('')||'<div class="empty">No source-backed signal in this filter yet.</div>';
  }

  function renderResearch(){
    var host=el('growthIntelResearch');if(!host)return;
    host.innerHTML=research.slice(0,8).map(function(x){
      var url=safeUrl(x.sourceUrl||x.contactUrl);
      return '<div class="row"><div class="grow"><strong>'+esc(clean(x.name||x.company||'Research target',120))+
        ' <span class="tag">'+esc(clean(x.category||'research',35))+'</span></strong><div class="meta">'+
        esc(clean(x.company||'',80)+(x.role?' · '+clean(x.role,120):''))+'<br>'+esc(clean(x.fit||'',220))+
        '<br><b>Research only:</b> no interest from this person is implied.</div></div><div class="actions">'+
        (url?'<a class="btn small" href="'+esc(url)+'" target="_blank" rel="noopener">Verify source</a>':'')+'</div></div>';
    }).join('')||'<div class="empty">No source-verified strategic profiles loaded.</div>';
  }

  function renderInterest(){
    var host=el('growthIntelInterest');if(!host)return;
    if(el('giInterestCount'))el('giInterestCount').textContent=String(interest.length);
    host.innerHTML=interest.map(function(x){
      var name=clean(x.name||x.firm||x.company||x.email||x.id,120),firm=clean(x.firm||x.company||'',100),status=clean(x.status||'',30);
      return '<div class="row"><div class="grow"><strong>'+esc(name)+' <span class="tag good">'+esc(statusLabel(status))+
        '</span></strong><div class="meta">'+esc(firm+(x.email?' · '+x.email:''))+
        (x.source?'<br>Source: '+esc(clean(x.source,180)):'')+
        '<br>Shown because the CRM contains an actual response/meeting/interest state.</div></div><div class="actions">'+
        '<select class="input" style="min-width:130px;max-width:155px" onchange="rwGrowthIntelSetStatus(\''+esc(x.id)+'\',this.value)">'+
        '<option value="">Update…</option><option value="replied">Replied</option><option value="meeting">Meeting</option><option value="interested">Interested</option><option value="diligence">Diligence</option><option value="term">Term</option><option value="committed">Committed</option><option value="pass">Passed</option></select>'+
        '</div></div>';
    }).join('')||'<div class="empty"><b>No recorded interest signal yet.</b><br>That is intentional: fit scores, public profiles and outreach drafts are never promoted to “interested” until a real reply, meeting or explicit signal is recorded.</div>';
  }

  async function loadIntel(){
    var errors=[];
    try{
      var res=await fetch('./opportunity-radar-weekly.json',{cache:'no-store'});
      if(!res.ok)throw new Error('signal feed HTTP '+res.status);
      feed=await res.json();
    }catch(e){feed=null;errors.push(e.message||String(e))}
    try{
      var rr=await fetch('./opportunity-radar-data.json',{cache:'no-store'});
      if(!rr.ok)throw new Error('research feed HTTP '+rr.status);
      var data=await rr.json();research=Array.isArray(data.leads)?data.leads:[];
    }catch(e){research=[];errors.push(e.message||String(e))}
    try{
      var snap=await db.collection('crm').where('status','in',ACTUAL_INTEREST).limit(100).get();
      interest=snap.docs.map(function(d){return Object.assign({id:d.id},d.data())});
      interest.sort(function(a,b){return ms(b.interestUpdatedAt||b.draftUpdatedAt||b.updatedAt||b.createdAt)-ms(a.interestUpdatedAt||a.draftUpdatedAt||a.updatedAt||a.createdAt)});
    }catch(e){interest=[];errors.push(e.message||String(e))}
    renderSignals();renderResearch();renderInterest();renderSnapshot();await loadMoatStats();
    if(el('growthIntelLoadState'))el('growthIntelLoadState').textContent=errors.length?'Some sources need review: '+errors.join(' · '):'Source-backed feeds and private CRM signals loaded.';
  }

  async function setStatus(id,status){
    if(!id||!status)return;
    if(['replied','meeting','interested','diligence','term','committed','pass'].indexOf(status)<0)return toast('Unsupported CRM status.',true);
    try{
      await db.collection('crm').doc(id).set({status:status,interestUpdatedAt:FV.serverTimestamp(),interestUpdatedBy:CURRENT_ADMIN.uid},{merge:true});
      toast('CRM status updated to '+statusLabel(status)+'.');
      await loadIntel();
    }catch(e){toast(typeof friendlyError==='function'?friendlyError(e):(e.message||'Could not update CRM.'),true)}
  }

  async function createTask(){
    var title=clean(el('giExperimentTitle')&&el('giExperimentTitle').value,140),
        detail=clean(el('giExperimentDetail')&&el('giExperimentDetail').value,3000),
        priority=clean(el('giExperimentPriority')&&el('giExperimentPriority').value,20)||'normal';
    if(!title)return toast('Add a short growth experiment title.',true);
    try{
      await db.collection('devRequests').add({
        title:'[Growth] '+title,detail:detail,priority:priority,status:'open',
        source:'growth-intelligence',createdAt:FV.serverTimestamp(),createdBy:CURRENT_ADMIN.uid
      });
      if(el('giExperimentTitle'))el('giExperimentTitle').value='';
      if(el('giExperimentDetail'))el('giExperimentDetail').value='';
      toast('Growth experiment added to the existing Dev / AI queue.');
    }catch(e){toast(typeof friendlyError==='function'?friendlyError(e):(e.message||'Could not add growth task.'),true)}
  }

  window.rwGrowthIntelStart=async function(){
    renderSnapshot();
    renderMoatLedger();
    if(started){await loadIntel();return}
    started=true;
    await Promise.all([loadPlan(),loadIntel()]);
  };
  window.rwGrowthIntelRefresh=loadIntel;
  window.rwGrowthIntelSavePlan=savePlan;
  window.rwGrowthIntelCreateTask=createTask;
  window.rwGrowthIntelSetStatus=setStatus;
  window.rwGrowthIntelRenderSnapshot=renderSnapshot;
})();
