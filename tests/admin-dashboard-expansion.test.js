const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

function loadModule(file, globalName) {
  const context = {};
  vm.createContext(context);
  vm.runInContext(read(file), context);
  return context[globalName];
}

const RWUserActivity = loadModule('js/admin/user-activity.js', 'RWUserActivity');
const RWPromoManager = loadModule('js/admin/promo-manager.js', 'RWPromoManager');
const RWNotificationComposer = loadModule('js/admin/notification-composer.js', 'RWNotificationComposer');
const RWDashboardHome = loadModule('js/admin/dashboard-home.js', 'RWDashboardHome');

// ---------------------------------------------------------------------------
// User activity / DAU
// ---------------------------------------------------------------------------
const NOW = new Date('2026-09-07T12:00:00Z').getTime();
const HOUR = 3600 * 1000, DAY = 24 * HOUR;

test('user-activity: toMillis handles Firestore Timestamp-like, ISO string, epoch millis, and empty', () => {
  assert.equal(RWUserActivity.toMillis({ toDate: () => new Date(1000) }), 1000);
  assert.equal(RWUserActivity.toMillis('1970-01-01T00:00:01.000Z'), 1000);
  assert.equal(RWUserActivity.toMillis(1000), 1000);
  assert.equal(RWUserActivity.toMillis(null), 0);
  assert.equal(RWUserActivity.toMillis(undefined), 0);
});

test('user-activity: computeActivityStats buckets DAU/WAU/MAU correctly and counts never-active separately', () => {
  const records = [
    { lastActive: NOW - 1 * HOUR },       // DAU + WAU + MAU
    { lastActive: NOW - 3 * DAY },        // WAU + MAU only
    { lastActive: NOW - 20 * DAY },       // MAU only
    { lastActive: NOW - 60 * DAY },       // none of the three
    { lastActive: null },                 // never active
    {}                                     // never active (no field at all)
  ];
  const stats = RWUserActivity.computeActivityStats(records, NOW);
  assert.equal(stats.totalUsers, 6);
  assert.equal(stats.dau, 1);
  assert.equal(stats.wau, 2);
  assert.equal(stats.mau, 3);
  assert.equal(stats.neverActive, 2);
  assert.equal(stats.mostRecentMs, NOW - 1 * HOUR);
});

test('user-activity: computeActivityStats never fabricates a DAU on an all-never-active list', () => {
  const stats = RWUserActivity.computeActivityStats([{ }, { lastActive: null }], NOW);
  assert.equal(stats.dau, 0);
  assert.equal(stats.neverActive, 2);
  assert.equal(stats.mostRecentMs, 0);
});

test('user-activity: renderActivityHtml states the honest pre-instrumentation limitation', () => {
  const stats = RWUserActivity.computeActivityStats([], NOW);
  const html = RWUserActivity.renderActivityHtml(stats, {});
  assert.match(html, /Honest limitation/);
  assert.match(html, /No tracked activity yet/);
});

// ---------------------------------------------------------------------------
// Promo manager
// ---------------------------------------------------------------------------
test('promo-manager: normalizePromo requires a code and a positive discount value', () => {
  assert.equal(RWPromoManager.normalizePromo({ discountValue: 10 }).ok, false);
  assert.equal(RWPromoManager.normalizePromo({ code: 'X' }).ok, false);
  assert.equal(RWPromoManager.normalizePromo({ code: 'X', discountValue: 0 }).ok, false);
  const good = RWPromoManager.normalizePromo({ code: 'launch20', discountValue: 20, discountType: 'percent' });
  assert.equal(good.ok, true);
  assert.equal(good.promo.code, 'LAUNCH20');
});

test('promo-manager: normalizePromo rejects a percent discount over 100', () => {
  const r = RWPromoManager.normalizePromo({ code: 'BIG', discountValue: 150, discountType: 'percent' });
  assert.equal(r.ok, false);
});

test('promo-manager: normalizePromo treats a negative/non-numeric usage cap as unlimited (0)', () => {
  const r = RWPromoManager.normalizePromo({ code: 'X', discountValue: 10, usageCap: -5 });
  assert.equal(r.promo.usageCap, 0);
});

test('promo-manager: upsertPromo preserves an existing real redemption count across an edit', () => {
  const list = [{ code: 'X', discountValue: 10, discountType: 'percent', redeemedCount: 7 }];
  const norm = RWPromoManager.normalizePromo({ code: 'x', discountValue: 15, discountType: 'percent' });
  const updated = RWPromoManager.upsertPromo(list, norm.promo);
  assert.equal(updated.length, 1);
  assert.equal(updated[0].redeemedCount, 7);
  assert.equal(updated[0].discountValue, 15);
});

