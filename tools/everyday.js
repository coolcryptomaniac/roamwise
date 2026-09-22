/* RoamWise Everyday Essentials: no sign-in, third-party API, or payment calls. */
(function(){
  'use strict';
  var core=window.RWEverydayCore,KEY='rw_everyday_essentials_v1';
  var byId=function(id){return document.getElementById(id);};
  var currency=function(n){return new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(n);};
  var today=function(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
  var state={entries:[]};
  function announce(message,error){var el=byId('message');el.textContent=message;el.className=error?'error':'notice';}
  function stored(){try{return localStorage.getItem(KEY);}catch(_){announce('Private browsing may block saving. Calculations still work, but data may not persist.',true);return null;}}
  function persist(){try{localStorage.setItem(KEY,JSON.stringify(state));return true;}catch(_){announce('Could not save on this device. Free up storage or check private browsing.',true);return false;}}
  function field(id){return byId(id).value.trim();}
  function addField(group,id,label,placeholder){
    var wrap=document.createElement('label'),span=document.createElement('span'),input=document.createElement('input');
    span.textContent=label;input.id=id;input.type='number';input.min='0';input.max='10000000';input.step='0.01';input.inputMode='decimal';input.placeholder=placeholder||'₹ per month';
    wrap.append(span,input);group.appendChild(wrap);input.addEventListener('input',renderPlan);
  }
  function renderPlan(){
    var plan={};core.categories.forEach(function(row){plan[row[0]]=field('plan-'+row[0]);});
    var sum=core.plannedTotal(plan),cap=core.money(field('monthlyCap')),view=byId('planResult');
    if(sum===null||cap===null&&field('monthlyCap')){view.textContent='Enter valid non-negative rupee amounts (up to ₹1 crore per field).';return;}
    view.textContent='Planned monthly essentials: '+currency(sum)+(cap!==null?' · '+(sum>cap?currency(sum-cap)+' over your budget':currency(cap-sum)+' below your budget'):' · Add an optional monthly budget to compare.');
  }
  function renderJourney(){
    var days=Number(field('days')),list=byId('journeyResults');list.replaceChildren();
    if(!Number.isInteger(days)||days<0||days>7){list.textContent='Choose 0–7 journey days each week.';return;}
    var options=[['transit','Public transport'],['shared','Shared ride'],['own','Own vehicle']];
    var entered=[],invalid=false;
    options.forEach(function(row){var raw=field('fare-'+row[0]);if(raw==='')return;var cost=core.money(raw),month=core.monthlyReturnTrip(raw,days);if(cost===null||month===null){invalid=true;return;}entered.push({name:row[1],amount:month});});
    if(invalid){list.textContent='Enter a valid return-journey cost for each selected mode.';return;}
    if(!entered.length){list.textContent='Enter your own cost for a return journey in one or more modes. No fares are fetched or guessed.';return;}
    entered.sort(function(a,b){return a.amount-b.amount;});
    entered.forEach(function(item,index){var li=document.createElement('li');li.textContent=item.name+': '+currency(item.amount)+'/month'+(index===0&&entered.length>1?' · lowest of your entered costs':'');list.appendChild(li);});
    var note=document.createElement('li');note.textContent='Estimate uses '+days+' days/week × 52/12 weeks/month. Check safety, accessibility, schedules and actual fares before choosing.';list.appendChild(note);
  }
  function mapsLink(mode){
    var origin=field('origin'),destination=field('destination');if(!origin||!destination)return null;
    var travel=mode==='walk'?'walking':mode==='transit'?'transit':'driving';
    return 'https://www.google.com/maps/dir/?api=1&origin='+encodeURIComponent(origin)+'&destination='+encodeURIComponent(destination)+'&travelmode='+travel;
  }
  function openMap(mode){var url=mapsLink(mode);if(!url){announce('Enter both route endpoints before opening Maps.',true);return;}window.open(url,'_blank','noopener,noreferrer');}
  function savePlan(){
    var plan={};core.categories.forEach(function(row){plan[row[0]]=field('plan-'+row[0]);});
    if(core.plannedTotal(plan)===null||field('monthlyCap')&&core.money(field('monthlyCap'))===null){announce('Please correct your monthly rupee amounts before saving.',true);return;}
    var days=Number(field('days'));if(!Number.isInteger(days)||days<0||days>7){announce('Journey days must be between 0 and 7.',true);return;}
    var fares={};for(var mode of ['transit','shared','own']){var raw=field('fare-'+mode);if(raw&&core.money(raw)===null){announce('Please correct the return-journey costs before saving.',true);return;}fares[mode]=raw;}
    state.plan=plan;state.monthlyCap=field('monthlyCap');state.route={origin:field('origin').slice(0,120),destination:field('destination').slice(0,120),days:days,fares:fares};
    if(persist())announce('Saved on this device only. These figures are your estimates, not verified prices.');
  }
  function renderEntries(){
    var month=field('month'),list=byId('spendList');list.replaceChildren();
    var total=core.monthSpend(state.entries,month);byId('spentTotal').textContent=total===null?'Choose a valid month.':'Logged this month: '+currency(total);
    state.entries.forEach(function(row){if(row.date.slice(0,7)!==month)return;
      var li=document.createElement('li'),content=document.createElement('span'),del=document.createElement('button');
      var category=core.categories.find(function(c){return c[0]===row.category;});
      content.textContent=row.date+' · '+(category?category[1]:'Essential')+' · '+currency(row.amount)+(row.note?' · '+row.note:'');
      del.type='button';del.textContent='Remove';del.setAttribute('aria-label','Remove expense from '+row.date);del.addEventListener('click',function(){state.entries=state.entries.filter(function(x){return x.id!==row.id;});persist();renderEntries();});
      li.append(content,del);list.appendChild(li);
    });
    if(!list.children.length)list.textContent='No expenses logged for this month.';
  }
  function addSpend(event){
    event.preventDefault();var amount=core.money(field('spentAmount')),date=field('spentDate'),category=field('spentCategory'),note=field('spentNote').slice(0,80);
    if(amount===null||amount<=0||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||date>today()||!core.categories.some(function(c){return c[0]===category;})){
      announce('Enter a valid positive expense, category, and a date not in the future.',true);return;
    }
    if(state.entries.length>=1500){announce('Entry limit reached. Remove older entries before adding more.',true);return;}
    state.entries.push({id:String(Date.now())+'-'+Math.random().toString(36).slice(2),date:date,category:category,amount:amount,note:note});
    byId('spentNote').value='';byId('spentAmount').value='';byId('month').value=date.slice(0,7);persist();renderEntries();announce('Expense logged on this device.');
  }
  function init(){
    var grid=byId('planFields'),cats=byId('spentCategory');
    core.categories.forEach(function(row){addField(grid,'plan-'+row[0],row[1]);var o=document.createElement('option');o.value=row[0];o.textContent=row[1];cats.appendChild(o);});
    var raw=stored();if(raw){try{var value=JSON.parse(raw);if(value&&typeof value==='object')state=value;}catch(_){announce('Saved data could not be read; starting with an empty form.',true);}}
    if(!Array.isArray(state.entries))state.entries=[];
    if(state.plan&&typeof state.plan==='object')core.categories.forEach(function(row){var v=state.plan[row[0]];if(core.money(v)!==null)byId('plan-'+row[0]).value=v;});
    if(core.money(state.monthlyCap)!==null)byId('monthlyCap').value=state.monthlyCap;
    if(state.route&&typeof state.route==='object'){
      byId('origin').value=String(state.route.origin||'').slice(0,120);byId('destination').value=String(state.route.destination||'').slice(0,120);
      if(Number.isInteger(state.route.days)&&state.route.days>=0&&state.route.days<=7)byId('days').value=state.route.days;
      ['transit','shared','own'].forEach(function(k){var v=(state.route.fares||{})[k];if(core.money(v)!==null)byId('fare-'+k).value=v;});
    }
    byId('spentDate').value=today();byId('month').value=today().slice(0,7);
    ['monthlyCap','days','fare-transit','fare-shared','fare-own'].forEach(function(id){byId(id).addEventListener('input',id==='monthlyCap'?renderPlan:renderJourney);});
    byId('savePlan').addEventListener('click',savePlan);byId('spendForm').addEventListener('submit',addSpend);byId('month').addEventListener('change',renderEntries);
    document.querySelectorAll('[data-map]').forEach(function(b){b.addEventListener('click',function(){openMap(b.dataset.map);});});
    byId('clearAll').addEventListener('click',function(){if(!window.confirm('Delete all Everyday Essentials data on this device? This cannot be undone.'))return;
      try{localStorage.removeItem(KEY);}catch(_){}state={entries:[]};core.categories.forEach(function(c){byId('plan-'+c[0]).value='';});
      ['monthlyCap','origin','destination','fare-transit','fare-shared','fare-own','spentAmount','spentNote'].forEach(function(id){byId(id).value='';});byId('days').value='5';renderPlan();renderJourney();renderEntries();announce('Local Everyday Essentials data cleared.');
    });
    renderPlan();renderJourney();renderEntries();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
