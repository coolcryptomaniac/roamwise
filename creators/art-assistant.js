/* Kala's assistant: a transparent, rule-based helper (assistant, seller, marketer, researcher).
   Not a language model. Every answer is built from the listings in artists-data.json and says when it does not know.
   Shows its reasoning steps. Nothing is sent anywhere. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); };
  var inr = function (n) { return '₹' + n.toLocaleString('en-IN'); };
  var log = $('akLog'); if (!log) return;
  var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function K() { return window.RWKala; }
  function low(it) { return it.range ? it.range[0] : (parseInt(String(it.price).replace(/[^\d]/g, ''), 10) || 0); }
  function high(it) { return it.range ? it.range[1] : low(it); }
  function parseBudget(q) {
    var m = /(\d+(?:[.,]\d+)?)\s*(lakh|lac|l\b|k\b|thousand|hazar)?/i.exec(q.replace(/,/g, ''));
    if (!m) return 0; var n = parseFloat(m[1]), u = (m[2] || '').toLowerCase();
    if (/lakh|lac|^l$/.test(u)) return n * 100000; if (/k|thousand|hazar/.test(u)) return n * 1000; return n >= 1000 ? n : 0;
  }
  function msg(cls, html) { var d = document.createElement('div'); d.className = 'ak-m ' + cls; d.innerHTML = html; log.appendChild(d); log.scrollTop = log.scrollHeight; return d; }
  function link(href, text, alt) { return '<a class="sa-btn' + (alt ? ' sa-alt' : '') + '" href="' + esc(href) + '" target="_blank" rel="noopener">' + esc(text) + '</a>'; }
  function wa(it, text) { var a = it.a; return a.whatsapp ? 'https://wa.me/' + a.whatsapp + '?text=' + encodeURIComponent(text) : a.instagram; }

  function think(q) {
    var it = K().current(), items = K().items(), s = q.toLowerCase(), steps = [], out = '', acts = '';
    if (!it) return { steps: ['No painting is selected'], html: 'Please pick a painting first.' };
    var budget = parseBudget(s);
    // Researcher
    if (/artist|about|who|research|source|verify|real|trust|genuine|authentic/.test(s) && !/caption|share/.test(s)) {
      var a = it.a; steps = ['Opening ' + a.name + '’s record', 'Reading its sources and check date'];
      var src = [a.website && ['Portfolio', a.website], ['Instagram', a.instagram], a.social && a.social.youtube && ['YouTube', a.social.youtube]].filter(Boolean);
      out = '<b>' + esc(a.name) + '</b> (' + esc(a.studio) + '), ' + esc(a.state) + '. Role on RoamWise: ' + esc(a.role) + '. Details were checked on ' + esc(String(a.checkedAt).slice(0, 10)) + ' from public pages: ' + src.map(function (x) { return '<a href="' + esc(x[1]) + '" target="_blank" rel="noopener">' + esc(x[0]) + '</a>'; }).join(', ') + '.<br>I cannot verify authenticity or sales history myself, so please ask the artist for a certificate and the details below.';
    }
    // Buy / connect / offer
    else if (/buy|order|purchase|connect|contact|offer|negotiate|discount/.test(s)) {
      steps = ['Reading the listing for ' + it.title, 'Preparing a message to the artist'];
      var bud = budget ? ' My budget is about ' + inr(budget) + '. Would that work?' : '';
      out = 'Here is a ready message to ' + esc(it.artist) + '. Prices are set by the artist, so any discount is her call.<ul><li>Ask for final price, size, framing and shipping</li><li>Pay only after you agree it with the artist</li></ul>';
      acts = link(wa(it, 'Namaste ' + it.studio + ', Kala (RoamWise art guide) showed me "' + it.title + '" (' + it.price + '). I would like to buy it.' + bud + ' Please share availability, final price and delivery details.'), it.a.whatsapp ? 'Message on WhatsApp' : 'Message on Instagram');
    }
    // Marketer
    else if (/caption|share|post|promote|market|story|status|hashtag|instagram/.test(s)) {
      steps = ['Taking the title, artist and price', 'Writing a caption in plain language'];
      var cap = 'Discover “' + it.title + '” by ' + it.artist + ' (' + it.studio + '), ' + it.price + '. ' + (it.sacred ? 'Original sacred art' : 'Original art') + ', sold directly by the artist. See it on RoamWise: https://www.roamwise.co.in/creators/sacred-art.html #SacredArt #IndianArt #OriginalPainting #RoamWise';
      out = 'Here is a caption you can post or send:<br><i>' + esc(cap) + '</i>';
      acts = '<button type="button" class="sa-btn" data-copy="' + esc(cap) + '">Copy caption</button> ' + link('https://wa.me/?text=' + encodeURIComponent(cap), 'Share on WhatsApp', true);
      if (navigator.share) acts += ' <button type="button" class="sa-btn sa-alt" data-share="' + esc(cap) + '">Share…</button>';
    }
    // Before buying checklist
    else if (/ask|check|before|certificate|deliver|ship|frame|return|policy|safe/.test(s)) {
      steps = ['Looking for stated policies', 'None are listed, so I will give a checklist'];
      out = 'The listings do not state delivery, framing or return terms, so I will not guess them. Ask ' + esc(it.artist) + ':<ul><li>Is it still available, and the final price?</li><li>Exact size, medium and whether it is framed</li><li>Certificate of authenticity or a signed note</li><li>Packing, shipping cost, time and insurance</li><li>Return or exchange terms in writing</li></ul>';
    }
    // Price / compare
    else if (/price|cost|how much|expensive|cheap|compare|worth|fair/.test(s)) {
      var all = items.map(low).filter(Boolean).sort(function (a, b) { return a - b; }), p = low(it), rank = all.filter(function (x) { return x <= p; }).length;
      steps = ['Reading the price of ' + it.title, 'Comparing it with ' + all.length + ' listings on this page'];
      out = it.title + ' is listed at <b>' + esc(it.price) + '</b>' + (it.range ? ' (an indicative range; the artist confirms)' : '') + '. ' + (p ? 'That is cheaper than about ' + Math.round((1 - rank / all.length) * 100) + '% of the listings here, which run from ' + inr(all[0]) + ' to ' + inr(all[all.length - 1]) + '. This compares only what is on this page, not the wider art market, so I cannot say whether it is a bargain.' : 'The artist has not published a price, so ask her.');
    }
    // Budget / room recommendation
    else if (budget || /pooja|puja|temple|shrine|living|office|gift|bedroom|suggest|recommend|under|below|within|room/.test(s)) {
      var sacredWant = /pooja|puja|temple|shrine|gift|devot|shiva|kali|ram/.test(s), modern = /living|office|bedroom|modern|decor|décor/.test(s);
      steps = ['Understood: ' + (budget ? 'budget about ' + inr(budget) : 'no budget given') + (sacredWant ? ', devotional' : modern ? ', contemporary' : ''), 'Filtering ' + items.length + ' listings', 'Ranking by fit'];
      var rows = items.map(function (x) { var sc = 0; if (!budget || (low(x) <= budget)) sc += 3; else sc -= 3; if (sacredWant && x.sacred) sc += 2; if (modern && !x.sacred) sc += 2; if (x.img) sc += 1; return { x: x, sc: sc }; }).filter(function (r) { return r.sc > 0 && low(r.x) > 0; }).sort(function (a, b) { return b.sc - a.sc; }).slice(0, 3);
      if (!rows.length) out = 'Nothing listed fits that budget yet. You can ask an artist for a custom commission.';
      else { out = 'Top picks for you:<ul>' + rows.map(function (r) { return '<li><a href="#" data-pick="' + items.indexOf(r.x) + '">' + esc(r.x.title) + '</a> by ' + esc(r.x.artist) + ', ' + esc(r.x.price) + '</li>'; }).join('') + '</ul>Tap one and I will change into something to match.'; }
    }
    else { steps = ['I could not match that to what I know']; out = 'I can help with <b>price</b>, <b>buying</b>, <b>the artist and sources</b>, <b>a caption to share</b>, <b>what to ask before buying</b>, or <b>suggestions for a budget or room</b>. I do not want to guess beyond the listings.'; }
    return { steps: steps, html: out + (acts ? '<div class="ak-act">' + acts + '</div>' : '') };
  }

  function ask(q) {
    q = String(q || '').trim(); if (!q) return; msg('ak-u', esc(q));
    var r = think(q), t = document.createElement('div'); t.className = 'ak-think'; log.appendChild(t);
    var i = 0; (function step() {
      if (i < r.steps.length) { t.textContent = '✦ ' + r.steps[i++] + '…'; setTimeout(step, still ? 0 : 420); }
      else { t.remove(); var m = msg('ak-k', r.html); K().say(m.textContent.slice(0, 400)); }
    })();
  }
  $('akForm').addEventListener('submit', function (e) { e.preventDefault(); ask($('akIn').value); $('akIn').value = ''; });
  $('akChips').addEventListener('click', function (e) { var b = e.target.closest('button[data-q]'); if (b) ask(b.dataset.q); });
  log.addEventListener('click', function (e) {
    var c = e.target.closest('[data-copy]'), s = e.target.closest('[data-share]'), p = e.target.closest('[data-pick]');
    if (c) { (navigator.clipboard ? navigator.clipboard.writeText(c.dataset.copy) : Promise.reject()).then(function () { c.textContent = 'Copied'; }).catch(function () { c.textContent = 'Select and copy manually'; }); }
    if (s) navigator.share({ text: s.dataset.share }).catch(function () {});
    if (p) { e.preventDefault(); K().select(+p.dataset.pick); }
  });
  // Greeting
  var greeted = false; function hello() { if (greeted || !K() || !K().current()) return; greeted = true; msg('ak-k', 'Namaste. Tell me a budget, a room, or ask about the artist. I can also write a caption to share this painting.'); }
  var iv = setInterval(function () { if (window.RWKala && window.RWKala.current()) { hello(); clearInterval(iv); } }, 300);
})();
