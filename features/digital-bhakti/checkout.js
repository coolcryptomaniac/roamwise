(function (root) {
  'use strict';
  var access = root.RWBhaktiAccess, params = new URLSearchParams(root.location.search), selected = root.RWBhakti.product(params.get('product'));
  var pending = null, busy = false, sdk = null, key = 'rw_bhakti_pending_v1', notice = '';
  function $(id) { return document.getElementById(id); }
  function say(text) { notice = text; $('checkout-status').textContent = text; }
  function save() { try { if (pending) root.localStorage.setItem(key, JSON.stringify(pending)); else root.localStorage.removeItem(key); } catch (e) { /* recovery is also available through the order query */ } }
  try { var saved = JSON.parse(root.localStorage.getItem(key) || 'null'); if (saved && /^rw_[A-Za-z0-9_-]{1,42}$/.test(saved.id) && root.RWBhakti.product(saved.productId) && Date.now() - saved.at < 7 * 86400000) pending = saved; } catch (e) { /* absent/corrupt storage */ }
  var returnedId = params.get('order_id'); if (returnedId && /^rw_[A-Za-z0-9_-]{1,42}$/.test(returnedId)) pending = { id: returnedId, productId: selected && selected.id, at: Date.now() };
  if (!selected && pending) selected = root.RWBhakti.product(pending.productId);
  function render() {
    if (selected) { $('purchase-title').textContent = selected.en + ' / ' + selected.hi; $('purchase-description').textContent = selected.bodyEn + ' / ' + selected.bodyHi; $('purchase-price').textContent = '₹' + selected.price; $('checkout-return').href = './?product=' + selected.id + '#bhakti'; }
    $('checkout-signin').hidden = !!access.user; $('checkout-account').hidden = !access.user;
    $('checkout-account-label').textContent = access.user ? 'Signed in / साइन इन: ' + (access.user.email || 'RoamWise account') : '';
    var included = selected && access.allowed(selected.level);
    $('checkout-pay').disabled = busy || !selected || !access.user || !access.ready || !access.checkoutEnabled || included || !!pending || !!access.error;
    $('checkout-pay').textContent = included ? 'Already included / पहले से शामिल' : 'Pay ₹' + (selected ? selected.price : '…') + ' securely / सुरक्षित भुगतान';
    if (!busy) $('checkout-status').textContent = notice || access.error || (included ? 'Programme unlocked. Return to the studio. / क्रम खुला है। स्टूडियो पर लौटें।' : pending ? 'A purchase is waiting for confirmation. Check it before paying again. / खरीद की पुष्टि बाकी है; पहले जाँचें।' : !selected ? 'Choose a programme in the studio first. / पहले स्टूडियो में क्रम चुनें।' : !access.user ? 'Sign in before purchase. / खरीद से पहले साइन इन करें।' : !access.ready ? 'Checking secure access… / पहुँच की जाँच…' : access.checkoutEnabled ? 'Ready for secure checkout. / सुरक्षित भुगतान तैयार।' : 'Programme checkout is not open yet. No payment was taken. / भुगतान अभी खुला नहीं है। कोई भुगतान नहीं लिया गया।');
  }
  function loadSdk() {
    if (root.Cashfree) return Promise.resolve();
    if (!sdk) sdk = new Promise(function (resolve, reject) { var script = document.createElement('script'); script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js'; script.onload = resolve; script.onerror = function () { sdk = null; reject(new Error('Payment screen could not load. No payment was taken.')); }; document.head.appendChild(script); });
    return sdk;
  }
  async function recover() {
    if (busy) return;
    busy = true; render(); say('Confirming purchase… / खरीद की पुष्टि…');
    try {
      if (pending && access.user) {
        var d = await access.request('bhakti/order/' + encodeURIComponent(pending.id) + '/status');
        if (d.order_status === 'PAID' && d.fulfilled === true) {
          selected = root.RWBhakti.product(d.productId); pending = null; save();
          var clean = new URL(root.location.href); clean.search = selected ? '?product=' + selected.id : ''; root.history.replaceState({}, '', clean.pathname + clean.search);
        } else if (d.order_status === 'EXPIRED' || d.order_status === 'TERMINATED') { pending = null; save(); }
        else { say('Payment is not confirmed yet. Retry the check before paying again. / पुष्टि अभी बाकी है। दोबारा भुगतान से पहले जाँचें।'); return; }
      }
      await access.refresh(); notice = '';
    } catch (e) { say(e.message); }
    finally { busy = false; render(); }
  }
  $('checkout-google').addEventListener('click', async function () { try { await access.google(); } catch (e) { say('Google sign-in did not finish. Use email or open RoamWise to sign in. / साइन इन पूरा नहीं हुआ। ईमेल या RoamWise से साइन इन करें।'); } });
  $('checkout-email').addEventListener('submit', async function (e) { e.preventDefault(); try { await access.email($('checkout-email-address').value, $('checkout-password').value); } catch (e) { say('Sign-in did not finish. Check your details or recover the account on RoamWise. / विवरण जाँचें या RoamWise पर खाता पुनः प्राप्त करें।'); } finally { $('checkout-password').value = ''; } });
  $('checkout-signout').addEventListener('click', function () { access.signout(); });
  $('checkout-retry').addEventListener('click', recover);
  $('checkout-pay-form').addEventListener('submit', async function (e) {
    e.preventDefault(); if ($('checkout-pay').disabled || !$('checkout-consent').checked) return;
    var phone = $('checkout-phone').value.replace(/[\s()-]/g, ''); if (!/^\+?\d{7,15}$/.test(phone)) { say('Enter a valid phone number / सही फोन नंबर भरें।'); return; }
    busy = true; render(); say('Opening secure payment… / सुरक्षित भुगतान खुल रहा है…');
    try {
      await loadSdk();
      var d = await access.request('bhakti/order', { method: 'POST', body: JSON.stringify({ amount: selected.price, customer: { phone: phone }, meta: { planId: selected.id } }) });
      if (!d.payment_session_id || !/^rw_[A-Za-z0-9_-]{1,42}$/.test(d.order_id) || !['production', 'sandbox'].includes(d.environment)) throw new Error('Payment session could not be verified. Check your purchase.');
      pending = { id: d.order_id, productId: selected.id, at: Date.now() }; save();
      await root.Cashfree({ mode: d.environment }).checkout({ paymentSessionId: d.payment_session_id, redirectTarget: '_self' });
    } catch (e) { say(e.message); }
    finally { busy = false; render(); }
  });
  root.addEventListener('rw-bhakti-access', function () { if (!busy) notice = ''; render(); if (access.user && access.ready && pending && !busy && !access.error) recover(); });
  render(); if (access.ready && access.user && pending) recover();
})(window);
