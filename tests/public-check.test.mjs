import test from 'node:test';
import assert from 'node:assert/strict';
import { youtubeRef, analyzeYoutube, summarizeFootprint, quickLinks } from '../creators/public-check-core.mjs';
import { handleCreatorPublicCheck } from '../worker/handlers/creator-public-check.js';
import { buildRoster } from '../creators/roster-core.mjs';
import { SEED_POLICIES } from '../creators/property-terms-core.mjs';

const NOW = '2026-10-20T12:00:00Z', day = (n) => new Date(Date.parse(NOW) - n * 864e5).toISOString();

test('YouTube links and handles are recognised; other links are not', () => {
  assert.deepEqual(youtubeRef('https://www.youtube.com/@mohucool'), { by: 'handle', value: '@mohucool' });
  assert.deepEqual(youtubeRef('@mohucool'), { by: 'handle', value: '@mohucool' });
  assert.equal(youtubeRef('https://www.youtube.com/channel/UCabcdefghijklmnopqrstuv').by, 'id');
  assert.equal(youtubeRef('https://evil.com/youtube.com/@x'), null);
  assert.equal(youtubeRef(''), null);
});

const vids = (views, likes, comments, n = 10) => Array.from({ length: n }, (_, i) => ({ snippet: { publishedAt: day(3 + i * 4) }, statistics: { viewCount: String(views), likeCount: String(likes), commentCount: String(comments) } }));
test('channel numbers become the same metrics shape the tiers use', () => {
  const a = analyzeYoutube({ id: 'UCx', snippet: { title: 'Asha Eats' }, statistics: { subscriberCount: '50000', videoCount: '200' } }, vids(12000, 600, 80), { now: NOW });
  assert.equal(a.metrics.followers, 50000); assert.equal(a.metrics.avgViews, 12000);
  assert.equal(a.metrics.engagementPct, 5.67); assert.equal(a.metrics.metricsVerified, true); assert.equal(a.metrics.source, 'youtube_data_api');
  assert.ok(a.metrics.postsLast30d >= 7);
  assert.equal(analyzeYoutube({ statistics: { hiddenSubscriberCount: true, subscriberCount: '9' } }, [], { now: NOW }).metrics.followers, 0);
});

test('web footprint keeps independent pages, separates own pages, and says how strong it is', () => {
  const f = summarizeFootprint([
    { title: 'Asha on Insta', url: 'https://www.instagram.com/asha/' }, { title: 'Asha on Insta', url: 'https://www.instagram.com/asha/' },
    { title: 'Almora food trail', url: 'https://www.example-blog.in/almora-food' }, { title: 'Press', url: 'https://times.example.com/asha' },
    { title: 'bad', url: 'javascript:alert(1)' }, { title: 'http only', url: 'http://plain.example.com' },
  ]);
  assert.equal(f.independent, 2); assert.equal(f.level, 'some'); assert.equal(f.items.filter((i) => i.own).length, 1);
  assert.equal(summarizeFootprint([]).level, 'none');
  assert.equal(summarizeFootprint([{ title: 'x', url: 'https://www.instagram.com/a/' }]).level, 'thin');
});

test('quick links open in the admin browser and never carry private data', () => {
  const l = quickLinks({ name: 'Asha Rawat', handle: 'https://www.instagram.com/asha/', youtube: '' });
  assert.ok(l.some((x) => x.label === 'Google' && x.url.includes('asha')));
  assert.ok(l.every((x) => /^https:\/\//.test(x.url)));
});

const req = (body) => new Request('https://w/admin/creator/public-check', { method: 'POST', body: JSON.stringify(body) });
const admin = async () => ({ uid: 'a' });
test('Worker: answers 503 until a key is configured; each source works on its own', async () => {
  const off = await handleCreatorPublicCheck(req({ name: 'A' }), {}, { requireAdmin: admin });
  assert.equal(off.status, 503);
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push(String(url));
    const u = String(url);
    const ok = (o) => ({ ok: true, status: 200, json: async () => o });
    if (u.includes('/channels?')) return ok({ items: [{ id: 'UCx', snippet: { title: 'T' }, statistics: { subscriberCount: '1000' }, contentDetails: { relatedPlaylists: { uploads: 'UUx' } } }] });
    if (u.includes('/playlistItems?')) return ok({ items: [{ contentDetails: { videoId: 'v1' } }] });
    if (u.includes('/videos?')) return ok({ items: vids(500, 20, 2, 1) });
    if (u.includes('firecrawl')) return ok({ data: [{ title: 'Blog', url: 'https://blog.example.com/a' }] });
    return { ok: false, status: 404, json: async () => ({}) };
  };
  const res = await handleCreatorPublicCheck(req({ name: 'Asha', handle: 'https://www.instagram.com/asha/', youtube: 'https://www.youtube.com/@asha' }), { YT_API_KEY: 'k', FIRECRAWL_API_KEY: 'f' }, { requireAdmin: admin, fetch: fetchImpl });
  const out = await res.json();
  assert.equal(res.status, 200); assert.equal(out.youtube.metrics.followers, 1000); assert.equal(out.footprint.independent, 1);
  assert.ok(!calls.some((u) => u.includes('instagram.com')), 'Instagram is never fetched');
  const onlyYt = await (await handleCreatorPublicCheck(req({ name: 'Asha', youtube: '@asha' }), { YT_API_KEY: 'k' }, { requireAdmin: admin, fetch: fetchImpl })).json();
  assert.ok(onlyYt.youtube && !onlyYt.footprint);
});

test('a fresh YouTube check stands in for Instagram numbers; Instagram wins when both exist', () => {
  const base = { id: 'y', name: 'Yt Creator', handle: 'https://www.instagram.com/y/', phone: '919900000001', niche: 'food', barter: { location: { town: 'almora' }, ask: {} } };
  const yt = { checkedAt: new Date().toISOString(), youtube: { metrics: { followers: 130000, engagementPct: 4, avgViews: 60000, postsLast30d: 10, metricsVerified: true }, signals: { lastPostDays: 3 } } };
  const r = buildRoster([{ ...base, refSales: 3, barter: { ...base.barter, publicCheck: yt } }], SEED_POLICIES)[0];
  assert.equal(r.metrics.followers, 130000); assert.equal(r.rating.evidence, 'youtube'); assert.equal(r.rating.tier, 'summit');
  const ig = { ratedAt: new Date().toISOString(), metrics: { followers: 9000, engagementPct: 5, avgViews: 4000, postsLast30d: 8, metricsVerified: true }, signals: {} };
  const both = buildRoster([{ ...base, barter: { ...base.barter, publicCheck: yt, instagram: ig } }], SEED_POLICIES)[0];
  assert.equal(both.metrics.followers, 9000); assert.equal(both.rating.evidence, 'instagram');
});
