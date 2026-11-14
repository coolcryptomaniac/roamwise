/* Home quick access: one calm row of round shortcuts under the Tusk box, so group chat,
   group planning, Trail Mesh and the wallet are one tap from the home screen.
   Classic script. Each item calls an existing global or opens an existing page; if a
   feature has not loaded yet the tap falls back to the menu drawer. */
(function () {
  'use strict';
  var W = /** @type {any} */ (window);
  var ITEMS = [
    { id: 'chat', icon: '💬', label: 'Group chat', run: function () { W.openGroupChat(); } },
    { id: 'plan', icon: '🤝', label: 'Plan together', run: function () { W.openGroupPlanner(); } },
    { id: 'mesh', icon: '📡', label: 'Trail Mesh', note: 'offline', run: function () { W.rwOpenTrailMesh('connect'); } },
    { id: 'split', icon: '👥', label: 'Split a stay', href: '/packages/amor-checkout.html' },
    { id: 'wallet', icon: '', label: 'Wallet', href: '/wallet/' },
    { id: 'invite', icon: '🎁', label: 'Invite & earn', href: '/wallet/#invite' }
  ];
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
      a.className = 'rwq-item'; a.href = item.href || '#'; a.setAttribute('role', 'listitem');
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
