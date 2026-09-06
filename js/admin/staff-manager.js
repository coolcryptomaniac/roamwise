// @ts-nocheck
/* ============================================================================
   js/admin/staff-manager.js
   ----------------------------------------------------------------------------
   View/edit UI logic for the real referrer registry that already exists —
   referral-data.js's window.RW_REFERRERS (3 staff referrers as of this
   writing: Febin, Deepanshi, Adarsh) and its live Firestore mirror at
   config/referrers (per js/pricing/referral.js's rwRefSync(): "the live
   list is in Firestore at config/referrers, editable from the admin panel"
   — this file is what actually makes that true; no admin UI existed for it
   before). Writes go through the existing `match /config/{doc}` rule
   (read: true, write: isAdmin()) — no new Firestore rule needed.

   Pure list-editing + HTML-string functions only; the Firestore
   read/write and DOM wiring live in admin/index.html.
   ========================================================================= */
var RWStaffManager = (function(){
  var TYPES = ['staff','creator','affiliate','campus'];

  function sanitizeCode(x){
    return String(x == null ? '' : x).toUpperCase().replace(/[^A-Z0-9_-]/g,'').slice(0,32);
  }

  /** Validate + normalize a referrer record before it's saved. Returns
   *  {ok:true, referrer} or {ok:false, error}. */
  function normalizeReferrer(input){
    var code = sanitizeCode(input && input.code);
    var name = String(input && input.name || '').trim().slice(0,80);
    if(!code) return { ok:false, error:'Code is required (letters, numbers, - and _ only).' };
    if(!name) return { ok:false, error:'Name is required.' };
    var rate = Number(input && input.rate);
    if(!isFinite(rate) || rate < 0 || rate > 1) rate = 0.30;
    var type = TYPES.indexOf(input && input.type) > -1 ? input.type : 'staff';
    return { ok:true, referrer: {
      code: code, name: name, type: type, rate: rate,
      active: input && input.active === false ? false : true,
      note: String(input && input.note || '').trim().slice(0,240)
    }};
  }

  /** Insert or replace a referrer by code (case-insensitive). */
  function upsertReferrer(list, referrer){
    var code = sanitizeCode(referrer.code);
    var out = (list || []).filter(function(r){ return sanitizeCode(r.code) !== code; });
    out.push(referrer);
    return out;
  }

  function removeReferrer(list, code){
    var c = sanitizeCode(code);
    return (list || []).filter(function(r){ return sanitizeCode(r.code) !== c; });
  }

  function renderStaffTableHtml(list, liabilityByCode, helpers){
    var esc = (helpers && helpers.esc) || function(s){ return String(s==null?'':s); };
    var money = (helpers && helpers.money) || function(n){ return '₹' + Math.round(Number(n)||0).toLocaleString('en-IN'); };
    var lb = liabilityByCode || {};
    var rows = (list || []).slice().sort(function(a,b){ return String(a.name||'').localeCompare(String(b.name||'')); })
      .map(function(r){
        var stats = lb[sanitizeCode(r.code)];
        var statsHtml = stats
          ? stats.salesCount + ' sale(s) · ' + money(stats.grossRevenueINR) + ' gross · ' + money(stats.commissionOwedINR) + ' owed'
          : 'No approved sales attributed yet';
        return '<div class="row"><div class="grow"><strong>' + esc(r.name) + (r.active === false ? ' <span class="tag">retired</span>' : '') + '</strong>' +
          '<div class="meta">' + esc(r.code) + ' &middot; ' + esc(r.type) + ' &middot; ' + Math.round((Number(r.rate)||0)*100) + '% commission' + (r.note ? ' &middot; ' + esc(r.note) : '') + '</div>' +
          '<div class="meta">' + statsHtml + '</div></div>' +
          '<div class="actions"><button class="btn small" onclick="openReferrerForm(\'' + esc(r.code) + '\')">Edit</button>' +
          '<button class="btn danger small" onclick="deleteReferrer(\'' + esc(r.code) + '\')">Remove</button></div></div>';
      }).join('');
    return '<div class="list">' + (rows || '<div class="empty">No referrers on file yet. Add one below.</div>') + '</div>';
  }

  function escAttr(s){
    return String(s==null?'':s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; });
  }

  function referrerFormHtml(referrer){
    var r = referrer || {};
    return '' +
      '<div class="field"><label>Code (e.g. RW-S04-NAME)</label><input id="refCode" class="input" value="' + escAttr(r.code) + '"' + (referrer ? ' readonly' : '') + '></div>' +
      '<div class="field"><label>Name</label><input id="refName" class="input" value="' + escAttr(r.name) + '"></div>' +
      '<div class="field"><label>Type</label><select id="refType" class="input">' +
        TYPES.map(function(t){ return '<option value="'+t+'"'+(r.type===t?' selected':'')+'>'+t+'</option>'; }).join('') +
      '</select></div>' +
      '<div class="field"><label>Commission rate (0–1, e.g. 0.30 = 30%)</label><input id="refRate" class="input" type="number" step="0.01" min="0" max="1" value="' + (typeof r.rate==='number'?r.rate:0.30) + '"></div>' +
      '<div class="field"><label>Active</label><select id="refActive" class="input"><option value="true"' + (r.active!==false?' selected':'') + '>Active</option><option value="false"' + (r.active===false?' selected':'') + '>Retired</option></select></div>' +
      '<div class="field full"><label>Note</label><input id="refNote" class="input" value="' + escAttr(r.note) + '"></div>';
  }

  function readReferrerForm($){
    return {
      code: $('refCode').value,
      name: $('refName').value,
      type: $('refType').value,
      rate: Number($('refRate').value),
      active: $('refActive').value !== 'false',
      note: $('refNote').value
    };
  }

  return {
    TYPES: TYPES,
    sanitizeCode: sanitizeCode,
    normalizeReferrer: normalizeReferrer,
    upsertReferrer: upsertReferrer,
    removeReferrer: removeReferrer,
    renderStaffTableHtml: renderStaffTableHtml,
    referrerFormHtml: referrerFormHtml,
    readReferrerForm: readReferrerForm
  };
})();
