#!/usr/bin/env node
/* Payment-screen layout audit: opens every payment/confirm screen at phone, tablet and desktop sizes and
   reports horizontal overflow, content clipped by the viewport, unreachable buttons and small tap targets.
   Usage: node tools/audit-payment-screens.js [baseUrl] [screenshotDir]   (needs a static server + playwright) */
const { chromium } = require('playwright');
const base = process.argv[2] || 'http://localhost:8765';
const shots = process.argv[3] || '';
const VIEWPORTS = [[360, 640], [390, 844], [412, 915], [844, 390], [768, 1024], [1440, 900]];
const PAGES = ['/my-payments/index.html', '/creators/brands.html', '/creators/dashboard.html', '/partner/index.html'];
const OVERLAYS = [
  ['plan picker', () => { openPay(); }],
  ['plan selected (UPI/QR step)', () => { openPay(); pickPlan('lifetime', 999, 'Lifetime', 'pro', 'one-off'); }],
  ['room payment', () => { rwBookPay({ id: 'r', property: 'Demo Stay', room: 'Deluxe Room', price: 2500, zone: 'Almora', area: 'Kotyura', upi: 'demo@upi' }, { inD: '2026-10-20', outD: '2026-10-22', nights: 2, guests: 2, name: 'A', phone: '9876543210' }); }],
  ['room enquiry form', () => { rwRoomEnquiry({ id: 'r', partnerId: 'p', property: 'Demo Stay', room: 'Deluxe Room', zone: 'Almora' }); }]
];
async function audit(page, label) {
  return page.evaluate(label => {
    const vw = innerWidth, vh = innerHeight, out = { label, vw, vh, issues: [] };
    const de = document.documentElement;
    if (de.scrollWidth > vw + 1) out.issues.push('page scrolls sideways by ' + (de.scrollWidth - vw) + 'px');
    const visible = e => { const r = e.getBoundingClientRect(), s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
    const root = document.querySelector('.overlay.open .sheet, .overlay.open, #payOverlay.open') || document.body;
    root.querySelectorAll('*').forEach(e => {
      if (!visible(e)) return;
      const r = e.getBoundingClientRect();
      if (r.right > vw + 1 && !e.closest('[style*="overflow-x"]')) out.issues.push('wider than screen: ' + (e.className || e.tagName).toString().slice(0, 40) + ' (' + Math.round(r.right - vw) + 'px)');
    });
    const sheet = document.querySelector('.overlay.open .sheet');
    if (sheet) {
      const r = sheet.getBoundingClientRect(), s = getComputedStyle(sheet);
      if (r.height > vh + 1) out.issues.push('sheet taller than screen (' + Math.round(r.height) + ' > ' + vh + ')');
      if (sheet.scrollHeight > sheet.clientHeight + 1 && !/(auto|scroll)/.test(s.overflowY)) out.issues.push('sheet content clipped, not scrollable');
      if (r.top < 0) out.issues.push('sheet top cut off');
    }
    root.querySelectorAll('button,a[href],input,select').forEach(e => {
      if (!visible(e)) return;
      const r = e.getBoundingClientRect();
      if (r.height < 36 && !(e.className + '').match(/\bx\b|tact/)) out.issues.push('small tap target (' + Math.round(r.height) + 'px): ' + (e.textContent || e.name || e.tagName).trim().slice(0, 30));
    });
    out.issues = [...new Set(out.issues)].slice(0, 8);
    return out;
  }, label);
}
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined }).catch(() => chromium.launch());
  const results = [];
  for (const [w, h] of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: w < 800, isMobile: w < 800, deviceScaleFactor: 2 });
    for (const path of PAGES) {
      const p = await ctx.newPage(); const errs = [];
      p.on('pageerror', e => errs.push(e.message));
      await p.goto(base + path, { waitUntil: 'domcontentloaded' }).catch(() => {});
      await p.waitForTimeout(1200);
      const r = await audit(p, path + ' @' + w + 'x' + h); if (errs.length) r.issues.push('script error: ' + errs[0].slice(0, 80));
      results.push(r);
      if (shots) await p.screenshot({ path: `${shots}/${path.replace(/\W+/g, '_')}_${w}x${h}.png` });
      await p.close();
    }
    const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    await p.goto(base + '/index.html', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500);
    for (const [name, fn] of OVERLAYS) {
      try { await p.evaluate(`(${fn.toString()})()`); await p.waitForTimeout(500); } catch (e) { results.push({ label: name + ' @' + w + 'x' + h, issues: ['could not open: ' + String(e.message).slice(0, 80)] }); continue; }
      const r = await audit(p, name + ' @' + w + 'x' + h); results.push(r);
      if (shots) await p.screenshot({ path: `${shots}/${name.replace(/\W+/g, '_')}_${w}x${h}.png` });
      await p.evaluate(() => { document.querySelectorAll('.overlay.open').forEach(o => o.classList.remove('open')); try { closePay(); } catch (e) {} });
    }
    await p.close(); await ctx.close();
  }
  await browser.close();
  const bad = results.filter(r => r.issues.length);
  console.log(JSON.stringify({ screens: results.length, withIssues: bad.length, issues: bad }, null, 1));
  process.exit(bad.length ? 1 : 0);
})();
