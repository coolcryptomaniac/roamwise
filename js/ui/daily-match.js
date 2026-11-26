/* Daily Match: one fun creator/artist × stay pairing per day, the same for everyone that day.
   A small game: guess the chemistry (Low / Good / Electric), then reveal the score. A right guess grows a
   streak kept on this device. "Propose this collab" opens the real match flow, and Share sends the pair
   to friends. Stays come from RoamWise's own published partners, so a pairing is an idea for a
   collaboration, never a claim that one exists. */
(function () {
  'use strict';
  var W = /** @type {any} */ (window), KEY = 'rw_daily_match_v1';
  function node(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function today() { return new Date().toISOString().slice(0, 10); }
  function seedOf(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rnd(seed) { return function () { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } }
  function keep(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* private mode */ } }
  function themes(list) { return (list || []).map(function (t) { return String(t).toLowerCase(); }); }
  function stays() {
    var all = Array.isArray(W.RW_PARTNERS) ? W.RW_PARTNERS : (W.RW_PARTNER_SEED || []);
    return all.filter(function (p) { return p && p.cat === 'stay' && typeof W.rwStayPublicEligible === 'function' && W.rwStayPublicEligible(p); })
      .map(function (p) { var ph = (p.photos || [])[0]; return { id: p.id, name: p.name, place: [p.area, p.zone].filter(Boolean).join(' · '), img: ph ? (typeof W.rwListingPhotoUrl === 'function' ? W.rwListingPhotoUrl(ph.src) : ph.src) : '', tags: themes([p.hook, p.zone].concat(p.badges || []).join(' ').match(/[a-z]+/gi) || []), stay: p }; });
  }
  function people(d, dir) {
    var out = [];
    ((d && d.artists) || []).forEach(function (a) { out.push({ id: 'artist:' + a.id, name: a.name, role: 'Artist', place: a.state || '', img: a.photo && a.photo.src || ((a.artworks || [])[0] || {}).image || '', tags: themes(a.themes), ig: a.instagram || '' }); });
    ((dir && dir.creators) || []).forEach(function (c) { out.push({ id: 'creator:' + c.id, name: c.name, role: 'Creator', place: c.town || '', img: '', tags: themes(String(c.niche || '').split(/[,·]/)), ig: c.instagram || '' }); });
    return out;
  }
  function chemistry(a, b, r) {
    var shared = a.tags.filter(function (t) { return b.tags.some(function (u) { return u.indexOf(t) >= 0 || t.indexOf(u) >= 0; }); }).length;
    return Math.max(52, Math.min(98, 60 + shared * 9 + Math.round(r() * 22)));
  }
  function band(score) { return score >= 85 ? 'Electric' : score >= 70 ? 'Good' : 'Low'; }
  function face(x, glyph) {
    var f = node('div', 'rw-dm-face');
    var pic = node('span', 'rw-dm-pic'); if (x.img) { var im = node('img'); im.src = x.img; im.alt = ''; im.loading = 'lazy'; pic.append(im); } else pic.textContent = glyph;
    f.append(pic, node('b', '', x.name), node('small', '', [x.role, x.place].filter(Boolean).join(' · ')));
    return f;
  }
  function render(a, b, score) {
    var s = load(), done = s.day === today() && s.guess;
    var sec = node('section', 'v v-home rw-daily-match'); sec.id = 'rwDailyMatch'; sec.setAttribute('aria-labelledby', 'rwDmTitle');
    var head = node('div', 'rw-dm-head'); var h = node('h2', '', '⚡ Today\'s Match'); h.id = 'rwDmTitle';
    head.append(h, node('span', 'rw-dm-streak', '🔥 Streak ' + (s.streak || 0)));
    var pair = node('div', 'rw-dm-pair'); pair.append(face(a, '🎨'), node('span', 'rw-dm-x', '×'), face(b.stay ? b : b, '🏡'));
    var meter = node('div', 'rw-dm-meter'); var fill = node('i'); meter.append(fill);
    var result = node('p', 'rw-dm-result', 'How strong is the chemistry? Guess, then reveal.');
    var guesses = node('div', 'rw-dm-guess');
    var actions = node('div', 'rw-dm-actions');
    function reveal(guess) {
      var st = load(); var right = guess === band(score);
      if (st.day !== today()) { st.streak = right ? ((st.last === yesterday() ? st.streak || 0 : 0) + 1) : 0; st.day = today(); st.guess = guess; st.last = today(); keep(st); }
      guesses.remove();
      var n = 0, t = setInterval(function () { n = Math.min(score, n + 3); fill.style.width = n + '%'; result.textContent = n + '% chemistry'; if (n >= score) { clearInterval(t); result.textContent = score + '% · ' + band(score) + ' match' + (st.guess ? (st.guess === band(score) ? ' · you called it! 🎉' : ' · you guessed ' + st.guess) : ''); head.querySelector('.rw-dm-streak').textContent = '🔥 Streak ' + (load().streak || 0); } }, 18);
      try { if (W.navigator.vibrate) W.navigator.vibrate([10, 30, 16]); } catch (e) { /* no vibration */ }
    }
    if (done) { setTimeout(function () { reveal(s.guess); }, 50); }
    else ['Low', 'Good', 'Electric'].forEach(function (g) { var btn = node('button', '', g === 'Electric' ? '⚡ Electric' : g); btn.type = 'button'; btn.addEventListener('click', function () { reveal(g); }); guesses.append(btn); });
    var propose = node('a', 'rw-dm-go', 'Propose this collab'); propose.href = '/creators/match.html?role=property&creator=' + encodeURIComponent(a.id) + '&stay=' + encodeURIComponent(b.id);
    var share = node('button', 'rw-dm-share', 'Share'); share.type = 'button';
    share.addEventListener('click', function () {
      var text = 'Today\'s RoamWise match: ' + a.name + ' × ' + b.name + ' — ' + score + '% chemistry. Guess yours:';
      var url = 'https://www.roamwise.co.in/#daily-match';
      if (W.navigator.share) W.navigator.share({ title: 'RoamWise Daily Match', text: text, url: url }).catch(function () { /* cancelled */ });
      else W.open('https://wa.me/?text=' + encodeURIComponent(text + ' ' + url), '_blank', 'noopener');
    });
    actions.append(propose, share);
    sec.append(head, pair, meter, result, guesses, actions, node('p', 'rw-dm-note', 'A daily idea for fun. Collaborations happen only when both sides agree.'));
    return sec;
  }
  function yesterday() { var d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10); }
  function mount() {
    if (document.getElementById('rwDailyMatch')) return true;
    var anchor = document.getElementById('rwHomeCreators') || document.getElementById('rwStayBrowser');
    var st = stays(); if (!anchor || !st.length) return false;
    Promise.all([
      fetch('/creators/artists-data.json', { cache: 'force-cache' }).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; }),
      fetch('/network/directory.json', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; })
    ]).then(function (res) {
      if (document.getElementById('rwDailyMatch')) return;
      var ppl = people(res[0], res[1]); if (!ppl.length) return;
      var r = rnd(seedOf('rw-daily-' + today()));
      var a = ppl[Math.floor(r() * ppl.length)], b = st[Math.floor(r() * st.length)];
      anchor.insertAdjacentElement('afterend', render(a, b, chemistry(a, b, r)));
    });
    return true;
  }
  function start() { if (!mount()) { var n = 0, t = setInterval(function () { if (mount() || ++n > 20) clearInterval(t); }, 600); } }
  W.rwDailyMatch = { band: band, chemistry: chemistry, seedOf: seedOf };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
