/* worker/lib/home-daily-core.js — pure rules for the daily home page feed (GET /home/daily).
   The Worker never writes copy and never invents a place, price or alert. It only SELECTS from what the
   team already curated and published on the site:
     data/home-promo.json   the promoted partner stays (order is rotated so a different one leads each day)
     data/conditions.json   dated travel advisories with their sources (only those in force today are shown)
   Named exports only; no network and no clock in here (the caller passes today's India date). */

const DAY_MS = 86400000;
const clip = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
const isDay = (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v || ''));

/* India calendar date (UTC+5:30, no daylight saving) for a JS Date. */
export function indiaDate(now) {
  return new Date(now.getTime() + 5.5 * 3600000).toISOString().slice(0, 10);
}

export function dayNumber(todayISO) {
  return Math.floor(Date.parse(todayISO + 'T00:00:00Z') / DAY_MS);
}

/* Same list, starting from a different item each day. Every partner leads equally often. */
export function rotate(list, todayISO) {
  const a = Array.isArray(list) ? list.slice() : [];
  if (a.length < 2 || !isDay(todayISO)) return a;
  const k = ((dayNumber(todayISO) % a.length) + a.length) % a.length;
  return a.slice(k).concat(a.slice(0, k));
}

/* Keep only what the cron needs from the two site files, so the KV value stays small and has no surprises. */
export function snapshot(promo, conditions, fetchedAt) {
  const stays = ((promo && promo.stays) || []).map((s) => String((s && s.partnerId) || '')).filter((id) => /^[a-z0-9_]{3,60}$/.test(id));
  const advisories = ((conditions && conditions.advisories) || []).filter((a) => a && a.id && a.title && isDay(a.from)).map((a) => ({
    id: clip(a.id, 80), kind: clip(a.kind, 20), official: a.official === true, title: clip(a.title, 160),
    from: a.from, until: isDay(a.until) ? a.until : '', source: clip(a.source, 80),
    sourceUrl: /^https:\/\/[^\s"']{4,300}$/.test(String(a.sourceUrl || '')) ? String(a.sourceUrl) : '',
  }));
  return { v: 1, fetchedAt: fetchedAt || '', checked: isDay(conditions && conditions.checked) ? conditions.checked : '', stays: [...new Set(stays)], advisories };
}

/* Advisories in force on `todayISO`: official first, then the ones ending soonest. Undated-end items are in
   force for 21 days from their start, so an old notice cannot sit on the home page forever. */
export function activeAdvisories(advisories, todayISO, limit = 3) {
  const t = dayNumber(todayISO);
  return (advisories || []).filter((a) => {
    const from = dayNumber(a.from), until = a.until ? dayNumber(a.until) : from + 21;
    return from <= t && t <= until;
  }).map((a) => ({ ...a, daysLeft: a.until ? dayNumber(a.until) - t : null }))
    .sort((x, y) => (Number(y.official) - Number(x.official)) || ((x.daysLeft == null ? 999 : x.daysLeft) - (y.daysLeft == null ? 999 : y.daysLeft)) || x.id.localeCompare(y.id))
    .slice(0, limit);
}

/* The feed the home page reads. `snap` may be null (nothing cached yet): the feed is then empty and the
   page shows exactly what it shows without the Worker. */
export function buildFeed(snap, todayISO) {
  if (!snap || !isDay(todayISO)) return { v: 1, date: isDay(todayISO) ? todayISO : '', stayOrder: [], advisories: [], source: 'none' };
  /* Advisory data older than 4 days is not shown as "today": a stale road alert is worse than none. */
  const fresh = snap.checked && dayNumber(todayISO) - dayNumber(snap.checked) <= 4;
  return {
    v: 1, date: todayISO, stayOrder: rotate(snap.stays, todayISO),
    advisories: fresh ? activeAdvisories(snap.advisories, todayISO) : [],
    advisoriesChecked: snap.checked || '', fetchedAt: snap.fetchedAt || '', source: 'site',
  };
}
