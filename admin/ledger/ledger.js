/* admin/ledger/ledger.js — read-only view of the company ledger (worker/handlers/company-ledger.js).
   Founder/admin only. ?demo=1 shows sample numbers without signing in. */
(function () {
  'use strict';
  var API = 'https://roamwise-api.founder-f53.workers.dev';
  var $ = function (id) { return document.getElementById(id); };
  var inr = function (n) { return '₹' + Number(n || 0).toLocaleString('en-IN'); };
  var DEMO = new URLSearchParams(location.search).has('demo');
  var idToken = '';
  var SAMPLE = { at: new Date().toISOString(), promoCap: 50000, ok: false,
    accounts: { wallets: 12, guestCash: 18500, refundInTransit: 6000, bonusLiability: 4200, bonusIssuedThisMonth: 3000, stays: 5, collected: 142000, partnerPayable: 72000, marginBooked: 21000, marginEarned: 17000, earningsPayable: 6000, heldForOthers: 96500 },
    earnings: [{ property: 'Sample Resort, Corbett', stays: 3, collected: 96000, booked: 42000, earned: 30000, netKnown: true }, { property: 'Sample Homestay, Almora', stays: 2, collected: 46000, booked: 0, earned: 0, netKnown: false }],
    alerts: [{ code: 'partner_amount_unknown', message: '1 paid stay(s) have no supplier amount on record, so what is owed to the property is not counted.' }] };

  function card(cls, label, value, note) {
    var d = document.createElement('div'); d.className = 'lg-card ' + cls;
    var s = document.createElement('small'); s.textContent = label;
    var b = document.createElement('b'); b.textContent = value;
    var n = document.createElement('small'); n.textContent = note;
    d.append(s, b, n); return d;
  }
  function render(l) {
    var a = l.accounts;
    $('lAt').textContent = 'Snapshot: ' + new Date(l.at).toLocaleString('en-IN') + (DEMO ? ' (sample data)' : '');
    var al = $('lAlerts'); al.replaceChildren();
    if (!l.alerts.length) { var ok = document.createElement('div'); ok.className = 'lg-ok'; ok.textContent = 'No alerts.'; al.append(ok); }
    l.alerts.forEach(function (x) { var d = document.createElement('div'); d.className = 'lg-alert'; d.textContent = x.message; al.append(d); });
    var c = $('lCards'); c.replaceChildren(
      card('lg-owed', 'Held for others (not ours to spend)', inr(a.heldForOthers), 'Guest cash + owed to properties + unpaid earnings'),
      card('lg-owed', 'Guest cash in ' + a.wallets + ' wallets', inr(a.guestCash), inr(a.refundInTransit) + ' already going back to banks'),
      card('lg-owed', 'Owed to properties', inr(a.partnerPayable), 'On ' + a.stays + ' live paid stays'),
      card('lg-owed', 'Earnings waiting to be paid', inr(a.earningsPayable), 'Creators, artists and partners'),
      card('lg-coin', 'Bonus coins unspent', inr(a.bonusLiability), inr(a.bonusIssuedThisMonth) + ' issued this month of ' + inr(l.promoCap) + ' cap'),
      card('lg-ours', 'RoamWise margin earned', inr(a.marginEarned), 'Stays finished 48 hours ago'),
      card('lg-ours', 'RoamWise margin booked', inr(a.marginBooked), 'Not ours until the stay is done'));
    var rows = $('lRows'); rows.replaceChildren();
    l.earnings.forEach(function (e) {
      var tr = document.createElement('tr');
      [e.property + (e.netKnown ? '' : ' (amount owed not on record)'), e.stays, inr(e.collected), inr(e.booked), inr(e.earned)].forEach(function (v) { var td = document.createElement('td'); td.textContent = v; tr.append(td); });
      rows.append(tr);
    });
    if (!l.earnings.length) { var tr = document.createElement('tr'), td = document.createElement('td'); td.colSpan = 5; td.textContent = 'No live paid stays.'; tr.append(td); rows.append(tr); }
  }
  function call(path, method, body) {
    return fetch(API + '/' + path, { method: method || 'GET', headers: { authorization: 'Bearer ' + idToken, 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }).then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); });
  }
  function load(path, method) {
    $('lMsg').textContent = 'Loading…';
    call(path || 'admin/ledger', method).then(function (r) {
      if (!r.ok) { $('lMsg').textContent = r.d.message || 'Could not load the ledger.'; return; }
      render(r.d.ledger); $('lMsg').textContent = '';
    }).catch(function () { $('lMsg').textContent = 'Could not reach RoamWise.'; });
  }
  var SAMPLE_E = [{ email: 'asha@example.com', role: 'creator', name: 'Asha (sample)', summary: { thisMonth: 6000, monthlyCap: 10000, available: 6000, paid: 4000, taxWatch: false } },
    { email: 'stay@example.com', role: 'property', name: 'Sample Homestay', summary: { thisMonth: 24000, monthlyCap: null, available: 0, paid: 24000, taxWatch: true } }];
  function renderE(list) {
    var rows = $('eRows'); rows.replaceChildren();
    list.forEach(function (p) {
      var s = p.summary, tr = document.createElement('tr');
      var who = document.createElement('td'); who.textContent = (p.name || p.email) + ' · ' + p.email;
      if (s.taxWatch) { var t = document.createElement('span'); t.className = 'lg-tax'; t.textContent = 'Over the yearly tax-deduction watch level: check with your CA before paying'; who.append(t); }
      tr.append(who);
      [p.role, inr(s.thisMonth) + (s.monthlyCap ? ' / ' + inr(s.monthlyCap) : ''), inr(s.available), inr(s.paid)].forEach(function (v) { var td = document.createElement('td'); td.textContent = v; tr.append(td); });
      var pay = document.createElement('td');
      if (s.available > 0) {
        var w = document.createElement('div'); w.className = 'lg-pay';
        var ref = document.createElement('input'); ref.placeholder = 'UPI / bank ref'; ref.setAttribute('aria-label', 'Payment reference for ' + p.email);
        var b = document.createElement('button'); b.className = 'hb-btn'; b.type = 'button'; b.textContent = 'Mark paid';
        b.onclick = function () {
          if (DEMO) { $('eMsg').textContent = 'Sample data: nothing saved.'; return; }
          call('admin/earnings/paid', 'POST', { email: p.email, ref: ref.value }).then(function (r) { $('eMsg').textContent = r.ok ? 'Marked ' + inr(r.d.paid) + ' as paid.' : (r.d.message || 'Could not save.'); if (r.ok) loadE(); });
        };
        w.append(ref, b); pay.append(w);
      }
      tr.append(pay); rows.append(tr);
    });
    if (!list.length) { var tr = document.createElement('tr'), td = document.createElement('td'); td.colSpan = 6; td.textContent = 'No earnings recorded yet.'; tr.append(td); rows.append(tr); }
  }
  function loadE() { call('admin/earnings').then(function (r) { if (r.ok) renderE(r.d.accounts); }).catch(function () {}); }
  $('eAdd').onsubmit = function (e) {
    e.preventDefault();
    if (DEMO) { $('eMsg').textContent = 'Sample data: nothing saved.'; return; }
    call('admin/earnings/add', 'POST', { email: $('eEmail').value, name: $('eName').value, role: $('eRole').value, amount: Number($('eAmt').value), note: $('eNote').value }).then(function (r) {
      if (!r.ok) { $('eMsg').textContent = (r.d.message || 'Could not add.') + (r.d.capLeft != null ? ' Room left this month: ' + inr(r.d.capLeft) + '.' : ''); return; }
      $('eMsg').textContent = 'Added.' + (r.d.taxWatch ? ' This person is now over the yearly tax-deduction watch level.' : ''); $('eAmt').value = ''; $('eNote').value = ''; loadE();
    });
  };
  $('lRun').onclick = function () { if (DEMO) { render(SAMPLE); return; } load('admin/ledger/run', 'POST'); };
  if (DEMO) { $('lMain').hidden = false; render(SAMPLE); renderE(SAMPLE_E); return; }
  var auth;
  try { firebase.initializeApp(window.RW_PARTNER_CONFIG.firebase); auth = firebase.auth(); } catch (e) { $('lAuth').hidden = false; $('lAuthMsg').textContent = 'Sign-in is not available right now.'; return; }
  auth.onAuthStateChanged(function (u) {
    $('lAuth').hidden = !!u; $('lMain').hidden = !u;
    if (u) u.getIdToken().then(function (t) { idToken = t; load(); loadE(); });
  });
  $('lLogin').onsubmit = function (e) {
    e.preventDefault();
    auth.signInWithEmailAndPassword($('lEmail').value, $('lPass').value).catch(function () { $('lAuthMsg').textContent = 'Sign-in failed. Check the email and password.'; });
  };
})();
