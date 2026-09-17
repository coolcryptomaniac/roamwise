/* RoamWise Admin Rules Center
   Keeps parsing/validation separate from admin/index.html so the complete
   canonical policy can be shown, copied and downloaded as plain text. */
(function (root) {
  'use strict';

  var REQUIRED_MARKERS = [
    "rules_version = '2';",
    'service cloud.firestore',
    'STABLE BUILD v17.0 / Platform V5',
    'match /admins/{uid}',
    'match /staff/{uid}',
    'match /adminAuditLog/{id}'
  ];

  function inspect(text) {
    var source = String(text || '');
    var versionMatch = source.match(/STABLE BUILD\s+(v[\d.]+)\s*\/\s*Platform V5/);
    var missing = REQUIRED_MARKERS.filter(function (marker) {
      return source.indexOf(marker) === -1;
    });
    return {
      ok: source.length > 1000 && missing.length === 0,
      version: versionMatch ? versionMatch[1] : '',
      lineCount: source ? source.split(/\r?\n/).length : 0,
      byteCount: typeof TextEncoder === 'function'
        ? new TextEncoder().encode(source).length
        : source.length,
      missing: missing
    };
  }

  function downloadName(info) {
    var version = info && info.version ? info.version : 'latest';
    return 'roamwise-firestore-rules-' + version + '.txt';
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' bytes';
    return (bytes / 1024).toFixed(1) + ' KB';
  }

  root.RWRulesCenter = {
    REQUIRED_MARKERS: REQUIRED_MARKERS.slice(),
    inspect: inspect,
    downloadName: downloadName,
    formatBytes: formatBytes
  };
})(typeof window !== 'undefined' ? window : globalThis);
