// @ts-nocheck
/* ==================== COPILOT: REPLY MOTION (typing + stagger) ====================
   Ailon Tusk's answers can type themselves out and fade in block by block,
   like a chat assistant, when that is pleasant, and drop to plain instant text
   when speed matters:
   - Fast mode (user toggle, "fast mode" / "fun mode" in chat) = always instant.
   - Auto (default) is instant for: prefers-reduced-motion, data-saver, low-end
     phones (<=2 GB or <=2 cores), booking / payment / receipt answers, saved or
     shared answers, long answers (>900 characters of text), and a hidden tab.
   - The whole effect is capped at ~1.3 seconds and ends the moment you tap it.
   The final HTML is identical either way: the effect only reveals text that is
   already in place, so links, buttons and screen readers keep working. */

var RW_FX_KEY = 'rw_fx_mode';
var RW_FX_MAX_MS = 1300;
var RW_FX_MAX_CHARS = 900;

function rwFxMode(){ try{ var m = localStorage.getItem(RW_FX_KEY); return (m === 'fast' || m === 'fun') ? m : 'auto'; }catch(e){ return 'auto'; } }
function rwFxSetMode(m){ try{ localStorage.setItem(RW_FX_KEY, m); }catch(e){ /* storage blocked */ } }

function rwFxLowEnd(){
  try{
    var n = navigator;
    if(n.connection && n.connection.saveData) return true;
    if(n.deviceMemory && n.deviceMemory <= 2) return true;
    if(n.hardwareConcurrency && n.hardwareConcurrency <= 2) return true;
  }catch(e){ /* unknown device: assume fine */ }
  return false;
}
function rwFxReduced(){
  try{ return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }catch(e){ return false; }
}
/* Pure decision, so tests can cover every rule. */
function rwFxDecide(mode, env, intents, raw, html){
  if(mode === 'fast') return false;
  if(env.reduced || env.hidden) return false;                       /* accessibility always wins, even in Fun mode */
  if(mode !== 'fun' && env.lowEnd) return false;
  if(intents && (intents._stayDesk || intents.smalltalk === 'memory')) return false;
  if(/\b(book|booking|reserve|pay|payment|receipt|refund|cancel|urgent|fast)\b/i.test(String(raw || ''))) return false;
  if(/Saved answer|Learned from other travellers|AI engines unreachable/.test(String(html || ''))) return false;   /* already instant by design */
  return true;
}

function rwFxFinish(bubble, st){
  if(!st || st.done) return;
  st.done = true;
  try{
    st.nodes.forEach(function(n){ n.node.nodeValue = n.text; });
    bubble.classList.remove('rw-fx-caret');
    bubble.style.minHeight = '';
    bubble.classList.remove('rw-fx');
    bubble.removeEventListener('pointerdown', st.skip);
  }catch(e){ /* element gone */ }
}

/* Called from cpFinish in place of `bubble.innerHTML = html`. Returns true when it handled it. */
function rwFxReveal(bubble, html, intents, raw){
  try{
    var env = { reduced: rwFxReduced(), hidden: !!document.hidden, lowEnd: rwFxLowEnd() };
    var mode = rwFxMode();
    var want = rwFxDecide(mode, env, intents, raw, html);
    bubble.innerHTML = html;
    rwFxAddToggle(bubble, mode);
    if(!want) return true;

    var walker = document.createTreeWalker(bubble, NodeFilter.SHOW_TEXT, null), nodes = [], total = 0, n;
    while((n = walker.nextNode())){
      var p = n.parentNode;
      if(!n.nodeValue.trim() || (p.closest && p.closest('.tk-fb,button,a,.rw-rail,.rw-fx-mode,style,script'))) continue;
      nodes.push({ node: n, text: n.nodeValue }); total += n.nodeValue.length;
    }
    if(total > RW_FX_MAX_CHARS || !nodes.length){
      /* long or text-free answer: block stagger only */
      var i0 = 0; [].forEach.call(bubble.children, function(c){ c.style.setProperty('--i', Math.min(i0++, 8)); });
      bubble.classList.add('rw-fx');
      setTimeout(function(){ bubble.classList.remove('rw-fx'); }, 1000);
      return true;
    }
    var st = { nodes: nodes, done: false, skip: null };
    st.skip = function(){ rwFxFinish(bubble, st); };
    bubble.style.minHeight = bubble.offsetHeight + 'px';           /* no layout jump while text types */
    var i = 0; [].forEach.call(bubble.children, function(c){ c.style.setProperty('--i', Math.min(i++, 8)); });
    bubble.classList.add('rw-fx', 'rw-fx-caret');
    nodes.forEach(function(x){ x.node.nodeValue = ''; });
    bubble.addEventListener('pointerdown', st.skip);

    var shown = 0, start = Date.now();
    (function tick(){
      if(st.done) return;
      var elapsed = Date.now() - start;
      var target = Math.min(total, Math.ceil(total * Math.min(1, elapsed / Math.min(RW_FX_MAX_MS, 250 + total * 9))));
      if(target > shown){
        var left = target, k;
        for(k = 0; k < nodes.length; k++){
          var len = nodes[k].text.length;
          nodes[k].node.nodeValue = nodes[k].text.slice(0, Math.max(0, Math.min(len, left)));
          left -= len;
        }
        shown = target;
      }
      if(shown >= total || elapsed >= RW_FX_MAX_MS + 200){ rwFxFinish(bubble, st); return; }
      (window.requestAnimationFrame || setTimeout)(tick, 16);
    })();
    return true;
  }catch(e){ try{ bubble.innerHTML = html; }catch(x){ /* nothing more to do */ } return true; }
}

function rwFxAddToggle(bubble, mode){
  try{
    var row = bubble.querySelector('.tk-fb'); if(!row) return;
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'rw-fx-mode';
    var fast = (mode === 'fast');
    b.textContent = fast ? '✨ Fun' : '⚡ Fast';
    b.setAttribute('aria-label', fast ? 'Turn on animated replies' : 'Turn on fast text-only replies');
    b.onclick = function(){ rwFxSetMode(fast ? 'auto' : 'fast'); b.textContent = fast ? '⚡ Fast' : '✨ Fun'; b.disabled = true; };
    row.appendChild(b);
  }catch(e){ /* optional */ }
}

/* Chat command: returns reply text or null. */
function rwFxCommand(t){
  var s = String(t || '').toLowerCase().trim();
  if(/^(fast|text|speed|quick)[ -]?mode( on)?$|^(turn off|stop|disable) (animations?|typing)$|^no animations?$/.test(s)){
    rwFxSetMode('fast'); return '⚡ Fast mode on: instant text, no animation. Say “fun mode” to bring the typing back.';
  }
  if(/^(fun|animated?|typing)[ -]?mode( on)?$|^(turn on|enable|start) (animations?|typing)$/.test(s)){
    rwFxSetMode('fun'); return '✨ Fun mode on: replies type out (never for bookings or payments, and never if your device asks for reduced motion). Say “fast mode” to turn it off.';
  }
  return null;
}
