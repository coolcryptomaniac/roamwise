// @ts-nocheck
/* chat-safety.js — treat every group-chat message as untrusted input.

   A trip chat is written to by every member, and the database rules only
   check who wrote a message, not what is inside it. Anything a member stores
   (the message id, a Tusk card's HTML, reaction keys, a meeting link, an
   amount) is shown in the browsers of everyone else in the room, so it must
   be cleaned before it becomes HTML. Otherwise one member can run script as
   another member, with that member's sign-in and wallet.

   Globals: rwChatSafeId, rwChatAttr, rwChatSafeUrl, rwChatSafeHtml,
   rwChatClickAllowed, rwChatCleanMessage. Loaded before js/social/group-chat-social.js. */

/* Firestore auto-ids are 20 letters and digits. Ids are placed inside
   onclick="..." strings, so anything with a quote or bracket is refused. */
function rwChatSafeId(id){
  return typeof id === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(id);
}

/* Escape for use inside a double-quoted HTML attribute. */
function rwChatAttr(s){
  return String(s == null ? '' : s).replace(/[&<>"'`]/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','`':'&#96;'}[c];
  });
}

/* Only ordinary web links. Returns '' for javascript:, data: and the like. */
function rwChatSafeUrl(u){
  var s = String(u == null ? '' : u).trim();
  if(!/^https?:\/\//i.test(s) || /["'<>`\s\\]/.test(s) || s.length > 600) return '';
  return s;
}

var RW_CHAT_DROP_TAGS = /^(script|style|iframe|frame|frameset|object|embed|applet|link|meta|base|form|input|textarea|select|option|template|noscript|audio|video|source|track|math|portal)$/i;
var RW_CHAT_URL_ATTRS = /^(href|src|action|formaction|poster|background|xlink:href|data)$/i;
/* A card button may call one app function with plain literal arguments, e.g.
   cpFollow('easy treks'). Anything else in an onclick is removed. Functions
   that move money, change the account or leave the app are never allowed. */
var RW_CHAT_ARG = "(?:'[^'\\\\<>;]{0,200}'|\"[^\"\\\\<>;]{0,200}\"|-?\\d{1,12}(?:\\.\\d{1,6})?|true|false|null|this)";
var RW_CHAT_CLICK_OK = new RegExp("^\\s*(?:return\\s+)?((?:rw|cp|tab|tk|chat|scrollTo|open)[A-Za-z0-9_]*)\\(\\s*(?:" + RW_CHAT_ARG + "\\s*(?:,\\s*" + RW_CHAT_ARG + "\\s*){0,5})?\\)\\s*$");
var RW_CHAT_CLICK_NEVER = /pay|bank|wallet|withdraw|transfer|checkout|order|buy|purchase|credit|refund|delete|remove|erase|reset|logout|signout|sign_?out|link|unlink|password|admin|token|secret|key|export|import|eval|exec|script|html|install/i;

/* Up to three plain calls in a row, e.g. tabGo('explore');scrollToId('treks'). */
function rwChatClickAllowed(val){
  var parts = String(val || '').split(';').filter(function(x){ return x.trim(); });
  if(!parts.length || parts.length > 3) return false;
  return parts.every(function(part){
    var m = RW_CHAT_CLICK_OK.exec(part);
    return !!m && !RW_CHAT_CLICK_NEVER.test(m[1]);
  });
}

function rwChatCleanNode(node){
  var kids = Array.prototype.slice.call(node.childNodes);
  for(var i = 0; i < kids.length; i++){
    var n = kids[i];
    if(n.nodeType === 8){ node.removeChild(n); continue; }          /* comments */
    if(n.nodeType !== 1) continue;
    var tag = String(n.nodeName || '').toLowerCase();
    if(RW_CHAT_DROP_TAGS.test(tag) || tag === 'svg'){ node.removeChild(n); continue; }
    var attrs = Array.prototype.slice.call(n.attributes || []);
    for(var a = 0; a < attrs.length; a++){
      var name = attrs[a].name.toLowerCase(), val = String(attrs[a].value || '');
      if(name === 'onclick'){
        if(!rwChatClickAllowed(val)) n.removeAttribute(attrs[a].name);
        continue;
      }
      if(name.indexOf('on') === 0 || name === 'srcdoc' || name === 'srcset' || name === 'name' || name === 'contenteditable'){
        n.removeAttribute(attrs[a].name); continue;
      }
      if(RW_CHAT_URL_ATTRS.test(name)){
        var v = val.replace(/[\u0000-\u0020]/g, '');
        var ok = /^https?:\/\//i.test(v) || /^(mailto:|tel:)/i.test(v) || /^[#/](?!\/)/.test(v) || (name === 'src' && /^data:image\/(png|jpe?g|webp|gif);base64,/i.test(v));
        if(!ok) n.removeAttribute(attrs[a].name);
        continue;
      }
      if(name === 'style' && /expression\s*\(|javascript:|url\s*\(\s*['"]?(?!https:\/\/)|position\s*:\s*(fixed|sticky)|@import|behavior\s*:/i.test(val)){
        n.removeAttribute(attrs[a].name); continue;
      }
    }
    if(tag === 'a'){ n.setAttribute('rel', 'noopener noreferrer'); if(n.getAttribute('target')) n.setAttribute('target', '_blank'); }
    rwChatCleanNode(n);
  }
}

/* Clean a block of HTML sent by another chat member. With no DOM available
   (tests, very old browsers) it falls back to plain escaped text. */
function rwChatSafeHtml(html){
  var raw = String(html == null ? '' : html);
  if(raw.length > 60000) raw = raw.slice(0, 60000);
  try{
    if(typeof document === 'undefined' || !document.createElement) throw new Error('no dom');
    var t = document.createElement('template');
    t.innerHTML = raw;
    rwChatCleanNode(t.content);
    var holder = document.createElement('div');
    holder.appendChild(t.content.cloneNode(true));
    return holder.innerHTML;
  }catch(e){
    return raw.replace(/<[^>]*>/g, ' ').replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }
}

/* A cleaned copy of a message; the original is left untouched. */
function rwChatCleanMessage(m){
  var out = {}, k;
  for(k in m) if(Object.prototype.hasOwnProperty.call(m, k)) out[k] = m[k];
  ['text','name','kind','uid'].forEach(function(f){ if(out[f] != null && typeof out[f] !== 'string') out[f] = String(out[f]); });

  /* reactions: {emoji: [uid, ...]}; keys end up in HTML and in onclick. */
  var rx = {}, src = (m.reactions && typeof m.reactions === 'object') ? m.reactions : {};
  Object.keys(src).slice(0, 24).forEach(function(key){
    if(key.length > 16 || /[\u0000-\u007f]/.test(key)) return;        /* emoji only: no ASCII at all */
    if(Array.isArray(src[key])) rx[key] = src[key].filter(function(u){ return typeof u === 'string'; });
  });
  out.reactions = rx;

  var p = (m.payload && typeof m.payload === 'object' && !Array.isArray(m.payload)) ? m.payload : {};
  var q = {};
  for(k in p) if(Object.prototype.hasOwnProperty.call(p, k)) q[k] = p[k];
  if(q.html != null) q.html = rwChatSafeHtml(q.html);
  if(q.amount != null){ var amt = Number(q.amount); q.amount = isFinite(amt) ? amt : 0; }
  if(q.map != null) q.map = rwChatSafeUrl(q.map);
  ['options','opts'].forEach(function(f){
    if(q[f] != null) q[f] = Array.isArray(q[f]) ? q[f].slice(0, 12).map(function(o){ return String(o == null ? '' : o).slice(0, 200); }) : [];
  });
  ['q','what','payerName','place','when','city','route','choice','type'].forEach(function(f){
    if(q[f] != null && typeof q[f] !== 'string') q[f] = String(q[f]);
  });
  if(q.votes != null && (typeof q.votes !== 'object' || Array.isArray(q.votes))) q.votes = {};
  out.payload = q;
  return out;
}

if(typeof module !== 'undefined' && module.exports){
  module.exports = { rwChatSafeId: rwChatSafeId, rwChatAttr: rwChatAttr, rwChatSafeUrl: rwChatSafeUrl, rwChatSafeHtml: rwChatSafeHtml, rwChatCleanMessage: rwChatCleanMessage, rwChatClickAllowed: rwChatClickAllowed };
}
