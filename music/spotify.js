// music/spotify.js - Spotify embedded player (official IFrame API). Real album audio and art, built-in track list.
// Full tracks play when the listener is signed in to Spotify in this browser; otherwise Spotify plays short previews.
let apiP = null;
function loadApi() {
  if (apiP) return apiP;
  apiP = new Promise((ok, no) => {
    window.onSpotifyIframeApiReady = (A) => ok(A);
    const s = document.createElement('script'); s.src = 'https://open.spotify.com/embed/iframe-api/v1'; s.async = true; s.onerror = () => no(new Error('blocked'));
    document.head.appendChild(s);
    setTimeout(() => no(new Error('timeout')), 10000);
  });
  apiP.catch(() => { apiP = null; });
  return apiP;
}
export function createSpotify(host, { onState, onError, height = 352 }) {
  let ctrl = null, creating = false, want = null;
  async function load(albumId, play = true) {
    want = { uri: 'spotify:album:' + albumId, play };
    try {
      const A = await loadApi();
      if (ctrl) { ctrl.loadUri(want.uri); if (play) setTimeout(() => { try { ctrl.play(); } catch (e) { /* ignore */ } }, 500); return; }
      if (creating) return; /* the ready handler loads the latest album asked for */
      creating = true;
      const el = document.createElement('div'); host.appendChild(el);
      A.createController(el, { uri: want.uri, width: '100%', height }, (c) => {
        ctrl = c; creating = false;
        c.addListener('ready', () => { if (want && want.play) setTimeout(() => { try { c.play(); } catch (e) { /* ignore */ } }, 400); });
        c.addListener('playback_update', (e) => { if (onState && e && e.data) onState(e.data); });
      });
    } catch (e) { creating = false; if (onError) onError(e); }
  }
  return {
    load,
    toggle() { if (ctrl) ctrl.togglePlay(); },
    pause() { if (ctrl) { try { ctrl.pause(); } catch (e) { /* ignore */ } } },
    seek(sec) { if (ctrl) { try { ctrl.seek(sec); } catch (e) { /* ignore */ } } },
    get ready() { return !!ctrl; },
  };
}
