// @ts-nocheck
/* AILON TUSK x ATLAS — answers geography questions straight from the open atlas (js/data/atlas-resolver.js):
   "where is X", "which state/district is X in", "how far is A from B", "what is near X". Namesakes are never guessed:
   "Rampur" or "Springfield" get a "which one?" with the real candidates. Anything the atlas cannot place falls back to the
   live geocoder, then to the normal Tusk engine. Pure helpers are exported for tests (rwAtlasIntent, rwAtlasCompose). */
(function (root) {
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var CLEAN = /[?!.]+$/;
  /* returns {type, a, b} or null */
  function intent(t) {
    var q = String(t || '').trim().replace(CLEAN, '').replace(/\s+/g, ' ');
    if (!q || q.length > 180) return null;
    // Hindi / Hinglish speech transcripts: preserve place names and their context.
    // Only geography intents are handled here; booking and payment remain in their dedicated flows.
    var natural = q.match(/^(?:mujhe\s+)?(.+?)\s+(?:kahan|kahaan|कहाँ|कहां)\s+(?:hai|he|है)(?:\s+.*)?$/i);
    if (natural) return {type:'where',a:natural[1]};
    var whereHindi = q.match(/^(?:where is|kahan hai|kahaan hai|कहाँ है|कहां है)\s+(.+)$/i);
    if (whereHindi) return {type:'where',a:whereHindi[1]};
    var nearHindi = q.match(/^(?:places|spots|ghumne ki jagah|ghumne ki jagahen|घूमने की जगह|घूमने की जगहें)\s+(?:near|around|paas|के पास)\s+(.+)$/i)
      || q.match(/^(.+?)\s+(?:ke paas|ke aas paas|के पास|के आसपास)\s+(?:kya|kahan|क्या|कहाँ|ghumne ki jagah|places|spots).*/i);
    if (nearHindi) return {type:'near',a:nearHindi[1]};
    var distanceHindi = q.match(/^(.+?)\s+(?:se|से)\s+(.+?)\s+(?:kitna|kitni|कितना|कितनी)\s+(?:dur|door|दूर).*$/i);
    if (distanceHindi) return {type:'distance',a:distanceHindi[1],b:distanceHindi[2]};
    var m;
    if ((m = q.match(/^(?:what(?:'s| is) the )?distance (?:between|from) (.+?) (?:and|to) (.+)$/i)) || (m = q.match(/^how far (?:is|are) (.+?) (?:from|to) (.+)$/i)) ||
        (m = q.match(/^(.+?) to (.+?) distance$/i))) {
      var a = m[1], b = m[2];
      if (/^how far/i.test(q)) { var tmp = a; a = m[2]; b = tmp; } // "how far is B from A" -> A..B
      return { type: 'distance', a: a, b: b };
    }
    if ((m = q.match(/^(?:which|what) (?:state|district|country|region) (?:is|does) (.+?) (?:in|belong to|come under|lie in|located in)$/i)) ||
        (m = q.match(/^(?:in )?(?:which|what) (?:state|district|country|region) (?:is|does) (.+?)(?: lie| located| situated| fall)?$/i)) ||
        (m = q.match(/^(.+?) (?:is )?in which (?:state|district|country|region)$/i)) || (m = q.match(/^where (?:is|are|'s) (.+?)(?: located| situated)?$/i)) ||
        (m = q.match(/^(.+?) (?:kahan|kahaan) (?:hai|he)$/i)) || (m = q.match(/^(?:locate|find) (.+)$/i))) {
      return { type: 'where', a: m[1] };
    }
    if ((m = q.match(/^(?:places|things|spots|sights|temples|attractions|what(?:'s| is)?(?: there)?(?: to see| to visit)?|tourist places|famous places) (?:to see |to visit |to do )?(?:near|around|close to|nearby) (.+)$/i)) ||
        (m = q.match(/^what(?:'s| is) (?:near|around|close to) (.+)$/i)) || (m = q.match(/^(.+?) (?:ke )?(?:paas|nearby) (?:kya|places)(?: hai| hain)?$/i))) {
      return { type: 'near', a: m[1] };
    }
    return null;
  }
  function ambig(name, f) {
    var q = 'There are several places called ' + name + (f.namesakes && f.namesakes.total >= 4 ? ' (about ' + f.namesakes.total + ' villages and towns with that name in India alone)' : '') + '. Which one do you mean?';
    var opts = f.matches.slice(0, 4).map(function (m) { return name + ', ' + (m.district && m.district !== m.name ? m.district + ', ' : '') + (m.state || m.country); });
    return (typeof rwTuskAsk === 'function') ? rwTuskAsk(q, opts) : esc(q) + '<br>' + opts.map(esc).join('<br>');
  }
  function describe(m) {
    var s = '<b>' + esc(m.name) + '</b> is ' + (/^[aeiou]/i.test(m.label) ? 'an ' : 'a ') + esc(m.label) + ' in <b>' + esc(m.where) + '</b>.';
    if (m.kind === 'country' && m.ref) s = esc(m.summary);
    return s;
  }
  function compose(i, A) {
    if (i.type === 'where') {
      var f = A.find(i.a); if (!f.best) return null;
      if (f.ambiguous) return ambig(i.a, f);
      var m = f.best, out = describe(m);
      if (m.lat != null) out += ' (about ' + Math.abs(m.lat).toFixed(2) + '°' + (m.lat < 0 ? 'S' : 'N') + ', ' + Math.abs(m.lng).toFixed(2) + '°' + (m.lng < 0 ? 'W' : 'E') + ')';
      if (m.viaAlias) out += ' “' + esc(i.a) + '” is another name for it.';
      return out;
    }
    if (i.type === 'distance') {
      var fa = A.find(i.a), fb = A.find(i.b); if (!fa.best || !fb.best) return null;
      if (fa.ambiguous) return ambig(i.a, fa); if (fb.ambiguous) return ambig(i.b, fb);
      var d = A.distance(fa.best, fb.best); if (!d) return null;
      return '<b>' + esc(fa.best.name) + '</b> to <b>' + esc(fb.best.name) + '</b>: about <b>' + d.km + ' km</b> in a straight line, so plan on roughly <b>' + d.roadKmApprox + ' km by road</b> (hills add more time than distance). Tell me the dates and I’ll plan it.';
    }
    if (i.type === 'near') {
      var fn = A.find(i.a); if (!fn.best || fn.best.lat == null) return null;
      if (fn.ambiguous) return ambig(i.a, fn);
      var list = A.nearby(fn.best.lat, fn.best.lng, 8, ['T', 'F', 'N', 'R', 'W', 'M', 'B', 'I', 'X', 'A']).filter(function (x) { return x.name !== fn.best.name; }).slice(0, 6);
      if (!list.length) return null;
      return 'Worth seeing near <b>' + esc(fn.best.name) + '</b> (straight-line distance):<br>' + list.map(function (x) { return '• ' + esc(x.name) + ' — ' + esc(x.label) + ', ~' + x.km + ' km'; }).join('<br>');
    }
    return null;
  }
  /* copilotSend pre-answer hook (via rwTuskPreAnswer). true = handled (async answer follows). */
  function reply(bubble, intents, t) {
    var it = intent(t); if (!it || !root || !root.RW_ATLAS) return false;
    intents.smalltalk = 'atlas';
    root.RW_ATLAS.loadAll().then(function (A) {
      var html = A && A.ready ? compose(it, root.RW_ATLAS) : null;
      if (html) return cpFinish(bubble, html, intents, t);
      var nm = it.a;
      if (typeof rwResolvePlace === 'function') return rwResolvePlace(nm).then(function (p) {
        if (p) return cpFinish(bubble, '<b>' + esc(p.name) + '</b>' + (p.admin ? ', ' + esc(p.admin) : '') + (p.country ? ', ' + esc(p.country) : '') + ' (about ' + Number(p.lat).toFixed(2) + '°, ' + Number(p.lon).toFixed(2) + '°).<br><a href="/?destination=' + encodeURIComponent(p.name) + '">Plan a trip →</a> · <a href="/partner/?role=customer&amp;destination=' + encodeURIComponent(p.name) + '">Find verified stays →</a><br><small>For live road closures or event updates, check current dated advisories and official sources before travelling; map lookup does not verify road conditions.</small>', intents, t);
        return cpFinish(bubble, 'I couldn’t place “' + esc(nm) + '” on the map. Could you add the district, state or country?', intents, t);
      });
      return cpFinish(bubble, 'I couldn’t place “' + esc(nm) + '”. Could you add the district, state or country?', intents, t);
    });
    return true;
  }
  var API = { intent: intent, compose: compose, reply: reply };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (root) { root.rwAtlasIntent = intent; root.rwAtlasCompose = compose; root.rwAtlasReply = reply; }
})(typeof window !== 'undefined' ? window : null);
