// @ts-check
/* Managed-compute policy for a perpetual RoamWise business.
   Core planning remains available without a paid model: the deterministic
   Smart Planner is unlimited and travellers may use their own provider key.
   A RoamWise-funded model is a separately metered convenience, because a
   one-time lifetime payment cannot safely promise unlimited third-party API
   spend forever. This module describes the contract; it does not reduce any
   existing tier feature or block the local/BYOK paths. */
(function(){
  var POLICIES = {
    free:    { managedAIRequests:0,   premiumPdf:0,  label:'Free' },
    plus:    { managedAIRequests:10,  premiumPdf:10, label:'Plus' },
    pro:     { managedAIRequests:40,  premiumPdf:-1, label:'Pro' },
    elite:   { managedAIRequests:100, premiumPdf:-1, label:'Elite' },
    founder: { managedAIRequests:12,  premiumPdf:-1, label:'Founder lifetime' }
  };

  function policyFor(planId, tierId){
    var id = String(planId || '');
    if(id === 'founder') return POLICIES.founder;
    var tier = String(tierId || '').toLowerCase();
    return POLICIES[tier] || POLICIES.free;
  }

  function allowanceLabel(value, unit){
    if(value < 0) return 'Unlimited ' + unit;
    if(value === 0) return 'No included ' + unit;
    return value + ' ' + unit + ' / month';
  }

  function featureLabels(planId, tierId){
    var p = policyFor(planId, tierId);
    return [
      'Unlimited Smart Planner searches',
      'Unlimited AI with your own provider key',
      allowanceLabel(p.managedAIRequests, 'RoamWise-hosted AI enhancements'),
      allowanceLabel(p.premiumPdf, 'premium PDF exports')
    ];
  }

  function estimateMonthlyCost(planId, tierId, usage, rates){
    var p = policyFor(planId, tierId), u = usage || {}, r = rates || {};
    var hosted = Math.max(0, Math.min(Number(u.managedAIRequests)||0,
      p.managedAIRequests < 0 ? Number(u.managedAIRequests)||0 : p.managedAIRequests));
    var pdf = Math.max(0, Number(u.premiumPdf)||0);
    return hosted * Math.max(0, Number(r.managedAIRequestINR)||0)
      + pdf * Math.max(0, Number(r.premiumPdfINR)||0);
  }

  RWPricing.USAGE_POLICIES = POLICIES;
  RWPricing.usagePolicyFor = policyFor;
  RWPricing.usageFeatureLabels = featureLabels;
  RWPricing.estimateMonthlyVariableCost = estimateMonthlyCost;
})();
