/* ============================================================================
   features/travel-safety/core/scam.js — "is this booking link / UPI / number safe?"
   ----------------------------------------------------------------------------
   Pure, offline checks. Nothing typed here leaves the device. The checker can
   say a link IS on an official domain (exact host or a government suffix); it
   can never say an unknown site is safe, only list warning signs. Wording on the
   page must keep that difference.

   classify(input, context) -> { type, verdict, host?, reasons[], advice[] }
     verdict: 'official' | 'roamwise' | 'high-risk' | 'caution' | 'unknown'
     context: 'helicopter' | 'chardham' | 'stay' | 'taxi' | 'trek' | 'other'
   ========================================================================= */
(function (root, factory) {
  var api = factory();
  root.RWScamCheck = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';

  /* Exact hosts (and their subdomains) we can vouch for as official. */
  var OFFICIAL = [
    { host: 'heliyatra.irctc.co.in', name: 'IRCTC HeliYatra (official Kedarnath helicopter booking)', for: ['helicopter'] },
    { host: 'irctc.co.in', name: 'IRCTC (Indian Railways)' },
    { host: 'registrationandtouristcare.uk.gov.in', name: 'Uttarakhand Tourism registration portal', for: ['chardham'] },
    { host: 'uttarakhandtourism.gov.in', name: 'Uttarakhand Tourism' },
    { host: 'badrinath-kedarnath.gov.in', name: 'Badrinath–Kedarnath Temple Committee' },
    { host: 'kmvn.gov.in', name: 'Kumaon Mandal Vikas Nigam (state tourism, Kumaon)' },
    { host: 'gmvnonline.com', name: 'Garhwal Mandal Vikas Nigam online booking (state tourism, Garhwal)' },
    { host: 'uttarastays.com', name: 'Uttarakhand Tourism homestay booking portal', for: ['stay'] },
    { host: 'roamwise.co.in', name: 'RoamWise', roamwise: true }
  ];
  /* Only governments can register these suffixes. */
  var GOV_SUFFIX = ['.gov.in', '.nic.in'];
  var FREE_HOSTS = ['blogspot.com', 'wixsite.com', 'weebly.com', 'netlify.app', 'vercel.app', 'github.io', 'pages.dev', 'web.app', 'firebaseapp.com',
    'godaddysites.com', 'business.site', 'wordpress.com', 'carrd.co', 'linktr.ee', 'sites.google.com', 'jimdosite.com', 'mystrikingly.com', 'webnode.page'];
  var SHORTENERS = ['bit.ly', 'tinyurl.com', 'cutt.ly', 'rb.gy', 'is.gd', 't.ly', 'shorturl.at', 'goo.gl', 'ow.ly', 'rebrand.ly', 'tiny.cc'];
  var LURE_WORDS = ['kedarnath', 'heli', 'helicopter', 'chardham', 'char-dham', 'badrinath', 'irctc', 'yatra', 'kmvn', 'gmvn', 'uttarakhand', 'tourism', 'darshan', 'kainchi', 'kailash'];

  function hostOf(input) {
    var s = String(input || '').trim();
    if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) s = 'https://' + s;
    try { return { host: new URL(s).hostname.toLowerCase().replace(/^www\./, '').replace(/\.$/, ''), http: /^http:\/\//i.test(String(input).trim()) }; } catch (e) { return null; }
  }
  function onHost(host, base) { return host === base || host.slice(-(base.length + 1)) === '.' + base; }

  function looksLikeUrl(s) { return /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(:\d+)?(\/\S*)?$/i.test(s) && !/@/.test(s.split('/')[0]); }
  function looksLikeUpi(s) { return /^[a-z0-9._-]{2,256}@[a-z][a-z0-9]{1,64}$/i.test(s); }
  function digitsOf(s) { return String(s).replace(/[\s()+-]/g, ''); }
  function looksLikePhone(s) { var d = digitsOf(s); return /^(91|0)?[6-9]\d{9}$/.test(d) || /wa\.me\/\d+/i.test(s); }

  function classifyUrl(raw, ctx) {
    var h = hostOf(raw);
    if (!h || !h.host || h.host.indexOf('.') === -1) return { type: 'url', verdict: 'unknown', reasons: ['This does not look like a web address.'], advice: [] };
    var host = h.host;
    var reasons = [];
    var advice = [];
    for (var i = 0; i < OFFICIAL.length; i++) {
      var o = OFFICIAL[i];
      if (onHost(host, o.host)) {
        if (o.roamwise) return { type: 'url', verdict: 'roamwise', host: host, reasons: ['This is a RoamWise page. RoamWise never sells helicopter tickets or government permits.'], advice: [] };
        var r = { type: 'url', verdict: 'official', host: host, reasons: ['Official: ' + o.name + '.'], advice: [] };
        if (h.http) r.advice.push('Open it with https:// and check the padlock before paying.');
        if (ctx === 'helicopter' && o.host !== 'heliyatra.irctc.co.in') r.advice.push('Kedarnath helicopter tickets themselves are sold only on heliyatra.irctc.co.in.');
        return r;
      }
    }
    if (GOV_SUFFIX.some(function (s) { return host.slice(-s.length) === s; })) {
      return { type: 'url', verdict: 'official', host: host, reasons: ['A government domain (' + host + '). Only government bodies can register these.'], advice: ['Still check it is the right department for what you are booking.'] };
    }
    var risk = 0;
    if (/^xn--|\.xn--/.test(host)) { risk += 3; reasons.push('The address uses look-alike characters (punycode), a common phishing trick.'); }
    if (host.indexOf('irctc') !== -1) { risk += 3; reasons.push('It uses "irctc" in the name but is not on irctc.co.in.'); }
    var lure = LURE_WORDS.filter(function (w) { return host.indexOf(w) !== -1; });
    if (lure.length && host.indexOf('irctc') === -1) { risk += 2; reasons.push('It borrows a pilgrimage or government name ("' + lure[0] + '") but is not an official domain.'); }
    if (FREE_HOSTS.some(function (f) { return onHost(host, f); })) { risk += 2; reasons.push('It is on a free website builder (' + host + '). Real operators rarely take payments on these.'); }
    if (SHORTENERS.some(function (f) { return onHost(host, f); })) { risk += 1; reasons.push('It is a short link that hides the real address. Open it carefully and check where it lands.'); }
    if (h.http) { risk += 1; reasons.push('It is not secure (http, no padlock).'); }
    if (ctx === 'helicopter') { risk += 3; reasons.push('Kedarnath helicopter tickets are sold only on heliyatra.irctc.co.in. Any other site selling them is fake.'); }
    if (ctx === 'chardham') { risk += 1; reasons.push('Char Dham registration is free and done on registrationandtouristcare.uk.gov.in or at official counters.'); }
    if (ctx === 'stay' || ctx === 'taxi' || ctx === 'trek') {
      advice.push('Private businesses use their own websites, so this alone is not proof either way.');
      advice.push('Call the number on their Google Maps listing, read recent reviews, and pay only a small advance (or at the property).');
      advice.push('Homestays registered with the state can also be found on uttarastays.com.');
    }
    advice.push('Never share an OTP, and do not pay by "scan this QR to receive money".');
    var verdict = risk >= 3 ? 'high-risk' : risk >= 1 ? 'caution' : 'unknown';
    if (verdict === 'unknown') reasons.push('Not an official domain we know. We cannot vouch for it.');
    return { type: 'url', verdict: verdict, host: host, reasons: reasons, advice: advice };
  }

  function classify(input, context) {
    var s = String(input || '').trim().slice(0, 500);
    var ctx = ['helicopter', 'chardham', 'stay', 'taxi', 'trek', 'other'].indexOf(context) !== -1 ? context : 'other';
    if (!s) return { type: 'empty', verdict: 'unknown', reasons: [], advice: [] };
    if (looksLikeUpi(s)) {
      var up = { type: 'upi', verdict: 'caution', reasons: ['This is a UPI ID. UPI shows you the account holder\'s name before you pay: check it matches the business.'], advice: [] };
      if (ctx === 'helicopter' || ctx === 'chardham') {
        up.verdict = 'high-risk';
        up.reasons.push(ctx === 'helicopter' ? 'Genuine helicopter tickets are paid only inside IRCTC HeliYatra, never to a UPI ID.' : 'Char Dham registration is free. Nobody needs a UPI payment for it.');
      } else up.advice.push('For a stay or taxi, prefer paying a small advance and the rest in person.');
      up.advice.push('Never enter your UPI PIN to "receive" money.');
      return up;
    }
    if (looksLikePhone(s)) {
      var ph = { type: 'phone', verdict: 'caution', reasons: [], advice: ['Match the number with the one on the business\'s Google Maps listing or official site.'] };
      if (ctx === 'helicopter') { ph.verdict = 'high-risk'; ph.reasons.push('No one sells genuine Kedarnath helicopter tickets over WhatsApp or phone. Book only on heliyatra.irctc.co.in.'); }
      else if (ctx === 'chardham') { ph.verdict = 'high-risk'; ph.reasons.push('Registration is free on the official portal; nobody needs to "arrange" it by phone for money.'); }
      else ph.reasons.push('A phone number can\'t be verified from here.');
      return ph;
    }
    if (looksLikeUrl(s)) return classifyUrl(s, ctx);
    return { type: 'text', verdict: 'unknown', reasons: ['Paste a website link, a UPI ID (name@bank) or a phone number.'], advice: [] };
  }

  return { classify: classify, OFFICIAL: OFFICIAL };
});
