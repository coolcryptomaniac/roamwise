// @ts-check
/* ==================== CORE: STORAGE UTILS ====================
   Extracted verbatim from app.js (Phase 4b modularization).
   Loaded FIRST in index.html's script chain — BEFORE js/data/*, and before
   app.js itself — because several later modules (the copilot core, and
   app.js's own top-level `if(lsGet('rw_keep_chat')==='1'){...}` init block)
   call lsGet() at PARSE TIME, not just from inside a later-called function.
   If lsGet lived only in app.js (which loads last), any new module loaded
   before app.js that also calls lsGet at its own top level would throw a
   ReferenceError before the page ever renders. Putting this true leaf
   utility (zero dependencies on anything else in the app) first removes
   that hazard for every module, regardless of their relative order. ==== */
var LS = localStorage;

/**
 * Read a value from localStorage, defaulting to an empty string when the
 * key is missing or storage returns null/undefined.
 * @param {string} k
 * @returns {string}
 */
function lsGet(k){ return LS.getItem(k)||''; }

/**
 * Write a value to localStorage.
 * @param {string} k
 * @param {string} v
 * @returns {void}
 */
function lsSet(k,v){ LS.setItem(k,v); }
