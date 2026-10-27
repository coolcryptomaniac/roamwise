'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');
const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const html = read('index.html');

test('remove unsupported promotions and their loaded runtime, not core tools', () => {
  const doc = new JSDOM(html).window.document;
  for (const id of ['aipulse', 'newspulse', 'events', 'rwCreatorBanner']) {
    assert.equal(doc.getElementById(id), null, id);
  }
  assert.doesNotMatch(html, /event-radar-news\.js|2026 breakthroughs|print-on-demand store coming soon|Become a Supporter/);
  assert.equal(fs.existsSync(path.join(root, 'js/misc/event-radar-news.js')), false);
  assert.doesNotMatch(read('js/boot/init.js'), /renderEventBanner\(|renderEvents\(|renderSpotlight\(|renderNewsPulse\(/);
  for (const id of ['copilotHero', 'app', 'bigSix', 'store', 'jlog', 'officialNotice', 'musicEventsIndia']) {
    assert.ok(doc.getElementById(id), id);
  }
  assert.ok(doc.querySelector('script[src*="js/misc/events.js"]'));
});

test('partner doors stay accessible through native, initially closed disclosure', () => {
  const doc = new JSDOM(html).window.document;
  const doors = doc.getElementById('rwPartnerDoors');
  assert.equal(doors.tagName, 'DETAILS');
  assert.equal(doors.open, false);
  assert.match(doors.querySelector('summary').textContent, /yoga teachers/);
  for (const href of ['/yoga/?src=home-top', '/partner/join/?src=home-top', '/creators/gallery.html?src=home-top']) {
    assert.ok([...doors.querySelectorAll('a')].some(a => a.getAttribute('href') === href), href);
  }
  assert.equal(doc.querySelectorAll('#quickGrid [onclick="openListing()"]') .length, 0);
  assert.ok(doc.querySelector('#bigSix [onclick="openListing()"]'));
  assert.doesNotMatch(doc.querySelector('.bs-creator').textContent, /Free stays/);
});

test('legal destinations remain available once each in the drawer', () => {
  const doc = new JSDOM(html).window.document;
  for (const p of ['/privacy.html', '/terms.html', '/refund-policy.html']) {
    assert.equal(doc.querySelectorAll('#drawer a[href="' + p + '"]').length, 1, p);
  }
  assert.doesNotMatch(doc.getElementById('drawer').textContent, /Agent evals|Tusk Agent|AI Pulse|World moments/);
});

test('site search and adaptive shortcut route to the maintained event directory', () => {
  let opened = 0;
  const ctx = { window: {}, openEvents() { opened++; } };
  vm.createContext(ctx);
  vm.runInContext(read('js/ui/site-search.js'), ctx);
  const entries = ctx.ssIndex();
  assert.ok(entries.find(e => e.t === 'Event Radar'));
  assert.ok(!entries.some(e => /Pulse|FIFA|Supporter/.test(e.t)));
  entries.find(e => e.t === 'Event Radar').go();
  vm.runInContext(read('js/ui/card-painter.js'), ctx);
  ctx.FORYOU_DEFS.events[1]();
  assert.equal(opened, 2);
  assert.doesNotMatch(read('js/ui/card-painter.js'), /activeEvents\(|evCity|class="pb">LIVE/);
});

test('no inline click or search entry targets a removed section', () => {
  const doc = new JSDOM(html).window.document;
  const actions = [...doc.querySelectorAll('[onclick]')].map(n => n.getAttribute('onclick')).join('\n');
  assert.doesNotMatch(actions + read('js/ui/site-search.js') + read('js/core/app-utils.js'), /scrollToId\(['"](?:events|aipulse|newspulse)['"]\)|eventPlan\(/);
});
