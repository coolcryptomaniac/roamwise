// @ts-nocheck
/* ==================== STAY REQUESTS: send to RoamWise ====================
   The trip basket and the single-room enquiry form used to write straight to
   Firestore collections that have no rule, so the request was silently lost
   while the guest saw "sent". They now go to the Worker (POST /stay/lead),
   which stores the request, and the guest is told the truth about whether it
   worked.

   Consent: the forms carry an explicit choice; this file refuses to send
   without it. The number is used to reply about THIS request on WhatsApp or
   phone, not for marketing. See privacy.html ("Stay requests and WhatsApp"). */

var RW_LEAD_CONSENT_FIELD = {
  key: 'consent', label: 'May we contact you on WhatsApp?', type: 'select',
  options: [{ value: '', label: 'Choose…' }, { value: 'yes', label: 'Yes — RoamWise and the property may WhatsApp or call me about this request' }],
  hint: 'Used only to reply to this request. No marketing messages. Kept for 12 months, then deleted; ask support@roamwise.co.in to delete sooner.'
};

/* payload: {source,name,phone,items,checkIn,checkOut,dates,guests,people,note,ref,estTotal}. cb(ok, message). */
function rwStayLeadSend(payload, cb){
  var tripOwner=typeof RWTripDesk!=='undefined'?RWTripDesk.owner():null;
  var url = (typeof window.rwApi === 'function') ? window.rwApi('stay/lead') : null;
  if(!url){ cb(false, 'offline'); return; }
  var body = {}; for(var k in payload) body[k] = payload[k];
  body.consent = true;
  var done = false, t = setTimeout(function(){ if(!done){ done = true; cb(false, 'timeout'); } }, 12000);
  fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    .then(function(r){ return r.json().then(function(j){ return { ok: r.ok && j && j.ok, j: j }; }, function(){ return { ok: false, j: null }; }); })
    .then(function(x){ if(done) return; done = true; clearTimeout(t); if(x.ok&&typeof RWTripDesk!=='undefined'&&tripOwner===RWTripDesk.owner())RWTripDesk.add({id:'inquiry:'+((x.j&&x.j.id)||Date.now()),title:'Stay inquiry '+(payload.checkIn||payload.dates||''),kind:'stay',status:'inquiry'}); cb(!!x.ok, x.ok ? (x.j && x.j.id) : (x.j && (x.j.message || x.j.error)) || 'failed'); })
    .catch(function(){ if(done) return; done = true; clearTimeout(t); cb(false, 'network'); });
}
