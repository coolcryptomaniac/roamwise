// Node-only bridge. The browser loads the same classic scripts in feature.json order.
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const manifest = require('../feature.json');
for (const file of manifest.browserScripts.filter(f => /^(?:data|core)\//.test(f))) require(path.join(root, file));
module.exports = globalThis.RWKainchiCore;
