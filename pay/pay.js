(function () {
  'use strict';
  var PAYMENT_URL = 'https://www.roamwise.co.in/pay/';
  var status = document.getElementById('copyStatus');
  function say(message) { status.textContent = message; }
  function fallback(text, success) {
    var field = document.createElement('textarea');
    field.className = 'clipboard-fallback';
    field.value = text;
    field.setAttribute('readonly', '');
    document.body.appendChild(field);
    field.select();
    var copied = false;
    try { copied = !!document.execCommand('copy'); } catch (error) { /* manual copy stays available */ }
    field.remove();
    say(copied ? success : 'Copy was unavailable. Select and copy the UPI ID above, or share this page URL.');
  }
  function copy(text, success) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { say(success); }).catch(function () { fallback(text, success); });
    } else { fallback(text, success); }
  }
  document.getElementById('copyUpi').addEventListener('click', function () {
    copy(document.getElementById('upiId').textContent.trim(), 'UPI ID copied.');
  });
  document.getElementById('copyPayment').addEventListener('click', function () {
    copy(PAYMENT_URL, 'Payment page link copied.');
  });
})();
