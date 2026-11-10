/* RoamWise B2B desk (staff portal). One card for partner and package deals:
   pipeline -> MOU prepare / send / download / signature -> package quotes -> reported payments.
   Rules live in staff/b2b-core.js (window.RWB2B) and firestore.rules (b2bDeals, b2bTxns).
   Uses the staff page's own globals: db, user, ROLE, hasRole, el, showModal, closeModal, showToastS.
   Nothing here moves money or signs for RoamWise: staff report payments, the founder verifies and countersigns. */
(function () {
  'use strict';
  var B = window.RWB2B, deals = [], txns = [], state = { denied: false, loaded: false, filter: 'open' };
  if (!B) return;
  function h(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function $(id) { return document.getElementById(id); }
  function isAdmin() { return window.ROLE === 'admin'; }
  function allowed() { return isAdmin() || window.hasRole('partnerships') || window.hasRole('bd'); }
  function today() { return new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10); }
  function toast(m) { if (typeof window.showToastS === 'function') window.showToastS(m); }
  function dealById(id) { for (var i = 0; i < deals.length; i++) if (deals[i]._id === id) return deals[i]; return null; }
  function fail(e) { alert(e && e.code === 'permission-denied' ? 'Not allowed. If you were just added to the team, ask Mohit to set your role to partnerships.' : 'Could not save: ' + ((e && e.message) || 'check your connection')); }
  function copy(text, done) {
    var ok = function () { toast(done || 'Copied'); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok, function () { prompt('Copy this:', text); });
    else prompt('Copy this:', text);
  }
  var field = function (id, label, attrs, val) { return '<label class="lab" style="margin-top:10px;display:block">' + label + '</label><input id="' + id + '" class="inp" ' + (attrs || '') + ' value="' + h(val || '') + '">'; };
  var select = function (id, label, map, val) { return '<label class="lab" style="margin-top:10px;display:block">' + label + '</label><select id="' + id + '" class="inp">' + Object.keys(map).map(function (k) { return '<option value="' + h(k) + '"' + (k === val ? ' selected' : '') + '>' + h(typeof map[k] === 'string' ? map[k] : map[k].label) + '</option>'; }).join('') + '</select>'; };

  /* ---------------- load ---------------- */
  function load() {
    if (!window.db || !window.user || !allowed()) return;
    var uid = window.user.uid, dq = window.db.collection('b2bDeals'), tq = window.db.collection('b2bTxns');
    if (!isAdmin()) { dq = dq.where('ownerUid', '==', uid); tq = tq.where('enteredBy', '==', uid); }
    Promise.all([dq.limit(400).get(), tq.limit(600).get()]).then(function (r) {
      deals = []; txns = [];
      r[0].forEach(function (d) { var x = d.data() || {}; x._id = d.id; deals.push(x); });
      r[1].forEach(function (d) { var x = d.data() || {}; x._id = d.id; txns.push(x); });
      deals.sort(function (a, b) { return String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')); });
      txns.sort(function (a, b) { return String(b.at || '').localeCompare(String(a.at || '')); });
      state.loaded = true; state.denied = false; paint();
    }).catch(function (e) {
      /* "No data" and "blocked" must never look the same. */
      state.loaded = true; state.denied = !!(e && e.code === 'permission-denied'); state.error = state.denied ? '' : ((e && e.message) || 'offline'); paint();
    });
  }

  /* ---------------- main card ---------------- */
  function paint() {
    var host = $('b2bOut'); if (!host) return;
    if (state.denied) { host.innerHTML = '<p class="note">This desk is not unlocked for your account yet. Ask Mohit to set your staff role to <b>partnerships</b>. (If he just did, the new database rules may still be deploying. Try again in a few minutes.)</p>'; return; }
    if (state.error) { host.innerHTML = '<p class="note">Could not load deals (' + h(state.error) + '). <a href="#" onclick="b2bReload();return false">Try again</a></p>'; return; }
    var s = B.summarise(deals, txns), t = today();
    var shown = deals.filter(function (d) { return state.filter === 'all' ? true : state.filter === 'done' ? (d.stage === 'live' || d.stage === 'lost') : (d.stage !== 'live' && d.stage !== 'lost'); });
    var pendingTx = txns.filter(function (x) { return x.status === 'reported'; });
    host.innerHTML =
      '<div class="dk-stats" style="margin-top:4px">'
      + '<div class="dk-stat"><b>' + s.open + '</b><span>open deals</span></div>'
      + '<div class="dk-stat"><b>' + (s.byStage.mou_sent) + '</b><span>MOU out</span></div>'
      + '<div class="dk-stat"><b>' + (s.byStage.mou_signed + s.byStage.countersigned + s.byStage.live) + '</b><span>signed</span></div>'
      + '</div>'
      + '<div class="pn-row"><span style="flex:1">Money verified by Mohit</span><b style="color:#4ADE80">' + h(B.inr(s.verified)) + '</b></div>'
      + '<div class="pn-row"><span style="flex:1">Reported, waiting to be checked</span><b style="color:#F0A63B">' + h(B.inr(s.reported)) + '</b></div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0">'
      + '<button class="btn go" style="padding:12px" onclick="b2bNewDeal()">&#10133; New deal</button>'
      + '<button class="btn" style="padding:12px" onclick="b2bPackage()">&#127890; Package quote</button>'
      + '<button class="btn" style="padding:12px" onclick="b2bLinks()">&#128279; Sign-up links</button>'
      + '<button class="btn" style="padding:12px" onclick="b2bHelp()">&#10067; How this works</button>'
      + '</div>'
      + (isAdmin() && pendingTx.length ? '<div class="dk-lab">PAYMENTS TO CHECK (' + pendingTx.length + ')</div>' + pendingTx.map(txRow).join('') : '')
      + '<div style="display:flex;gap:6px;margin:10px 0 4px">' + [['open', 'Open'], ['done', 'Live / closed'], ['all', 'All']].map(function (f) { return '<button class="btn" style="' + (state.filter === f[0] ? 'border-color:var(--gold);color:var(--gold)' : '') + '" onclick="b2bFilter(\'' + f[0] + '\')">' + f[1] + '</button>'; }).join('') + '</div>'
      + (shown.length ? shown.map(function (d) {
        var cls = d.stage === 'live' || d.stage === 'countersigned' || d.stage === 'mou_signed' ? 'ok' : d.stage === 'lost' ? 'no' : 'due';
        return '<div class="task" style="cursor:pointer" onclick="b2bOpen(\'' + h(d._id) + '\')"><div class="tk" style="flex:1"><b>' + h(d.name) + '</b>'
          + '<p>' + h([B.KINDS[d.kind] || '', d.city, isAdmin() ? d.ownerName : ''].filter(Boolean).join(' · ')) + '<br>' + h(B.nextStep(d, t)) + '</p></div>'
          + '<span class="pay-tag ' + cls + '">' + h(B.stageLabel(d.stage)) + '</span></div>';
      }).join('') : '<p class="note">' + (deals.length ? 'Nothing in this view.' : 'No deals yet. Tap <b>New deal</b> after your first call. It takes three fields.') + '</p>');
  }
  function txRow(x) {
    var cls = x.status === 'verified' ? 'ok' : x.status === 'rejected' ? 'no' : 'due';
    return '<div class="pn-row"><span style="flex:1">' + h(B.TXN_KINDS[x.kind] || x.kind) + ' · ' + h(x.dealName || '') + '<br><span class="dk-note" style="margin:0">' + h([x.date, B.TXN_METHODS[x.method], x.ref, isAdmin() ? x.enteredByName : ''].filter(Boolean).join(' · ')) + (x.proofUrl ? ' · <a href="' + h(x.proofUrl) + '" target="_blank" rel="noopener">proof</a>' : '') + '</span></span>'
      + '<b>' + h(B.inr(x.amount)) + '</b> <span class="pay-tag ' + cls + '">' + h(x.status) + '</span>'
      + (isAdmin() && x.status === 'reported' ? ' <button class="btn" onclick="event.stopPropagation();b2bTxnDecide(\'' + h(x._id) + '\',true)">&#10003;</button><button class="btn" onclick="event.stopPropagation();b2bTxnDecide(\'' + h(x._id) + '\',false)">&#10005;</button>' : '') + '</div>';
  }

  /* ---------------- new / edit deal ---------------- */
  function dealForm(d) {
    d = d || {}; var ls = d.longStay || {};
    return field('bd_name', 'Business name *', 'placeholder="e.g. Hygge Home Manali"', d.name)
      + select('bd_kind', 'Type', B.KINDS, d.kind || 'stay')
      + field('bd_city', 'City / area *', 'placeholder="e.g. Kasar Devi, Almora"', d.city)
      + field('bd_contact', 'Owner or manager name', '', d.contact)
      + field('bd_phone', 'Phone', 'type="tel" inputmode="numeric"', d.phone)
      + field('bd_email', 'Email', 'type="email"', d.email)
      + field('bd_next', 'Follow up on', 'type="date"', d.nextAt)
      + '<label class="lab" style="margin-top:10px;display:block">Notes from the call</label><textarea id="bd_note" class="inp" rows="2">' + h(d.note || '') + '</textarea>'
      + '<details style="margin-top:12px"' + (d.plan && d.plan !== 'free' || d.listingFee || d.longStay || d.bookingModel === 'net' ? ' open' : '') + '><summary class="lab" style="cursor:pointer">MOU terms (leave as is for the standard free plan)</summary>'
      + select('bd_plan', 'Plan', B.PLANS, d.plan || 'free')
      + select('bd_model', 'Booking method', { commission: 'Commission on completed stays', net: 'Protected net rate (no commission)' }, d.bookingModel || 'commission')
      + field('bd_fee', 'Assisted setup fee in Rs (only if agreed; max 10,000)', 'type="number" inputmode="numeric" placeholder="0"', d.listingFee || '')
      + '<p class="dk-note">Long stays (15 nights or more). Fill only if they offer monthly rates.</p>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px">'
      + '<input id="bd_r15" class="inp" type="number" placeholder="15 nights Rs" value="' + h(ls.r15 || '') + '"><input id="bd_r30" class="inp" type="number" placeholder="1 month Rs" value="' + h(ls.r30 || '') + '"><input id="bd_r90" class="inp" type="number" placeholder="3 mo / month" value="' + h(ls.r90 || '') + '"></div>'
      + '<input id="bd_incl" class="inp" placeholder="Included: Wi-Fi, electricity, meals..." value="' + h(ls.incl || '') + '">'
      + '</details>';
  }
  function readDeal() {
    var v = function (id) { var e = $(id); return e ? e.value : ''; };
    var ls = (v('bd_r15') || v('bd_r30') || v('bd_r90')) ? { r15: v('bd_r15'), r30: v('bd_r30'), r90: v('bd_r90'), incl: v('bd_incl') } : null;
    return B.cleanDeal({ name: v('bd_name'), kind: v('bd_kind'), city: v('bd_city'), contact: v('bd_contact'), phone: v('bd_phone'), email: v('bd_email'), nextAt: v('bd_next'), note: v('bd_note'), plan: v('bd_plan'), bookingModel: v('bd_model'), listingFee: v('bd_fee'), longStay: ls });
  }
  window.b2bNewDeal = function () {
    window.showModal('<div class="card" style="max-height:86vh;overflow:auto"><h3 style="margin:0 0 4px">New deal</h3><p class="note">Name and city are enough to start. Everything else can be added later.</p>' + dealForm()
      + '<div style="display:flex;gap:8px;margin-top:14px"><button class="btn go" style="flex:1;padding:11px" onclick="b2bSaveDeal()">Save</button><button class="btn" style="padding:11px" onclick="closeModal()">Cancel</button></div></div>');
  };
  window.b2bEditDeal = function (id) {
    var d = dealById(id); if (!d) return;
    window.showModal('<div class="card" style="max-height:86vh;overflow:auto"><h3 style="margin:0 0 4px">Edit ' + h(d.name) + '</h3>' + dealForm(d)
      + '<div style="display:flex;gap:8px;margin-top:14px"><button class="btn go" style="flex:1;padding:11px" onclick="b2bSaveDeal(\'' + h(id) + '\')">Save</button><button class="btn" style="padding:11px" onclick="b2bOpen(\'' + h(id) + '\')">Back</button></div></div>');
  };
  window.b2bSaveDeal = function (id) {
    var c = readDeal(); if (!c.ok) { alert(c.problems.join('\n')); return; }
    var now = new Date().toISOString(), rec = c.value; rec.updatedAt = now;
    var col = window.db.collection('b2bDeals'), p;
    if (id) {
      var old = dealById(id) || {};
      if (!rec.longStay && old.longStay) rec.longStay = window.firebase.firestore.FieldValue.delete();
      p = col.doc(id).update(rec).then(function () { return id; });
    } else {
      if (deals.some(function (x) { return String(x.name).toLowerCase() === rec.name.toLowerCase() && String(x.city).toLowerCase() === rec.city.toLowerCase(); })) { alert(rec.name + ' in ' + rec.city + ' is already in your deals.'); return; }
      rec.ownerUid = window.user.uid; rec.ownerName = B.clip(window.user.displayName || window.user.email || '', 80); rec.stage = 'lead'; rec.createdAt = now;
      p = col.add(rec).then(function (r) { return r.id; });
    }
    p.then(function (did) { toast('Saved'); reloadThen(function () { window.b2bOpen(did); }); }).catch(fail);
  };
  function reloadThen(fn) {
    var uid = window.user.uid, dq = window.db.collection('b2bDeals'), tq = window.db.collection('b2bTxns');
    if (!isAdmin()) { dq = dq.where('ownerUid', '==', uid); tq = tq.where('enteredBy', '==', uid); }
    Promise.all([dq.limit(400).get(), tq.limit(600).get()]).then(function (r) {
      deals = []; txns = [];
      r[0].forEach(function (d) { var x = d.data() || {}; x._id = d.id; deals.push(x); });
      r[1].forEach(function (d) { var x = d.data() || {}; x._id = d.id; txns.push(x); });
      deals.sort(function (a, b) { return String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')); });
      txns.sort(function (a, b) { return String(b.at || '').localeCompare(String(a.at || '')); });
      paint(); if (fn) fn();
    }).catch(function () { paint(); });
  }

  /* ---------------- deal sheet ---------------- */
  function mou(d, opts) { opts = opts || {}; return B.mouLink(d, { origin: location.origin.indexOf('roamwise.co.in') > -1 ? location.origin : 'https://roamwise.co.in', dealId: d._id, token: d.mouToken, print: opts.print }); }
  window.b2bOpen = function (id) {
    var d = dealById(id); if (!d) return;
    var frozen = !isAdmin() && B.STAFF_STAGES.indexOf(d.stage) < 0;
    var mine = txns.filter(function (x) { return x.dealId === id; });
    var isPartner = d.kind !== 'package' && d.kind !== 'campus' && d.kind !== 'corporate';
    var out = '<div class="card" style="max-height:88vh;overflow:auto"><div style="display:flex;gap:8px;align-items:flex-start"><h3 style="margin:0;flex:1">' + h(d.name) + '</h3><button class="btn" onclick="closeModal()">Close</button></div>'
      + '<p class="note" style="margin:4px 0 8px">' + h([B.KINDS[d.kind], d.city, d.contact].filter(Boolean).join(' · ')) + '</p>'
      + '<div class="pn-row"><span style="flex:1"><b>' + h(B.stageLabel(d.stage)) + '</b><br><span class="dk-note" style="margin:0">' + h(B.nextStep(d, today())) + '</span></span></div>'
      + (d.note ? '<p class="dk-note">' + h(d.note) + '</p>' : '')
      + '<div style="display:flex;gap:6px;flex-wrap:wrap;margin:10px 0">'
      + (d.phone ? '<a class="btn" style="text-decoration:none" href="tel:+91' + h(d.phone) + '">&#128222; Call</a><a class="btn" style="text-decoration:none" target="_blank" rel="noopener" href="https://wa.me/91' + h(d.phone) + '">WhatsApp</a>' : '')
      + (frozen ? '' : '<button class="btn" onclick="b2bEditDeal(\'' + h(id) + '\')">&#9998; Edit</button>')
      + '</div>';
    if (!frozen) {
      out += '<div class="dk-lab">MOVE THE DEAL</div><div style="display:flex;gap:6px;flex-wrap:wrap">'
        + B.STAGES.filter(function (s) { return isAdmin() ? s.who !== 'system' || d.stage === 'mou_signed' : s.who === 'staff'; }).filter(function (s) { return s.id !== d.stage && s.id !== 'mou_sent' && s.id !== 'mou_signed'; }).map(function (s) { return '<button class="btn" onclick="b2bStage(\'' + h(id) + '\',\'' + s.id + '\')">' + h(s.label) + '</button>'; }).join('') + '</div>';
    }
    if (isPartner) {
      out += '<div class="dk-lab">MOU</div>';
      if (d.mouSignedAt) out += '<div class="dk-done">&#9989; Signed by ' + h(d.mouSignedBy || 'the partner') + (d.mouSignedDesig ? ' (' + h(d.mouSignedDesig) + ')' : '') + ' on ' + h(new Date(d.mouSignedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })) + ' IST. Recorded automatically when they signed.</div>';
      else if (d.mouSignedLink) out += '<div class="dk-note">Signed copy link saved. Mohit checks it and countersigns.</div>';
      out += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">'
        + (d.mouSignedAt ? '' : '<button class="btn go" style="padding:11px" onclick="b2bMouSend(\'' + h(id) + '\',\'wa\')">Send on WhatsApp</button><button class="btn" style="padding:11px" onclick="b2bMouSend(\'' + h(id) + '\',\'copy\')">Copy signing link</button>')
        + '<button class="btn" style="padding:11px" onclick="b2bMouSend(\'' + h(id) + '\',\'open\')">Preview</button>'
        + '<button class="btn" style="padding:11px" onclick="b2bMouSend(\'' + h(id) + '\',\'pdf\')">Download PDF</button></div>'
        + (d.mouSignedAt || frozen ? '' : '<p class="dk-note">If they signed and sent you the signed link on WhatsApp instead, paste it here:</p><div style="display:flex;gap:6px"><input id="bd_signed" class="inp" style="margin:0" placeholder="https://roamwise.co.in/partner/mou/?..."><button class="btn" onclick="b2bSignedLink(\'' + h(id) + '\')">Save</button></div>')
        + (d.stage === 'countersigned' || d.stage === 'live' ? '<p class="dk-note">Next: send them the registration link from <b>Sign-up links</b> so their rooms and rates go in.</p>' : '');
    }
    if (d.pkg) out += '<div class="dk-lab">PACKAGE QUOTED</div><div class="pn-row"><span style="flex:1">' + h(d.pkg.name) + ' · ' + h(d.pkg.n) + ' travellers' + (d.pkg.start ? ' · ' + h(d.pkg.start) : '') + '</span><b>' + h(B.inr(d.pkg.groupTotal)) + '</b></div>';
    out += '<div class="dk-lab">PAYMENTS</div>' + (mine.length ? mine.map(txRow).join('') : '<div class="dk-note" style="margin-top:0">Nothing reported yet.</div>')
      + '<button class="btn" style="width:100%;padding:11px;margin-top:8px" onclick="b2bTxn(\'' + h(id) + '\')">&#8377; Report a payment received</button>'
      + (isAdmin() && (d.stage === 'countersigned') ? '<button class="btn go" style="width:100%;padding:11px;margin-top:8px" onclick="b2bPublish(\'' + h(id) + '\')">Make live in the app</button>' : '')
      + '</div>';
    window.showModal(out);
  };
  window.b2bStage = function (id, stage) {
    var d = dealById(id); if (!d) return;
    if (stage === 'lost' && !confirm('Mark ' + d.name + ' as not going ahead?')) return;
    window.db.collection('b2bDeals').doc(id).update({ stage: stage, updatedAt: new Date().toISOString() }).then(function () { reloadThen(function () { window.b2bOpen(id); }); }).catch(fail);
  };
  /* Preparing a link gives the deal its signing token once and marks it MOU sent when it is actually shared. */
  window.b2bMouSend = function (id, how) {
    var d = dealById(id); if (!d) return;
    /* Open the tab inside the tap itself; a window opened after the save would be blocked on phones. */
    var tab = how === 'copy' ? null : window.open('about:blank', '_blank');
    var ready = Promise.resolve();
    var share = how === 'wa' || how === 'copy';
    var canWrite = isAdmin() || B.STAFF_STAGES.indexOf(d.stage) > -1;
    if (canWrite && !d.mouSignedAt && (!d.mouToken || (share && d.stage !== 'mou_sent'))) {
      var patch = { updatedAt: new Date().toISOString() };
      if (!d.mouToken) patch.mouToken = d.mouToken = B.newToken();
      if (share && (d.stage === 'lead' || d.stage === 'pitched')) { patch.stage = d.stage = 'mou_sent'; patch.mouSentAt = d.mouSentAt = patch.updatedAt; }
      ready = window.db.collection('b2bDeals').doc(id).update(patch);
    }
    ready.then(function () {
      var link = mou(d), go = function (u) { if (tab) tab.location.href = u; else window.open(u, '_blank'); };
      if (how === 'copy') copy(link, 'Signing link copied');
      else if (how === 'wa') go('https://wa.me/' + (d.phone ? '91' + d.phone : '') + '?text=' + encodeURIComponent(B.mouMessage(d, link)));
      else if (how === 'pdf') go(mou(d, { print: true }));
      else go(link);
      paint(); if (share) window.b2bOpen(id);
    }).catch(function (e) { if (tab) tab.close(); fail(e); });
  };
  window.b2bSignedLink = function (id) {
    var raw = ($('bd_signed') || {}).value || '', s = B.parseSignedLink(raw);
    if (!s) { alert('That is not a signed RoamWise MOU link. Ask them to tap "Send to RoamWise on WhatsApp" after signing and paste that link.'); return; }
    window.db.collection('b2bDeals').doc(id).update({ mouSignedLink: raw.trim().slice(0, 1200), stage: 'mou_sent', updatedAt: new Date().toISOString() })
      .then(function () { toast('Saved. Mohit will check and countersign'); reloadThen(function () { window.b2bOpen(id); }); }).catch(fail);
  };

  /* ---------------- payments ---------------- */
  window.b2bTxn = function (id) {
    var d = dealById(id); if (!d) return;
    window.showModal('<div class="card" style="max-height:86vh;overflow:auto"><h3 style="margin:0 0 4px">Payment received · ' + h(d.name) + '</h3>'
      + '<p class="note">Report only money that has actually reached the RoamWise account. Mohit matches it against the bank and marks it verified.</p>'
      + select('bt_kind', 'What was it for', B.TXN_KINDS, d.pkg ? 'package_deposit' : 'plan_fee')
      + field('bt_amt', 'Amount in Rs *', 'type="number" inputmode="decimal"', '')
      + select('bt_method', 'Paid by', B.TXN_METHODS, 'upi')
      + field('bt_ref', 'UPI / bank reference (UTR) *', 'placeholder="12-digit UTR or order id"', '')
      + field('bt_date', 'Date paid *', 'type="date"', today())
      + field('bt_proof', 'Screenshot link (Drive, optional)', 'placeholder="https://"', '')
      + field('bt_note', 'Note', '', '')
      + '<div style="display:flex;gap:8px;margin-top:14px"><button class="btn go" style="flex:1;padding:11px" onclick="b2bSaveTxn(\'' + h(id) + '\')">Report payment</button><button class="btn" style="padding:11px" onclick="b2bOpen(\'' + h(id) + '\')">Back</button></div></div>');
  };
  window.b2bSaveTxn = function (id) {
    var d = dealById(id); if (!d) return; var v = function (i) { return ($(i) || {}).value || ''; };
    var c = B.cleanTxn({ kind: v('bt_kind'), amount: v('bt_amt'), method: v('bt_method'), ref: v('bt_ref'), date: v('bt_date'), proofUrl: v('bt_proof'), note: v('bt_note') });
    if (!c.ok) { alert(c.problems.join('\n')); return; }
    if (c.value.ref && txns.some(function (x) { return x.ref && x.ref === c.value.ref; })) { alert('A payment with reference ' + c.value.ref + ' is already reported.'); return; }
    var rec = c.value; rec.dealId = id; rec.dealName = d.name; rec.enteredBy = window.user.uid; rec.enteredByName = B.clip(window.user.displayName || '', 80); rec.status = 'reported'; rec.at = new Date().toISOString();
    window.db.collection('b2bTxns').add(rec).then(function () { toast('Reported. Waiting for Mohit to verify'); reloadThen(function () { window.b2bOpen(id); }); }).catch(fail);
  };
  /* Founder only. RoamWise's own income (plan fee, setup fee, commission) also goes to the finance ledger.
     Package money is collected on behalf of the stay, driver and guide, so it is NOT booked as revenue here. */
  window.b2bTxnDecide = function (tid, ok) {
    if (!isAdmin()) return; var x = null; txns.forEach(function (t) { if (t._id === tid) x = t; }); if (!x) return;
    if (!confirm((ok ? 'Verified against the bank: ' : 'Reject: ') + B.inr(x.amount) + ' · ' + (x.dealName || '') + ' · ref ' + (x.ref || 'none') + '?')) return;
    var now = new Date().toISOString(), own = ok && (x.kind === 'plan_fee' || x.kind === 'setup_fee' || x.kind === 'commission');
    window.db.collection('b2bTxns').doc(tid).update({ status: ok ? 'verified' : 'rejected', decidedBy: window.user.uid, decidedAt: now, ledgered: own })
      .then(function () { return own ? window.db.collection('ledger').add({ kind: 'revenue', what: (B.TXN_KINDS[x.kind] || 'B2B') + ' · ' + (x.dealName || ''), amount: Number(x.amount), at: x.date || now.slice(0, 10), enteredBy: window.user.uid, source: 'b2b', b2bTxnId: tid, ref: x.ref || '' }) : null; })
      .then(function () { toast(ok ? (own ? 'Verified and added to the ledger' : 'Verified. Package money is not booked as revenue here') : 'Rejected'); reloadThen(); }).catch(fail);
  };
  /* Founder only: a countersigned partner goes into config/partners (the list the app reads) and the deal becomes live. */
  window.b2bPublish = function (id) {
    if (!isAdmin()) return; var d = dealById(id); if (!d) return;
    var cat = { stay: 'stay', adventure: 'adventure', transport: 'transport', agency: 'agency', creator: 'creator' }[d.kind] || 'listing', ref = window.db.collection('config').doc('partners');
    ref.get().then(function (snap) {
      var list = (snap.exists && Array.isArray((snap.data() || {}).list)) ? snap.data().list : [];
      if (!list.some(function (p) { return String(p.name || '').toLowerCase() === String(d.name).toLowerCase(); })) {
        list.push({ id: 'p_' + String(d.name).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 18) + '_' + Date.now().toString(36).slice(-4), name: d.name, cat: cat, zone: d.city, area: '', person: d.contact || '', phone: d.phone || '', email: d.email || '', rating: null, reviews: null, hook: '', verified: 'signed', commissionPct: (B.PLANS[d.plan] || B.PLANS.free).pct, addedBy: d.ownerUid || '', addedByName: d.ownerName || '', at: new Date().toISOString() });
        return ref.set({ list: list, updatedAt: new Date().toISOString() }, { merge: true });
      }
    }).then(function () { return window.db.collection('b2bDeals').doc(id).update({ stage: 'live', updatedAt: new Date().toISOString() }); })
      .then(function () { toast(d.name + ' is live'); reloadThen(function () { window.b2bOpen(id); }); }).catch(fail);
  };

  /* ---------------- package quote ---------------- */
  var pk = null;
  window.b2bPackage = function () {
    window.showModal('<div class="card"><p class="note">Loading packages…</p></div>');
    (pk ? Promise.resolve(pk) : import('../packages/catalog.mjs').then(function (m) { pk = m; return m; })).then(function () {
      var ids = Object.keys(pk.PACKAGES), sizes = []; for (var n = pk.GROUP.min; n <= pk.GROUP.max; n++) sizes.push(n);
      window.showModal('<div class="card" style="max-height:88vh;overflow:auto"><h3 style="margin:0 0 4px">Package quote</h3><p class="note">Prices come straight from the live package page, so what you quote is what they see.</p>'
        + '<label class="lab" style="margin-top:10px;display:block">Package</label><select id="bp_pkg" class="inp" onchange="b2bPkPaint()">' + ids.map(function (k) { var p = pk.PACKAGES[k]; return '<option value="' + h(k) + '">' + h(p.name) + (p.status === 'open' ? '' : ' (opening soon)') + '</option>'; }).join('') + '</select>'
        + '<label class="lab" style="margin-top:10px;display:block">Travellers</label><select id="bp_n" class="inp" onchange="b2bPkPaint()">' + sizes.map(function (n) { return '<option' + (n === pk.GROUP.default ? ' selected' : '') + '>' + n + '</option>'; }).join('') + '</select>'
        + select('bp_veh', 'Vehicle', { single: 'One vehicle for the group', cheapest: 'Smaller cars (cheapest)', premium: 'Premium van' }, 'single')
        + '<label style="display:flex;gap:8px;align-items:center;margin-top:10px;font-size:13px"><input type="checkbox" id="bp_kit" checked onchange="b2bPkPaint()"> Yaadein keepsake kit</label>'
        + field('bp_start', 'Start date (if they have one)', 'type="date" onchange="b2bPkPaint()"', '')
        + field('bp_who', 'Group or contact name', 'placeholder="e.g. NMIMS E-Cell, Rohan"', '')
        + field('bp_phone', 'Their WhatsApp number', 'type="tel" inputmode="numeric"', '')
        + '<div id="bp_out" style="margin-top:12px"></div></div>');
      $('bp_veh').onchange = window.b2bPkPaint; window.b2bPkPaint();
    }).catch(function () { window.showModal('<div class="card"><p class="note">Could not load the package list. Check your connection and try again.</p><button class="btn" onclick="closeModal()">Close</button></div>'); });
  };
  function pkRead() {
    var id = $('bp_pkg').value, n = parseInt($('bp_n').value, 10), opts = { vehicle: $('bp_veh').value, kit: $('bp_kit').checked };
    return { id: id, n: n, opts: opts, start: $('bp_start').value, pkg: pk.PACKAGES[id], price: pk.priceFor(id, n, opts), link: 'https://roamwise.co.in/packages/?destination=' + encodeURIComponent(id) };
  }
  window.b2bPkPaint = function () {
    var q = pkRead(), out = $('bp_out'); if (!out) return;
    if (!q.price) { out.innerHTML = '<p class="note">No published price for that group size and vehicle. Pick another combination; do not quote a number that is not on the page.</p>'; return; }
    out.innerHTML = '<div class="pn-row"><span style="flex:1">Per person (GST included)</span><b>' + h(B.inr(q.price.totalPP)) + '</b></div>'
      + '<div class="pn-row"><span style="flex:1">Group total</span><b>' + h(B.inr(q.price.groupTotal)) + '</b></div>'
      + (q.pkg.status === 'open' ? '' : '<p class="dk-note">' + h(q.pkg.statusNote || 'Opening soon.') + ' Take interest only, no deposit.</p>')
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px"><button class="btn go" style="padding:11px" onclick="b2bPkSend(\'wa\')">Send on WhatsApp</button><button class="btn" style="padding:11px" onclick="b2bPkSend(\'copy\')">Copy quote</button></div>'
      + '<button class="btn" style="width:100%;padding:11px;margin-top:8px" onclick="b2bPkSend(\'save\')">Save as a deal</button><button class="btn" style="width:100%;padding:11px;margin-top:8px" onclick="closeModal()">Close</button>';
  };
  window.b2bPkSend = function (how) {
    var q = pkRead(); if (!q.price) return;
    var msg = B.packageMessage(q.pkg, q.n, q.start, q.price, q.link), ph = B.phone($('bp_phone').value), who = B.clip($('bp_who').value, 110);
    if (how === 'copy') { copy(msg, 'Quote copied'); return; }
    if (how === 'wa') { window.open('https://wa.me/' + (ph ? '91' + ph : '') + '?text=' + encodeURIComponent(msg), '_blank'); return; }
    if (who.length < 2) { alert('Add the group or contact name to save this as a deal.'); return; }
    var now = new Date().toISOString();
    window.db.collection('b2bDeals').add({ ownerUid: window.user.uid, ownerName: B.clip(window.user.displayName || window.user.email || '', 80), name: who, kind: 'package', city: q.pkg.name, contact: '', phone: ph, email: '', plan: 'free', bookingModel: 'commission', listingFee: 0, note: '', nextAt: '', stage: 'pitched',
      pkg: { id: q.id, name: q.pkg.name, n: q.n, start: q.start || '', vehicle: q.opts.vehicle, kit: q.opts.kit, totalPP: q.price.totalPP, groupTotal: q.price.groupTotal }, createdAt: now, updatedAt: now })
      .then(function (r) { toast('Saved'); reloadThen(function () { window.b2bOpen(r.id); }); }).catch(fail);
  };

  /* ---------------- self sign-up links ---------------- */
  var LINKS = [
    ['Homestay or hotel', '/partner/join/', 'They list rooms, rates and photos themselves in about 3 minutes.'],
    ['Trek company, guide or transport', '/treks/#studio', 'They add their own departures; Mohit reviews before anything is sold.'],
    ['Space for remote workers (long stays)', '/nomads/join/', 'Monthly rates, Wi-Fi and work setup.'],
    ['Local provider (driver, guide, cook)', '/providers/join/', 'Verified provider listing.'],
    ['Yoga / wellness teacher', '/yoga/', 'Commission and a bookable listing.'],
    ['Artist', '/creators/join-artist.html', 'Free page to sell their own work.'],
    ['Creator / influencer', '/join/', 'Creator network application.']
  ];
  window.b2bLinks = function () {
    window.showModal('<div class="card" style="max-height:88vh;overflow:auto"><h3 style="margin:0 0 4px">Sign-up links</h3><p class="note">Send the right link and they fill in their own details. You do not type anything for them, and nothing goes live until it is reviewed.</p>'
      + LINKS.map(function (l, i) { return '<div class="task"><div class="tk" style="flex:1"><b>' + h(l[0]) + '</b><p>' + h(l[2]) + '</p></div><button class="btn" onclick="b2bLink(' + i + ',\'wa\')">WhatsApp</button><button class="btn" onclick="b2bLink(' + i + ',\'copy\')">Copy</button></div>'; }).join('')
      + '<button class="btn" style="width:100%;padding:11px;margin-top:10px" onclick="closeModal()">Close</button></div>');
  };
  window.b2bLink = function (i, how) {
    var l = LINKS[i], url = 'https://roamwise.co.in' + l[1];
    if (how === 'copy') copy(url, 'Link copied');
    else window.open('https://wa.me/?text=' + encodeURIComponent('Namaste, here is the RoamWise sign-up link (' + l[0].toLowerCase() + '). It takes a few minutes and you fill in your own details:\n' + url), '_blank');
  };
  window.b2bHelp = function () {
    window.showModal('<div class="card" style="max-height:88vh;overflow:auto"><h3 style="margin:0 0 8px">How the B2B desk works</h3>'
      + ['<b>1. New deal</b> after every first call. Name and city are enough.', '<b>2. Send the MOU</b> from the deal. They read it and sign on their phone. The moment they sign, the deal turns to "MOU signed" by itself.', '<b>3. Mohit countersigns.</b> You cannot sign for RoamWise, and you never need to.', '<b>4. Send the sign-up link</b> so they add their own rooms, rates and photos.', '<b>5. Package quote</b> for groups: pick the package and size, send the quote. Prices come from the live page.', '<b>6. Report a payment</b> only when money has reached the RoamWise account, with the UTR. Mohit verifies it. Reported money is never counted as received.'].map(function (t) { return '<p class="note" style="margin:8px 0">' + t + '</p>'; }).join('')
      + '<button class="btn" style="width:100%;padding:11px;margin-top:6px" onclick="closeModal()">Got it</button></div>');
  };
  window.b2bFilter = function (f) { state.filter = f; paint(); };
  window.b2bReload = function () { state.error = ''; load(); };
  /* Called by the staff page once the signed-in person's role is known. */
  window.b2bDeskInit = function () {
    var box = $('b2bBox'); if (!box) return;
    box.style.display = allowed() ? 'block' : 'none';
    if (allowed()) load();
  };
})();
