/* Music store page. Prices and availability come from the Worker; this page never sends a price.
 * Server text is written with textContent only. Order tokens stay in this browser (localStorage). */
(function () {
  'use strict';
  var API = (window.RW_MUSIC_API || 'https://roamwise-api.founder-f53.workers.dev').replace(/\/$/, '');
  var $ = function (id) { return document.getElementById(id); };
  var cat = null, pick = null, busy = false, pollTimer = 0;
  var ID_RE = /^RWM-[A-HJKMNP-Z2-9]{10}$/;

  function inr(paise) { var r = paise / 100; return '₹' + r.toLocaleString('en-IN', { maximumFractionDigits: 2 }); }
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function store(k, v) { try { if (v == null) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function api(path, opts) {
    return fetch(API + path, opts).then(function (r) { return r.json().catch(function () { return {}; }).then(function (b) { return { ok: r.ok, status: r.status, body: b }; }); });
  }
  function showError(msg) { var e = $('msError'); e.textContent = msg || ''; e.hidden = !msg; }

  function renderTiers() {
    var box = $('msTierList'); box.textContent = '';
    var d = el('div', 'ms-tier'); d.appendChild(el('h3', '', 'Download')); d.appendChild(el('b', '', inr(cat.downloadPaise)));
    d.appendChild(el('p', '', cat.downloadUse)); box.appendChild(d);
    cat.tiers.forEach(function (t) {
      var c = el('div', 'ms-tier'); c.appendChild(el('h3', '', t.label)); c.appendChild(el('b', '', inr(t.pricePaise))); c.appendChild(el('p', '', t.use)); box.appendChild(c);
    });
    var ul = $('msTerms'); ul.textContent = '';
    cat.terms.forEach(function (t) { ul.appendChild(el('li', '', t)); });
  }

  function renderGrid() {
    var g = $('msGrid'); g.textContent = '';
    cat.releases.forEach(function (r) {
      var card = el('article', 'ms-card');
      var img = el('img'); img.loading = 'lazy'; img.alt = ''; img.src = 'https://i.ytimg.com/vi/' + encodeURIComponent(r.id) + '/hqdefault.jpg'; card.appendChild(img);
      card.appendChild(el('h3', '', r.title));
      var act = el('div', 'ms-actions');
      var can = cat.checkoutOpen && r.available;
      var dl = el('button', 'ms-btn', can ? 'Download ' + inr(r.pricePaise) : (cat.checkoutOpen ? 'Coming soon' : 'Opening soon'));
      dl.type = 'button'; dl.disabled = !can;
      dl.addEventListener('click', function () { choose(r, 'download'); });
      var lic = el('button', 'ms-btn ghost', 'Licence'); lic.type = 'button'; lic.disabled = !can;
      lic.addEventListener('click', function () { choose(r, 'licence'); });
      act.appendChild(dl); act.appendChild(lic); card.appendChild(act); g.appendChild(card);
    });
  }

  function setPrice() {
    $('msCoItem').textContent = (pick.kind === 'download' ? 'Download: ' : pick.tier.label + ': ') + pick.release.title + ' · ' + inr(pick.paise);
    $('msUpiOpt').hidden = !cat.methods.upi || pick.paise > cat.upiMaxPaise;
    var first = cat.methods.cashfree ? 'cashfree' : 'upi';
    if ($('msUpiOpt').hidden && cat.methods.cashfree) first = 'cashfree';
    document.querySelector('input[name="payMethod"][value="' + first + '"]').checked = true;
    $('msPay').textContent = 'Pay ' + inr(pick.paise);
  }

  function choose(release, kind) {
    pick = { release: release, kind: kind, tier: null, paise: release.pricePaise };
    var fs = $('msTierPick'); fs.textContent = ''; fs.appendChild(el('legend', '', 'Licence type'));
    if (kind === 'licence') {
      pick.tier = cat.tiers[0]; pick.paise = pick.tier.pricePaise;
      cat.tiers.forEach(function (t, i) {
        var lab = el('label', 'ms-radio'); var inp = document.createElement('input');
        inp.type = 'radio'; inp.name = 'tier'; inp.value = t.id; inp.checked = i === 0;
        inp.addEventListener('change', function () { pick.tier = t; pick.paise = t.pricePaise; setPrice(); });
        lab.appendChild(inp); lab.appendChild(document.createTextNode(' ' + t.label + ' · ' + inr(t.pricePaise) + ' — ' + t.use)); fs.appendChild(lab);
      });
    }
    fs.hidden = kind !== 'licence';
    $('msLicFields').hidden = kind !== 'licence';
    document.querySelector('input[name="payMethod"][value="cashfree"]').parentNode.hidden = !cat.methods.cashfree;
    setPrice();
    showError(''); $('msUpi').hidden = true; $('msForm').hidden = false;
    $('msCheckout').hidden = false; if ($('msCheckout').scrollIntoView) $('msCheckout').scrollIntoView({ behavior: 'smooth' });
  }

  function loadCashfree() {
    return new Promise(function (res, rej) {
      if (window.Cashfree) return res();
      var s = document.createElement('script'); s.src = 'https://sdk.cashfree.com/js/v3/cashfree.js'; s.onload = function () { res(); }; s.onerror = function () { rej(new Error('sdk')); };
      document.head.appendChild(s);
    });
  }

  function submit(ev) {
    ev.preventDefault();
    if (busy || !pick) return;
    if (!$('ms-agree').checked) return showError('Please tick the box to confirm you have read the terms.');
    var method = document.querySelector('input[name="payMethod"]:checked').value;
    var body = {
      method: method,
      item: { releaseId: pick.release.id, kind: pick.kind, tier: pick.tier ? pick.tier.id : undefined },
      buyer: { name: $('ms-name').value, phone: $('ms-phone').value, email: $('ms-email').value, licensee: $('ms-licensee').value, project: $('ms-project').value },
    };
    busy = true; $('msPay').disabled = true; showError('');
    api('/music/order', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }).then(function (r) {
      if (!r.ok) throw new Error(r.body.message || 'Could not place the order. No payment was taken.');
      var b = r.body; store('rwMusicOrder.' + b.orderId, b.token); store('rwMusicLast', b.orderId);
      if (b.method === 'upi') return showUpi(b);
      return loadCashfree().then(function () {
        var cf = window.Cashfree({ mode: b.environment === 'production' ? 'production' : 'sandbox' });
        return cf.checkout({ paymentSessionId: b.payment_session_id, redirectTarget: '_self' });
      });
    }).catch(function (e) { showError(e.message === 'sdk' ? 'Could not load the payment window. Please try again.' : e.message); })
      .then(function () { busy = false; $('msPay').disabled = false; });
  }

  function showUpi(b) {
    $('msForm').hidden = true; $('msUpi').hidden = false;
    $('msUpiAmt').textContent = '₹' + b.upi.amount; $('msUpiRef').textContent = b.orderId;
    $('msUpiOpen').href = b.upi.uri;
    var q = $('msUpiQr'); q.textContent = '';
    var s = document.createElement('script'); s.src = '../../vendor/qrcodejs/1.0.0/qrcode.min.js';
    s.onload = function () { try { new window.QRCode(q, { text: b.upi.uri, width: 180, height: 180 }); } catch (e) { /* link still works */ } };
    document.head.appendChild(s);
    watch(b.orderId);
  }

  function certificate(c) {
    var a = $('msCert'); a.textContent = '';
    a.appendChild(el('h3', '', 'Music Licence Certificate'));
    var dl = el('dl');
    [['Licence no.', c.licenceNo], ['Licence type', c.tierLabel], ['Track', c.track], ['Licensed to', c.licensee], ['Project', c.project], ['Issued', new Date(c.issuedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })], ['Licensor', c.licensor], ['Permitted use', c.use], ['Credit line', c.credit]].forEach(function (p) {
      dl.appendChild(el('dt', '', p[0])); dl.appendChild(el('dd', '', p[1] || ''));
    });
    a.appendChild(dl);
    var ol = el('ol'); c.terms.forEach(function (t) { ol.appendChild(el('li', '', t)); }); a.appendChild(ol);
    a.appendChild(el('small', '', 'Verify at roamwise.co.in/music/store/ using the licence number. Terms version ' + c.termsVersion + '.'));
    a.hidden = false; $('msPrint').hidden = false;
  }

  function renderStatus(s) {
    $('msStatus').hidden = false;
    var t = $('msStatusText');
    if (s.status === 'paid') {
      t.textContent = 'Payment confirmed for "' + s.releaseTitle + '" (' + s.label + '). Order ' + s.orderId + '.';
      if (s.download) {
        var a = $('msDownload'); a.href = s.download.url; a.textContent = 'Download ' + s.releaseTitle; a.hidden = false;
        var n = $('msDlNote'); n.textContent = 'This link works for 15 minutes; reopen this page for a fresh one. Downloads left: ' + s.download.remaining + '.'; n.hidden = false;
      }
      if (s.certificate) certificate(s.certificate);
      return true;
    }
    if (s.status === 'awaiting_upi_payment') t.textContent = 'Waiting for your UPI payment to be matched (order ' + s.orderId + '). We release the file as soon as it is confirmed.';
    else if (s.status === 'payment_setup_failed') { t.textContent = 'The payment could not be started. No money was taken.'; return true; }
    else t.textContent = 'Waiting for the payment to be confirmed (order ' + s.orderId + ').';
    return false;
  }

  function watch(id) {
    var token = store('rwMusicOrder.' + id);
    if (!token || !ID_RE.test(id)) return;
    var tries = 0;
    (function poll() {
      api('/music/order/' + id + '/status', { headers: { authorization: 'Bearer ' + token } }).then(function (r) {
        if (!r.ok) { $('msStatus').hidden = false; $('msStatusText').textContent = r.body.message || 'We could not find this order in this browser.'; return; }
        if (!renderStatus(r.body) && ++tries < 60) pollTimer = setTimeout(poll, r.body.method === 'upi' ? 30000 : 3000);
      }).catch(function () { if (++tries < 60) pollTimer = setTimeout(poll, 8000); });
    })();
  }

  function verify(ev) {
    ev.preventDefault();
    var id = $('ms-lic-no').value.trim().toUpperCase(), out = $('msVerifyOut');
    if (!ID_RE.test(id)) { out.textContent = 'That does not look like a licence number.'; return; }
    api('/music/licence/' + id).then(function (r) {
      var b = r.body;
      out.textContent = r.ok && b.valid ? 'Valid: ' + b.tier + ' for "' + b.track + '", issued to ' + b.licensee + ' on ' + new Date(b.issuedAt).toLocaleDateString('en-IN') + '.' : 'No valid licence found for that number.';
    }).catch(function () { out.textContent = 'Could not check right now. Please try again.'; });
  }

  function init() {
    $('msForm').addEventListener('submit', submit);
    $('msVerify').addEventListener('submit', verify);
    $('msPrint').addEventListener('click', function () { window.print(); });
    api('/music/catalogue').then(function (r) {
      if (!r.ok || !r.body.releases) throw new Error('x');
      cat = r.body; renderTiers(); renderGrid();
      if (!cat.checkoutOpen) { var b = $('msBanner'); b.textContent = 'The store opens soon. You can see the tracks and licence prices now.'; b.hidden = false; }
    }).catch(function () { $('msGrid').textContent = 'The store could not load right now. Please try again shortly.'; });
    var id = new URLSearchParams(location.search).get('order_id') || store('rwMusicLast');
    if (id && ID_RE.test(id) && store('rwMusicOrder.' + id)) watch(id);
  }
  init();
})();
