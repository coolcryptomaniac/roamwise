// @ts-nocheck
/* Owner-entered cash planning. No bank access, payment actions or legal determinations. */
var RWCapitalDiscipline=(function(){
  var FIELDS=[
    ['cash','Total business cash now (₹)'],
    ['committed','Included cash reserved for partners, refunds, taxes and other liabilities (₹)'],
    ['monthlyCost','Essential monthly costs, including founder pay and AI (₹)'],
    ['contribution','Conservative monthly cash contribution after variable costs and taxes (₹)'],
    ['costGrowth','Annual essential-cost increase assumption (%)'],
    ['aiCap','Monthly AI/API budget (₹)'],
    ['aiActual','AI/API spend this month to date (₹)']
  ];
  function validate(raw){
    var values={},errors=[];
    FIELDS.forEach(function(f){var value=raw&&raw[f[0]],n=Number(value);
      if(value==null||String(value).trim()===''||!Number.isFinite(n)||n<0||n>(f[0]==='costGrowth'?100:1e12))errors.push(f[1]);
      else values[f[0]]=n;
    });
    return {values:values,errors:errors};
  }
  function calculate(raw){
    var checked=validate(raw);if(checked.errors.length)return {errors:checked.errors};
    var v=checked.values,available=Math.max(0,v.cash-v.committed),balance=available,cumulative=0,required=0,need10=0,runway=null;
    for(var month=1;month<=240;month++){
      var cost=v.monthlyCost*Math.pow(1+v.costGrowth/100,Math.floor((month-1)/12));
      var deficit=cost-v.contribution;
      cumulative+=deficit;required=Math.max(required,cumulative);
      if(month===120)need10=required;
      balance-=deficit;
      if(runway===null&&balance<-.005)runway=month-1;
    }
    var reserve=v.monthlyCost*24;
    return {errors:[],values:v,available:available,liabilityGap:Math.max(0,v.committed-v.cash),reserve:reserve,
      reserveGap:Math.max(0,reserve-available),experimentHeadroom:Math.max(0,available-reserve),
      monthlyBurn:Math.max(0,v.monthlyCost-v.contribution),runway:runway,
      need10:need10,need20:required,gap10:Math.max(0,need10-available),gap20:Math.max(0,required-available),
      aiOver:Math.max(0,v.aiActual-v.aiCap)};
  }
  function money(n){return '₹'+Math.round(n).toLocaleString('en-IN');}
  function landscape(){return '<svg class="cd-landscape" viewBox="0 0 900 260" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false"><circle cx="714" cy="70" r="37" fill="#e8ba6c" opacity=".8"/><path d="M0 235 130 126 210 191 355 36 450 146 540 63 670 185 785 111 900 209V260H0Z" fill="#3e5067"/><path d="m285 111 70-75 95 110-56-30-35-40-31 39-22-7Z m211-2 44-46 57 54-38-13-21-17-20 25Z" fill="#f4eee3" opacity=".85"/><path d="M0 245 185 169 270 225 411 154 587 231 747 167 900 222V260H0Z" fill="#203a42"/><path d="M0 253 145 224 309 249 489 215 660 252 817 220 900 244V260H0Z" fill="#10262d"/></svg>';}
  function header(){return '<header class="cd-hero"><div class="cd-hero-copy"><span class="cd-eyebrow">ROAMWISE · ROOTED IN KUMAON</span><h2>Strong roots.<br><em>A longer horizon.</em></h2><p>Capital discipline for a business built to last.</p><span class="cd-chip">Owner-entered planning · INR</span></div>'+landscape()+'<div class="cd-aipan" aria-hidden="true"></div></header>';}
  function empty(){return '<div class="cd-empty"><span class="cd-seed" aria-hidden="true">◇</span><div><h3>Your horizon starts with real numbers.</h3><p>Enter your figures and calculate to reveal the reserve gauge and runway. Nothing is assumed about your cash.</p></div></div>';}
  function summary(m){
    if(m.errors.length)return '<p role="alert">Enter a non-negative number in every field. Enter 0 where confirmed; blanks are unknown.</p>';
    var warning=m.liabilityGap?'Cash is below committed liabilities. Reconcile obligations before discretionary spending.':m.reserveGap?'Below the proposed reserve target. Pause new recurring commitments and review costs.':'Reserve target covered in this snapshot. This is not spending approval.';
    var pct=m.reserve>0?Math.min(100,m.available/m.reserve*100):0;
    var months=m.runway===null?240:m.runway;
    var metrics=[['Available cash',money(m.available),'After committed funds'],['Monthly net burn',money(m.monthlyBurn),'At today’s entered costs'],['Reserve shortfall',money(m.reserveGap),'Against the 24-month target'],['Above reserve',money(m.experimentHeadroom),'Before new commitments; not approval']];
    return '<section class="cd-results" aria-label="Your capital scenario"><div class="cd-section-heading"><span class="cd-eyebrow">YOUR FINANCIAL LANDSCAPE</span><h3>A clear view of the road ahead</h3></div><div class="cd-notice '+(m.liabilityGap||m.reserveGap?'cd-caution':'')+'"><b>'+warning+'</b>'+(m.liabilityGap?'<span>Liability shortfall: '+money(m.liabilityGap)+'</span>':'')+'</div>'+
      '<div class="cd-metrics">'+metrics.map(function(r){return '<article class="cd-metric"><span>'+r[0]+'</span><strong>'+r[1]+'</strong><small>'+r[2]+'</small></article>';}).join('')+'</div>'+
      '<div class="cd-chart-grid"><article class="cd-chart"><h4>Reserve coverage</h4><div class="cd-reserve"><div class="cd-ring" style="--coverage:'+pct+'%" aria-hidden="true"><span>'+(m.reserve>0?Math.floor(pct)+'%':'—')+'</span></div><div><b>'+money(m.available)+' available</b><p>Target: '+money(m.reserve)+'</p><small>'+(m.reserve>0?'Gauge capped at 100%. Target = 24 months of today’s essential costs.':'No reserve target can be assessed with zero essential costs.')+'</small></div></div></article>'+
      '<article class="cd-chart"><h4>Runway under your assumptions</h4><div class="cd-runway-value">'+(m.runway===null?'240+':m.runway)+' <span>full months</span></div><p>'+(m.runway===null?'Not exhausted within 240 months; not a guarantee.':'Before modelled cash first becomes negative.')+'</p><div class="cd-track" aria-hidden="true"><span style="width:'+(months/240*100)+'%"></span></div><div class="cd-axis" aria-hidden="true"><span>Now</span><span>10 years</span><span>20 years</span></div></article></div>'+
      '<div class="cd-budget-note"><b>AI / API budget</b><span>'+(m.aiOver?'Over by '+money(m.aiOver):'Within entered budget')+' · '+money(m.values.aiActual)+' spent / '+money(m.values.aiCap)+' budget</span><small>Month-to-date input, not a forecast or enforced cap.</small></div>'+
      '<div class="cd-table-wrap"><table><caption>Long-horizon funding needs</caption><thead><tr><th scope="col">Horizon</th><th scope="col">Starting cash required</th><th scope="col">Additional cash needed</th></tr></thead><tbody><tr><th scope="row">10 years</th><td>'+money(m.need10)+'</td><td>'+money(m.gap10)+'</td></tr><tr><th scope="row">20 years</th><td>'+money(m.need20)+'</td><td>'+money(m.gap20)+'</td></tr></tbody></table></div>'+
      '<p class="cd-footnote">Contribution stays constant; costs rise annually at your assumption. No investment return, fundraising, sales growth or unexpected losses are assumed. AI spend is already part of costs—do not count it twice. Budget warnings do not enforce provider spending limits.</p></section>';
  }
  function fields(){
    return [['01','The foundation','Cash and commitments',FIELDS.slice(0,2)],['02','The rhythm','Monthly costs and contribution',FIELDS.slice(2,5)],['03','The boundaries','AI and API spending',FIELDS.slice(5)]].map(function(group){
      return '<fieldset class="cd-fieldset"><legend><span class="cd-step">'+group[0]+'</span>'+group[1]+'</legend><p>'+group[2]+'</p><div class="cd-fields">'+group[3].map(function(f){return '<div class="field"><label for="capital_'+f[0]+'">'+f[1]+'</label><div class="cd-input-wrap"><input class="input" id="capital_'+f[0]+'" name="'+f[0]+'" type="number" inputmode="decimal" min="0" max="'+(f[0]==='costGrowth'?100:1e12)+'" step="any" placeholder="Enter amount" required></div></div>';}).join('')+'</div></fieldset>';
    }).join('');
  }
  function mount(host,saved,onSave){
    if(!host||host.dataset.mounted)return;
    host.dataset.mounted='true';
    host.innerHTML=header()+'<div class="cd-body"><div class="cd-intro"><span class="cd-eyebrow">BUILD FROM WHAT YOU KNOW</span><p>Owner-entered scenario, not a bank balance or forecast. Count only Roamwise income as contribution, not booking value, customer advances or partner payouts. Exclude variable costs already deducted from contribution when entering essential costs.</p></div><form>'+fields()+'<p class="cd-footnote">24 months is a proposed reserve policy, not a statutory requirement. Cost increases are an editable scenario assumption.</p><div class="cd-actions"><button class="btn primary" type="submit">Reveal my runway <span aria-hidden="true">↗</span></button><button class="btn" type="button" data-save>Save reviewed inputs</button></div><p data-status role="status"></p></form><div data-result aria-live="polite">'+empty()+'</div>'+
      '<details class="cd-policy"><summary>Grow carefully · before adding a revenue stream</summary><ul><li>Prefer software subscriptions and disclosed referral fees with measurable delivery costs. Honour existing customer and partner terms.</li><li>Require a positive contribution after payment fees, AI, support and refund costs before scaling. Keep optional extras separate.</li><li>Use provider checkout or an approved marketplace arrangement. Do not treat partner or customer money as operating capital.</li><li>Seek a specific review before holding third-party funds, creating a cash wallet, lending, crypto custody, guaranteed inventory or foreign entities.</li><li>Keep seller details, complaint handling and consent records current. A referral label or direct payment does not decide tax or consumer-law obligations.</li><li>Use the existing finance workbench for the current facts and professional sign-off; this checklist is not a compliance clearance.</li></ul><a class="btn" href="./finance-desk/">Open finance &amp; compliance workbench</a></details></div>';
    var form=host.querySelector('form'),status=host.querySelector('[data-status]'),result=host.querySelector('[data-result]');
    FIELDS.forEach(function(f){var value=saved&&saved[f[0]];form.elements[f[0]].value=typeof value==='number'&&Number.isFinite(value)?value:(f[0]==='costGrowth'?6:'');});
    function read(){var raw={};FIELDS.forEach(function(f){raw[f[0]]=form.elements[f[0]].value;});return raw;}
    function review(){if(!form.reportValidity())return null;var m=calculate(read());result.innerHTML=summary(m);return m.errors.length?null:m;}
    form.addEventListener('input',function(){result.innerHTML=empty();status.textContent='Inputs changed. Recalculate to refresh the scenario.';});
    form.addEventListener('submit',function(e){e.preventDefault();review();});
    host.querySelector('[data-save]').addEventListener('click',async function(){
      var m=review();if(!m)return;var button=this;button.disabled=true;
      try{await onSave(m.values);status.textContent='Reviewed inputs saved. This does not change budgets, payment flows or contracts.';}
      catch(e){status.textContent='Could not save. Your inputs remain here; retry after checking your admin session.';}
      finally{button.disabled=false;}
    });
  }
  return {validate:validate,calculate:calculate,summary:summary,mount:mount};
})();
