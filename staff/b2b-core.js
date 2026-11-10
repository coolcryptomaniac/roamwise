/* RoamWise B2B desk: pure rules shared by staff/b2b-desk.js and the tests (tests/b2b-core.test.js).
   No DOM, no network, no Firestore here. A classic script in the browser (window.RWB2B) and a
   CommonJS module in Node.

   Who may do what (enforced in firestore.rules, mirrored here so the screen never offers a refused action):
   - B2B staff move a deal lead -> pitched -> mou_sent, or mark it lost.
   - mou_signed is written by the Worker when the property signs its own MOU link (worker/handlers/b2b-mou.js).
   - countersigned and live are the founder's steps.
   - Staff report money with a reference; only the founder marks it verified. Reported money is never counted as received. */
(function (root) {
  'use strict';

  var STAGES = [
    { id: 'lead', label: 'New lead', who: 'staff' },
    { id: 'pitched', label: 'Pitched', who: 'staff' },
    { id: 'mou_sent', label: 'MOU sent', who: 'staff' },
    { id: 'mou_signed', label: 'MOU signed by partner', who: 'system' },
    { id: 'countersigned', label: 'Countersigned by founder', who: 'admin' },
    { id: 'live', label: 'Live on RoamWise', who: 'admin' },
    { id: 'lost', label: 'Not going ahead', who: 'staff' }
  ];
  var STAFF_STAGES = STAGES.filter(function (s) { return s.who === 'staff'; }).map(function (s) { return s.id; });

  var KINDS = {
    stay: 'Homestay / hotel',
    adventure: 'Trek / experience operator',
    transport: 'Driver / transport',
    agency: 'Travel agency',
    creator: 'Creator-led trips',
    campus: 'College / campus group',
    corporate: 'Company / team offsite',
    package: 'Package buyer (group)'
  };

  /* Must match the table in partner/mou/index.html and the `plans` map in partner/mou/mou.js. */
  var PLANS = {
    free: { label: 'Partner Free', fee: 0, period: '', pct: 7 },
    desk: { label: 'Partner Desk', fee: 249, period: 'per month', pct: 5 },
    annual: { label: 'Partner Annual', fee: 2499, period: 'per year', pct: 5 },
    three_year: { label: 'Partner 3 Year', fee: 5999, period: 'once for 3 years', pct: 5 }
  };

  var TXN_KINDS = {
    plan_fee: 'Partner plan fee',
    setup_fee: 'Assisted setup fee',
    package_deposit: 'Package deposit',
    package_balance: 'Package balance',
    commission: 'Stay commission',
    refund: 'Refund paid out',
    other: 'Other'
  };
  var TXN_METHODS = { upi: 'UPI', bank: 'Bank transfer', cashfree: 'Cashfree link', cash: 'Cash' };
  var TXN_MAX = 500000;

  function clip(v, n) { return String(v == null ? '' : v).replace(/[\u0000-\u001f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n || 120); }
  function digits(v) { return String(v == null ? '' : v).replace(/\D/g, ''); }
  function phone(v) { var d = digits(v); if (d.length === 12 && d.slice(0, 2) === '91') d = d.slice(2); if (d.length === 11 && d[0] === '0') d = d.slice(1); return /^[6-9]\d{9}$/.test(d) ? d : ''; }
  function email(v) { var s = clip(v, 120).toLowerCase(); return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s) ? s : ''; }
  function money(v) { var n = Math.round(Number(v) || 0); return n > 0 ? n : 0; }
  function inr(n) { return 'Rs ' + Math.round(Number(n) || 0).toLocaleString('en-IN'); }
  function isoDay(v) { return /^\d{4}-\d{2}-\d{2}$/.test(String(v || '')) ? String(v) : ''; }
  function stageLabel(id) { for (var i = 0; i < STAGES.length; i++) if (STAGES[i].id === id) return STAGES[i].label; return 'New lead'; }

  /* 128-bit random token, hex. `rand` is injectable for tests. */
  function newToken(rand) {
    var b = new Uint8Array(16);
    if (rand) rand(b); else (root.crypto || require('node:crypto').webcrypto).getRandomValues(b);
    var s = ''; for (var i = 0; i < b.length; i++) s += (b[i] < 16 ? '0' : '') + b[i].toString(16);
    return s;
  }

  /* Form input -> the exact field set firestore.rules accepts from staff. Returns { ok, problems, value }. */
  function cleanDeal(input) {
    input = input || {};
    var problems = [];
    var v = {
      name: clip(input.name, 110),
      kind: Object.prototype.hasOwnProperty.call(KINDS, input.kind) ? input.kind : 'stay',
      city: clip(input.city, 90),
      contact: clip(input.contact, 80),
      phone: phone(input.phone),
      email: email(input.email),
      plan: Object.prototype.hasOwnProperty.call(PLANS, input.plan) ? input.plan : 'free',
      bookingModel: input.bookingModel === 'net' ? 'net' : 'commission',
      listingFee: money(input.listingFee),
      note: clip(input.note, 600),
      nextAt: isoDay(input.nextAt)
    };
    if (v.name.length < 2) problems.push('Business name is needed.');
    if (!v.city) problems.push('City or area is needed.');
    if (clip(input.phone, 30) && !v.phone) problems.push('That phone number is not a 10-digit Indian mobile.');
    if (clip(input.email, 120) && !v.email) problems.push('That email address does not look right.');
    if (v.listingFee > 10000) problems.push('Setup fee is above Rs 10,000. Ask Mohit before quoting that.');
    var ls = input.longStay ? {
      r15: money(input.longStay.r15), r30: money(input.longStay.r30), r90: money(input.longStay.r90),
      incl: clip(input.longStay.incl, 200), rooms: clip(digits(input.longStay.rooms), 3), min: clip(digits(input.longStay.min), 3)
    } : null;
    if (ls && !(ls.r15 || ls.r30 || ls.r90)) ls = null;
    if (ls) v.longStay = ls;
    return { ok: problems.length === 0, problems: problems, value: v };
  }

  /* The link the partner opens to read and sign. Uses only parameters partner/mou/mou.js already understands,
     plus deal + k so the signature is recorded against this deal by the Worker. */
  function mouLink(deal, opts) {
    opts = opts || {};
    var base = (opts.origin || 'https://roamwise.co.in').replace(/\/+$/, '') + '/partner/mou/';
    var q = [];
    function add(k, val) { if (val !== '' && val != null && val !== 0) q.push(k + '=' + encodeURIComponent(String(val))); }
    add('property', clip(deal.name, 110));
    add('owner', clip(deal.contact, 80));
    add('city', clip(deal.city, 90));
    add('plan', Object.prototype.hasOwnProperty.call(PLANS, deal.plan) ? deal.plan : 'free');
    if (deal.bookingModel === 'net') add('booking_model', 'net');
    add('listing_fee', money(deal.listingFee));
    var ls = deal.longStay;
    if (ls && (ls.r15 || ls.r30 || ls.r90)) {
      add('ls', 1); add('r15', money(ls.r15)); add('r30', money(ls.r30)); add('r90', money(ls.r90));
      add('incl', clip(ls.incl, 200)); add('rooms', clip(ls.rooms, 3)); add('min', clip(ls.min, 3));
    }
    if (opts.dealId && opts.token) { add('deal', opts.dealId); add('k', opts.token); }
    if (opts.print) add('print', 1);
    return base + '?' + q.join('&');
  }

  /* A signed copy link (what the partner sends back) -> who signed and when. Null when it is not one. */
  function parseSignedLink(url) {
    var u; try { u = new URL(String(url || '').trim()); } catch (e) { return null; }
    if (!/(^|\.)roamwise\.co\.in$/.test(u.hostname) || !/^\/partner\/mou\/?$/.test(u.pathname)) return null;
    var name = clip(u.searchParams.get('s'), 80), at = u.searchParams.get('at') || '';
    var t = new Date(at);
    if (name.length < 3 || isNaN(t)) return null;
    return { name: name, desig: clip(u.searchParams.get('d'), 40) || 'Owner', at: t.toISOString(), property: clip(u.searchParams.get('property'), 110) };
  }

  function mouMessage(deal, link) {
    return 'Namaste' + (deal.contact ? ' ' + clip(deal.contact, 80) : '') + ',\n\n'
      + 'Here is the RoamWise partnership MOU for ' + clip(deal.name, 110) + '. It is non-exclusive, there is no joining fee on Partner Free, '
      + 'and commission applies only to completed stays.\n\n'
      + 'Please read it and sign at the bottom of this page (it takes about a minute):\n' + link + '\n\n'
      + 'RoamWise countersigns after you sign, and you can download your copy as a PDF from the same page.';
  }

  /* Money a staff member reports. Returns { ok, problems, value }. */
  function cleanTxn(input) {
    input = input || {};
    var problems = [];
    var amount = Math.round(Number(input.amount) * 100) / 100;
    var v = {
      kind: Object.prototype.hasOwnProperty.call(TXN_KINDS, input.kind) ? input.kind : 'other',
      method: Object.prototype.hasOwnProperty.call(TXN_METHODS, input.method) ? input.method : 'upi',
      amount: amount,
      ref: clip(input.ref, 60),
      proofUrl: /^https:\/\/[^\s]{6,300}$/.test(String(input.proofUrl || '').trim()) ? String(input.proofUrl).trim() : '',
      date: isoDay(input.date),
      note: clip(input.note, 300)
    };
    if (!(amount > 0)) problems.push('Enter the amount.');
    if (amount > TXN_MAX) problems.push('Amounts above ' + inr(TXN_MAX) + ' are entered by Mohit.');
    if (!v.date) problems.push('Pick the payment date.');
    if (v.method !== 'cash' && v.ref.length < 4) problems.push('Add the UPI / bank reference so the payment can be matched.');
    if (clip(input.proofUrl, 300) && !v.proofUrl) problems.push('The proof link must start with https://');
    return { ok: problems.length === 0, problems: problems, value: v };
  }

  /* Totals for the desk header. Reported money is shown apart from verified money and never added to it. */
  function summarise(deals, txns) {
    var by = {}; STAGES.forEach(function (s) { by[s.id] = 0; });
    (deals || []).forEach(function (d) { if (Object.prototype.hasOwnProperty.call(by, d.stage)) by[d.stage]++; else by.lead++; });
    var verified = 0, reported = 0, rejected = 0;
    (txns || []).forEach(function (t) {
      var a = Number(t.amount) || 0, sign = t.kind === 'refund' ? -1 : 1;
      if (t.status === 'verified') verified += sign * a; else if (t.status === 'rejected') rejected += a; else reported += sign * a;
    });
    var open = (deals || []).filter(function (d) { return d.stage !== 'live' && d.stage !== 'lost'; }).length;
    return { byStage: by, open: open, total: (deals || []).length, verified: verified, reported: reported, rejected: rejected };
  }

  /* What should this person do next on this deal. One line, never more. */
  function nextStep(deal, todayISO) {
    var late = deal.nextAt && todayISO && deal.nextAt < todayISO ? ' (follow-up was due ' + deal.nextAt + ')' : '';
    if (deal.kind === 'package' || deal.kind === 'campus' || deal.kind === 'corporate') {
      if (deal.stage === 'lead') return 'Send them a package quote' + late;
      if (deal.stage === 'pitched') return 'Follow up on the quote. Dates are held only after the deposit reaches RoamWise' + late;
      if (deal.stage === 'lost') return 'Closed. Reopen only if they come back';
      return 'Report each payment with its reference as it arrives' + late;
    }
    switch (deal.stage) {
      case 'lead': return 'Call or message them and log what they said' + late;
      case 'pitched': return 'Prepare the MOU and send the signing link' + late;
      case 'mou_sent': return deal.mouSignedLink ? 'Signed copy received. Mohit checks it and countersigns' : 'Waiting for their signature. Nudge after 2 days' + late;
      case 'mou_signed': return 'Signed by the partner. Mohit countersigns next';
      case 'countersigned': return 'Send them the registration link so rooms and rates go in';
      case 'live': return 'Live. Check rates and photos monthly';
      case 'lost': return 'Closed. Reopen only if they come back';
      default: return 'Call or message them';
    }
  }

  /* Package quote text for WhatsApp. `price` is the row from packages/catalog.mjs priceFor(); nothing is priced here. */
  function packageMessage(pkg, n, startISO, price, link) {
    if (!pkg || !price) return '';
    return 'Namaste, here is the RoamWise quote you asked for.\n\n'
      + pkg.name + ' | ' + pkg.days + ' days / ' + pkg.nights + ' nights from ' + pkg.start + '\n'
      + (startISO ? 'Start date: ' + startISO + '\n' : '')
      + 'Group: ' + n + ' travellers\n'
      + 'Price: ' + inr(price.totalPP) + ' per person, ' + inr(price.groupTotal) + ' for the group (GST included)\n\n'
      + 'See the day-by-day plan, what is included and book here:\n' + link + '\n\n'
      + 'Dates are held only after the deposit is paid to RoamWise.';
  }

  var api = {
    STAGES: STAGES, STAFF_STAGES: STAFF_STAGES, KINDS: KINDS, PLANS: PLANS, TXN_KINDS: TXN_KINDS, TXN_METHODS: TXN_METHODS, TXN_MAX: TXN_MAX,
    clip: clip, phone: phone, email: email, inr: inr, stageLabel: stageLabel, newToken: newToken,
    cleanDeal: cleanDeal, mouLink: mouLink, parseSignedLink: parseSignedLink, mouMessage: mouMessage,
    cleanTxn: cleanTxn, summarise: summarise, nextStep: nextStep, packageMessage: packageMessage
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.RWB2B = api;
})(typeof window !== 'undefined' ? window : globalThis);
