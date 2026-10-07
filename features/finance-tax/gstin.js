/* RoamWise GSTIN / payout-detail validators — pure, browser + Node (UMD).
 *
 * A GSTIN is 15 characters: 2-digit state code, 10-char PAN, entity digit,
 * the letter Z, and a Mod-36 check character. This only checks FORMAT and the
 * check digit. It cannot prove the number is active or belongs to this
 * property; an admin confirms that on the GST portal before ticking "GST verified".
 *
 * Never store or ask for a full bank account number here: only the UPI id,
 * account-holder name, IFSC and last four digits. The full number is collected
 * by the payout provider at KYC time, not by RoamWise.
 */
(function(root,factory){'use strict';var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.RWGstin=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
var CHARS='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
var FORMAT=/^(0[1-9]|[1-2]\d|3[0-8]|97|99)[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

var STATES={'01':'Jammu and Kashmir','02':'Himachal Pradesh','03':'Punjab','04':'Chandigarh','05':'Uttarakhand','06':'Haryana','07':'Delhi','08':'Rajasthan','09':'Uttar Pradesh','10':'Bihar','11':'Sikkim','12':'Arunachal Pradesh','13':'Nagaland','14':'Manipur','15':'Mizoram','16':'Tripura','17':'Meghalaya','18':'Assam','19':'West Bengal','20':'Jharkhand','21':'Odisha','22':'Chhattisgarh','23':'Madhya Pradesh','24':'Gujarat','26':'Dadra and Nagar Haveli and Daman and Diu','27':'Maharashtra','29':'Karnataka','30':'Goa','31':'Lakshadweep','32':'Kerala','33':'Tamil Nadu','34':'Puducherry','35':'Andaman and Nicobar Islands','36':'Telangana','37':'Andhra Pradesh','38':'Ladakh','97':'Other Territory','99':'Centre Jurisdiction'};
function checkChar(first14){
  var sum=0;
  for(var i=0;i<14;i++){
    var v=CHARS.indexOf(first14.charAt(i));
    if(v<0)return '';
    var p=v*(i%2===0?1:2);
    sum+=Math.floor(p/36)+(p%36);
  }
  return CHARS.charAt((36-(sum%36))%36);
}
function normalize(v){return String(v==null?'':v).replace(/[\s-]/g,'').toUpperCase();}

/* { ok, gstin, stateCode, state, pan } or { ok:false, error } */
function validateGstin(v){
  var g=normalize(v);
  if(!g)return {ok:false,error:'empty'};
  if(g.length!==15)return {ok:false,error:'A GSTIN has 15 characters.'};
  if(!FORMAT.test(g))return {ok:false,error:'That does not look like a GSTIN.'};
  if(checkChar(g.slice(0,14))!==g.charAt(14))return {ok:false,error:'The last character does not match. Please re-check the number.'};
  var sc=g.slice(0,2);
  return {ok:true,gstin:g,stateCode:sc,state:STATES[sc]||'',pan:g.slice(2,12)};
}

var UPI=/^[a-zA-Z0-9._-]{2,64}@[a-zA-Z][a-zA-Z0-9]{1,30}$/;
function validUpi(v){return UPI.test(String(v||'').trim());}
var IFSC=/^[A-Z]{4}0[A-Z0-9]{6}$/;
function validIfsc(v){return IFSC.test(String(v||'').trim().toUpperCase());}
function validLast4(v){return /^\d{4}$/.test(String(v||'').trim());}

/* Which payout details a property has given. Never claims they are verified. */
function payoutSummary(p){
  p=p||{};
  var upi=String(p.payoutUpi||'').trim(),holder=String(p.payoutHolder||'').trim(),ifsc=String(p.payoutIfsc||'').trim().toUpperCase(),l4=String(p.payoutAcctLast4||'').trim();
  var hasUpi=validUpi(upi),hasBank=holder.length>=3&&validIfsc(ifsc)&&validLast4(l4);
  return {hasUpi:hasUpi,hasBank:hasBank,ready:(hasUpi||hasBank)&&holder.length>=3,upi:hasUpi?upi:'',holder:holder,ifsc:hasBank?ifsc:'',last4:hasBank?l4:''};
}

/* A upi://pay deep link the GUEST's own app opens to pay the PROPERTY directly.
   RoamWise never receives or routes the money. Returns '' unless every part is valid. */
function upiPayLink(o){
  o=o||{};
  var pa=String(o.upi||'').trim(),pn=String(o.name||'').trim().slice(0,60),am=Math.round(Number(o.amount)||0),tn=String(o.note||'').trim().slice(0,60);
  if(!validUpi(pa)||pn.length<2||am<1||am>10000000)return '';
  return 'upi://pay?pa='+encodeURIComponent(pa)+'&pn='+encodeURIComponent(pn)+'&am='+am+'&cu=INR'+(tn?'&tn='+encodeURIComponent(tn):'');
}

return {validateGstin:validateGstin,normalize:normalize,checkChar:checkChar,validUpi:validUpi,validIfsc:validIfsc,validLast4:validLast4,payoutSummary:payoutSummary,upiPayLink:upiPayLink,STATES:STATES};
});
