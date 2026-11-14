/* RoamWise wallet entry points: the header chip, the drawer link and the shared icons.
   Classic script (no modules): rwWalletIcon, rwCoinIcon and rwOpenWallet are globals so
   inline markup and other pages can use them.

   Where it lives, following MakeMyTrip, IndiGo, Uber and Amazon Pay:
   - a balance chip in the top bar next to the account avatar (signed-in users only),
   - a "Wallet" row at the top of the menu drawer,
   - the wallet page itself at /wallet/.
   Real money (refunds, prepaid packs) shows with a rupee sign. RoamWise bonus credit
   shows as gold coins: it can be spent on bookings but never sent to a bank. */
(function () {
  'use strict';
  var W = /** @type {any} */ (window);
  var API = 'https://roamwise-api.founder-f53.workers.dev';
  var LOGO = '/assets/img/roamwise-logo-176.webp';
  var PALETTES = {
    teal: { body: '#14b8a6', dark: '#0f766e', trim: '#e8ba6c' },
    gold: { body: '#e8ba6c', dark: '#b8862f', trim: '#0f766e' },
    violet: { body: '#8b5cf6', dark: '#5b21b6', trim: '#e8ba6c' }
  };

  var NAMES = { teal: 'Himalayan teal', gold: 'Saffron gold', violet: 'Royal violet' };
  function chosen() { try { var v = localStorage.getItem('rw_wallet_color'); return PALETTES[v] ? v : 'teal'; } catch (e) { return 'teal'; } }

  /* A wallet with a gold flap and the RoamWise logo in the centre. No palette = the user's choice. */
  function rwWalletIcon(size, palette) {
    var p = PALETTES[palette || chosen()] || PALETTES.teal, s = size || 24;
    return '<svg class="rw-wallet-ic" width="' + s + '" height="' + s + '" viewBox="0 0 48 48" aria-hidden="true" focusable="false">' +
      '<rect x="3" y="11" width="42" height="31" rx="7" fill="' + p.body + '"/>' +
      '<path d="M3 18a7 7 0 0 1 7-7h28a7 7 0 0 1 7 7v1H3z" fill="' + p.dark + '"/>' +
      '<path d="M9 11l22-6a3 3 0 0 1 3.7 2.1L36 11z" fill="' + p.trim + '"/>' +
      '<rect x="34" y="23" width="11" height="10" rx="3" fill="' + p.dark + '"/>' +
      '<circle cx="39.5" cy="28" r="2.2" fill="' + p.trim + '"/>' +
      '<circle cx="20" cy="28.5" r="10" fill="#fff" stroke="' + p.trim + '" stroke-width="2"/>' +
      '<image href="' + LOGO + '" x="12" y="20.5" width="16" height="16" preserveAspectRatio="xMidYMid meet"/>' +
      '</svg>';
  }

  /* Gold coin for bonus credit. */
  function rwCoinIcon(size) {
    var s = size || 14;
    return '<svg class="rw-coin-ic" width="' + s + '" height="' + s + '" viewBox="0 0 20 20" aria-hidden="true" focusable="false">' +
      '<circle cx="10" cy="10" r="9" fill="#e8ba6c" stroke="#b8862f" stroke-width="1.5"/>' +
      '<circle cx="10" cy="10" r="5.6" fill="none" stroke="#fff3d6" stroke-width="1"/>' +
      '<text x="10" y="13.4" text-anchor="middle" font-size="8.5" font-weight="800" font-family="system-ui,sans-serif" fill="#7a5513">R</text>' +
      '</svg>';
  }

  var inr = function (n) { return '₹' + Number(n || 0).toLocaleString('en-IN'); };
  var num = function (n) { return Number(n || 0).toLocaleString('en-IN'); };

  /* Inside the Android app a folder URL is answered with the home page, so name the file there. */
  function rwOpenWallet() {
    var native = false;
    try { native = !!(W.Capacitor && W.Capacitor.isNativePlatform && W.Capacitor.isNativePlatform()); } catch (e) { native = false; }
    location.href = native ? '/wallet/index.html' : '/wallet/';
  }

  /* Settings: pick the wallet colour from three swatches (each drawn as the real icon). */
  function rwSetWalletColor(id) {
    if (!PALETTES[id]) return;
    try { localStorage.setItem('rw_wallet_color', id); } catch (e) { /* storage best-effort */ }
    document.querySelectorAll('.rw-wallet-ic-slot').forEach(function (n) { n.innerHTML = rwWalletIcon(+(n.getAttribute('data-size') || 22)); });
    var chip = document.getElementById('rwWalletChip');
    if (chip && chip.firstElementChild && chip.firstElementChild.tagName.toLowerCase() === 'svg') chip.firstElementChild.outerHTML = rwWalletIcon(22);
    var dr = document.getElementById('rwDrWalletIc'); if (dr) dr.innerHTML = rwWalletIcon(20);
    rwMountWalletColorSetting();
  }
  function rwWalletColorPickerHTML() {
    var cur = chosen();
    return '<div class="rw-wcp" role="radiogroup" aria-label="Wallet colour">' + Object.keys(PALETTES).map(function (k) {
      return '<button type="button" role="radio" aria-checked="' + (k === cur) + '" class="rw-wcp-opt' + (k === cur ? ' on' : '') + '" onclick="rwSetWalletColor(\'' + k + '\')">' +
        rwWalletIcon(34, k) + '<span>' + NAMES[k] + '</span></button>';
    }).join('') + '</div>';
  }
  function rwMountWalletColorSetting() {
    var body = document.querySelector('#settingsOverlay .modal-body');
    var host = document.getElementById('rwWalletColorSec');
    if (!host && body) {
      host = document.createElement('div'); host.id = 'rwWalletColorSec'; host.className = 'key-section';
      body.insertBefore(host, body.firstChild);
    }
    if (host) host.innerHTML = '<div class="key-sec-title">Wallet colour</div>' + rwWalletColorPickerHTML();
    ['rwWalletColorPage', 'rwWalletColorDrawer'].forEach(function (id) { var n = document.getElementById(id); if (n) n.innerHTML = rwWalletColorPickerHTML(); });
  }

  function paint(cash, bonus) {
    var chip = document.getElementById('rwWalletChip');
    if (!chip) return;
    var parts = '<span class="rw-wc-cash">' + inr(cash) + '</span>';
    if (bonus > 0) parts += '<span class="rw-wc-coin">' + rwCoinIcon(13) + num(bonus) + '</span>';
    chip.innerHTML = rwWalletIcon(22) + '<span class="rw-wc-amt">' + parts + '</span>';
    chip.setAttribute('aria-label', 'Wallet: ' + inr(cash) + ' cash' + (bonus > 0 ? ', ' + num(bonus) + ' bonus coins' : ''));
    chip.title = bonus > 0 ? 'Cash ' + inr(cash) + ' · Bonus coins ' + num(bonus) : 'Wallet · ' + inr(cash);
    var dr = document.getElementById('rwDrWalletAmt');
    if (dr) dr.textContent = inr(cash) + (bonus > 0 ? ' + ' + num(bonus) + ' coins' : '');
  }

  function show(on) {
    var chip = document.getElementById('rwWalletChip');
    if (chip) chip.style.display = on ? 'inline-flex' : 'none';
  }

  /* Referral links (?ref=RWXXXXXXXX): remember the code, then claim it once after sign-in.
     Coins are paid by the server only after the friend's first stay is completed. */
  function rememberRef() {
    try {
      var c = (new URLSearchParams(location.search).get('ref') || '').toUpperCase();
      if (/^RW[A-Z2-7]{8}$/.test(c)) localStorage.setItem('rw_ref_code', c);
    } catch (e) { /* storage best-effort */ }
  }
  function claimRef(token) {
    var code = '', device = '';
    try { code = localStorage.getItem('rw_ref_code') || ''; device = localStorage.getItem('rw_devid') || ''; } catch (e) { return; }
    if (!code) return;
    fetch(API + '/referral/claim', { method: 'POST', headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' }, body: JSON.stringify({ code: code, device: device }) })
      .then(function (r) { if (r.status !== 401 && r.status !== 403) { try { localStorage.removeItem('rw_ref_code'); } catch (e) { /* ignore */ } } })
      .catch(function () { /* tried again on the next visit */ });
  }

  /* Balance comes from the Worker with the user's Firebase sign-in; no wallet yet shows ₹0. */
  function refresh(u) {
    if (!u) { show(false); return; }
    show(true); paint(0, 0);
    u.getIdToken().then(function (t) {
      claimRef(t);
      return fetch(API + '/wallet', { headers: { authorization: 'Bearer ' + t } });
    }).then(function (r) { return r.json(); }).then(function (d) {
      if (!d || !d.wallet) return;
      var bonus = Number(d.wallet.bonusBalance || 0), total = Number(d.wallet.balance || 0);
      paint(Math.max(0, total - bonus), bonus);
    }).catch(function () { /* chip stays at ₹0; the wallet page shows the real state */ });
  }

  function init() {
    rememberRef();
    var icon = document.getElementById('rwDrWalletIc');
    if (icon) icon.innerHTML = rwWalletIcon(20);
    document.querySelectorAll('.rw-wallet-ic-slot').forEach(function (n) { n.innerHTML = rwWalletIcon(+(n.getAttribute('data-size') || 22)); });
    if (!document.getElementById('rwWalletColorCss')) {
      var st = document.createElement('style'); st.id = 'rwWalletColorCss';
      st.textContent = '.rw-wcp{display:flex;gap:8px;flex-wrap:wrap}.rw-wcp-opt{display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 10px;border-radius:12px;border:1px solid #ffffff26;background:#ffffff0d;color:inherit;font:600 11px system-ui,sans-serif;cursor:pointer;min-width:84px}.rw-wcp-opt.on{border-color:#e8ba6c;box-shadow:0 0 0 2px #e8ba6c55}';
      document.head.appendChild(st);
    }
    if (document.getElementById('rwWalletColorPage')) rwMountWalletColorSetting();
    var tries = 0;
    (function hook() {
      try {
        var fb = W.firebase;
        if (fb && fb.apps && fb.apps.length && fb.auth) { fb.auth().onAuthStateChanged(refresh); return; }
      } catch (e) { /* not ready yet */ }
      if (++tries < 40) setTimeout(hook, 250); /* Firebase starts after sign-in setup; stop after 10 s */
    })();
  }

  W.rwWalletIcon = rwWalletIcon;
  W.rwCoinIcon = rwCoinIcon;
  W.rwOpenWallet = rwOpenWallet;
  W.rwSetWalletColor = rwSetWalletColor;
  W.rwMountWalletColorSetting = rwMountWalletColorSetting;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
