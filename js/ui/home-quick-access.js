/* Home quick access: compact horizontal shortcuts under Tusk; advanced tools live under More.
   Classic script. Each item calls an existing global or opens an existing page; if a
   feature has not loaded yet the tap falls back to the menu drawer. */
(function () {
  'use strict';
  var W = /** @type {any} */ (window);
  var ITEMS = [
    { id: 'group-chat', icon: '💬', label: 'Group chat', run: function () { W.openGroupChat(); } },
    { id: 'group-plan', icon: '🤝', label: 'Plan together', run: function () { W.openGroupPlanner(); } },
    { id: 'organisers', icon: '🧭', label: 'Organisers', href: '/organisers/' },
    { id: 'mesh', icon: '📡', label: 'TrailMesh', note: 'OFFLINE', href: '/trailmesh/' },
    { id: 'wallet', icon: '👛', label: 'Wallet', href: '/wallet/' },
    { id: 'memories', icon: '📸', label: 'Memories', href: '/memories/' },
    { id: 'kainchi', icon: '🕉️', label: 'Kainchi Dham', href: '/kainchi/' },
    { id: 'bhakti', icon: '🪔', label: 'Digital Bhakti', href: '/bhakti/' },
    { id: 'sacred', icon: '🛕', label: 'Sacred trips', href: '/pilgrimage/' },
    { id: 'treks', icon: '🥾', label: 'Treks & guides', href: '/treks/' },
    { id: 'stays', icon: '🏡', label: 'Find stays', run: function () { if(W.rwOpenStayBrowser)W.rwOpenStayBrowser();else W.openListing(); } },
    { id: 'transport', icon: '🚆', label: 'Transport', run: function () { W.rwOpenTripDesk(); } },
    { id: 'experiences', icon: '✨', label: 'Experiences', run: function () { W.openExperiences(); } },
    { id: 'more', icon: '☰', label: 'All tools', href: '/more/' }
  ];
  /* Inside the Android app a folder URL such as /wallet/ is answered with the home page (unstyled, stuck),
     so name the file there. The website keeps the clean URL. */
  function native() {
    try { return !!(W.Capacitor && W.Capacitor.isNativePlatform && W.Capacitor.isNativePlatform()); } catch (e) { return false; }
  }
  function target(href) { return native() ? href.replace(/^(\/[^?#]*\/)(?=$|[?#])/, '$1index.html') : href; }
  function tap(item, ev) {
    if (item.href) return;
    ev.preventDefault();
    try { item.run(); } catch (e) { try { W.openDrawer(); } catch (e2) { /* nothing to open yet */ } }
  }
  function mount() {
    var host = document.getElementById('rwQuick');
    if (!host || host.firstChild) return;
    var row = document.createElement('div'); row.className = 'rwq-row'; row.setAttribute('role', 'list');
    ITEMS.forEach(function (item) {
      var a = document.createElement('a');
      a.className = 'rwq-item'; a.href = item.href ? target(item.href) : '#'; a.setAttribute('role', 'listitem');
      var c = document.createElement('span'); c.className = 'rwq-ic';
      if (item.id === 'wallet' && W.rwWalletIcon) { c.className += ' rw-wallet-ic-slot'; c.setAttribute('data-size', '28'); c.innerHTML = W.rwWalletIcon(28); } else c.textContent = item.icon || '👛';
      if (item.note) { var n = document.createElement('i'); n.textContent = item.note; c.appendChild(n); }
      var l = document.createElement('span'); l.className = 'rwq-lb'; l.textContent = item.label;
      a.append(c, l);
      a.addEventListener('click', function (ev) { tap(item, ev); });
      row.appendChild(a);
    });
    host.appendChild(row);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
