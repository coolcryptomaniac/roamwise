/* RoamWise property compliance check — a deterministic rules engine, browser + Node (UMD).
 *
 * "AI compliance check" in plain terms: it reads the evidence RoamWise already holds about a
 * property and scores it against a fixed checklist, the same way every time. It does NOT look at
 * the property in person, audit its books or give legal advice, so the badges it awards say what
 * was checked ("paperwork on file"), never that a place is safe, legal or well run.
 *
 * Input is a listing entry (config/partners shape) plus optional private facts an admin adds:
 *   routeType      'direct'|'whatsapp'|'ota'|'website'|'phone'|'none'  (from rwBookingRoute)
 *   gstVerified    true once an admin confirmed the GSTIN on the GST portal
 *   payoutReady    true when UPI / bank details are on file (never the details themselves)
 *   photoCount     number of photos the guest can see
 *
 * Badges (ids exist in badges-data.js):
 *   checked  RoamWise Checked  signed agreement + working booking route + at least one photo
 *   gst      GST Verified      GSTIN confirmed by an admin
 *   trusted  RoamWise Trusted  Checked + score of 80 or more
 */
(function(root,factory){'use strict';var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.RWTrust=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';

var RULES_VERSION='2026-10-07';
var TRUSTED_AT=80;

function n(v){var x=Number(v);return isFinite(x)?x:0;}

/* Each check: id, label, weight, critical, test(p) -> {ok, note}, fix (what the host or admin does next). */
var CHECKS=[
  {id:'signed',label:'Signed RoamWise agreement',weight:20,critical:true,
   test:function(p){return {ok:p.verified==='signed'&&p.listingReady===true};},
   fix:'Approve the property in the partner admin after the MOU is accepted.'},
  {id:'route',label:'A booking route that works',weight:20,critical:true,
   test:function(p){var t=p.routeType||'none';return {ok:t!=='none',note:t!=='none'?t:''};},
   fix:'Save a booking route (WhatsApp number, booking link or phone) in the partner admin.'},
  {id:'contact',label:'Guests can reach the property',weight:10,critical:false,
   test:function(p){var t=p.routeType;return {ok:t==='whatsapp'||t==='phone'||t==='direct'||!!p.supportEmail};},
   fix:'Add a WhatsApp number or phone the owner agreed to show.'},
  {id:'photos',label:'Photos shared by the host',weight:15,critical:false,
   test:function(p){var c=n(p.photoCount)||((p.photos||[]).length);return {ok:c>=2,partial:c===1,note:c+' photo'+(c===1?'':'s')};},
   fix:'Upload at least two real photos of the property.'},
  {id:'location',label:'Location given',weight:5,critical:false,
   test:function(p){return {ok:!!(p.mapsUrl||p.area)};},
   fix:'Add the area or a Google Maps link.'},
  {id:'gst',label:'GSTIN verified',weight:15,critical:false,
   test:function(p){return {ok:p.gstVerified===true};},
   fix:'Add the GSTIN in the join form or admin, check it on the GST portal, then tick "GST verified". Not registered? That is fine below the turnover threshold; it just earns no GST badge.'},
  {id:'policy',label:'Advance and cancellation terms published',weight:10,critical:false,
   test:function(p){return {ok:n(p.advancePct)>0||n(p.freeCancelHours)>0};},
   fix:'Set the advance % and the free-cancellation window in the admin.'},
  {id:'payout',label:'Payout details on file',weight:5,critical:false,
   test:function(p){return {ok:p.payoutReady===true};},
   fix:'Add a UPI ID or bank IFSC and last 4 digits (never the full account number).'}
];

function assess(p){
  p=p||{};
  var score=0,checks=[],missing=[],critFail=false;
  CHECKS.forEach(function(c){
    var r=c.test(p)||{};
    var pts=r.ok?c.weight:(r.partial?Math.round(c.weight/2):0);
    score+=pts;
    if(c.critical&&!r.ok)critFail=true;
    checks.push({id:c.id,label:c.label,ok:!!r.ok,partial:!!r.partial,points:pts,weight:c.weight,critical:c.critical,note:r.note||''});
    if(!r.ok)missing.push({id:c.id,label:c.label,fix:c.fix});
  });
  var photosOk=checks.filter(function(c){return c.id==='photos';})[0];
  var checkedOk=!critFail&&(photosOk.ok||photosOk.partial);
  var badges=[];
  if(checkedOk)badges.push('checked');
  if(p.gstVerified===true)badges.push('gst');
  if(checkedOk&&score>=TRUSTED_AT)badges.push('trusted');
  var tier=badges.indexOf('trusted')>-1?'trusted':checkedOk?'checked':'listed';
  return {rulesVersion:RULES_VERSION,score:score,tier:tier,badges:badges,checks:checks,missing:missing};
}

/* Merge computed badges into a listing's own list: keep what admins awarded (local, quiet, slept...),
   drop stale compliance badges, add the freshly computed ones. */
var OWNED=['checked','gst','trusted'];
function mergeBadges(existing,computed){
  var keep=(existing||[]).filter(function(b){return OWNED.indexOf(b)<0&&b!=='verified'&&b!=='listed';});
  var out=keep.concat(computed||[]);
  var seen={};return out.filter(function(b){if(seen[b])return false;seen[b]=1;return true;});
}

return {assess:assess,mergeBadges:mergeBadges,CHECKS:CHECKS,RULES_VERSION:RULES_VERSION,TRUSTED_AT:TRUSTED_AT};
});
