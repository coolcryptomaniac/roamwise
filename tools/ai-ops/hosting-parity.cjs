'use strict';
// Read-only smoke checks for the LIVE hostname and Cloudflare Pages staging.
// These HTTP probes CANNOT verify Google OAuth completion, create Cashfree
// orders, certify payment settlement, or perform automatic DNS failover.
const fs = require('node:fs');
const TARGETS = [
  { name: 'live-domain', url: process.env.RW_LIVE_SITE_URL || 'https://roamwise.co.in' },
  { name: 'cloudflare-pages', url: process.env.RW_CLOUDFLARE_SITE_URL || 'https://roamwise-web.pages.dev' },
];
const PATHS = [
  { path: '/', marker: /roamwise/i, purpose: 'homepage' },
  { path: '/rw-config.js', marker: /RW_CONFIG/, purpose: 'runtime configuration' },
  { path: '/js/boot/auth-init.js', marker: /roamwisepro\.firebaseapp\.com/, purpose: 'Firebase auth script' },
  { path: '/js/payments/providers/cashfree-adapter.js', marker: /CF_SDK_URL/, purpose: 'Cashfree client adapter' },
  { path: '/kainchi/', marker: /kainchi/i, purpose: 'Kainchi page' },
];
function baseUrl(value) {
  const u = new URL(value);
  if (u.protocol !== 'https:' || u.username || u.password || u.search || u.hash || (u.pathname !== '/' && u.pathname !== '')) {
    throw Error('Expected a plain HTTPS host origin');
  }
  return u;
}
async function probe(fetcher, target, check) {
  let url;
  try { url = new URL(check.path, baseUrl(target.url)); }
  catch (_) { return { site: target.name, page: check.path, ok: false, detail: 'invalid host configuration' }; }
  try {
    const response = await fetcher(url.href, { method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(14000) });
    if (response.status !== 200) return { site: target.name, page: check.path, ok: false, detail: 'HTTP ' + response.status };
    // Some static hosts redirect to their own canonical URL. Record that to
    // prevent treating two URLs that redirect to one origin as independent.
    const finalHost = new URL(response.url || url.href).hostname;
    const body = await response.text();
    if (!check.marker.test(body)) return { site: target.name, page: check.path, ok: false, detail: 'expected content not found' };
    return { site: target.name, page: check.path, ok: true, finalHost };
  } catch (_) {
    return { site: target.name, page: check.path, ok: false, detail: 'network error / timeout' };
  }
}
async function checkHosting(fetcher = global.fetch, targets = TARGETS, paths = PATHS) {
  const results = [];
  for (const target of targets) {
    for (const check of paths) results.push(await probe(fetcher, target, check));
  }
  return {
    ok: results.every(item => item.ok),
    results,
    checksOnly: 'public read-only HTTP + static content markers',
    googleSignInVerified: false,
    cashfreeOrderCreationVerified: false,
    cashfreePaymentVerified: false,
    automaticFailoverConfigured: false,
    note: 'An HTTP 200 does not prove OAuth, cash collection, transactions, or independent origin availability.'
  };
}
if (require.main === module) {
  checkHosting().then(result => {
    fs.writeFileSync('hosting-parity-result.json', JSON.stringify(result, null, 2) + '\n');
    const failed = result.results.filter(item => !item.ok);
    for (const row of result.results) console.log((row.ok ? 'PASS ' : 'FAIL ') + row.site + ' ' + row.page + ' ' + (row.ok ? row.finalHost : row.detail));
    if (failed.length) console.error('Hosting parity checks failed; do NOT automatically change DNS or payment routing.');
    process.exitCode = result.ok ? 0 : 1;
  }).catch(() => {
    console.error('Hosting parity monitor failed without disclosing response bodies.');
    process.exitCode = 1;
  });
}
module.exports = { checkHosting, probe, baseUrl };
