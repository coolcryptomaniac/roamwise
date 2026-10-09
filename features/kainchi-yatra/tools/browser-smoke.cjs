// Optional local Chromium integration gate. No browser library ships with the page.
const { chromium } = require(process.env.KAINCHI_PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const http = require('node:http'), fs = require('node:fs'), path = require('node:path');
(async () => {
  const root = path.resolve(__dirname, '../../..');
  const server = http.createServer((req, res) => {
    let file = path.join(root, decodeURIComponent(req.url.split('?')[0]));
    if (file.endsWith('/')) file += 'index.html';
    if (!file.startsWith(root + '/') || !fs.existsSync(file)) { res.writeHead(404); return res.end(); }
    res.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg' })[path.extname(file)] || 'application/octet-stream');
    res.end(fs.readFileSync(file));
  });
  await new Promise(resolve => server.listen(8775, '127.0.0.1', resolve));
  const browser = await chromium.launch({ executablePath: process.env.KAINCHI_CHROMIUM_PATH, headless: true, args: ['--no-sandbox'] });
  const out = process.env.KAINCHI_QA_OUTPUT || '/tmp/kainchi-daily-qa'; fs.mkdirSync(out, { recursive: true });
  const results = [];
  try {
    for (const width of [360, 390, 1280]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, timezoneId: 'Asia/Kolkata', locale: 'en-IN' });
      const page = await context.newPage(), errors = [], external = [];
      page.on('pageerror', e => errors.push(String(e)));
      page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
      page.on('request', r => { if (!r.url().startsWith('http://127.0.0.1:8775/')) external.push(r.url()); });
      await page.goto('http://127.0.0.1:8775/kainchi/', { waitUntil: 'networkidle' });
      for (const lang of ['en', 'hi']) {
        await page.locator('[data-lang="' + lang + '"]').click();
        await page.screenshot({ path: `${out}/hero-${width}-${lang}.png` });
        for (const tab of ['today', 'plan', 'bhakti', 'reach', 'arrival', 'help', 'nearby']) {
          await page.locator('#tab-' + tab).click();
          assert.equal(await page.locator('#' + tab).isVisible(), true);
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Overflow ${width}/${lang}/${tab}`);
        }
      }
      await page.locator('[data-lang="en"]').click();
      await page.locator('#tab-reach').click();
      await page.selectOption('#route-origin', 'kathgodam');
      assert.equal(new URL(await page.locator('#route-open').getAttribute('href')).searchParams.get('origin'), 'Kathgodam Railway Station, Uttarakhand');
      await page.locator('#reach').screenshot({ path: `${out}/reach-${width}.png` });
      await page.locator('#tab-plan').click();
      await page.locator('#week-strip button').nth(2).click();
      assert.equal(await page.locator('#plan-date').inputValue(), await page.locator('#pass-date').inputValue());
      assert.match(await page.locator('#share-trip').getAttribute('href'), /^https:\/\/wa.me/);
      await page.locator('#plan').screenshot({ path: `${out}/plan-${width}.png` });
      await page.locator('#tab-arrival').click();
      await page.fill('#pass-leader', 'Mohit Pandey'); await page.fill('#pass-size', '4');
      await page.locator('#pass-form button[type="submit"]').click();
      assert.equal(await page.locator('.pass').count(), 1);
      assert.equal(await page.evaluate(() => localStorage.getItem('rw_kainchi_passes_v1')), null);
      await page.check('#pass-remember'); assert.match(await page.evaluate(() => localStorage.getItem('rw_kainchi_passes_v1')), /KDY-/);
      await page.uncheck('#pass-remember');
      await page.evaluate(() => { window.print = () => { window.__printed = true; }; });
      await page.locator('.pass button').first().click();
      assert.equal(await page.evaluate(() => window.__printed), true);
      await page.emulateMedia({ media: 'print' });
      assert.equal(await page.locator('.pass.printing').isVisible(), true);
      if (width === 390) await page.pdf({ path: `${out}/pass.pdf`, format: 'A4' });
      await page.emulateMedia({ media: null });
      await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
      await page.locator('#tab-help').click();
      await page.selectOption('#rep-cat', 'ambulance');
      assert.equal(await page.locator('#report-emergency').isVisible(), true);
      assert.equal(await page.locator('#report-out').isVisible(), false);
      await page.selectOption('#rep-cat', 'taxi'); await page.fill('#rep-place', 'Bhowali');
      await page.fill('#rep-text', 'Asked for more than the displayed fare.');
      await page.locator('#report-form button').click();
      assert.match(await page.locator('#report-mail').getAttribute('href'), /^mailto:support@roamwise.co.in/);
      await page.locator('#tab-today').click();
      await page.locator('[data-feed-filter="official"]').click();
      assert.equal(await page.locator('#updates-list .update-card').count(), 0);
      // Refresh malformed JSON keeps the last-good UI; no HTML can execute.
      await page.route('**/daily.json', route => route.fulfill({ contentType: 'application/json', body: '{bad' }));
      await page.locator('#updates-refresh').click();
      await page.waitForFunction(() => document.getElementById('feed-network').textContent.includes('Refresh unavailable'));
      assert.equal(await page.locator('#updates-refresh').isEnabled(), true);
      await page.locator('#tab-plan').focus(); await page.keyboard.press('ArrowRight');
      assert.equal(await page.locator('#tab-bhakti').getAttribute('aria-selected'), 'true');
      await page.locator('#diya-toggle').click();
      await page.locator('#baba-photo').scrollIntoViewIfNeeded();
      await page.waitForFunction(() => document.getElementById('baba-photo').naturalWidth > 0);
      assert.equal(await page.locator('#digital-diya').evaluate(el => el.classList.contains('lit')), true);
      await page.locator('#bhakti').screenshot({ path: `${out}/bhakti-${width}.png` });
      await page.locator('#motion-toggle').click();
      assert.equal(await page.locator('.hero-mist').evaluate(el => getComputedStyle(el).animationName), 'none');
      await page.emulateMedia({ reducedMotion: 'reduce' });
      assert.equal(await page.locator('.hero-copy').evaluate(el => getComputedStyle(el).animationName), 'none');
      assert.deepEqual(errors, []); assert.deepEqual(external, []);
      results.push({ width, languages: ['en', 'hi'], overflow: false, errors: 0, externalRequests: 0, tabs: true, pass: true, print: true, report: true, sourceFailure: true });
      await context.close();
    }
    fs.writeFileSync(`${out}/results.json`, JSON.stringify(results, null, 2)); console.log(JSON.stringify(results));
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(e => { console.error(e); process.exit(1); });
