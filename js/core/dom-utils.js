// @ts-nocheck
/* ==================== CORE: DOM UTILS ====================
   Extracted verbatim from app.js (Phase 6a modularization).
   Loaded FIRST in index.html's script chain — before every other js/*
   module and before app.js itself — because several later modules
   (js/misc/misc-features.js and misc-features-2.js) call el() at PARSE
   TIME, not just from inside a later-called function (e.g. their
   verbatim-preserved immediate `renderHS(); renderBC(); renderCircs();
   renderEvs(); renderTreks(); renderExps();` calls, which query static
   DOM containers like #hsAcc/#circGrid/#trekGrid as soon as the script
   runs). If el() lived only in app.js (which loads last), any module
   loaded before app.js that calls el() at its own top level would throw
   a ReferenceError before the page ever renders — exactly the hazard
   js/core/storage-utils.js documents for lsGet/lsSet. Putting this true
   leaf utility (zero dependencies on anything else in the app) first
   removes that hazard for every module, regardless of relative order. */
function el(id){ return document.getElementById(id); }
