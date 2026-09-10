(function () {
  'use strict';
  var auth = firebase.auth(), db = firebase.firestore(), actor = null, campaigns = [], profile = {};
  var $ = function (selector) { return document.querySelector(selector); };
  var apiBase = function () { return String(window.RW_CONFIG && window.RW_CONFIG.creatorProtectionUrl || '').replace(/\/+$/, ''); };
  var money = function (minor) { return '₹' + Math.round(Number(minor || 0) / 100).toLocaleString('en-IN'); };
  var esc = function (value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]; }); };
  var rupees = function (selector) { return Math.max(0, Math.round(Number($(selector).value || 0))); };

  async function call(path, options) {
    if (!apiBase()) throw new Error('Protected campaign API is not activated yet');
    var user = auth.currentUser;
    if (!user) throw new Error('Sign in first');
    var token = await user.getIdToken();
    var init = Object.assign({ method: 'GET' }, options || {});
    init.headers = Object.assign({ authorization: 'Bearer ' + token, 'content-type': 'application/json', 'x-idempotency-key': crypto.randomUUID() }, init.headers || {});
    var response = await fetch(apiBase() + path, init);
    var result = await response.json().catch(function () { return {}; });
    if (!response.ok) throw new Error(result.message || result.error || 'Campaign service request failed');
    return result;
  }

  function rateCard() { return profile.rateCard || {}; }
  function setRates() {
    var rates = rateCard();
    $('#cpRateReel').value = rates.reel || '';
    $('#cpRateStories').value = rates.stories || '';
    $('#cpRateHotel').value = rates.hotel || '';
    $('#cpRateUgc').value = rates.ugc || '';
    $('#cpRateDay').value = rates.travelDay || '';
    $('#cpMinimum').value = rates.minimum || 15000;
    $('#cpAcceptBarter').checked = rates.acceptsBarter === true;
    $('#cpPhone').value = rates.phone || '';
  }

  async function saveRates() {
    var user = auth.currentUser;
    if (!user) return;
    var rates = { reel: rupees('#cpRateReel'), stories: rupees('#cpRateStories'), hotel: rupees('#cpRateHotel'), ugc: rupees('#cpRateUgc'), travelDay: rupees('#cpRateDay'), minimum: rupees('#cpMinimum'), acceptsBarter: $('#cpAcceptBarter').checked, phone: $('#cpPhone').value.replace(/\D/g, '').slice(-10) };
    if (rates.phone.length !== 10) { $('#cpRateMsg').textContent = 'Add a valid 10-digit mobile for payout KYC.'; return; }
    try {
      await db.collection('users').doc(user.uid).update({'creator.rateCard': rates, 'creator.updatedAt': new Date().toISOString()});
      profile.rateCard = rates;
      if (apiBase()) {
        await call('/v1/creator-protection/onboard', { method: 'POST', body: JSON.stringify({ role: 'creator', displayName: $('#csName').value || user.displayName || user.email, phone: rates.phone, minimumPaidMinor: rates.minimum * 100, acceptsBarter: rates.acceptsBarter }) });
        $('#cpRateMsg').textContent = '✓ Saved · protection KYC submitted';
      } else $('#cpRateMsg').textContent = '✓ Rate card saved · protected payments awaiting provider activation';
    } catch (error) { $('#cpRateMsg').textContent = error.message || 'Could not save rate card'; }
  }

  function badge(campaign) {
    if (campaign.kind === 'barter') return '<span class="cp-badge">BARTER · OPT-IN</span>';
    if (['funded','in_progress','submitted','approved','release_pending','paid','disputed'].includes(campaign.status)) return '<span class="cp-badge funded"><i></i> FUNDED</span>';
    return '<span class="cp-badge">FUNDING REQUIRED</span>';
  }

  function actions(campaign) {
    if (campaign.status === 'published') return '<button class="cp-tab on" data-apply="' + esc(campaign.id) + '">Apply</button>';
    var controls = '';
    if (campaign.status === 'funded') controls += '<button class="cp-tab on" data-action="start" data-id="' + esc(campaign.id) + '">Start work</button>';
    if (campaign.status === 'in_progress') controls += '<button class="cp-tab on" data-action="submit" data-id="' + esc(campaign.id) + '">Submit work</button>';
    if (['funded','in_progress','submitted','approved'].includes(campaign.status)) controls += '<button class="cp-tab" data-dispute="' + esc(campaign.id) + '">Raise issue</button>';
    if (controls) return controls;
    return '';
  }

  function render() {
    var root = $('#cpCampaigns');
    if (!root) return;
    if (!apiBase()) { root.innerHTML = '<div class="cp-empty"><b>Campaign protection is in onboarding mode.</b><br>Your rate card is live, but funding and payout controls stay disabled until RoamWise completes provider underwriting and KYC.</div>'; return; }
    if (!campaigns.length) { root.innerHTML = '<div class="cp-empty">No matching ' + ($('#cpFundedOnly').checked ? 'funded ' : '') + 'campaigns right now. Your Creator Minimum and barter choice are filtering the feed.</div>'; return; }
    root.innerHTML = campaigns.map(function (campaign) {
      return '<article class="cp-mini-card"><div class="cp-card-top">' + badge(campaign) + '<span class="cp-kind">' + esc(String(campaign.kind || '').toUpperCase()) + '</span></div><h3>' + esc(campaign.title) + '</h3><p>' + esc(campaign.destination) + ' · ' + esc(campaign.travel_start || 'Dates to be agreed') + '</p><div class="cp-mini-money">' + money(campaign.creator_fee_minor) + '</div><p>Travel reimbursement ' + money(campaign.travel_reimbursement_minor) + ' · ' + Number(campaign.accommodation_nights || 0) + ' nights · ' + (campaign.mealsIncluded ? 'meals included' : 'meals not included') + '</p><div class="cp-actions">' + actions(campaign) + '</div></article>';
    }).join('');
    root.querySelectorAll('[data-apply]').forEach(function (button) { button.onclick = function () { apply(button.dataset.apply); }; });
    root.querySelectorAll('[data-action]').forEach(function (button) { button.onclick = function () { act(button.dataset.id, button.dataset.action); }; });
    root.querySelectorAll('[data-dispute]').forEach(function (button) { button.onclick = function () { dispute(button.dataset.dispute); }; });
  }

  async function loadCampaigns() {
    if (!apiBase() || !auth.currentUser) return render();
    try {
      actor = await call('/v1/creator-protection/me');
      $('#cpProtectionStatus').innerHTML = actor.status === 'active' ? '<b>Protected payouts active.</b> Provider KYC is approved for this identity.' : '<b>Protection KYC pending.</b> You can save rates now; applying and money movement unlock after approval.';
      if (actor.role !== 'creator' || actor.status !== 'active') { campaigns = []; return render(); }
      var result = await call('/v1/creator-protection/campaigns?funded=' + ($('#cpFundedOnly').checked ? 'true' : 'false'));
      campaigns = result.campaigns || []; render();
    } catch (error) { $('#cpProtectionStatus').textContent = error.message; campaigns = []; render(); }
  }

  async function apply(id) {
    var note = prompt('Add a short pitch for this travel campaign:') || '';
    try { await call('/v1/creator-protection/campaigns/' + encodeURIComponent(id) + '/apply', { method: 'POST', body: JSON.stringify({ note: note }) }); alert('Application sent with your verified creator identity.'); }
    catch (error) { alert(error.message); }
  }

  async function act(id, action) {
    try { await call('/v1/creator-protection/campaigns/' + encodeURIComponent(id) + '/' + action, { method: 'POST', body: '{}' }); await loadCampaigns(); }
    catch (error) { alert(error.message); }
  }

  async function dispute(id) {
    var reason = prompt('Describe the payment, travel or deliverable issue. This pauses release:');
    if (!reason) return;
    try { await call('/v1/creator-protection/campaigns/' + encodeURIComponent(id) + '/dispute', { method: 'POST', body: JSON.stringify({ reason: reason, evidence: [] }) }); await loadCampaigns(); }
    catch (error) { alert(error.message); }
  }

  $('#cpSaveRates').onclick = saveRates;
  $('#cpFundedOnly').onchange = loadCampaigns;
  auth.onAuthStateChanged(async function (user) {
    if (!user || !user.emailVerified) return;
    try { var snap = await db.collection('users').doc(user.uid).get(); profile = snap.exists && snap.data().creator || {}; setRates(); }
    catch (_) { profile = {}; setRates(); }
    loadCampaigns();
  });
  window.RWCreatorCampaigns = { version: '1.0.0', refresh: loadCampaigns };
})();
