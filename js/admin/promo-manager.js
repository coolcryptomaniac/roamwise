// @ts-nocheck
/* ============================================================================
   js/admin/promo-manager.js
   ----------------------------------------------------------------------------
   Create/view/deactivate promotional codes for the admin "Promos" tab.

   REUSES THE EXISTING REFERRER SCHEME rather than inventing a new one:
   referral-data.js / js/admin/staff-manager.js already store the referrer
   registry as ONE Firestore doc, config/referrers, holding {list:[...]}, and
   the `match /config/{doc}` rule (read: true, write: isAdmin()) already
   covers any doc under config/ — so this file writes to config/promoCodes in
   exactly the same shape, and needs NO new firestore.rules block.

   SCOPE, STATED HONESTLY: this only makes promo codes exist, be listed, and
   be deactivated in Firestore. There is currently no generic promo-code
   input anywhere in checkout (checked app.js's payment/claim flow) — wiring
   a real redemption path into checkout is explicitly a follow-up, not part
   of this file. Because of that, `redeemedCount` here is NEVER incremented
   by any live code path yet; it is stored so the field exists and always
   reads 0 until that follow-up lands, and the UI says so rather than
   implying it's already live.

   DESIGN NOTE for that follow-up (read before wiring checkout to this):
   once a real redemption write path exists, do NOT let an unauthenticated/
   ordinary client increment redeemedCount directly on this list-in-one-doc
   shape — two concurrent redemptions racing a client-side read-modify-write
   of the whole `list` array is a real TOCTOU risk (the same class of gap
   PRICING-REFERRAL-MATH.md's partnerClaims doc-ID-per-code pattern and
   PR #152/#155 both had to reason carefully about). The safer shape at that
   point is closer to partnerClaims/{code} (one doc per code, server-
   validated amount/plan, incremented via a Firestore transaction or a
   Worker endpoint) — not a naive merge write from the browser.

   Pure list-editing + HTML-string functions only; the Firestore read/write
   and DOM wiring live in admin/index.html.
   ========================================================================= */
