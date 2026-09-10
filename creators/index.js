(function () {
  'use strict';
  var CFG = {apiKey:'AIzaSyBTfmJvHTmp0mNQqsIhWEwnLLwFKz0ExYQ',authDomain:'roamwisepro.firebaseapp.com',projectId:'roamwisepro',storageBucket:'roamwisepro.firebasestorage.app',messagingSenderId:'1039880917656',appId:'1:1039880917656:web:8b3e18e8a4b1c9f8e2c0d1'};
  var db = null;
  try { if (!firebase.apps.length) firebase.initializeApp(CFG); db = firebase.firestore(); } catch (_) {}
  var byId = function (id) { return document.getElementById(id); };
  function number(id) { return Math.max(0, Math.round(Number(byId(id).value || 0))); }
  function selected(id) { return Array.from(byId(id).selectedOptions || []).map(function (option) { return option.value; }).slice(0, 10); }
  function show(message, bad) { byId('applyMsg').innerHTML = '<div class="cp-message' + (bad ? ' bad' : '') + '">' + String(message).replace(/[&<>]/g, '') + '</div>'; }
  byId('creatorApplication').addEventListener('submit', async function (event) {
    event.preventDefault();
    var name = byId('cName').value.trim(), email = byId('cEmail').value.trim(), consent = byId('cConsent').checked;
    if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return show('Add your name and a valid email.', true);
    if (!consent) return show('Please accept the contact consent before applying.', true);
    var rec = {
      seg: 'creator', name: name.slice(0, 120), email: email.slice(0, 160), handle: byId('cHandle').value.trim().slice(0, 200),
      reach: byId('cReach').value, niche: byId('cNiche').value.trim().slice(0, 160), note: byId('cNote').value.trim().slice(0, 1200),
      creatorMinimum: number('cMinimum'), reelRate: number('cReel'), storyPackageRate: number('cStories'), creatorServices: selected('cServices'),
      acceptsBarter: byId('cBarter').checked, consent: true, source: 'creators page (inbound)', stage: 'new', tier: 'applied', refSales: 0, refRevenue: 0, code: '', createdAt: new Date().toISOString()
    };
    var button = byId('applyBtn'); button.disabled = true; button.textContent = 'Sending…';
    try {
      if (!db) throw new Error('offline');
      await db.collection('crm').add(rec);
      show('Application received. Create Creator Studio with this same email; RoamWise will review your identity and protected-payout eligibility.');
      setTimeout(function () { location.href = 'dashboard.html?email=' + encodeURIComponent(email); }, 1800);
    } catch (_) {
      show('The form could not reach RoamWise. Opening email as a fallback…', true);
      setTimeout(function () { location.href = 'mailto:founder@roamwise.co.in?subject=' + encodeURIComponent('Creator application — ' + name) + '&body=' + encodeURIComponent(JSON.stringify(rec, null, 2)); }, 700);
    } finally { button.disabled = false; button.textContent = 'Send application →'; }
  });
})();
