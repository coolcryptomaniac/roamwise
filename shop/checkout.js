/* Buy now for live shop products. Each product's "Buy now" button opens the checkout panel directly
 * under itself (Cashfree or UPI). Prices and totals always come from the Worker; this file never computes
 * money. Server text is written with textContent only. When the Worker says checkout is closed (or cannot
 * be reached) the same panel offers a prefilled WhatsApp order instead, so a buyer is never stuck. */
(function() {
  'use strict';
  const root = document.getElementById('buy');
  if (!root) return;
  const API = String(window.RW_SHOP_API || 'https://roamwise-api.founder-f53.workers.dev').replace(/\/$/, '');
  const WA = '919987379730';
  const $ = (id) => document.getElementById(id);
  const form = $('buy-form');
  const ORDER_RE = /^RWS-[A-HJKMNP-Z2-9]{10}$/;
  let products = [];
  let product = null;
  let quote = null;
  let checkoutOpen = false;
  let loaded = null; // promise for the catalogue request
  /* RoamWise wallet: the private wallet token from a wallet link (?wallet=) or the wallet page on this device. */
  let walletT = new URLSearchParams(location.search).get('wallet') || '';
  try { if (walletT) localStorage.setItem('rwWalletT', walletT); else walletT = localStorage.getItem('rwWalletT') || ''; } catch (_) { /* private mode */ }
  let walletPaise = 0;

  const money = (paise) => '₹' + (paise / 100).toLocaleString('en-IN', { minimumFractionDigits: paise % 100 ? 2 : 0, maximumFractionDigits: 2 });
  const say = (id, text) => { $(id).textContent = text; };
  async function api(path, options) {
    const res = await fetch(API + path, options);
    return { ok: res.ok, status: res.status, data: await res.json().catch(() => ({})) };
  }
  const post = (path, body) => api(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const store = {
    set(id, token) { try { localStorage.setItem('rwShopOrder.' + id, token); } catch (_) { /* private mode */ } },
    get(id) { try { return localStorage.getItem('rwShopOrder.' + id); } catch (_) { return null; } },
  };
  const val = (name) => form.elements[name].value.trim();
  const cart = () => [{ id: product.id, variant: val('variant'), qty: Number(val('qty')) }];
  const ship = () => ({ line1: val('line1'), line2: val('line2'), city: val('city'), state: val('state'), pin: val('pin') });
  const customer = () => ({ name: val('buyName'), phone: val('buyPhone'), email: val('buyEmail') });

  function resetQuote() { quote = null; $('buy-methods').hidden = true; $('buy-pay').hidden = true; say('buy-summary', ''); }
  ['product', 'variant', 'qty', 'pin'].forEach((n) => form.elements[n].addEventListener('input', resetQuote));

  function setProduct(id) {
    product = products.find((p) => p.id === id) || products[0] || null;
    if (!product) return;
    $('buy-product').value = product.id;
    const select = $('buy-variant'); select.replaceChildren();
    product.variants.forEach((v) => { const o = document.createElement('option'); o.value = v.id; o.textContent = v.label + ' · ' + money(product.pricePaise); select.append(o); });
    form.elements.qty.max = String(product.maxQty);
    if (Number(form.elements.qty.value) > product.maxQty) form.elements.qty.value = String(product.maxQty);
    say('buy-title', 'Buy ' + product.name);
    resetQuote();
  }

  /* The product's own WhatsApp link in its section, used as the fallback order route. */
  function whatsappFor(button) {
    const section = button && button.closest('section');
    const link = section && section.querySelector('a[href^="https://wa.me/"]');
    return link ? link.href : 'https://wa.me/' + WA;
  }
  function showClosed(button, reason) {
    form.hidden = true; $('buy-intro').hidden = true;
    const p = $('buy-closed'); p.hidden = false; p.replaceChildren();
    p.append(document.createTextNode(reason + ' '));
    const a = document.createElement('a'); a.className = 'button'; a.target = '_blank'; a.rel = 'noopener noreferrer';
    a.href = whatsappFor(button); a.textContent = 'Order on WhatsApp instead';
    p.append(a);
  }

  /* Open the checkout panel immediately after the clicked Buy now button. */
  async function openFor(id, button) {
    if (button) button.after(root);
    root.hidden = false;
    $('buy-upi').hidden = true; $('buy-closed').hidden = true; $('buy-intro').hidden = false; form.hidden = false;
    await loaded;
    if (!checkoutOpen || !products.some((p) => p.id === id)) {
      showClosed(button, 'Online payment is not available for this item right now. No payment can be taken here.');
    } else {
      setProduct(id);
      $('buy-product-row').hidden = !!button; // the button already chose the product
    }
    root.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const first = form.hidden ? null : $('buy-name');
    if (first && first.focus) first.focus({ preventScroll: true });
  }
  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-buy]');
    if (button) { event.preventDefault(); openFor(button.dataset.buy, button); return; }
    const jump = event.target.closest('[data-buy-jump]');
    if (jump) {
      const target = document.querySelector('[data-buy="' + jump.dataset.buyJump + '"]');
      if (target) { event.preventDefault(); openFor(jump.dataset.buyJump, target); }
    }
  });

  const STATUS_TEXT = {
    paid: 'Payment received. Your order is confirmed. We will update you on WhatsApp.',
    refunded_to_wallet: 'This order was refunded to your RoamWise wallet. Check your email for the wallet link.',
    awaiting_payment: 'We have not received confirmation of your payment yet. If money left your account, do not pay again; message us with your order ID.',
    awaiting_upi_payment: 'Waiting for your UPI payment to be verified in our bank record. This is not instant. Do not pay twice.',
    payment_setup_failed: 'The payment could not be started and no money was taken. Please try again.',
  };
  async function showStatus(orderId, attempts) {
    const token = store.get(orderId);
    root.hidden = false;
    say('buy-status', 'Order ' + orderId);
    if (!token) { say('buy-status', 'Order ' + orderId + '. We cannot show its status in this browser. Message us on WhatsApp with this order ID.'); return; }
    const r = await api('/shop/order/' + orderId + '/status', { headers: { Authorization: 'Bearer ' + token } }).catch(() => null);
    if (!r || !r.ok) { say('buy-status', 'Order ' + orderId + ': ' + ((r && r.data.message) || 'we could not check this order right now.')); return; }
    say('buy-status', 'Order ' + orderId + ' · ' + money(r.data.totalPaise) + '. ' + (STATUS_TEXT[r.data.status] || 'Status: ' + r.data.status));
    if (r.data.status === 'awaiting_payment' && attempts > 0) setTimeout(() => showStatus(orderId, attempts - 1), 3000);
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const el = document.createElement('script'); el.src = src; el.onload = resolve; el.onerror = () => reject(new Error('load ' + src));
      document.head.append(el);
    });
  }
  function showUpi(data) {
    say('buy-upi-amount', '₹' + data.upi.amount); say('buy-upi-id', data.upi.pa); say('buy-upi-ref', data.orderId);
    $('buy-upi-open').href = data.upi.uri;
    $('buy-upi-wa').href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent('Hello RoamWise, I paid ₹' + data.upi.amount + ' by UPI for order ' + data.orderId + '. UTR: ');
    $('buy-upi').hidden = false; form.hidden = true;
    loadScript('/vendor/qrcodejs/1.0.0/qrcode.min.js').then(() => {
      $('buy-upi-qr').replaceChildren();
      new window.QRCode($('buy-upi-qr'), { text: data.upi.uri, width: 180, height: 180 });
    }).catch(() => { /* the Open UPI app button still works */ });
    say('buy-status', STATUS_TEXT.awaiting_upi_payment);
  }

  $('buy-quote').addEventListener('click', async () => {
    resetQuote();
    if (!product) return;
    const r = await post('/shop/quote', { items: cart(), pin: val('pin') }).catch(() => null);
    if (!r) { say('buy-summary', 'Could not reach checkout. Please order on WhatsApp.'); return; }
    if (!r.ok) { say('buy-summary', r.data.message || 'Could not price this order.'); return; }
    quote = r.data;
    say('buy-summary', 'Item ' + money(quote.subtotalPaise) + ' + delivery ' + money(quote.shippingPaise) + ' = ' + money(quote.totalPaise));
    let first = true;
    form.querySelectorAll('input[name="payMethod"]').forEach((radio) => {
      const open = radio.value === 'wallet' ? walletPaise >= quote.totalPaise && quote.totalPaise % 100 === 0 : !!quote.methods[radio.value];
      radio.closest('label').hidden = !open; radio.disabled = !open; radio.checked = open && first;
      if (open) first = false;
    });
    $('buy-methods').hidden = first; $('buy-pay').hidden = first;
    if (first) say('buy-summary', 'Online payment is not available right now. Please order on WhatsApp.');
    else $('buy-pay').textContent = 'Place order and pay ' + money(quote.totalPaise);
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!quote || !form.reportValidity()) return;
    const method = (form.querySelector('input[name="payMethod"]:checked') || {}).value;
    if (!method) return;
    $('buy-pay').disabled = true;
    say('buy-status', 'Creating your order…');
    const r = await post('/shop/order', { items: cart(), customer: customer(), ship: ship(), method, ...(method === 'wallet' ? { wallet: walletT } : {}) }).catch(() => null);
    $('buy-pay').disabled = false;
    if (!r || !r.ok) { say('buy-status', (r && r.data.message) || 'Could not create the order. No payment was taken.'); return; }
    store.set(r.data.orderId, r.data.token);
    if (r.data.method === 'upi') { showUpi(r.data); return; }
    if (r.data.method === 'wallet') { form.hidden = true; showStatus(r.data.orderId, 0); return; }
    try {
      await loadScript('https://sdk.cashfree.com/js/v3/cashfree.js');
      const cashfree = window.Cashfree({ mode: r.data.environment === 'production' ? 'production' : 'sandbox' });
      say('buy-status', 'Opening secure payment…');
      cashfree.checkout({ paymentSessionId: r.data.payment_session_id, redirectTarget: '_self' });
    } catch (_) {
      say('buy-status', 'Could not open the payment window. No money was taken for this attempt. Try again or pay by UPI.');
    }
  });

  loaded = (async function init() {
    const params = new URLSearchParams(location.search);
    const returned = params.get('order_id');
    if (returned && ORDER_RE.test(returned)) showStatus(returned, 10);
    if (walletT) api('/wallet?t=' + encodeURIComponent(walletT)).then((w) => {
      if (!w.ok) return;
      walletPaise = (w.data.wallet.balance || 0) * 100;
      say('buy-wallet-label', 'RoamWise wallet credit (' + money(walletPaise) + ' available)');
    }).catch(() => { /* wallet is optional */ });
    const r = await api('/shop/catalogue').catch(() => null);
    if (r && r.ok) {
      products = r.data.products || [];
      checkoutOpen = !!r.data.checkoutOpen && products.length > 0;
      const pick = $('buy-product');
      products.forEach((p) => { const o = document.createElement('option'); o.value = p.id; o.textContent = p.name + ' · ' + money(p.pricePaise); pick.append(o); });
      pick.addEventListener('change', () => setProduct(pick.value));
    }
  })();

  /* Deep link from the homepage: /shop/?buy=<id> opens checkout under that product's button. */
  const requested = new URLSearchParams(location.search).get('buy');
  if (requested && /^[a-z0-9-]{1,60}$/.test(requested)) {
    const button = document.querySelector('[data-buy="' + requested + '"]');
    if (button) openFor(requested, button);
  }
})();
