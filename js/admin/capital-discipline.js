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
  function summary(m){
    if(m.errors.length)return '<p role="alert">Enter a non-negative number in every field. Enter 0 where confirmed; blanks are unknown.</p>';
    var warning=m.liabilityGap?'Cash is below committed liabilities. Reconcile obligations before discretionary spending.':m.reserveGap?'Below the proposed reserve target. Pause new recurring commitments and review costs.':'Reserve target covered in this snapshot. This is not spending approval.';
    return '<div class="alert"><b>'+warning+'</b></div><dl>'+[
      ['Cash available after commitments',money(m.available)],
      ['24-month reserve at today’s essential costs',money(m.reserve)],
      ['Reserve shortfall',money(m.reserveGap)],
      ['Cash above reserve before any new commitments',money(m.experimentHeadroom)],
      ['Current monthly net burn',money(m.monthlyBurn)],
      ['Full months funded under these assumptions',m.runway===null?'Not exhausted within 240 months; not a guarantee':String(m.runway)],
      ['AI/API budget status',m.aiOver?'Over by '+money(m.aiOver):'Within entered budget; monthly spend is not a forecast']
    ].map(function(r){return '<dt>'+r[0]+'</dt><dd><strong>'+r[1]+'</strong></dd>';}).join('')+'</dl>'+
    '<div style="overflow-x:auto"><table><thead><tr><th>Horizon</th><th>Starting cash required</th><th>Additional cash needed</th></tr></thead><tbody><tr><td>10 years</td><td>'+money(m.need10)+'</td><td>'+money(m.gap10)+'</td></tr><tr><td>20 years</td><td>'+money(m.need20)+'</td><td>'+money(m.gap20)+'</td></tr></tbody></table></div>'+
    '<p class="meta">Contribution stays constant; costs rise annually at your assumption. No investment return, fundraising, sales growth or unexpected losses are assumed. AI spend is already part of costs—do not count it twice. Budget warnings do not enforce provider spending limits.</p>';
  }
  function mount(host,saved,onSave){
    if(!host||host.dataset.mounted)return;
    host.dataset.mounted='true';
    host.innerHTML='<p>Owner-entered scenario, not a bank balance or forecast. Count only Roamwise income as contribution, not booking value, customer advances or partner payouts. Exclude variable costs already deducted from contribution when entering essential costs.</p><form><div class="fields">'+FIELDS.map(function(f){return '<div class="field"><label for="capital_'+f[0]+'">'+f[1]+'</label><input class="input" id="capital_'+f[0]+'" name="'+f[0]+'" type="number" min="0" max="'+(f[0]==='costGrowth'?100:1e12)+'" step="any" required></div>';}).join('')+'</div><p class="meta">24 months is a proposed reserve policy, not a statutory requirement. Cost increases are an editable scenario assumption.</p><div class="actions"><button class="btn primary" type="submit">Calculate scenario</button><button class="btn" type="button" data-save>Save reviewed inputs</button></div><p data-status role="status"></p></form><div data-result aria-live="polite"></div>'+
      '<details style="margin-top:16px"><summary>Before adding a revenue stream</summary><ul><li>Prefer software subscriptions and disclosed referral fees with measurable delivery costs. Honour existing customer and partner terms.</li><li>Require a positive contribution after payment fees, AI, support and refund costs before scaling. Keep optional extras separate.</li><li>Use provider checkout or an approved marketplace arrangement. Do not treat partner or customer money as operating capital.</li><li>Seek a specific review before holding third-party funds, creating a cash wallet, lending, crypto custody, guaranteed inventory or foreign entities.</li><li>Keep seller details, complaint handling and consent records current. A referral label or direct payment does not decide tax or consumer-law obligations.</li><li>Use the existing finance workbench for the current facts and professional sign-off; this checklist is not a compliance clearance.</li></ul><a class="btn" href="./finance-desk/">Open finance &amp; compliance workbench</a></details>';
    var form=host.querySelector('form'),status=host.querySelector('[data-status]'),result=host.querySelector('[data-result]');
    FIELDS.forEach(function(f){var value=saved&&saved[f[0]];form.elements[f[0]].value=typeof value==='number'&&Number.isFinite(value)?value:(f[0]==='costGrowth'?6:'');});
    function read(){var raw={};FIELDS.forEach(function(f){raw[f[0]]=form.elements[f[0]].value;});return raw;}
    function review(){if(!form.reportValidity())return null;var m=calculate(read());result.innerHTML=summary(m);return m.errors.length?null:m;}
    form.addEventListener('input',function(){result.innerHTML='';status.textContent='Inputs changed. Recalculate to refresh the scenario.';});
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
