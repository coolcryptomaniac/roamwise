/* Pure, dependency-free helpers for RoamWise Everyday Essentials. */
(function(root){
  'use strict';
  var CATEGORIES=[
    ['housing','Housing / rent'],['food','Basic groceries'],['utilities','Electricity / water'],
    ['connectivity','Mobile / internet'],['health','Healthcare essentials'],
    ['transport','Necessary transport'],['obligations','Debt / tax minimums'],['other','Other essentials']
  ];
  function money(value){
    if(typeof value==='number')return Number.isFinite(value)&&value>=0&&value<=10000000?Math.round(value*100)/100:null;
    if(typeof value!=='string'||!/^\d{1,8}(?:\.\d{1,2})?$/.test(value.trim()))return null;
    var n=Number(value);
    return Number.isFinite(n)&&n<=10000000?n:null;
  }
  function monthlyReturnTrip(returnTripCost,daysPerWeek){
    var amount=money(returnTripCost),days=Number(daysPerWeek);
    if(amount===null||!Number.isInteger(days)||days<0||days>7)return null;
    return Math.round(amount*days*52/12*100)/100;
  }
  function plannedTotal(plan){
    if(!plan||typeof plan!=='object')return null;
    var total=0;
    for(var i=0;i<CATEGORIES.length;i++){
      var raw=plan[CATEGORIES[i][0]];
      if(raw===''||raw===undefined||raw===null)continue;
      var n=money(raw);if(n===null)return null;total+=n;
    }
    return Math.round(total*100)/100;
  }
  function monthSpend(entries,month){
    if(!Array.isArray(entries)||!/^\d{4}-(0[1-9]|1[0-2])$/.test(String(month)))return null;
    var total=0;
    for(var i=0;i<entries.length;i++){
      var e=entries[i];if(!e||typeof e.date!=='string'||e.date.slice(0,7)!==month)continue;
      var n=money(e.amount);if(n===null)return null;total+=n;
    }
    return Math.round(total*100)/100;
  }
  var api={categories:CATEGORIES,money:money,monthlyReturnTrip:monthlyReturnTrip,plannedTotal:plannedTotal,monthSpend:monthSpend};
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.RWEverydayCore=api;
})(typeof window!=='undefined'?window:null);
