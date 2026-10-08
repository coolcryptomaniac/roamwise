// @ts-nocheck
/* ==================== WhatsApp verification + "send my trip" ====================
   Profile card that (1) verifies the user's phone by having them send a one-time
   code to the RoamWise WhatsApp number, and (2) lets them push ONE itinerary to the
   WhatsApp bot so it can answer "MY TRIP".

   How verification stays honest: the app never learns or accepts a typed number.
   It only creates wa_verifications/{CODE} (rules force uid == auth.uid). The WhatsApp
   webhook receives the SIM-verified sender number and writes wa_links/{uid}, which
   NO client can write. The UI trusts wa_links/{uid} and nothing else.

   Trips live on-device (rw_trips), so nothing leaves the phone until the user taps
   "Send my trip to WhatsApp"; that writes wa_trips/{uid} (owner-only, replaceable,
   deletable). Backend: roamwise-whatsapp (Cloudflare Worker or Firebase Function).

   Classic script, no modules: globals are reached by inline onclick. Depends at call
   time on db, user/firebase.auth(), AUTH_READY, el, showToast, vaultGet. */

var RW_WA_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 32 chars: no 0/O/1/I, no modulo bias
var _rwWaUnsub = null;

function rwWaNumber(){
  var c = (window.RW_CONFIG && window.RW_CONFIG.whatsapp) || {};
  return String(c.botNumber || '919987379730').replace(/\D/g, '');
}

function rwWaMakeCode(){
  var a = new Uint8Array(8);
  (window.crypto || self.crypto).getRandomValues(a);
  var s = '';
  for (var i = 0; i < a.length; i++) s += RW_WA_ALPHABET.charAt(a[i] % 32);
  return s;
}

function rwWaLink(text){
  return 'https://wa.me/' + rwWaNumber() + '?text=' + encodeURIComponent(text);
}

function rwWaMask(phone){
  var d = String(phone || '').replace(/\D/g, '');
  return d.length < 6 ? '' : '+' + d.slice(0, 2) + ' ••••• ••' + d.slice(-3);
}

function rwWaUid(){
  try { var u = firebase.auth().currentUser; return u && u.uid ? u.uid : ''; } catch (e) { return ''; }
}

/* Keep only plain, bounded text so the document is small and rules-friendly. */
function rwWaTripPayload(it){
  if (!it || !it.days || !it.days.length) return null;
  var cut = function(v, n){ return typeof v === 'string' ? v.slice(0, n) : ''; };
  var days = it.days.slice(0, 30).map(function(d, i){
    d = (d && typeof d === 'object') ? d : { title: String(d) };
    return {
      day: Number(d.day) || i + 1,
      title: cut(d.title, 120), morning: cut(d.morning, 400), afternoon: cut(d.afternoon, 400),
      evening: cut(d.evening, 400), tip: cut(d.tip, 300)
    };
  });
  return { name: cut(String(it.name || 'My trip'), 120), start: cut(String(it.start || ''), 20), days: days };
}

function rwWaLatestTrip(){
  try {
    if (window._lastItin && window._lastItin.days && window._lastItin.days.length) {
      var start = (document.getElementById('tripStart') || {}).value || '';
      return { name: window._lastItin.name, days: window._lastItin.days, start: start };
    }
    var v = (typeof vaultGet === 'function') ? vaultGet() : [];
    return v.length ? v[0] : null;
  } catch (e) { return null; }
}

