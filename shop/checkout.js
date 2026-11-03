/* Online order form for live shop products. Prices and totals always come from the Worker; this file
 * never computes money. Server text is written with textContent only. */
(function() {
  'use strict';
  const root = document.getElementById('buy');
  if (!root) return;
  const API = String(window.RW_SHOP_API || 'https://roamwise-api.founder-f53.workers.dev').replace(/\/$/, '');
  const $ = (id) => document.getElementById(id);
  const form = $('buy-form');
  const ORDER_RE = /^RWS-[A-HJKMNP-Z2-9]{10}$/;
  let products = [];
  let product = null;
  let quote = null;

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
  const setProduct = (id) => {
    product = products.find((p) => p.id === id) || products[0];
    if (!product) return;
    $('buy-product').value = product.id;
    const select = $('buy-variant'); select.replaceChildren();
    product.variants.forEach((v) => { const o = document.createElement('option'); o.value = v.id; o.textContent = v.label + ' · ' + money(product.pricePaise); select.append(o); });
    form.elements.qty.max = String(product.maxQty);
    if (Number(form.elements.qty.value) > product.maxQty) form.elements.qty.value = String(product.maxQty);
    resetQuote();
  };
  const ship = () => ({ line1: val('line1'), line2: val('line2'), city: val('city'), state: val('state'), pin: val('pin') });
  const customer = () => ({ name: val('buyName'), phone: val('buyPhone'), email: val('buyEmail') });
  function resetQuote() { quote = null; $('buy-methods').hidden = true; $('buy-pay').hidden = true; say('buy-summary', ''); }
  ['product', 'variant', 'qty', 'pin'].forEach((n) => form.elements[n].addEventListener('input', resetQuote));

  const STATUS_TEXT = {
    paid: 'Payment received. Your order is confirmed. We will update you on WhatsApp.',
    awaiting_payment: 'We have not received confirmation of your payment yet. If money left your account, do not pay again; message us with your order ID.',
    awaiting_upi_payment: 'Waiting for your UPI payment to be verified in our bank record. This is not instant. Do not pay twice.',
    payment_setup_failed: 'The payment could not be started and no money was taken. Please try again.',
  };
  async function showStatus(orderId, attempts) {
    const token = store.get(orderId);
    root.hidden = false;
    say('buy-status', 'Order ' + orderId);
    if (!token) { say('buy-status', 'Order ' + orderId + '. We cannot show its status in this browser. Message us on WhatsApp with this order ID.'); return; }
    const r = await api('/shop/order/' + orderId + '/status', { headers: { Authorization: 'Bearer ' + token } });
    if (!r.ok) { say('buy-status', 'Order ' + orderId + ': ' + (r.data.message || 'we could not check this order right now.')); return; }
    const line = 'Order ' + orderId + ' · ' + money(r.data.totalPaise) + '. ' + (STATUS_TEXT[r.data.status] || 'Status: ' + r.data.status);
    say('buy-status', line);
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
    const text = 'Hello RoamWise, I paid ' + '₹' + data.upi.amount + ' by UPI for order ' + data.orderId + '. UTR: ';
    $('buy-upi-wa').href = 'https://wa.me/919987379730?text=' + encodeURIComponent(text);
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
    const radios = form.querySelectorAll('input[name="payMethod"]');
    let first = true;
    radios.forEach((radio) => {
      const open = !!quote.methods[radio.value];
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
    const r = await post('/shop/order', { items: cart(), customer: customer(), ship: ship(), method }).catch(() => null);
    $('buy-pay').disabled = false;
    if (!r || !r.ok) { say('buy-status', (r && r.data.message) || 'Could not create the order. No payment was taken.'); return; }
    store.set(r.data.orderId, r.data.token);
    if (r.data.method === 'upi') { showUpi(r.data); return; }
    try {
      await loadScript('https://sdk.cashfree.com/js/v3/cashfree.js');
      const cashfree = window.Cashfree({ mode: r.data.environment === 'production' ? 'production' : 'sandbox' });
      say('buy-status', 'Opening secure payment…');
      cashfree.checkout({ paymentSessionId: r.data.payment_session_id, redirectTarget: '_self' });
    } catch (_) {
      say('buy-status', 'Could not open the payment window. No money was taken for this attempt. Try again or pay by UPI.');
    }
  });

  (async function init() {
    const returned = new URLSearchParams(location.search).get('order_id');
    if (returned && ORDER_RE.test(returned)) { showStatus(returned, 10); }
    const r = await api('/shop/catalogue').catch(() => null);
    if (!r || !r.ok) return;
    products = r.data.products || [];
    if (!products.length) return;
    const pick = $('buy-product');
    products.forEach((p) => { const o = document.createElement('option'); o.value = p.id; o.textContent = p.name + ' · ' + money(p.pricePaise); pick.append(o); });
    pick.addEventListener('change', () => setProduct(pick.value));
    setProduct(products[0].id);
    document.querySelectorAll('[data-buy]').forEach((a) => {
      if (!r.data.checkoutOpen || !products.some((p) => p.id === a.dataset.buy)) return;
      a.hidden = false;
      a.addEventListener('click', () => { root.hidden = false; setProduct(a.dataset.buy); });
    });
    if (r.data.checkoutOpen) root.hidden = false;
  })();
})();
