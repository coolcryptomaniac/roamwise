/* NMIMS pass tools: no secrets, Firebase credentials or writes in this module. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.RWNMIMSPass = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  const CAMPAIGN = 'nmims2026';
  function email(value) {
    const result = String(value || '').trim().toLowerCase();
    if (result.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)) throw new Error('Enter a valid recipient email.');
    return result;
  }
  function name(value) {
    const result = String(value || '').trim().replace(/\s+/g, ' ');
    if (result.length < 2 || result.length > 80) throw new Error('Enter the student’s name (2–80 characters).');
    return result;
  }
  function slug(value) {
    return name(value).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7) || 'TRAVELR';
  }
  function token(bytes) {
    if (!bytes || bytes.length !== 8) throw new Error('Eight cryptographically random bytes are required.');
    let value = 0, bits = 0, out = '';
    for (const byte of bytes) {
      value = (value << 8) | byte;
      bits += 8;
      while (bits >= 5) {
        out += ALPHABET[(value >>> (bits - 5)) & 31];
        bits -= 5;
        value &= (1 << bits) - 1;
      }
    }
    if (bits) out += ALPHABET[(value << (5 - bits)) & 31];
    return out;
  }
  function code(studentName, serial, bytes) {
    if (!Number.isSafeInteger(serial) || serial < 1 || serial > 9999) throw new Error('Serial number is out of range.');
    const result = 'NMIMS-' + slug(studentName) + '-' + String(serial).padStart(4, '0') + '-' + token(bytes);
    if (result.length > 32) throw new Error('Code exceeds the app’s 32-character limit.');
    return result;
  }
  function allocation(pool, role) {
    if (!pool || pool.issuanceEnabled !== true) throw new Error('NMIMS issuance is disabled until the partnership is approved.');
    if (!['student', 'organiser'].includes(role)) throw new Error('Select student or organiser.');
    const cap = pool.cap;
    const claimed = pool.claimed || 0;
    if (!Number.isSafeInteger(cap) || cap < 1 || cap > 500 || !Number.isSafeInteger(claimed) || claimed < 0 || claimed >= cap) {
      throw new Error('The NMIMS pass pool is unconfigured or has reached its limit.');
    }
    const field = role === 'organiser' ? 'organiserClaimed' : 'studentClaimed';
    const roleCap = pool[role === 'organiser' ? 'organiserCap' : 'studentCap'];
    const used = pool[field] || 0;
    if (!Number.isSafeInteger(roleCap) || roleCap < 1 || !Number.isSafeInteger(used) || used < 0 || used >= roleCap) {
      throw new Error('This NMIMS allocation is unconfigured or full.');
    }
    const serial = Math.max(claimed + 1, pool.nextSerial || 1);
    if (!Number.isSafeInteger(serial) || serial > 9999) throw new Error('Invalid next serial.');
    return { serial, claimed: claimed + 1, field, roleUsed: used + 1 };
  }
  async function emailIndex(address, subtle) {
    const input = new TextEncoder().encode(CAMPAIGN + ':' + email(address));
    const digest = await subtle.digest('SHA-256', input);
    return CAMPAIGN + '_' + Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
  }
  /* ---- Bulk coupons (event-day, not tied to an email) ----
     NMIMS-STU-0123-XXXXXXXXXXXXX / NMIMS-ORG-0007-XXXXXXXXXXXXX (28 chars, <= the app's 32 cap).
     The last 13 characters carry 64 random bits. The serial is for audit only and authenticates nothing. */
  const TAGS = { student: 'STU', organiser: 'ORG' };
  const SPLIT = { organiser: 50, student: 450 };
  function coupon(role, serial, bytes) {
    if (!TAGS[role]) throw new Error('Select student or organiser.');
    if (!Number.isSafeInteger(serial) || serial < 1 || serial > 9999) throw new Error('Serial number is out of range.');
    const out = 'NMIMS-' + TAGS[role] + '-' + String(serial).padStart(4, '0') + '-' + token(bytes);
    if (out.length > 32) throw new Error('Code exceeds the app\u2019s 32-character limit.');
    return out;
  }
  /** randomBytes(n) must be a CSPRNG (crypto.getRandomValues). Returns [{code, role, serial}] with unique codes. */
  function couponBatch(randomBytes, split) {
    const plan = split || SPLIT;
    if (plan.organiser + plan.student > 500) throw new Error('A batch may not exceed the 500-pass ceiling.');
    const seen = new Set(), list = [];
    for (const role of ['organiser', 'student']) {
      for (let serial = 1; serial <= plan[role]; serial++) {
        let code;
        for (let tries = 0; tries < 5; tries++) {
          code = coupon(role, serial, randomBytes(8));
          if (!seen.has(code)) break;
          code = '';
        }
        if (!code) throw new Error('Random code collision; run the generator again.');
        seen.add(code);
        list.push({ code, role, serial });
      }
    }
    return list;
  }
  /** SHA-256 over the sorted list of codes: publish it in advance and reveal the list later to prove the set never changed. */
  async function commitment(codes, subtle) {
    const digest = await subtle.digest('SHA-256', new TextEncoder().encode(codes.slice().sort().join('\n')));
    return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
  }
  function toCsv(list, expiresIso) {
    return 'serial,type,code,redeem_link,valid_until\n' + list.map(c =>
      [c.serial, c.role, c.code, 'https://www.roamwise.co.in/?redeem=' + c.code, expiresIso].join(',')).join('\n') + '\n';
  }
  /** Rebuilds the coupon list from a CSV this tool produced (serial,type,code,redeem_link,valid_until). Every row is validated; anything odd throws. */
  const CODE_RE = /^NMIMS-(STU|ORG)-(\d{4})-[0-9A-HJKMNP-TV-Z]{13}$/;
  function fromCsv(text) {
    const lines = String(text || '').replace(/^\uFEFF/, '').split(/\r?\n/).filter(l => l.trim());
    if (!lines.length || lines[0].trim().toLowerCase().split(',').slice(0, 3).join(',') !== 'serial,type,code') throw new Error('This is not a coupon CSV from this desk.');
    const seen = new Set(), list = [];
    let expiresIso = '';
    for (const line of lines.slice(1)) {
      const f = line.split(',').map(x => x.trim().replace(/^"|"$/g, ''));
      const m = CODE_RE.exec(f[2] || '');
      if (!m) throw new Error('Row with an invalid code: ' + line.slice(0, 40));
      const role = m[1] === 'STU' ? 'student' : 'organiser';
      const serial = Number(m[2]);
      if (f[1] !== role || Number(f[0]) !== serial) throw new Error('Row does not match its own code: ' + f[2]);
      if (seen.has(f[2])) throw new Error('Duplicate code in CSV: ' + f[2]);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(f[4] || '')) throw new Error('Row without a valid_until date: ' + f[2]);
      seen.add(f[2]); expiresIso = expiresIso || f[4];
      list.push({ code: f[2], role, serial });
    }
    if (!list.length) throw new Error('The CSV has no coupons.');
    if (list.length > 500) throw new Error('More than 500 coupons in the CSV.');
    return { list, expiresIso };
  }
  /** Keeps cards whose serial is within [from, to] (blank = open end). */
  function serialRange(list, from, to) {
    const lo = Number(from) || 1, hi = Number(to) || 9999;
    return list.filter(c => c.serial >= lo && c.serial <= hi);
  }
  /** rows: [{code, serial, role, redeemedAt (ISO or ''), redeemedUid}] */
  function redemptionsCsv(rows) {
    return 'serial,type,code,redeemed_at,redeemed_by_uid\n' + rows.map(r => [r.serial, r.role, r.code, r.redeemedAt || '', r.redeemedUid || ''].join(',')).join('\n') + '\n';
  }
  /** Printable A4 sheet, 10 cards per page, one QR per coupon. qrSvg(url) must return an SVG string (see qrcode.js).
      Everything is inline: no fonts, images or scripts are loaded, so the codes never leave the browser. */
  function cardsHtml(list, qrSvg, expiresIso, title) {
    const esc = x => String(x).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const cards = list.map(c => '<div class="card"><div class="top"><b>RoamWise</b><span>Founder Pro for life</span></div>' +
      '<div class="qr">' + qrSvg('https://www.roamwise.co.in/?redeem=' + c.code) + '</div>' +
      '<div class="code">' + esc(c.code) + '</div>' +
      '<div class="how">Scan, sign in with Google, tap Redeem.<br>Or enter the code in Settings &rarr; Redeem a partner code.</div>' +
      '<div class="wish"><b>A gift for the builders of Startup Garage 2026</b><br>With thanks to E-Cell and SBM NMIMS. Wishing you big ideas and bigger journeys.<br>&mdash; Mohit and team RoamWise</div>' +
      '<div class="meta">#' + esc(c.serial) + ' &middot; ' + (c.role === 'organiser' ? 'Organiser' : 'Student / audience') + ' &middot; one use &middot; valid until ' + esc(expiresIso) + '</div></div>').join('');
    return '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>' + esc(title || 'NMIMS pass cards') + '</title><style>' +
      '@page{size:A4;margin:8mm}*{box-sizing:border-box}body{margin:0;font:11px/1.35 system-ui,Arial,sans-serif;color:#1a1530;-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
      '.sheet{display:grid;grid-template-columns:1fr 1fr;gap:5mm}.card{border:1.5px dashed #8a3fd1;border-radius:10px;padding:8px 10px;text-align:center;height:52mm;break-inside:avoid;page-break-inside:avoid;background:linear-gradient(135deg,#fff5e6,#efe6ff)}' +
      '.top{display:flex;justify-content:space-between;align-items:center;font-size:11px}.top b{color:#C4302B;font-size:13px}.top span{color:#0f8f72;font-weight:700}' +
      '.qr svg{width:20mm;height:20mm;margin:2px 0;background:#fff;border-radius:4px}.code{font:700 11px ui-monospace,Menlo,monospace;letter-spacing:.02em;word-break:break-all}' +
      '.how{font-size:8.5px;color:#4a4560;margin-top:2px}.wish{font-size:8px;line-height:1.3;color:#8a3fd1;margin-top:3px}.wish b{font-size:8.8px}.meta{font-size:8px;color:#6a5f80;margin-top:2px}' +
      '.note{grid-column:1/-1;font-size:9px;color:#6a5f80}@media screen{body{padding:10px;background:#eee}.card{background:#fff}}' +
      '</style></head><body><div class="sheet"><div class="note">' + esc(title || '') + ' &middot; treat these cards like cash: whoever redeems a code first gets the pass. Print, cut along the dashed lines, hand out one per person.</div>' + cards + '</div></body></html>';
  }

  /** On-screen version of the cards for phones/tablets: one card per row, big QR, "Save image" and "Copy link" per card.
      No paper needed. The only script is a fixed inline block (no codes are interpolated into it); nothing is loaded or sent anywhere. */
  function digitalCardsHtml(list, qrSvg, expiresIso, title) {
    const esc = x => String(x).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const cards = list.map(c => '<div class="card" data-code="' + esc(c.code) + '" data-serial="' + esc(c.serial) + '"><div class="top"><b>RoamWise</b><span>Founder Pro for life</span></div>' +
      '<div class="qr">' + qrSvg('https://www.roamwise.co.in/?redeem=' + c.code) + '</div>' +
      '<div class="code">' + esc(c.code) + '</div>' +
      '<a class="open" href="https://www.roamwise.co.in/?redeem=' + esc(c.code) + '">Tap to redeem</a>' +
      '<div class="how">Scan, or tap the button, sign in with Google and redeem.<br>Or enter the code in Settings &rarr; Redeem a partner code.</div>' +
      '<div class="wish"><b>A gift for the builders of Startup Garage 2026</b><br>With thanks to E-Cell and SBM NMIMS. Wishing you big ideas and bigger journeys.<br>&mdash; Mohit and team RoamWise</div>' +
      '<div class="meta">#' + esc(c.serial) + ' &middot; ' + (c.role === 'organiser' ? 'Organiser' : 'Student / audience') + ' &middot; one use &middot; valid until ' + esc(expiresIso) + '</div>' +
      '<div class="acts"><button type="button" class="save">Save image</button><button type="button" class="copy">Copy link</button></div></div>').join('');
    const script = "document.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;var card=b.closest('.card');if(!card)return;var code=card.getAttribute('data-code');" +
      "if(b.classList.contains('copy')){var link='https://www.roamwise.co.in/?redeem='+code;(navigator.clipboard&&navigator.clipboard.writeText?navigator.clipboard.writeText(link):Promise.reject()).then(function(){b.textContent='Copied'},function(){window.prompt('Copy this link',link)});return;}" +
      "if(b.classList.contains('save')){var svg=card.querySelector('.qr svg');var xml=new XMLSerializer().serializeToString(svg);var img=new Image();img.onload=function(){var c=document.createElement('canvas');c.width=640;c.height=860;var x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,640,860);x.fillStyle='#C4302B';x.font='bold 40px Arial';x.textAlign='center';x.fillText('RoamWise',320,70);x.fillStyle='#0f8f72';x.font='bold 26px Arial';x.fillText('Founder Pro for life',320,110);x.imageSmoothingEnabled=false;x.drawImage(img,70,140,500,500);x.fillStyle='#1a1530';x.font='bold 24px monospace';x.fillText(code,320,690);x.fillStyle='#4a4560';x.font='22px Arial';x.fillText('Scan, sign in with Google, tap Redeem.',320,740);x.fillText('One use. '+card.querySelector('.meta').textContent.split('\\u00b7').pop().trim(),320,780);var a=document.createElement('a');a.download='RoamWise-'+code+'.png';a.href=c.toDataURL('image/png');a.click();};img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(xml);}});";
    return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(title || 'NMIMS digital pass cards') + '</title><style>' +
      '*{box-sizing:border-box}body{margin:0;padding:12px;background:#eee;font:14px/1.4 system-ui,Arial,sans-serif;color:#1a1530}.note{max-width:420px;margin:0 auto 12px;font-size:12px;color:#6a5f80}' +
      '.card{max-width:420px;margin:0 auto 16px;border:1.5px dashed #8a3fd1;border-radius:14px;padding:14px;text-align:center;background:#fff}.top{display:flex;justify-content:space-between;align-items:center}.top b{color:#C4302B;font-size:18px}.top span{color:#0f8f72;font-weight:700;font-size:13px}' +
      '.qr svg{width:min(70vw,260px);height:min(70vw,260px);margin:8px 0;background:#fff}.code{font:700 14px ui-monospace,Menlo,monospace;word-break:break-all}.how{font-size:12px;color:#4a4560;margin-top:6px}.wish{font-size:12.5px;line-height:1.4;color:#8a3fd1;margin-top:8px}.wish b{font-size:13.5px}.meta{font-size:11px;color:#6a5f80;margin-top:4px}' +
      '.acts{display:flex;gap:8px;justify-content:center;margin-top:10px}.acts button{border:0;border-radius:9px;padding:10px 14px;font:700 13px system-ui;background:#E8BA6C;color:#0B1020}' +
      '.open{display:inline-block;margin-top:8px;padding:10px 18px;border-radius:9px;background:#6d2fd1;color:#fff;font-weight:700;text-decoration:none}.code{color:inherit}' +
      '@page{size:A4;margin:8mm}@media print{body{padding:0;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}.acts{display:none}.note{display:none}' +
      'body{display:grid;grid-template-columns:1fr 1fr;gap:5mm}.card{max-width:none;margin:0;height:88mm;padding:8px 10px;break-inside:avoid;page-break-inside:avoid}.qr svg{width:32mm;height:32mm;margin:3px 0}.how{font-size:9px}.wish{font-size:9px;margin-top:4px}.wish b{font-size:9.6px}.meta{font-size:8.5px}.open{margin-top:4px;padding:6px 12px;font-size:11px}}' +
      '</style></head><body><div class="note">' + esc(title || '') + ' &middot; digital cards, no printing needed. Save an image or copy the link and send it to one person. Treat each like cash: whoever redeems a code first gets the pass.</div>' + cards + '<script>' + script + '</script></body></html>';
  }
  return { CAMPAIGN, SPLIT, cardsHtml, digitalCardsHtml, email, name, slug, token, code, allocation, emailIndex, coupon, couponBatch, commitment, toCsv, fromCsv, serialRange, redemptionsCsv };
});