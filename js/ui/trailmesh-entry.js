// @ts-nocheck
/* TrailMesh entry point: one button, both versions.
 * In the RoamWise Android app the native Trail Mesh (Nearby Connections: offline chat, SOS, team roll call,
 * pairing, file share, operator tools) is installed by nearby-mesh.js as window.RWTrailMesh. Everywhere else
 * (and as the planning companion inside the app) the web Expedition Kit at /trailmesh/ covers the trek plan,
 * checklists, field journal, Scout guide and safety briefing.
 * Global by design: called from inline onclick in the drawer and homepage cards. */
(function () {
  'use strict';
  function nativeMesh() {
    try { return window.RWTrailMesh && window.RWTrailMesh.isAvailable() ? window.RWTrailMesh : null; } catch (_) { return null; }
  }
  window.rwTrailMeshNative = function () { return Boolean(nativeMesh()); };
  window.rwOpenTrailMesh = function (panel, ev) {
    var mesh = nativeMesh();
    if (mesh) {
      if (ev && ev.preventDefault) ev.preventDefault();
      try { mesh.open(panel || 'connect'); return false; } catch (_) { /* fall through to the kit */ }
    }
    if (ev && ev.preventDefault) ev.preventDefault();
    location.href = '/trailmesh/index.html';
    return false;
  };
  /* /?trailmesh=1 (linked from the web kit) opens the native radio panel once the app bridge is ready. */
  function deepLink() {
    var p = new URLSearchParams(location.search).get('trailmesh');
    if (!p) return;
    var tries = 0;
    (function wait() {
      if (nativeMesh()) { nativeMesh().open(p === '1' ? 'connect' : p); return; }
      if (++tries < 20) setTimeout(wait, 250);
    })();
  }
  /* Label the homepage card for what this device can actually do. */
  function label() {
    var card = document.getElementById('rwTrailMeshCard');
    if (!card) return;
    var small = card.querySelector('small');
    if (small && nativeMesh()) small.textContent = 'Offline phone-to-phone chat, SOS alarm, team roll call and file share over Bluetooth and Wi-Fi, plus your trek plan and checklists.';
  }
  function boot() { deepLink(); label(); setTimeout(label, 1500); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
})();