test('promo-manager: setActive toggles only the matching code', () => {
  const list = [{ code: 'A', active: true }, { code: 'B', active: true }];
  const updated = RWPromoManager.setActive(list, 'a', false);
  assert.equal(updated.find(p => p.code === 'A').active, false);
  assert.equal(updated.find(p => p.code === 'B').active, true);
});

test('promo-manager: isExpired compares expiresAt against now, never assumes expiry with no date', () => {
  assert.equal(RWPromoManager.isExpired({ expiresAt: '' }, NOW), false);
  assert.equal(RWPromoManager.isExpired({ expiresAt: '2020-01-01' }, NOW), true);
  assert.equal(RWPromoManager.isExpired({ expiresAt: '2099-01-01' }, NOW), false);
});

test('promo-manager: renderPromoListHtml is honest that redemption counts are not live yet', () => {
  const html = RWPromoManager.renderPromoListHtml([{ code: 'X', discountValue: 10, discountType: 'percent', redeemedCount: 0, usageCap: 0, active: true }], {});
  assert.match(html, /not yet incremented by checkout/);
});

// ---------------------------------------------------------------------------
// Notification composer
// ---------------------------------------------------------------------------
test('notification-composer: normalizeNotification requires title and body', () => {
  assert.equal(RWNotificationComposer.normalizeNotification({ body: 'b' }).ok, false);
  assert.equal(RWNotificationComposer.normalizeNotification({ title: 't' }).ok, false);
  const good = RWNotificationComposer.normalizeNotification({ title: 't', body: 'b' });
  assert.equal(good.ok, true);
  assert.equal(good.notification.status, 'queued');
  assert.equal(good.notification.target.type, 'all');
});

test('notification-composer: a uid target requires a non-empty uid', () => {
  const bad = RWNotificationComposer.normalizeNotification({ title: 't', body: 'b', targetType: 'uid' });
  assert.equal(bad.ok, false);
  const good = RWNotificationComposer.normalizeNotification({ title: 't', body: 'b', targetType: 'uid', targetUid: 'abc123' });
  assert.equal(good.ok, true);
  assert.equal(good.notification.target.type, 'uid');
  assert.equal(good.notification.target.uid, 'abc123');
});

test('notification-composer: title/body/url are capped at their limits, matching worker/handlers/push.js', () => {
  const long = 'x'.repeat(1000);
  const r = RWNotificationComposer.normalizeNotification({ title: long, body: long, url: long });
  assert.equal(r.notification.title.length, RWNotificationComposer.MAX_TITLE);
  assert.equal(r.notification.body.length, RWNotificationComposer.MAX_BODY);
  assert.equal(r.notification.url.length, RWNotificationComposer.MAX_URL);
});

test('notification-composer: renderQueueHtml is explicit that nothing is actually sent yet', () => {
  const html = RWNotificationComposer.renderQueueHtml([{ id: '1', title: 'Hi', body: 'B', status: 'queued', target: { type: 'all' } }], {});
  assert.match(html, /Not wired to a live sender yet/);
  assert.match(html, /queued — not sent/);
});

// ---------------------------------------------------------------------------
// Dashboard home
// ---------------------------------------------------------------------------
test('dashboard-home: buildHomeSummary pulls real numbers from each owning module\'s output, never invents one', () => {
  const summary = RWDashboardHome.buildHomeSummary({
    totalUsers: 29, proUsers: 5, unresolvedCount: 1,
    activityStats: { dau: 3, mau: 12 },
    businessSummary: { mrrINR: 897 },
    activePromoCount: 2, queuedNotificationCount: 4
  });
  assert.equal(summary.totalUsers, 29);
  assert.equal(summary.dau, 3);
  assert.equal(summary.mau, 12);
  assert.equal(summary.mrrINR, 897);
  assert.equal(summary.activePromoCount, 2);
  assert.equal(summary.queuedNotificationCount, 4);
});

test('dashboard-home: buildHomeSummary defaults cleanly with no input at all', () => {
  const summary = RWDashboardHome.buildHomeSummary();
  assert.equal(summary.totalUsers, 0);
  assert.equal(summary.dau, 0);
  assert.equal(summary.mrrINR, 0);
});

test('dashboard-home: renderDashboardHomeHtml links into every new + existing section', () => {
  const summary = RWDashboardHome.buildHomeSummary({});
  const html = RWDashboardHome.renderDashboardHomeHtml(summary, {});
  assert.match(html, /goPage\('activity'\)/);
  assert.match(html, /goPage\('promos'\)/);
  assert.match(html, /goPage\('notifications'\)/);
  assert.match(html, /goPage\('business'\)/);
});
