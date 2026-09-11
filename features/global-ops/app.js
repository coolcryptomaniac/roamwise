(function () {
  'use strict';
  var CFG={apiKey:'AIzaSyBTfmJvHTmp0mNQqsIhWEwnLLwFKz0ExYQ',authDomain:'roamwisepro.firebaseapp.com',projectId:'roamwisepro',storageBucket:'roamwisepro.firebasestorage.app',messagingSenderId:'1039880917656',appId:'1:1039880917656:web:8b3e18e8a4b1c9f8e2c0d1'};
  if(!firebase.apps.length)firebase.initializeApp(CFG);
  var auth=firebase.auth(),state={items:[],settings:{},metrics:{},filter:'all'},$=function(s){return document.querySelector(s)};
  var apiBase=function(){return String(window.RW_CONFIG&&window.RW_CONFIG.globalOpsUrl||'').replace(/\/+$/,'')};
  var esc=function(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
  var money=function(minor){return'₹'+Math.round(Number(minor||0)/100).toLocaleString('en-IN')};
  var rupees=function(id){return Math.max(0,Math.round(Number($(id).value||0)))};
  function note(root,text,bad){$(root).innerHTML='<div class="message'+(bad?' bad':'')+'">'+esc(text)+'</div>'}
  async function call(path,options){
    if(!apiBase())throw Error('Global Operations worker is not activated yet.');
    var user=auth.currentUser;if(!user)throw Error('Sign in first');
    var token=await user.getIdToken(),init=Object.assign({method:'GET'},options||{});
    init.headers=Object.assign({authorization:'Bearer '+token,'content-type':'application/json','x-idempotency-key':crypto.randomUUID()},init.headers||{});
    var response=await fetch(apiBase()+path,init),result=await response.json().catch(function(){return{}});
    if(!response.ok)throw Error(result.error||'Global Operations request failed');
    return result;
  }
  function setSettings(){
    var s=state.settings||{};
    $('#gsHeadcount').value=s.core_headcount||0;$('#gsCap').value=s.headcount_cap||20;$('#gsContractors').value=s.contractor_count||0;$('#gsAssets').value=s.owned_asset_count||0;$('#gsWorkflows').value=s.recurring_workflow_count||0;$('#gsBudget').value=Math.round(Number(s.monthly_tool_budget_minor||0)/100);
  }
  function paintKpis(){
    var m=state.metrics||{},rows=[
      [m.coreHeadcount+' / '+m.headcountCap,'core team'],
      [m.ownedAssetCount||0,'owned assets'],
      [(m.automationCoveragePct||0)+'%','workflow coverage'],
      [m.openSupport||0,'open support'],
      [m.humanApprovalQueue||0,'human approvals'],
      [m.overdueCompliance||0,'overdue compliance']
    ];
    $('#goKpis').innerHTML=rows.map(function(r){return'<div class="kpi"><b>'+esc(r[0])+'</b><span>'+esc(r[1])+'</span></div>'}).join('');
    $('#goHealth').textContent=m.healthy?'GUARDRAILS HEALTHY':'REVIEW EXCEPTIONS';
    $('#goHealth').className='health '+(m.healthy?'good':'bad');
  }
  function itemCost(item){return Number(item.monthly_cost_minor||0)?' · '+money(item.monthly_cost_minor)+'/mo':''}
  function paintItems(){
    var rows=state.filter==='all'?state.items:state.items.filter(function(item){return item.type===state.filter}),root=$('#goItems');
    if(!rows.length){root.innerHTML='<div class="empty">No '+esc(state.filter==='all'?'operations':state.filter)+' records yet.</div>';return}
    root.innerHTML=rows.map(function(item){
      var gate=item.human_gate?'<span class="tag">HUMAN GATE</span>':'';
      return'<article class="item" data-id="'+esc(item.id)+'"><div class="item-top"><span class="tag '+esc(item.status)+'">'+esc(item.type.toUpperCase())+' · '+esc(item.status.toUpperCase())+'</span><span class="tag '+esc(item.priority)+'">'+esc(item.priority.toUpperCase())+'</span></div><h3>'+esc(item.name)+'</h3><p>'+esc(item.detail||'No detail added.')+'</p><div class="meta">'+esc([item.provider,item.owner,item.region].filter(Boolean).join(' · '))+itemCost(item)+'</div><div class="meta">'+gate+(item.due_at?' Due '+esc(item.due_at):'')+'</div><div class="item-actions">'+(item.status!=='active'?'<button data-status="active">Activate</button>':'')+(item.status!=='resolved'?'<button data-status="resolved">Resolve</button>':'')+(item.status!=='blocked'?'<button data-status="blocked">Block</button>':'')+'</div></article>'
    }).join('');
    root.querySelectorAll('[data-status]').forEach(function(button){button.onclick=function(){quickStatus(button.closest('[data-id]').dataset.id,button.dataset.status)}})
  }
  function render(){setSettings();paintKpis();paintItems()}
  async function load(){
    if(!apiBase()){
      $('#goMode').innerHTML='<b>Provider-onboarding mode.</b> The researched architecture is visible, but operational writes, scheduled sweeps and support routing stay disabled until the Worker URL is configured.';
      state.settings={headcount_cap:20};state.metrics={coreHeadcount:0,headcountCap:20,ownedAssetCount:0,automationCoveragePct:0,openSupport:0,humanApprovalQueue:0,overdueCompliance:0,healthy:false};state.items=[];return render()
    }
    $('#goMode').textContent='Connecting to the protected operations service…';
    try{var data=await call('/v1/global-ops/dashboard');state.settings=data.settings||{};state.items=data.items||[];state.metrics=data.metrics||{};$('#goMode').innerHTML='<b>Live control plane.</b> Scheduled scans and queue delivery use server-owned state; the browser cannot self-approve admin access.';render()}
    catch(error){note('#goMode',error.message,true)}
  }
  async function saveSettings(event){
    event.preventDefault();
    try{var result=await call('/v1/global-ops/settings',{method:'PUT',body:JSON.stringify({coreHeadcount:rupees('#gsHeadcount'),headcountCap:rupees('#gsCap'),contractorCount:rupees('#gsContractors'),ownedAssetCount:rupees('#gsAssets'),recurringWorkflowCount:rupees('#gsWorkflows'),monthlyToolBudgetMinor:rupees('#gsBudget')*100})});note('#gsMsg','Operating limits saved.');await load()}
    catch(error){note('#gsMsg',error.message,true)}
  }
  function itemPayload(){
    return{type:$('#giType').value,name:$('#giName').value,provider:$('#giProvider').value,owner:$('#giOwner').value,region:$('#giRegion').value,status:$('#giStatus').value,priority:$('#giPriority').value,dueAt:$('#giDue').value?new Date($('#giDue').value).toISOString():'',monthlyCostMinor:rupees('#giCost')*100,evidenceUrl:$('#giEvidence').value,detail:$('#giDetail').value,humanGate:$('#giHuman').checked}
  }
  async function addItem(event){
    event.preventDefault();try{await call('/v1/global-ops/items',{method:'POST',body:JSON.stringify(itemPayload())});note('#giMsg','Operations record added.');event.target.reset();await load()}catch(error){note('#giMsg',error.message,true)}
  }
  async function quickStatus(id,status){try{await call('/v1/global-ops/items/'+encodeURIComponent(id),{method:'PATCH',body:JSON.stringify({status:status})});await load()}catch(error){alert(error.message)}}
  async function triage(event){
    event.preventDefault();try{var result=await call('/v1/global-ops/triage',{method:'POST',body:JSON.stringify({subject:$('#gtSubject').value,message:$('#gtMessage').value,email:$('#gtEmail').value,aiConsent:$('#gtConsent').checked})});$('#gtResult').innerHTML='<div class="message"><b>'+esc(result.triage.priority.toUpperCase())+' · '+esc(result.triage.category)+' → '+esc(result.triage.queueRegion)+'</b><br>'+esc(result.message)+(result.suggestedResponse?'<hr>'+esc(result.suggestedResponse):'')+'</div>';await load()}catch(error){note('#gtResult',error.message,true)}
  }
  async function sweep(){try{var result=await call('/v1/global-ops/sweep',{method:'POST',body:'{}'});alert(result.count+' risk item(s) queued for review.');await load()}catch(error){alert(error.message)}}
  var seed=[
    {type:'partner',name:'Expedia Rapid lodging API',provider:'Expedia Group',region:'GLOBAL',status:'research',priority:'normal',sourceUrl:'https://partner.expediagroup.com/en-us/solutions/build-your-travel-experience/rapid-api',detail:'Evaluate lodging inventory, commercial terms, support and booking liability.'},
    {type:'partner',name:'Duffel flights API',provider:'Duffel',region:'GLOBAL',status:'research',priority:'normal',sourceUrl:'https://duffel.com/pricing',detail:'Evaluate managed airline content and per-order economics.'},
    {type:'partner',name:'Airalo eSIM Partner API',provider:'Airalo',region:'GLOBAL',status:'research',priority:'normal',sourceUrl:'https://developers.partners.airalo.com/introduction-752219m0',detail:'Evaluate API inventory, support handoff, refunds and destination coverage.'},
    {type:'partner',name:'Amadeus Enterprise API review',provider:'Amadeus',region:'GLOBAL',status:'research',priority:'normal',sourceUrl:'https://developers.amadeus.com/',detail:'Self-service portal was decommissioned in July 2026; assess enterprise access only if justified.'},
    {type:'automation',name:'15-minute exception sweep',provider:'Cloudflare Workers + Queues',region:'GLOBAL',status:'active',priority:'high',humanGate:true,sourceUrl:'https://developers.cloudflare.com/queues/reference/how-queues-works/',detail:'Queue critical and due-within-72-hours work; consumers must be idempotent because delivery is at least once.'},
    {type:'compliance',name:'GST export and LUT treatment',provider:'CA / GST adviser',region:'INDIA',status:'pending',priority:'high',humanGate:true,sourceUrl:'https://cbic-gst.gov.in/pdf/circularno-37-cgst.pdf',detail:'Confirm export-of-services conditions, annual LUT and invoice treatment before foreign billing.'},
    {type:'compliance',name:'RBI export realisation evidence',provider:'Authorized dealer bank',region:'INDIA',status:'pending',priority:'high',humanGate:true,sourceUrl:'https://www.rbi.org.in/Scripts/BS_ViewMasDirections.aspx?id=10395',detail:'Maintain remittance and export-realisation evidence under current RBI directions.'},
    {type:'compliance',name:'DPDP privacy operating checklist',provider:'Privacy counsel',region:'INDIA',status:'pending',priority:'high',humanGate:true,sourceUrl:'https://www.meity.gov.in/documents/act-and-policies/digital-personal-data-protection-rules-2025-gDOxUjMtQWa',detail:'Map notices, consent, processors, retention, rights handling and breach response.'}
  ];
  async function seedResearch(){
    if(!apiBase())return alert('Deploy and configure the Global Operations worker first.');
    var existing=new Set(state.items.map(function(item){return item.name}));
    var pending=seed.filter(function(item){return!existing.has(item.name)});
    try{for(var i=0;i<pending.length;i++)await call('/v1/global-ops/items',{method:'POST',body:JSON.stringify(pending[i])});alert(pending.length+' researched record(s) added.');await load()}catch(error){alert(error.message)}
  }
  async function login(event){event.preventDefault();try{await auth.signInWithEmailAndPassword($('#goEmail').value.trim(),$('#goPassword').value)}catch(error){note('#goAuthMsg',error.message,true)}}
  $('#goLogin').onsubmit=login;$('#goSignOut').onclick=function(){auth.signOut()};$('#goSettings').onsubmit=saveSettings;$('#goItem').onsubmit=addItem;$('#goSupport').onsubmit=triage;$('#goSweep').onclick=sweep;$('#goRefresh').onclick=load;if($('#goSeed'))$('#goSeed').onclick=seedResearch;
  $('#goTabs').querySelectorAll('[data-filter]').forEach(function(button){button.onclick=function(){$('#goTabs').querySelectorAll('button').forEach(function(x){x.classList.remove('on')});button.classList.add('on');state.filter=button.dataset.filter;paintItems()}});
  auth.onAuthStateChanged(function(user){if(!user||!user.emailVerified){$('#goAuth').hidden=false;$('#goApp').hidden=true;$('#goSignOut').hidden=true;$('#goIdentity').textContent=user?'VERIFY EMAIL':'ADMIN REQUIRED';return}$('#goAuth').hidden=true;$('#goApp').hidden=false;$('#goSignOut').hidden=false;$('#goIdentity').textContent=user.email||user.uid;load()});
})();
