/* Original articulated SVG puppet; mouth motion follows speech events, not phoneme lip-sync. */
(function (root) {
  'use strict';
  var serial = 0;
  root.RWKainchiUI.panditji = function () {
    var prefix = 'pandit-' + (++serial) + '-';
    var ns = 'http://www.w3.org/2000/svg';
    function node(tag, attrs, parent) {
      var n = document.createElementNS(ns, tag);
      Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, typeof attrs[k] === 'string' && k === 'fill' ? attrs[k].replace(/url\(#pandit-/g, 'url(#' + prefix) : attrs[k]); });
      if (parent) parent.appendChild(n); return n;
    }
    var svg = node('svg', { viewBox: '0 0 260 340', class: 'pandit-puppet', 'aria-hidden': 'true' });
    var defs = node('defs', {}, svg);
    [['skin', '#f3c695', '#bc744b'], ['robe', '#c55135', '#541d34'], ['shawl', '#ffce7a', '#b67526'], ['hair', '#fff1d5', '#b8a898']].forEach(function (colors) {
      var grad = node('linearGradient', { id: prefix + colors[0], x2: '0', y2: '1' }, defs);
      node('stop', { offset: '0%', 'stop-color': colors[1] }, grad); node('stop', { offset: '100%', 'stop-color': colors[2] }, grad);
    });
    function path(d, fill, parent, cls) { return node('path', { d: d, fill: fill, class: cls || '' }, parent || svg); }
    node('circle', { cx: 130, cy: 96, r: 78, fill: 'none', stroke: '#e8ba6c', 'stroke-width': 1, opacity: '.5' }, svg);
    node('circle', { cx: 130, cy: 96, r: 72, fill: 'none', stroke: '#e8ba6c', 'stroke-width': 3, opacity: '.2' }, svg);
    path('M30 280Q35 164 86 145L174 145Q225 163 230 280Q195 334 130 329Q65 334 30 280', 'url(#pandit-robe)');
    path('M89 147L115 137L127 320L70 308Z M171 147L146 137L132 320L189 308Z', 'url(#pandit-shawl)');
    path('M105 153L115 148L121 303L108 292Z M155 153L146 148L140 303L154 292Z', '#fbe0a4');
    path('M35 289Q85 263 131 294Q175 263 226 289L213 323Q168 340 132 318Q84 340 45 323Z', '#e8bf8c');
    for (var i = 0; i < 18; i += 1) node('circle', { cx: 96 + i * 4, cy: 174 + Math.sin(i / 17 * Math.PI) * 64, r: 3, fill: '#4c251f', stroke: '#df9d59', 'stroke-width': '.5' }, svg);
    var head = node('g', { class: 'pandit-head' }, svg);
    node('ellipse', { cx: 130, cy: 46, rx: 22, ry: 20, fill: 'url(#pandit-hair)' }, head);
    node('ellipse', { cx: 130, cy: 57, rx: 20, ry: 4, fill: '#8d4929' }, head);
    node('ellipse', { cx: 130, cy: 102, rx: 43, ry: 56, fill: 'url(#pandit-hair)' }, head);
    node('ellipse', { cx: 90, cy: 103, rx: 8, ry: 13, fill: 'url(#pandit-skin)' }, head);
    node('ellipse', { cx: 170, cy: 103, rx: 8, ry: 13, fill: 'url(#pandit-skin)' }, head);
    path('M96 91Q95 60 128 63Q164 61 165 91L163 118Q158 147 130 153Q101 146 97 119Z', 'url(#pandit-skin)', head);
    path('M96 88Q95 51 131 51Q166 53 166 88Q157 65 130 66Q106 67 96 88', 'url(#pandit-hair)', head);
    path('M101 117Q107 136 130 133Q152 136 160 117L157 146Q146 166 130 171Q111 165 102 147Z', 'url(#pandit-hair)', head);
    path('M108 116Q119 108 130 115Q143 109 152 116L147 126Q135 117 130 122Q120 117 111 125Z', '#eee1cd', head);
    path('M104 90Q113 85 121 91 M138 91Q148 86 156 92', 'none', head).setAttribute('stroke', '#806253');
    var eyes = node('g', { class: 'pandit-eyes' }, head);
    [[113, 98], [147, 98]].forEach(function (p) { node('ellipse', { cx: p[0], cy: p[1], rx: 6, ry: 3, fill: '#f9ecd5' }, eyes); node('circle', { cx: p[0], cy: p[1], r: 2.5, fill: '#2f201e' }, eyes); });
    path('M130 96L126 112Q130 115 135 112', 'none', head).setAttribute('stroke', '#a36746');
    node('path', { d: 'M124 74L127 88 M137 74L134 88', stroke: '#ffe0a1', 'stroke-width': 3, fill: 'none' }, head);
    node('circle', { cx: 130, cy: 89, r: 2.5, fill: '#c55733' }, head);
    var mouth = node('g', { class: 'pandit-mouth' }, head);
    node('ellipse', { cx: 130, cy: 128, rx: 9, ry: 3.2, fill: '#68302c', class: 'pandit-mouth-open' }, mouth);
    node('path', { d: 'M121 128Q130 132 139 128', fill: 'none', stroke: '#b77467', 'stroke-width': 2 }, mouth);
    function arm(cls, d, palm) {
      var g = node('g', { class: cls }, svg); path(d, 'url(#pandit-robe)', g);
      path(palm, 'url(#pandit-skin)', g); return g;
    }
    arm('pandit-arm pandit-arm-left', 'M77 163Q42 169 48 207L85 239L104 220L75 191Z', 'M84 221Q91 209 103 216L119 225Q127 231 118 237L102 238L91 233Z');
    arm('pandit-arm pandit-arm-right', 'M183 163Q218 169 212 207L175 239L156 220L185 191Z', 'M176 221Q169 209 157 216L141 225Q133 231 142 237L158 238L169 233Z');
    var greeting = node('g', { class: 'pandit-namaste' }, svg);
    path('M101 230Q102 215 117 192L124 172Q128 166 130 177L130 211L120 232Z M159 230Q158 215 143 192L136 172Q132 166 130 177L130 211L140 232Z', 'url(#pandit-skin)', greeting);
    path('M109 229L122 208 M151 229L138 208', 'none', greeting).setAttribute('stroke', '#b37653');
    return svg;
  };
})(window);