function rwWaCardHTML(state, extra){
  var box = 'background:linear-gradient(135deg,rgba(22,191,150,.10),rgba(22,191,150,.04));border:1px solid rgba(22,191,150,.35);border-radius:14px;padding:12px 14px';
  var title = '<div style="font-size:13px;font-weight:800;color:var(--t1);margin-bottom:4px">📱 WhatsApp</div>';
  var sub = function(t){ return '<div style="font-size:11.5px;color:var(--t2);line-height:1.5;margin-bottom:8px">' + t + '</div>'; };
  var btn = function(label, fn){ return '<button class="tact" style="font-weight:800" onclick="' + fn + '">' + label + '</button>'; };
  if (state === 'signin') return '<div style="' + box + '">' + title + sub('Sign in first, then you can verify your number on WhatsApp in one tap.') + '</div>';
  if (state === 'unavailable') return '<div style="' + box + '">' + title + sub('WhatsApp verification isn’t available right now. Try again a little later.') + '</div>';
  if (state === 'verified') {
    return '<div style="' + box + '">' + title + sub('✅ Verified · ' + extra + '<br>Message <b>MY TRIP</b> to our WhatsApp any time to get your saved plan.')
      + btn('📲 Send my latest trip to WhatsApp', 'rwWaSendTrip()') + '</div>';
  }
  if (state === 'waiting') {
    return '<div style="' + box + '">' + title + sub('Waiting for your message… In WhatsApp just tap <b>Send</b> on the pre-filled text, then come back here.')
      + '<a class="tact" style="display:inline-block;text-decoration:none;font-weight:800" target="_blank" rel="noopener" href="' + extra + '">Open WhatsApp ↗</a></div>';
  }
  return '<div style="' + box + '">' + title
    + sub('Verify your number without any SMS or OTP: tap the button and send the pre-filled message. We use your number only to verify you and reply to you; you agree to receive trip-related WhatsApp messages from RoamWise and can send <b>STOP</b> any time.')
    + btn('✅ Verify via WhatsApp', 'rwWaStart()') + '</div>';
}

function rwWaPaint(state, extra){
  var c = document.getElementById('rwWaCard');
  if (c) c.innerHTML = rwWaCardHTML(state, extra);
}

function rwWaStop(){
  if (_rwWaUnsub) { try { _rwWaUnsub(); } catch (e) { /* listener already closed */ } _rwWaUnsub = null; }
}

/* Called when the profile sheet opens. Distinguishes "not verified" from "blocked/unavailable". */
function rwWaRender(){
  rwWaStop();
  if (typeof AUTH_READY === 'undefined' || !AUTH_READY || typeof db === 'undefined' || !db) { rwWaPaint('unavailable'); return; }
  var uid = rwWaUid();
  if (!uid) { rwWaPaint('signin'); return; }
  _rwWaUnsub = db.collection('wa_links').doc(uid).onSnapshot(function(s){
    var ov = document.getElementById('profOverlay');
    if (!ov || !ov.classList.contains('open')) { rwWaStop(); return; }
    var d = s.exists ? s.data() : null;
    if (d && d.phone) rwWaPaint('verified', rwWaMask(d.phone));
    else if (window._rwWaPendingLink) rwWaPaint('waiting', window._rwWaPendingLink);
    else rwWaPaint('start');
  }, function(){ rwWaPaint('unavailable'); });
}

function rwWaStart(){
  var uid = rwWaUid();
  if (!uid) { rwWaPaint('signin'); return; }
  var code = rwWaMakeCode();
  var link = rwWaLink('VERIFY-' + code);
  db.collection('wa_verifications').doc(code).set({
    uid: uid, status: 'pending', createdAt: firebase.firestore.FieldValue.serverTimestamp()
  }).then(function(){
    window._rwWaPendingLink = link;
    rwWaPaint('waiting', link);
    window.open(link, '_blank'); // may be blocked by the browser; the "Open WhatsApp" link above is the fallback
    try { if (typeof track === 'function') track('wa_verify_start'); } catch (e) { /* analytics best-effort */ }
  }).catch(function(){
    if (typeof showToast === 'function') showToast('Could not start verification. Check your connection and try again.');
  });
}

function rwWaSendTrip(){
  var uid = rwWaUid();
  var p = rwWaTripPayload(rwWaLatestTrip());
  if (!uid) { rwWaPaint('signin'); return; }
  if (!p) { if (typeof showToast === 'function') showToast('Generate or save an itinerary first'); return; }
  p.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
  db.collection('wa_trips').doc(uid).set(p).then(function(){
    if (typeof showToast === 'function') showToast('Trip ready. Tap Send in WhatsApp to receive it.');
    window.open(rwWaLink('MY TRIP'), '_blank');
    try { if (typeof track === 'function') track('wa_trip_sent'); } catch (e) { /* analytics best-effort */ }
  }).catch(function(){
    if (typeof showToast === 'function') showToast('Could not save your trip for WhatsApp. Try again.');
  });
}
