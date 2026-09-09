// Node-only bridge. Browser and Worker load the same four classic modules.
require('./validation.js');
require('./money.js');
require('./reports.js');
require('./exports.js');
module.exports = globalThis.RWBusinessCore;
