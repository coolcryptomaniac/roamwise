// Lightweight fetch()-and-inject helper for reusable static HTML chrome
// (header/nav/footer blocks repeated near-verbatim across standalone marketing
// and legal pages). No templating engine, no build step — plain fetch + innerHTML,
// consistent with the rest of RoamWise's no-bundler architecture (see CLAUDE.md).
//
// Usage: <div data-include="partials/marketing-header.html"></div>
// then include this script anywhere on the page (order relative to the
// data-include elements does not matter — it waits for DOMContentLoaded).
(function () {
  function includePartial(el) {
    var src = el.getAttribute('data-include');
    if (!src) return Promise.resolve();
    return fetch(src)
      .then(function (res) {
        if (!res.ok) throw new Error('include-partial: ' + src + ' -> ' + res.status);
        return res.text();
      })
      .then(function (html) {
        el.innerHTML = html;
      })
      .catch(function (err) {
        // Fail silently in production so a missing/broken partial never blocks
        // the rest of the page from rendering; log for local debugging.
        if (window.console && console.warn) console.warn(err);
      });
  }

  function includeAllPartials() {
    var nodes = document.querySelectorAll('[data-include]');
    for (var i = 0; i < nodes.length; i++) includePartial(nodes[i]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', includeAllPartials);
  } else {
    includeAllPartials();
  }

  window.includeAllPartials = includeAllPartials;
})();