var RWPromoManager = (function(){
  var DISCOUNT_TYPES = ['percent','flat'];

  function sanitizeCode(x){
    return String(x == null ? '' : x).toUpperCase().replace(/[^A-Z0-9_-]/g,'').slice(0,32);
  }

  /** Validate + normalize a promo code before it's saved. Returns {ok, promo|error}. */
  function normalizePromo(input){
    var code = sanitizeCode(input && input.code);
    if(!code) return { ok:false, error:'Code is required (letters, numbers, - and _ only).' };
    var type = DISCOUNT_TYPES.indexOf(input && input.discountType) > -1 ? input.discountType : 'percent';
    var value = Number(input && input.discountValue);
    if(!isFinite(value) || value <= 0) return { ok:false, error:'Discount value must be a positive number.' };
    if(type === 'percent' && value > 100) return { ok:false, error:'A percent discount can\'t exceed 100.' };
    var usageCap = Number(input && input.usageCap);
    if(!isFinite(usageCap) || usageCap < 0) usageCap = 0; // 0 = unlimited
    var expiresAt = String(input && input.expiresAt || '').trim().slice(0,10); // YYYY-MM-DD or ''
    return { ok:true, promo: {
      code: code, discountType: type, discountValue: value,
      usageCap: usageCap, redeemedCount: (input && input.redeemedCount) || 0,
      expiresAt: expiresAt, active: input && input.active === false ? false : true,
      note: String(input && input.note || '').trim().slice(0,240)
    }};
  }

  function upsertPromo(list, promo){
    var code = sanitizeCode(promo.code);
    var existing = (list || []).find(function(p){ return sanitizeCode(p.code) === code; });
    var out = (list || []).filter(function(p){ return sanitizeCode(p.code) !== code; });
    // Preserve any real redemption count already on file rather than resetting it on edit.
    out.push(Object.assign({}, promo, { redeemedCount: existing ? (existing.redeemedCount || 0) : (promo.redeemedCount || 0) }));
    return out;
  }

  function setActive(list, code, active){
    var c = sanitizeCode(code);
    return (list || []).map(function(p){
      return sanitizeCode(p.code) === c ? Object.assign({}, p, { active: !!active }) : p;
    });
  }

  function removePromo(list, code){
    var c = sanitizeCode(code);
    return (list || []).filter(function(p){ return sanitizeCode(p.code) !== c; });
  }

  function isExpired(promo, nowMs){
    if(!promo.expiresAt) return false;
    var t = new Date(promo.expiresAt + 'T23:59:59').getTime();
    return isFinite(t) && t < (typeof nowMs === 'number' ? nowMs : Date.now());
  }

  function discountLabel(p){
    return p.discountType === 'flat' ? ('₹' + p.discountValue + ' off') : (p.discountValue + '% off');
  }

  function renderPromoListHtml(list, helpers){
    var esc = (helpers && helpers.esc) || function(s){ return String(s==null?'':s); };
    var now = Date.now();
    var rows = (list || []).slice().sort(function(a,b){ return (b.active!==false) - (a.active!==false); })
      .map(function(p){
        var expired = isExpired(p, now);
        var status = p.active === false ? '<span class="tag">deactivated</span>' : (expired ? '<span class="tag warn">expired</span>' : '<span class="tag good">active</span>');
        var cap = p.usageCap > 0 ? (p.redeemedCount || 0) + ' / ' + p.usageCap + ' used' : (p.redeemedCount || 0) + ' used (no cap)';
        return '<div class="row"><div class="grow"><strong>' + esc(p.code) + '</strong> ' + status +
          '<div class="meta">' + esc(discountLabel(p)) + (p.expiresAt ? ' &middot; expires ' + esc(p.expiresAt) : ' &middot; no expiry') + ' &middot; ' + cap + (p.note ? ' &middot; ' + esc(p.note) : '') + '</div></div>' +
          '<div class="actions"><button class="btn small" onclick="openPromoForm(\'' + esc(p.code) + '\')">Edit</button>' +
          '<button class="btn small" onclick="togglePromoActive(\'' + esc(p.code) + '\', ' + (p.active===false) + ')">' + (p.active===false ? 'Reactivate' : 'Deactivate') + '</button></div></div>';
      }).join('');
    return '<div class="meta" style="margin-bottom:10px">Redemption counts are tracked in Firestore but not yet incremented by checkout — there is no generic promo-code input in checkout yet. This tab manages the codes themselves.</div>' +
      '<div class="list">' + (rows || '<div class="empty">No promo codes yet. Add one below.</div>') + '</div>';
  }

  function escAttr(s){
    return String(s==null?'':s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; });
  }

  function promoFormHtml(promo){
    var p = promo || {};
    return '' +
      '<div class="field"><label>Code (e.g. LAUNCH20)</label><input id="promoCode" class="input" value="' + escAttr(p.code) + '"' + (promo ? ' readonly' : '') + '></div>' +
      '<div class="field"><label>Discount type</label><select id="promoType" class="input">' +
        DISCOUNT_TYPES.map(function(t){ return '<option value="'+t+'"'+(p.discountType===t?' selected':'')+'>'+(t==='percent'?'Percent off':'Flat amount off (₹)')+'</option>'; }).join('') +
      '</select></div>' +
      '<div class="field"><label>Discount value</label><input id="promoValue" class="input" type="number" min="0" step="1" value="' + (typeof p.discountValue==='number'?p.discountValue:10) + '"></div>' +
      '<div class="field"><label>Usage cap (0 = unlimited)</label><input id="promoCap" class="input" type="number" min="0" value="' + (typeof p.usageCap==='number'?p.usageCap:0) + '"></div>' +
      '<div class="field"><label>Expires (optional)</label><input id="promoExpiry" class="input" type="date" value="' + escAttr(p.expiresAt) + '"></div>' +
      '<div class="field"><label>Active</label><select id="promoActive" class="input"><option value="true"' + (p.active!==false?' selected':'') + '>Active</option><option value="false"' + (p.active===false?' selected':'') + '>Deactivated</option></select></div>' +
      '<div class="field full"><label>Note</label><input id="promoNote" class="input" value="' + escAttr(p.note) + '"></div>';
  }

  function readPromoForm($){
    return {
      code: $('promoCode').value,
      discountType: $('promoType').value,
      discountValue: Number($('promoValue').value),
      usageCap: Number($('promoCap').value),
      expiresAt: $('promoExpiry').value,
      active: $('promoActive').value !== 'false',
      note: $('promoNote').value
    };
  }

  return {
    DISCOUNT_TYPES: DISCOUNT_TYPES,
    sanitizeCode: sanitizeCode,
    normalizePromo: normalizePromo,
    upsertPromo: upsertPromo,
    setActive: setActive,
    removePromo: removePromo,
    isExpired: isExpired,
    discountLabel: discountLabel,
    renderPromoListHtml: renderPromoListHtml,
    promoFormHtml: promoFormHtml,
    readPromoForm: readPromoForm
  };
})();
