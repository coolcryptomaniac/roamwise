'use strict';
const test = require('node:test'), assert = require('node:assert');
const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'nmims/quiz/index.html'), 'utf8');
test('quiz page is self-contained and stores nothing', () => {
  assert.ok(!/<script[^>]+src=/i.test(html), 'no external scripts');
  assert.ok(!/(fetch\(|XMLHttpRequest|localStorage|sessionStorage|document\.cookie|gtag|analytics)/i.test(html));
  assert.ok(!/<link[^>]+href="https?:/i.test(html), 'no external stylesheets');
});
test('quiz has six questions and four results with prompts', () => {
  assert.strictEqual((html.match(/^   \['/gm) || []).length, 6);
  ['The Bootstrapper', 'The Pitch-Deck Planner', 'The Network Nomad', 'The Slow Mountain Founder'].forEach(n => assert.ok(html.includes(n), n));
  assert.strictEqual((html.match(/p:'Plan /g) || []).length, 4);
});
test('quiz never promises a pass or commission and links to the redeem page', () => {
  assert.ok(html.includes('/nmims/redeem/'));
  assert.ok(!/commission/i.test(html));
});
