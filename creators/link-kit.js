/* creators/link-kit.js — one tracked link per place a creator posts.
   Every link carries the creator's referral code (?ref=, what js/pricing/referral.js stores for 30 days
   and stamps on a paid claim) plus UTM tags so RoamWise can see which channel converts.
   utm_content is never used: referral.js reads it as a referral code. Works in a browser
   (window.RWLinkKit) and in Node tests (module.exports). */
(function (root) {
  var CHANNELS = [
    { id: 'ig_bio', label: 'Instagram bio', source: 'instagram', tip: 'Paste in your bio link or link-in-bio page.' },
    { id: 'ig_story', label: 'Instagram Story link sticker', source: 'instagram_story', tip: 'Add a link sticker on the Story where you show RoamWise.' },
    { id: 'reel', label: 'Reel caption / pinned comment', source: 'instagram_reel', tip: 'Instagram does not make caption links clickable: say "link in bio" and use the short link.' },
    { id: 'youtube', label: 'YouTube description', source: 'youtube', tip: 'First line of the description, and the pinned comment.' },
    { id: 'shorts', label: 'YouTube Shorts', source: 'youtube_shorts', tip: 'Shorts links are not clickable: pin a comment with the short link.' },
    { id: 'whatsapp', label: 'WhatsApp / Telegram', source: 'whatsapp', tip: 'For groups, channels and status.' },
    { id: 'linkedin', label: 'LinkedIn post', source: 'linkedin', tip: 'Put the link in the first comment for better reach.' },
    { id: 'blog', label: 'Blog / website', source: 'blog', tip: 'Link the words "plan it on RoamWise".' }
  ];
  function clean(code) { return String(code == null ? '' : code).toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 32); }
  function buildLinks(code, base) {
    var c = clean(code); if (!c) return [];
    var b = String(base || 'https://roamwise.co.in').replace(/\/+$/, '');
    return CHANNELS.map(function (ch) {
      var q = 'ref=' + encodeURIComponent(c) + '&utm_source=' + ch.source + '&utm_medium=creator&utm_campaign=' + encodeURIComponent(c.toLowerCase());
      return { id: ch.id, label: ch.label, tip: ch.tip, url: b + '/?' + q };
    });
  }
  function shortLink(code, base) {
    var c = clean(code); return c ? String(base || 'https://roamwise.co.in').replace(/\/+$/, '') + '/r/' + c : '';
  }
  var api = { CHANNELS: CHANNELS, buildLinks: buildLinks, shortLink: shortLink, clean: clean };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.RWLinkKit = api;
})(typeof window !== 'undefined' ? window : this);
