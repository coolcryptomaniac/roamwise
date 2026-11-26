/* Home creators: one or two featured creators in a banner, then a sideways rail of every listed creator.
   Classic script. Data comes from /network/directory.json (founder-exported, public fields only); while that
   list is empty the consented RoamWise artists stand in. Contact numbers are never in the data: the card only
   says a number is shared after both sides accept, and "Collab" starts the existing match flow. */
(function () {
  'use strict';
  var W = /** @type {any} */ (window);
  var KEY = 'rw_creator_interest_v1';
  var section = null;
  function node(tag, cls, text) { var el = document.createElement(tag); if (cls) el.className = cls; if (text != null) el.textContent = text; return el; }
  function igUrl(v) {
    var raw = String(v || '').trim().replace(/^@/, '');
    var m = raw.match(/^(?:https?:\/\/)?(?:www\.)?instagram\.com\/([A-Za-z0-9._]{1,30})/i);
    var h = m ? m[1] : (/^[A-Za-z0-9._]{1,30}$/.test(raw) ? raw : '');
    return h ? 'https://www.instagram.com/' + h + '/' : '';
  }
  function igHandle(url) { var m = String(url).match(/instagram\.com\/([^/]+)/); return m ? '@' + m[1] : ''; }
  function compact(n) {
    n = Number(n) || 0; if (!n) return '';
    if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace(/\.0$/, '') + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(n >= 1e5 ? 0 : 1).replace(/\.0$/, '') + 'K';
    return String(n);
  }
  function interests() { try { return JSON.parse(localStorage.getItem(KEY) || '[]') || []; } catch (e) { return []; } }
  function markInterest(id) {
    try { var l = interests(); if (l.indexOf(id) < 0) { l.push(id); localStorage.setItem(KEY, JSON.stringify(l.slice(-200))); } } catch (e) { /* storage blocked */ }
  }
  function safePhoto(p) { if (p && typeof p === 'object') p = p.src; return /^(\/|creators\/|assets\/|https:\/\/)/.test(String(p || '')) && !/["'<>]/.test(p) ? p : ''; }
  function normalise(list, source) {
    return (list || []).filter(function (x) { return x && x.id && x.name; }).map(function (x) {
      return {
        id: String(x.id).slice(0, 90), name: String(x.name).slice(0, 90),
        niche: String(x.niche || (x.themes || []).slice(0, 2).join(' · ') || x.role || '').slice(0, 90),
        town: String(x.town || x.state || '').slice(0, 65),
        followers: Number(x.followers) || 0, featured: x.featured === true,
        instagram: igUrl(x.instagram), photo: safePhoto(x.photo),
        page: source === 'artists' ? (x.page && /^[a-z0-9/._-]+$/i.test(x.page) ? x.page : '/creators/artists.html') : '/creators/profile.html?id=' + encodeURIComponent(x.id),
        founderListed: x.listing === 'founder'
      };
    });
  }
  function avatar(c, big) {
    var a = node('span', 'rwc-av' + (big ? ' big' : ''));
    if (c.photo) { var img = node('img'); img.src = c.photo; img.alt = ''; img.loading = 'lazy'; a.appendChild(img); }
    else a.textContent = c.name.charAt(0).toUpperCase();
    return a;
  }
  function actions(c) {
    var row = node('div', 'rwc-actions');
    if (c.instagram) { var f = node('a', 'rwc-btn ig', 'Follow ' + igHandle(c.instagram)); f.href = c.instagram; f.target = '_blank'; f.rel = 'noopener noreferrer'; row.appendChild(f); }
    var done = interests().indexOf(c.id) >= 0;
    var b = node('a', 'rwc-btn collab', done ? 'Collab requested ✓' : 'Collab');
    b.href = '/creators/matches.html?to=' + encodeURIComponent('creator-' + c.id);
    b.addEventListener('click', function () { markInterest(c.id); });
    row.appendChild(b);
    return row;
  }
  function masked() {
    var p = node('p', 'rwc-phone'); p.append(node('span', '', '📞 +91 ••••• •••••'), node('small', '', 'Shared only when you both accept a match'));
    return p;
  }
  function meta(c) {
    var bits = [c.niche, c.town].filter(Boolean).join(' · ');
    var m = node('p', 'rwc-meta', bits || 'Creator');
    if (c.followers) m.appendChild(node('b', '', ' · ' + compact(c.followers) + ' followers' + (c.founderListed ? '*' : '')));
    return m;
  }
  function banner(list) {
    var wrap = node('div', 'rwc-banner');
    list.forEach(function (c) {
      var card = node('article', 'rwc-feature');
      var body = node('div', 'rwc-feature-body');
      var name = node('a', 'rwc-name', c.name); name.href = c.page;
      body.append(node('small', 'rwc-kicker', '★ FEATURED CREATOR'), name, meta(c), actions(c), masked());
      card.append(avatar(c, true), body);
      wrap.appendChild(card);
    });
    return wrap;
  }
  function rail(list) {
    var track = node('div', 'rwc-track'); track.setAttribute('role', 'list');
    function cardFor(c) {
      if (c.join) {
        var join = node('a', 'rwc-card rwc-join'); join.href = '/creators/match.html?role=creator&invite=founding';
        join.append(node('span', 'rwc-av', '+'), node('strong', '', 'Are you a creator?'), node('p', 'rwc-meta', 'Get listed and matched with stays'));
        return join;
      }
      var card = node('article', 'rwc-card'); card.setAttribute('role', 'listitem');
      var name = node('a', 'rwc-name', c.name); name.href = c.page;
      card.append(avatar(c, false), name, meta(c), actions(c), masked());
      return card;
    }
    var items = list.concat([{ join: true, id: 'join', name: '' }]);
    /* Endless, paged rail (js/ui/rail-engine.js); search and filters can be added through rail.setQuery later. */
    if (W.RWRail) { setTimeout(function () { W.rwCreatorsRail = W.RWRail.create(track, { items: items, render: cardFor, pageSize: 12, match: function (c, q) { return c.join || !q.text || (c.name + ' ' + c.niche + ' ' + c.town).toLowerCase().indexOf(String(q.text).toLowerCase()) >= 0; } }); }, 0); }
    else items.forEach(function (c) { track.appendChild(cardFor(c)); });
    return track;
  }
  function render(creators, fromArtists) {
    if (!creators.length) return;
    var featured = creators.filter(function (c) { return c.featured; }).slice(0, 2);
    if (!featured.length) featured = creators.slice().sort(function (a, b) { return b.followers - a.followers; }).slice(0, fromArtists && !document.getElementById('rwAmbassadorBanner') ? 1 : 0);
    section = node('section', 'v v-home rw-creators'); section.id = 'rwHomeCreators'; section.setAttribute('aria-labelledby', 'rwHomeCreatorsTitle');
    var head = node('div', 'rwc-head'), title = node('h2', '', fromArtists ? 'Artists & creators' : 'Creators on RoamWise'); title.id = 'rwHomeCreatorsTitle';
    var all = node('a', 'rwc-all', 'See all →'); all.href = fromArtists ? '/creators/artists.html' : '/network/';
    head.append(node('div'), all); head.firstChild.append(node('small', 'rwc-kicker', 'CREATOR × PROPERTY MATCH'), title, node('p', '', 'Follow them, or tap Collab to propose a stay. Numbers are swapped only after a mutual yes.'));
    section.append(head);
    if (featured.length) section.appendChild(banner(featured));
    section.appendChild(rail(creators));
    if (creators.some(function (c) { return c.founderListed; })) section.appendChild(node('p', 'rwc-note', '* Follower counts are self-reported by creators and not yet verified.'));
    var after = document.getElementById('rwStayBrowser') || document.getElementById('rwQuick');
    if (after) after.insertAdjacentElement('afterend', section);
  }
  function load() {
    if (section || !document.getElementById('rwQuick')) return;
    fetch('/network/directory.json', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; }).then(function (/** @type {any} */ d) {
      var list = normalise((d && d.creators) || [], 'directory');
      if (list.length) return render(list, false);
      return fetch('/creators/artists-data.json').then(function (r) { return r.ok ? r.json() : {}; }).then(function (/** @type {any} */ a) {
        render(normalise(Array.isArray(a) ? a : (a.artists || []), 'artists'), true);
      }).catch(function () { /* no creators to show */ });
    });
  }
  W.rwHomeCreatorsLoad = load;
  function start() { setTimeout(load, 1200); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
