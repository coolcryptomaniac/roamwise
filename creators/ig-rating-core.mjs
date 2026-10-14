/* ============================================================================
   creators/ig-rating-core.mjs — rate a creator from their real Instagram posts
   ============================================================================
   Input is what Instagram's official Business Discovery API returns for a public
   Business or Creator account (followers, media count, and per post likes,
   comments, type, time, caption). No scraping: Instagram's terms forbid
   collecting data by automated means without permission, and scrapers get the
   RoamWise account blocked. The Worker endpoint that fetches this data stays off
   until a Meta app token is configured.

   The rating reads the last ~25 posts the way a careful human would: is
   engagement real and steady, or one viral post and bought likes? Does the
   creator actually post about this region? Is the feed all ads? It also folds in
   what RoamWise itself has seen: completed collaborations and the bookings
   they produced. Pure functions, no network.
   ========================================================================= */
import { creatorQuality } from './local-barter-core.mjs';

const num = (v) => { const n = Number(v); return Number.isFinite(n) && n >= 0 ? n : 0; };
const median = (a) => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const mean = (a) => a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0;
const sd = (a) => { const m = mean(a); return a.length > 1 ? Math.sqrt(mean(a.map((v) => (v - m) ** 2))) : 0; };

export const REGION_WORDS = Object.freeze(['almora', 'kumaon', 'kumaoni', 'uttarakhand', 'pahadi', 'pahad', 'nainital', 'bhimtal', 'ranikhet', 'bageshwar', 'kausani', 'haldwani', 'mukteshwar', 'binsar', 'jageshwar', 'pithoragarh', 'munsiyari', 'devbhoomi', 'himalaya']);
const AD_RX = /#(ad|ads|sponsored|collab|paidpartnership|gifted|partnership)\b|paid partnership/i;
const GIVEAWAY_RX = /giveaway|contest|win a |winner announced/i;

/** Username from a profile URL or @handle. Empty when it does not look like an Instagram handle. */
export function igUsername(value) {
  const s = String(value || '').trim();
  const m = /instagram\.com\/([A-Za-z0-9._]{1,30})/i.exec(s) || /^@?([A-Za-z0-9._]{1,30})$/.exec(s);
  const u = m ? m[1].toLowerCase() : '';
  return ['p', 'reel', 'reels', 'stories', 'explore'].includes(u) ? '' : u;
}

/** Metrics + signals from a Business Discovery payload ({ followers_count, media_count, media: { data: [...] } }). */
export function analyzeDiscovery(bd = {}, opts = {}) {
  const now = Date.parse(opts.now || new Date().toISOString());
  const followers = num(bd.followers_count);
  const words = (opts.regionWords || REGION_WORDS).map((w) => w.toLowerCase());
  const posts = ((bd.media && bd.media.data) || []).map((p) => ({
    likes: p.like_count == null ? null : num(p.like_count), comments: num(p.comments_count), views: num(p.view_count),
    at: Date.parse(p.timestamp || ''), reel: p.media_product_type === 'REELS' || p.media_type === 'VIDEO', caption: String(p.caption || ''),
  })).filter((p) => Number.isFinite(p.at));
  /* Posts under a day old have not collected their engagement yet. */
  const settled = posts.filter((p) => now - p.at > 864e5);
  const withLikes = settled.filter((p) => p.likes != null);
  const perPost = withLikes.map((p) => (p.likes + p.comments) / Math.max(1, followers) * 100);
  const reelViews = settled.filter((p) => p.reel && p.views).map((p) => p.views);
  const likes = withLikes.map((p) => p.likes), comments = settled.map((p) => p.comments);
  const posts30 = posts.filter((p) => now - p.at <= 30 * 864e5).length;
  const lastPostDays = posts.length ? Math.floor((now - Math.max(...posts.map((p) => p.at))) / 864e5) : null;
  const local = posts.length ? posts.filter((p) => words.some((w) => p.caption.toLowerCase().includes(w))).length / posts.length : 0;
  const ads = posts.length ? posts.filter((p) => AD_RX.test(p.caption)).length / posts.length : 0;
  const giveaways = posts.filter((p) => GIVEAWAY_RX.test(p.caption)).length;
  const medEr = median(perPost), cv = mean(perPost) ? sd(perPost) / mean(perPost) : 0;
  const top = perPost.length ? Math.max(...perPost) : 0;
  const commentRatio = mean(likes) ? mean(comments) / mean(likes) : 0;
  return {
    username: String(bd.username || '').slice(0, 30), followers, mediaCount: num(bd.media_count), postsSampled: posts.length,
    metrics: {
      followers, engagementPct: Math.round(medEr * 100) / 100, avgLikes: Math.round(median(likes)), avgComments: Math.round(median(comments)),
      avgViews: Math.round(median(reelViews)), postsLast30d: posts30, metricsVerified: true, source: 'instagram_business_discovery',
    },
    signals: {
      consistency: Math.round(cv * 100) / 100, viralDependence: medEr ? Math.round(top / medEr * 10) / 10 : 0,
      commentToLike: Math.round(commentRatio * 1000) / 10, localContentPct: Math.round(local * 100), adSharePct: Math.round(ads * 100),
      giveaways, lastPostDays, likesHidden: settled.length - withLikes.length, reelShare: posts.length ? Math.round(posts.filter((p) => p.reel).length / posts.length * 100) : 0,
    },
  };
}

