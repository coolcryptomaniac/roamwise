/* Property join form add-on: RoamWise segments, guest capacity, up to 3 packages, and automatic
   go-live after the MOU is signed.

   After the form saves, the host's browser asks the Worker (POST /partner/self-list) to run the
   automatic checks. The Worker reads the saved application itself, records MOU evidence and, if
   every check passes, publishes a NEW · ENQUIRY-ONLY listing. Payments, prices and the signed-partner
   badge still need RoamWise's review. Package prices typed here stay private (owner + admin only).

   Chains the window.rwJoin* hooks set by longstay.js, so load this file after it. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var API = (window.RW_CONFIG && window.RW_CONFIG.workerUrl) || 'https://roamwise-api.founder-f53.workers.dev';
  var SEGMENTS = [
    ['workation', 'Workation & corporate retreat', '15 days to 3 months; fast internet and a quiet work zone'],
    ['wedding', 'Destination wedding', 'Catering, music, rituals; full packages if possible'],
    ['artist', 'Artist, yoga & wellness retreat', 'You host or support artists, writers, musicians, yoga'],
    ['business', 'Business hotel near airport', 'Near an airport, conference hall, startup-friendly'],
    ['homestay', 'Scenic village homestay', 'Villages, hill towns, near trek starts'],
    ['destination', 'Popular destination stay', 'Goa, Manali, Nainital, Ooty, Srinagar and similar']
  ];
  var esc = function (v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var clip = function (v, n) { return String(v == null ? '' : v).replace(/[\u0000-\u001f<>]/g, ' ').trim().slice(0, n || 80); };

  /* Extra property types for the new segments. */
  var type = $('propertyType');
  if (type) [['Wedding venue', 'Wedding venue / banquet'], ['Retreat centre', 'Retreat / wellness centre'], ['Business hotel', 'Business hotel']].forEach(function (o) {
    var el = document.createElement('option'); el.value = o[0]; el.textContent = o[1]; type.insertBefore(el, type.lastElementChild);
  });

  /* UI: inserted at the top of step 2, before the price fields. */
  var host = document.querySelector('[data-step="1"] .fields');
  if (!host) return;
  var box = document.createElement('div');
  box.className = 'full fields';
  box.id = 'segBox';
  var segOpts = SEGMENTS.map(function (s) { return '<option value="' + s[0] + '">' + esc(s[1]) + '</option>'; }).join('');
  var pkgRow = function (i) {
    return '<div class="field full" style="border:1px dashed #7a5a5e;border-radius:12px;padding:10px"><label for="pkName' + i + '">Package ' + (i + 1) + (i ? ' (optional)' : '') + '</label>'
      + '<input id="pkName' + i + '" maxlength="60" placeholder="' + (['e.g. 3-night mountain wedding', 'e.g. 1-month workation', 'e.g. Weekend yoga retreat'][i]) + '">'
      + '<div class="fields" style="margin-top:8px"><div class="field"><label for="pkNights' + i + '">Nights</label><input id="pkNights' + i + '" type="number" min="1" max="120" inputmode="numeric" placeholder="3"></div>'
      + '<div class="field"><label for="pkSeg' + i + '">For</label><select id="pkSeg' + i + '"><option value="">Any guest</option>' + segOpts + '</select></div>'
      + '<div class="field full"><label for="pkIncl' + i + '">What is included</label><input id="pkIncl' + i + '" maxlength="240" placeholder="Stay, all meals, mehendi night, DJ, pickup"></div>'
      + '<div class="field full"><label for="pkPrice' + i + '">Your price to RoamWise (₹, private)</label><input id="pkPrice' + i + '" type="number" min="0" max="10000000" inputmode="numeric" placeholder="Total for the package"><span class="helper">Never shown to guests. RoamWise confirms the final guest price with you.</span></div></div></div>';
  };
  box.innerHTML = '<div class="field full"><span class="eyebrow">What is your place great for?</span><span class="helper">Pick every experience you really offer. Guests find you through these, so choose honestly. <span class="req">*</span></span></div>'
    + '<div class="field full ct-months" id="segChecks">' + SEGMENTS.map(function (s) { return '<label title="' + esc(s[2]) + '"><input type="checkbox" value="' + s[0] + '"> ' + esc(s[1]) + '</label>'; }).join('') + '</div>'
    + '<div class="field"><label for="guestCapacity">Most guests you can host at once</label><input id="guestCapacity" type="number" min="1" max="5000" inputmode="numeric" placeholder="e.g. 40"><span class="helper">Important for weddings, retreats and teams.</span></div>'
    + '<details class="full nomadbox"><summary><span class="eyebrow">Optional</span> Add up to 3 packages (wedding, retreat, workation…)</summary><div class="fields" style="margin-top:10px">' + [0, 1, 2].map(pkgRow).join('') + '</div></details>';
  host.insertBefore(box, host.firstChild);

  function segments() { return Array.prototype.map.call(document.querySelectorAll('#segChecks input:checked'), function (x) { return x.value; }); }
  function num(id, max) { var n = Math.round(Number($(id).value)); return Number.isFinite(n) && n > 0 && n <= max ? n : 0; }
  function packages() {
    var out = [];
    [0, 1, 2].forEach(function (i) {
      var name = clip($('pkName' + i).value, 60);
      if (name.length < 3) return;
      out.push({ name: name, nights: num('pkNights' + i, 120), segment: $('pkSeg' + i).value,
        includes: clip($('pkIncl' + i).value, 240).split(',').map(function (x) { return clip(x, 40); }).filter(Boolean).slice(0, 6),
        price: num('pkPrice' + i, 10000000) });
    });
    return out;
  }

  /* Restore a saved draft (sign-in round trips reload the page). */
  try {
    var saved = JSON.parse(sessionStorage.getItem('rwJoinDraft') || 'null');
    if (saved && saved.segx) {
      document.querySelectorAll('#segChecks input').forEach(function (x) { x.checked = (saved.segx.segments || []).indexOf(x.value) >= 0; });
      if (saved.segx.cap) $('guestCapacity').value = saved.segx.cap;
      (saved.segx.packages || []).forEach(function (p, i) {
        if (i > 2) return;
        $('pkName' + i).value = p.name || ''; $('pkNights' + i).value = p.nights || ''; $('pkSeg' + i).value = p.segment || '';
        $('pkIncl' + i).value = (p.includes || []).join(', '); $('pkPrice' + i).value = p.price || '';
      });
    }
  } catch (e) { /* draft restore is best-effort */ }

  /* ---- chained hooks ---- */
  var prevValidate = window.rwJoinValidate, prevDraft = window.rwJoinDraftExtra, prevExtra = window.rwJoinExtra, prevDone = window.rwJoinDone;
  window.rwJoinValidate = function (step) {
    var msg = prevValidate ? prevValidate(step) : '';
    if (msg) return msg;
    if (step === 1 && !segments().length) { var f = document.querySelector('#segChecks input'); if (f) f.focus(); return 'Pick at least one experience your place is great for.'; }
    return '';
  };
  window.rwJoinDraftExtra = function (d) {
    if (prevDraft) prevDraft(d);
    d.segx = { segments: segments(), cap: $('guestCapacity').value, packages: packages() };
  };
  window.rwJoinExtra = function (doc) {
    if (prevExtra) prevExtra(doc);
    doc.segments = segments();
    var cap = num('guestCapacity', 5000); if (cap) doc.guestCapacity = cap;
    doc.packages = packages();
    doc.selfListRequestedAt = new Date().toISOString();
  };

  /* ---- automatic go-live ---- */
  var LABELS = { mou: 'MOU accepted', signature: 'MOU signed with your name', email: 'Email verified', basics: 'Name and town', type: 'Property type',
    phone: 'Mobile number', location: 'Google Maps or website link', photo: 'A real photo', segments: 'Experiences chosen', price: 'Room price',
    gstin: 'GSTIN', authority: 'Your authority to list', unique: 'Not already listed', phoneUnique: 'Phone not linked to another property' };
  function panel() {
    var p = $('selfListBox');
    if (!p) {
      p = document.createElement('div'); p.id = 'selfListBox'; p.className = 'info'; p.setAttribute('aria-live', 'polite');
      var done = $('done'); done.insertBefore(p, $('doneEmail'));
    }
    return p;
  }
  function render(r) {
    var p = panel();
    if (r.listed) {
      p.innerHTML = '<b>Your property is live on RoamWise as a new listing.</b><br>Guests can find it on Stay &amp; do, the map and in Ailon Tusk, and send enquiries through RoamWise. '
        + 'Payments and the RoamWise Partner badge switch on after our quick review. We will contact you on WhatsApp.';
      return;
    }
    var fails = (r.checks || []).filter(function (c) { return !c.ok; });
    p.innerHTML = (r.held ? '<b>Saved. RoamWise will contact you before this goes live.</b>' : '<b>Almost there. Fix these to go live automatically:</b>')
      + (fails.length ? '<ul style="margin:8px 0 8px 18px;padding:0">' + fails.map(function (c) { return '<li>' + esc(LABELS[c.id] || c.label) + ': ' + esc(c.fix) + '</li>'; }).join('') + '</ul>' : '')
      + (r.message ? '<div>' + esc(r.message) + '</div>' : '')
      + '<button type="button" class="btn secondary" id="selfListRetry" style="margin-top:8px">Check again</button>'
      + ' <a href="../" style="margin-left:6px">Edit my property</a>';
    var b = $('selfListRetry'); if (b) b.onclick = run;
  }
  function run() {
    var p = panel(); p.textContent = 'Running RoamWise automatic checks…';
    var u = window.firebase && firebase.auth && firebase.auth().currentUser;
    if (!u) { p.textContent = 'Sign in again to finish listing your property.'; return; }
    u.reload().catch(function () {}).then(function () { return u.getIdToken(true); }).then(function (tok) {
      return fetch(API.replace(/\/+$/, '') + '/partner/self-list', { method: 'POST', headers: { authorization: 'Bearer ' + tok, 'content-type': 'application/json' }, body: '{}' });
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (j) {
        if (res.status === 501) { p.textContent = 'Saved. RoamWise will review your property by hand and contact you.'; return; }
        if (!res.ok) { p.innerHTML = esc(j.message || 'Could not run the checks right now.') + ' <button type="button" class="btn secondary" id="selfListRetry">Check again</button>'; var b = $('selfListRetry'); if (b) b.onclick = run; return; }
        render(j);
      });
    }).catch(function () { p.innerHTML = 'Saved. We could not reach RoamWise to run the automatic checks. <button type="button" class="btn secondary" id="selfListRetry">Check again</button>'; var b = $('selfListRetry'); if (b) b.onclick = run; });
  }
  window.rwJoinDone = function () {
    if (prevDone) prevDone();
    setTimeout(run, 400);
  };
})();
