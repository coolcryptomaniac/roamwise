/* Captures crisp frames of a smooth homepage scroll (iPhone-size, 2x) for the reel's phone screen.
   Usage: node capture-home.cjs <outDir> [frames]   (needs a static server on :8775 serving the repo root) */
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const out = process.argv[2], N = +process.argv[3] || 420;
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.addInitScript(() => { try { localStorage.setItem('rw_opening', '1'); } catch (e) {} });
  await p.goto('http://localhost:8775/#home', { waitUntil: 'load' });
  await p.waitForTimeout(2500);
  await p.evaluate(() => { try { localStorage.setItem('rw_opening', '1'); } catch (e) {} const o = document.getElementById('rwOpening'); if (o) o.remove(); document.body.style.overflow = ''; });
  await p.waitForTimeout(1500);
  const sk = p.getByText('Skip', { exact: true }); if (await sk.count()) await sk.first().click().catch(() => {});
  await p.waitForTimeout(800);
  await p.evaluate(() => { document.querySelectorAll('div,span').forEach((e) => { if (/\+\d+ XP/.test(e.textContent || '') && e.children.length === 0) { let n = e; while (n.parentElement && getComputedStyle(n).position !== 'fixed') n = n.parentElement; n.style.display = 'none'; } }); });
  await p.addStyleTag({ content: '#rwpBar{display:none!important} *{scroll-behavior:auto!important}' });
  /* anchor stops so the scroll lingers on the sections that matter */
  const ys = await p.evaluate(() => ['rwPromo', 'brand-ambassador', 'joinBand', 'rwBooks', 'rwMemories'].map((id) => { const e = document.getElementById(id); return e ? Math.max(0, e.getBoundingClientRect().top + scrollY - 80) : null; }).filter((v) => v != null));
  const stops = [0, ...ys];
  const ease = (t) => t * t * (3 - 2 * t);
  const pos = (i) => { const t = i / (N - 1) * (stops.length - 1), k = Math.min(stops.length - 2, Math.floor(t)), f = t - k; const s = Math.min(1, Math.max(0, (f - .25) / .5)); return stops[k] + (stops[k + 1] - stops[k]) * ease(s); };
  for (let i = 0; i < N; i++) {
    await p.evaluate((y) => window.scrollTo(0, y), Math.round(pos(i)));
    await p.waitForTimeout(30);
    await p.screenshot({ path: `${out}/h${String(i).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 86 });
  }
  console.log('frames', N, 'stops', stops.map(Math.round).join(','));
  await b.close();
})();
