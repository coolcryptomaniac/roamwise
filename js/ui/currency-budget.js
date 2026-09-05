// @ts-nocheck
/* ==================== UI: CURRENCY GRID + BUDGET SLIDER ====================
   Extracted from app.js (modularization round 5) using a deferred-init
   pattern: this used to be two anonymous top-level IIFEs (plus a plain
   top-level `function updateBudget(){...}` declaration between them)
   that ran/were defined immediately at the exact point they appeared in
   app.js's parse order. That's the one genuine load-order hazard this
   kind of boot code has — moving the CODE to a file that loads earlier
   or later than that exact point would change WHEN it runs relative to
   `index.html`'s DOM and to app.js's other top-level statements around
   it.

   The fix: keep the code itself — completely unchanged, just re-indented
   — inside a named function here (this file can load at any point
   before app.js; nothing in it executes until called), and leave a
   single `rwInitCurrencyBudget();` call in app.js at the *exact* line
   the old code used to occupy. Execution order is therefore identical to
   before; only the code's home file changed. `updateBudget` is now a
   function nested inside `rwInitCurrencyBudget()` rather than a global
   — grepped repo-wide first and confirmed nothing outside this cluster
   ever called it, so nesting it (instead of publishing it on `window`)
   is a zero-risk simplification, not a behavior change.

   See js/core/dom-utils.js's header comment for the general version of
   this hazard, and ARCHITECTURE.md's "Load order: why it's load-bearing"
   section for why only top-level/parse-time code (not function bodies)
   is order-sensitive at all.

   Depends on (by name, resolved when rwInitCurrencyBudget() is actually
   called from app.js — i.e. after every script on the page has loaded,
   same as before): `CURR`/`AC` (currency table + active currency,
   app.js) and `fmtMoney` (js/pricing/tiers.js). */
function rwInitCurrencyBudget(){
  (function(){
    var cg = el('currGrid');
    CURR.forEach(function(cu){
      var b = document.createElement('button');
      b.className = 'cbtn'+(cu.c==='INR'?' on':'');
      b.dataset.c = cu.c;
      b.innerHTML = `<span class="sym">${cu.s}</span><span class="code">${cu.c}</span>`;
      b.onclick = function(){
        AC = cu.c;
        document.querySelectorAll('.cbtn').forEach(function(x){ x.classList.toggle('on', x.dataset.c===cu.c); });
        updateBudget();
      };
      cg.appendChild(b);
    });
  })();

  var slider = el('budgetSlider');
  slider.addEventListener('input', function(){ updateBudget(true); });
  /* BUG FIX (reported by team, Ladakh 40k case): the slider moves in fixed USD
     steps, so at typical currency rates a single step could jump the DISPLAYED
     INR value by 4000+, making round numbers like exactly 40,000 nearly
     impossible to land on by dragging. Fix: a real "type an exact amount" field
     that's always the source of truth for precision, alongside a finer slider
     step for anyone who prefers to drag. */
  function updateBudget(fromSlider){
    var v = parseInt(slider.value);
    el('budgetDisplay').innerHTML = v>=10000 ? fmtMoney(10000)+'+' : fmtMoney(v);
    slider.style.setProperty('--pct', ((v-200)/9800*100).toFixed(1)+'%');
    var cu = CURR.find(function(x){return x.c===AC;}) || {s:'\u20b9', r:1};
    var ex = el('budgetExact'), sym = el('budgetExactSym');
    if(sym) sym.textContent = cu.s;
    if(ex && document.activeElement!==ex){ ex.value = Math.round(v*cu.r); }
  }
  (function(){
    var ex = el('budgetExact');
    if(ex){
      ex.addEventListener('input', function(){
        var cu = CURR.find(function(x){return x.c===AC;}) || {r:1};
        var shown = parseFloat(ex.value); if(isNaN(shown) || shown<0) return;
        var usd = Math.round(shown/cu.r);
        usd = Math.max(200, Math.min(10000, usd));
        slider.value = usd;
        updateBudget(false);
      });
    }
  })();
  updateBudget();
}
