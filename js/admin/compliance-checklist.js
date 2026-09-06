// @ts-nocheck
/* ============================================================================
   js/admin/compliance-checklist.js
   ----------------------------------------------------------------------------
   A plain, honest checklist — NOT a fabricated "compliance score". Every
   item below references something real already identified in this repo:
   a merged PR, a documented threshold, or an existing admin tool. The owner
   flips each item's status by hand (open / in_progress / done / not_yet_required)
   and that choice is the only thing persisted — this file never invents or
   auto-grades compliance.

   Persisted at config/complianceChecklist (admin-write-only per the existing
   `match /config/{doc}` Firestore rule — no new rule needed for this file).
   ========================================================================= */
var RWComplianceChecklist = (function(){
  var STATUSES = ['open','in_progress','done','not_yet_required'];

  /* Static item definitions. `defaultStatus` reflects what this session's
     own history/docs actually show — see each `evidence` string for the
     exact source. Never a guess dressed up as a fact. */
  var ITEMS = [
    {
      id: 'razorpay_kyc_pages',
      label: 'Razorpay KYC pages (pricing, cancellation/refund, terms, privacy)',
      defaultStatus: 'done',
      evidence: 'PR #128 "Add Razorpay KYC pages" — merged 2026-09-05. Added pricing.html and refund-policy.html, updated terms.html/privacy.html and footer links.'
    },
    {
      id: 'firestore_rules_hardening',
      label: 'Firestore security rules hardened (founder-seat counting, partner-redeem replay, rules-duplication cleanup)',
      defaultStatus: 'done',
      evidence: 'firestore.rules header (STABLE BUILD, see version marker) + git history: Founder-seat public counter fix, NMIMS partner-redeem replay closure, and removal of duplicated/conflicting match blocks.'
    },
    {
      id: 'rules_deployed_current',
      label: 'Deployed Firebase rules match this repo\'s firestore.rules',
      defaultStatus: 'open',
      evidence: 'Not a one-time fact — verify live via the existing Admin → Rules tab ("Run live test" / meta/rulesVersion probe) each time firestore.rules changes.'
    },
    {
      id: 'business_upi_separation',
      label: 'Business payments run through a registered business UPI/current account, not personal UPI',
      defaultStatus: 'open',
      evidence: 'BUSINESS-FINANCE-SETUP.md §1 + PRICING-REFERRAL-MATH.md §2: app.js still routes to the personal handle coolmohit@ybl as of this writing.'
    },
    {
      id: 'gst_registration',
      label: 'GST registration',
      defaultStatus: 'not_yet_required',
      evidence: 'finance-data.js RW_TAX_FLAGS.gst_reg: mandatory only above ₹20L services turnover/year; PRICING-REFERRAL-MATH.md confirms current revenue is well under that. Optional voluntary registration only if claiming input credit or a business customer demands a GST invoice.'
    },
    {
      id: 'tds_194h_referrals',
      label: 'TDS withholding (Section 194H) on referral/creator commission',
      defaultStatus: 'open',
      evidence: 'finance-data.js RW_TAX_FLAGS.tds_194h: triggers above ~₹20,000 commission to one person/FY. PRICING-REFERRAL-MATH.md §6: ~27 Pro-yearly sales or ~5 lifetime sales by one referrer crosses it. Live status is computed from real commission totals — see the flag(s) below, generated from the Referrals tab, not typed in by hand.'
    },
    {
      id: 'udyam_registration',
      label: 'Udyam (MSME) registration',
      defaultStatus: 'open',
      evidence: 'BUSINESS-FINANCE-SETUP.md §2: free, ~10 minutes, recommended first step toward a business current account.'
    },
    {
      id: 'founder_offer_cap_integrity',
      label: 'Founder-offer 1,000-seat cap counts every real grant path (admin + NMIMS partner redemption)',
      defaultStatus: 'done',
      evidence: 'js/pricing/founder-seats.js + firestore.rules pricing/founder carve-out: shared pricing/founder.count now moves on both the admin manual-payment tool and openPartnerRedeem(), fixing the counter that used to stay stuck at "1,000 left".'
    }
  ];

  function defaultsMap(){
    var m = {};
    ITEMS.forEach(function(it){ m[it.id] = it.defaultStatus; });
    return m;
  }

  /** overrides: the raw config/complianceChecklist Firestore doc (or {}). */
  function mergeChecklist(overrides){
    var statuses = Object.assign(defaultsMap(), overrides || {});
    return ITEMS.map(function(it){
      var s = statuses[it.id];
      return Object.assign({}, it, { status: STATUSES.indexOf(s) > -1 ? s : it.defaultStatus });
    });
  }

  /** Plain counts by status — deliberately not collapsed into one "score". */
  function summarize(items){
    var counts = { open:0, in_progress:0, done:0, not_yet_required:0 };
    items.forEach(function(it){ if(Object.prototype.hasOwnProperty.call(counts, it.status)) counts[it.status]++; });
    return counts;
  }

  function statusLabel(s){
    return { open:'Open', in_progress:'In progress', done:'Done', not_yet_required:'Not required yet' }[s] || s;
  }

  function renderChecklistHtml(items, tdsFlags, esc){
    esc = esc || function(s){ return String(s==null?'':s); };
    var counts = summarize(items);
    var summaryLine = counts.done + ' done · ' + counts.in_progress + ' in progress · ' + counts.open + ' open · ' + counts.not_yet_required + ' not required yet (plain counts, not a score)';
    var tdsHtml = (tdsFlags && tdsFlags.length)
      ? '<div class="alert bad"><b>TDS 194H threshold crossed</b> for: ' + tdsFlags.map(function(f){ return esc(f.name || f.code) + ' (₹' + Math.round(f.commissionOwedINR).toLocaleString('en-IN') + ' owed)'; }).join(', ') + ' — withhold TDS on their next payout and confirm with a CA.</div>'
      : '<div class="meta">No referrer has crossed the ₹20,000/FY TDS 194H threshold yet (live check against the Referrals tab).</div>';
    var rows = items.map(function(it){
      var tagClass = it.status === 'done' ? 'good' : (it.status === 'open' ? 'warn' : '');
      return '<div class="row"><div class="grow"><strong>' + esc(it.label) + '</strong><div class="meta">' + esc(it.evidence) + '</div></div>' +
        '<span class="tag ' + tagClass + '">' + esc(statusLabel(it.status)) + '</span>' +
        '<select class="input" style="width:auto" data-checklist-id="' + esc(it.id) + '" onchange="setComplianceStatus(\'' + esc(it.id) + '\', this.value)">' +
        STATUSES.map(function(s){ return '<option value="' + s + '"' + (s===it.status?' selected':'') + '>' + statusLabel(s) + '</option>'; }).join('') +
        '</select></div>';
    }).join('');
    return '<div class="meta" style="margin-bottom:10px">' + summaryLine + '</div>' + tdsHtml + '<div class="list" style="margin-top:12px">' + rows + '</div>';
  }

  return {
    ITEMS: ITEMS,
    STATUSES: STATUSES,
    mergeChecklist: mergeChecklist,
    summarize: summarize,
    statusLabel: statusLabel,
    renderChecklistHtml: renderChecklistHtml
  };
})();
