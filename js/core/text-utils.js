// @ts-check
/* ==================== CORE: TEXT UTILS ====================
   Extracted verbatim from app.js (Phase 4b modularization).
   esc2() is a tiny, dependency-free HTML-escape leaf utility that is called
   from nearly every copilot/social module (and from deep inside app.js
   itself), but used to live ~16,000 lines into app.js — after everything
   that calls it. It was never a load-order hazard in practice (every call
   site is inside a function body, resolved at call time, not at parse
   time), but centralizing it here alongside the other core leaf utilities
   removes any ambiguity about which file "owns" it as more modules move
   out of app.js. ==== */

/**
 * HTML-escape a value for safe interpolation into markup. Non-string and
 * nullish inputs are coerced to a string first (null/undefined become '').
 * @param {unknown} t
 * @returns {string}
 */
function esc2(t){ return String(t==null?'':t).replace(/[<>&]/g,function(c){ return {'<':'&lt;','>':'&gt;','&':'&amp;'}[c]; }); }

/* Plain HTML-content escape: safe to drop text between tags (innerHTML).
   Order matters — & must go first or the entity escapes below would
   themselves get re-escaped. Quotes are escaped too (defense in depth)
   even though they're not strictly required outside an attribute. Moved
   here from js/copilot/rich-reply.js (already reused by js/copilot/core.js)
   to sit alongside esc2(), the similar smaller escaper; verbatim move, zero
   logic changes. */
function escHtml(s){
  return String(s==null?'':s)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}
