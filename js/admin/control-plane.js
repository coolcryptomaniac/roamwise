/* RoamWise Admin Control Plane
   The live /admin page is canonical for web, PWA and Android. This runtime
   audit prevents navigation and feature panels from silently drifting apart. */
(function (root) {
  'use strict';

  var CANONICAL_URL = 'https://www.roamwise.co.in/admin/';

  function audit(navIds, sectionIds) {
    var nav = Array.from(new Set(navIds || []));
    var sections = Array.from(new Set(sectionIds || []));
    return {
      ok: nav.every(function (id) { return sections.indexOf(id) !== -1; })
        && sections.every(function (id) { return nav.indexOf(id) !== -1; }),
      missingSections: nav.filter(function (id) { return sections.indexOf(id) === -1; }),
      unreachableSections: sections.filter(function (id) { return nav.indexOf(id) === -1; }),
      capabilityCount: nav.length
    };
  }

  function render(result, esc) {
    var safe = esc || function (value) { return String(value || ''); };
    var state = result.ok ? 'good' : 'bad';
    var label = result.ok ? 'Synchronized' : 'Mismatch found';
    var details = result.ok
      ? 'Every admin navigation action has one matching live panel.'
      : 'Missing panels: ' + safe(result.missingSections.join(', ') || 'none')
        + '. Unreachable panels: ' + safe(result.unreachableSections.join(', ') || 'none') + '.';
    return '<div class="alert ' + state + '"><b>' + label + '</b><div class="meta">'
      + result.capabilityCount + ' canonical capabilities. ' + details + '</div></div>';
  }

  root.RWAdminControlPlane = {
    CANONICAL_URL: CANONICAL_URL,
    audit: audit,
    render: render
  };
})(typeof window !== 'undefined' ? window : globalThis);