/** Conversion history from RoamWise's own records: completed collaborations and the bookings they produced. */
export function conversionHistory(deals = {}, ledger = {}) {
  const list = Object.values(deals || {}).filter(Boolean);
  const done = list.filter((d) => ['content_live', 'closed'].includes(d.status));
  const bookings = done.reduce((s, d) => s + num(d.bookings), 0) + num(ledger.verifiedSales);
  const value = done.reduce((s, d) => s + num(d.bookingValue), 0);
  const cost = done.reduce((s, d) => s + num(d.stayValue), 0);
  return { collabs: done.length, bookings, bookingValue: value, stayCost: cost, roi: cost ? Math.round(value / cost * 10) / 10 : null, perCollab: done.length ? Math.round(bookings / done.length * 10) / 10 : null };
}

/** The rating: quality score from real numbers, nudged by what the feed and past deals show, with plain reasons. */
export function rateCreator(analysis, history = {}) {
  const a = analysis || { metrics: {}, signals: {} }, s = a.signals || {}, h = history || {};
  const metrics = { ...a.metrics, verifiedBookings: num(h.bookings) };
  const base = creatorQuality(metrics);
  let score = base.score;
  const why = [...base.why], flags = [...base.flags];
  const add = (d, text, flag) => { score += d; if (d >= 0 && text) why.push(text); if (d < 0 && (flag || text)) flags.push(flag || text); };
  if (s.localContentPct >= 30) add(5, `${s.localContentPct}% of recent posts are about the region`);
  else if (a.postsSampled >= 6 && s.localContentPct === 0) add(-3, null, 'no_regional_content');
  if (s.consistency && s.consistency > 1.2) add(-5, null, 'engagement_swings');
  if (s.viralDependence >= 8) add(-3, null, 'one_viral_post');
  if (s.commentToLike && s.commentToLike < 0.3 && a.followers >= 10000) add(-6, null, 'likes_without_comments');
  if (s.adSharePct > 50) add(-5, null, 'mostly_ads');
  if (s.giveaways >= 3) add(-4, null, 'giveaway_audience');
  if (s.lastPostDays != null && s.lastPostDays > 30) add(-6, null, 'not_posting');
  if (h.collabs >= 2 && !h.bookings) add(-8, null, 'collabs_no_bookings');
  if (h.roi != null && h.roi >= 2) add(5, `past stays returned ${h.roi}× their cost in bookings`);
  score = Math.max(0, Math.min(100, Math.round(score)));
  if (flags.includes('likely_inflated') || flags.includes('audience_growth_anomaly')) score = Math.min(score, 35);
  const grade = score >= 75 ? 'A' : score >= 60 ? 'B' : score >= 45 ? 'C' : 'D';
  return { score, grade, stars: Math.max(1, Math.min(5, Math.round(score / 20))), why: [...new Set(why)], flags: [...new Set(flags)], metrics, history: h, signals: s, ratedAt: new Date().toISOString(), source: 'instagram + roamwise' };
}

/** Optional: a prompt for a model to write a two-line summary. The numbers above are the rating; this is only prose. */
export function summaryPrompt(rating) {
  return 'In two short sentences for a homestay owner, say whether this Instagram creator is worth hosting for a stay-for-content barter and why. Do not invent numbers.\n' + JSON.stringify({ grade: rating.grade, score: rating.score, why: rating.why, flags: rating.flags, metrics: rating.metrics, history: rating.history });
}
