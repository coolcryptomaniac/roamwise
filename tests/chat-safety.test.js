'use strict';
/* Group-chat messages are written by other members and must never reach the
   page as live HTML. Browser-level behaviour of rwChatSafeHtml was checked
   with Playwright; these cover the parts that run without a DOM. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const S = require('../js/social/chat-safety.js');

test('message ids that could break out of onclick are refused', () => {
  assert.equal(S.rwChatSafeId('Zk3mPq81LmNoPqRsTuVw'), true);
  ["a');alert(1);//", 'a"b', 'a<b', '', null, 'x'.repeat(65)].forEach((id) => assert.equal(S.rwChatSafeId(id), false));
});

test('only plain web links survive', () => {
  assert.equal(S.rwChatSafeUrl('https://www.google.com/maps/search/?api=1&query=Mall%20Road'), 'https://www.google.com/maps/search/?api=1&query=Mall%20Road');
  ['javascript:alert(1)', 'data:text/html,x', 'https://a.com/" onmouseover="x', ' https://a.com/<b>'].forEach((u) => assert.equal(S.rwChatSafeUrl(u), ''));
});

test('attribute escape covers quotes', () => {
  assert.equal(S.rwChatAttr('a"b\'c<d>&'), 'a&quot;b&#39;c&lt;d&gt;&amp;');
});

test('reaction keys: emoji kept, markup dropped', () => {
  const m = S.rwChatCleanMessage({ reactions: { '❤️': ['u1', 7, 'u2'], '<img src=x onerror=alert(1)>': ['u1'], "');alert(1);//": ['u1'], '🔥': 'notarray' } });
  assert.deepEqual(Object.keys(m.reactions), ['❤️']);
  assert.deepEqual(m.reactions['❤️'], ['u1', 'u2']);
});

test('payload fields are forced to safe types', () => {
  const m = S.rwChatCleanMessage({ payload: { amount: '<img src=x onerror=alert(1)>', map: 'javascript:alert(1)', opts: 'x', options: [1, '<b>', null], votes: 'x', q: 5 } });
  assert.equal(m.payload.amount, 0);
  assert.equal(m.payload.map, '');
  assert.deepEqual(m.payload.opts, []);
  assert.deepEqual(m.payload.options, ['1', '<b>', '']);
  assert.deepEqual(m.payload.votes, {});
  assert.equal(m.payload.q, '5');
});

test('without a DOM, shared HTML falls back to escaped text', () => {
  const out = S.rwChatSafeHtml('<img src=x onerror="alert(1)">hello <b>there</b>');
  assert.equal(/[<>]/.test(out), false);
  assert.match(out, /hello/);
});

test('card buttons: plain app calls allowed, everything else removed', () => {
  ["cpFollow('easy treks')", "rwTrekOps('Kedarkantha',9500)", "tabGo('explore');scrollToId('treks')", 'return rwOpenMap("Mall Road")', 'rwTuskToggleCardSize(this)'].forEach((c) => assert.equal(S.rwChatClickAllowed(c), true, c));
  ["alert(1)", "eval('x')", "cpFollow('a');fetch('//evil')", "rwWalletBank('x')", "rwDeleteAccount()", "cpFollow(window.name)", "cpFollow('a'+document.cookie)", "location='//evil'", "rwX(`a`)", "a();b();c();d()", ''].forEach((c) => assert.equal(S.rwChatClickAllowed(c), false, c));
});

test('the chat renderer goes through the cleaner and is loaded in order', () => {
  const soc = fs.readFileSync(path.join(__dirname, '..', 'js/social/group-chat-social.js'), 'utf8');
  assert.match(soc, /function chatBubble\(id, m, mine\)\{\s*if\(!m \|\| typeof rwChatSafeId !== 'function' \|\| !rwChatSafeId\(id\)\) return '';/);
  assert.match(soc, /chatBubbleHTML\(id, rwChatCleanMessage\(m\), mine\)/);
  assert.equal(/\+\s*m\.payload\.html\s*\+/.test(soc), false);
  const idx = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.ok(idx.indexOf('js/social/chat-safety.js') > -1 && idx.indexOf('js/social/chat-safety.js') < idx.indexOf('js/social/group-chat-social.js'));
});
