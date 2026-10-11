/* NMIMS pass desk: bulk share pack (ZIP of per-card images / PDFs, tracker CSV). Runs only in the admin's browser.
   No network, no secrets. Pure helpers (zip, pdf, csv) are unit-tested in Node; canvas drawing is browser-only. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.RWNMIMSBulk = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const LINK = code => 'https://www.roamwise.co.in/?redeem=' + code;
  const ROLE_NAME = { student: 'Student', organiser: 'Organiser' };
  const fileStem = c => 'RoamWise-' + ROLE_NAME[c.role] + '-' + String(c.serial).padStart(4, '0');

  /* ---------- CSV ---------- */
  const q = v => { const s = String(v == null ? '' : v); return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  function message(c, expiresIso) {
    return 'Hi! A gift from the builders of Startup Garage 2026: a RoamWise Founder Pro pass, free for life. ' +
      'Tap this link, sign in with Google or email and tap Redeem: ' + LINK(c.code) +
      ' (one use, valid until ' + expiresIso + '). Wishing you big ideas and bigger journeys. Mohit and team RoamWise';
  }
  /** Sheet for the E-Cell team: ready-to-paste message plus empty tracking columns. */
  function trackerCsv(list, expiresIso) {
    const head = 'serial,type,code,redeem_link,valid_until,message_to_copy,sent_to,channel,date_sent,notes';
    return head + '\n' + list.map(c => [c.serial, c.role, c.code, LINK(c.code), expiresIso, message(c, expiresIso), '', '', '', ''].map(q).join(',')).join('\n') + '\n';
  }

  /* ---------- ZIP (store only, no compression) ---------- */
  let CRC_TABLE = null;
  function crc32(bytes) {
    if (!CRC_TABLE) { CRC_TABLE = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; CRC_TABLE[n] = c >>> 0; } }
    let c = 0xFFFFFFFF;
    for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 255] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }
  /** files: [{name, data: Uint8Array}] -> Uint8Array of a valid .zip */
  function zip(files) {
    const enc = new TextEncoder(), chunks = [], central = [];
    let offset = 0;
    const u16 = n => [n & 255, (n >>> 8) & 255], u32 = n => [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255];
    for (const f of files) {
      const name = enc.encode(f.name), crc = crc32(f.data), size = f.data.length;
      const local = Uint8Array.from([0x50, 0x4b, 3, 4, ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(crc), ...u32(size), ...u32(size), ...u16(name.length), ...u16(0)]);
      chunks.push(local, name, f.data);
      central.push(Uint8Array.from([0x50, 0x4b, 1, 2, ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(crc), ...u32(size), ...u32(size), ...u16(name.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(offset)]), name);
      offset += local.length + name.length + size;
    }
    let cdSize = 0; for (const c of central) cdSize += c.length;
    const end = Uint8Array.from([0x50, 0x4b, 5, 6, ...u16(0), ...u16(0), ...u16(files.length), ...u16(files.length), ...u32(cdSize), ...u32(offset), ...u16(0)]);
    const all = [...chunks, ...central, end];
    let total = 0; for (const c of all) total += c.length;
    const out = new Uint8Array(total); let p = 0;
    for (const c of all) { out.set(c, p); p += c.length; }
    return out;
  }

  /* ---------- one-page PDF: a JPEG with tappable link rectangles ---------- */
  /** jpeg: Uint8Array; w,h in pixels; links: [{x,y,w,h,url}] in pixel coordinates (origin top-left). Page is 0.75 pt per px. */
  function pdfFromJpeg(jpeg, w, h, links) {
    const enc = s => new TextEncoder().encode(s);
    const W = Math.round(w * 75) / 100, H = Math.round(h * 75) / 100, k = 0.75;
    const annots = links.map((l, i) => {
      if (!/^https:\/\/[A-Za-z0-9._~:\/?#=&%-]+$/.test(l.url)) throw new Error('Unsafe link.');
      const x1 = l.x * k, x2 = (l.x + l.w) * k, y1 = H - (l.y + l.h) * k, y2 = H - l.y * k;
      return '<< /Type /Annot /Subtype /Link /Rect [' + [x1, y1, x2, y2].map(n => n.toFixed(2)).join(' ') + '] /Border [0 0 0] /A << /S /URI /URI (' + l.url + ') >> >>';
    });
    const objs = [
      enc('<< /Type /Catalog /Pages 2 0 R >>'),
      enc('<< /Type /Pages /Kids [3 0 R] /Count 1 >>'),
      enc('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + W + ' ' + H + '] /Contents 4 0 R /Resources << /XObject << /Im0 5 0 R >> >> /Annots [' + annots.map((_, i) => (6 + i) + ' 0 R').join(' ') + '] >>'),
      enc('<< /Length ' + ('q ' + W + ' 0 0 ' + H + ' 0 0 cm /Im0 Do Q').length + ' >>\nstream\nq ' + W + ' 0 0 ' + H + ' 0 0 cm /Im0 Do Q\nendstream'),
      null, // image, assembled below
      ...annots.map(enc)
    ];
    const imgHead = enc('<< /Type /XObject /Subtype /Image /Width ' + w + ' /Height ' + h + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + jpeg.length + ' >>\nstream\n');
    const imgTail = enc('\nendstream');
    const imgObj = new Uint8Array(imgHead.length + jpeg.length + imgTail.length);
    imgObj.set(imgHead, 0); imgObj.set(jpeg, imgHead.length); imgObj.set(imgTail, imgHead.length + jpeg.length);
    objs[4] = imgObj;
    const parts = [enc('%PDF-1.4\n')], offsets = []; let pos = parts[0].length;
    objs.forEach((o, i) => {
      offsets.push(pos);
      const a = enc((i + 1) + ' 0 obj\n'), b = enc('\nendobj\n');
      parts.push(a, o, b); pos += a.length + o.length + b.length;
    });
    const xref = 'xref\n0 ' + (objs.length + 1) + '\n0000000000 65535 f \n' + offsets.map(o => String(o).padStart(10, '0') + ' 00000 n \n').join('') +
      'trailer\n<< /Size ' + (objs.length + 1) + ' /Root 1 0 R >>\nstartxref\n' + pos + '\n%%EOF\n';
    parts.push(enc(xref));
    let total = 0; for (const p of parts) total += p.length;
    const out = new Uint8Array(total); let p = 0;
    for (const c of parts) { out.set(c, p); p += c.length; }
    return out;
  }

  /* ---------- card drawing (browser only) ---------- */
  const CARD = { w: 720, h: 1000, btn: { x: 200, y: 668, w: 320, h: 64 }, qr: { x: 130, y: 130, s: 460 } };
  function wrap(ctx, text, max) {
    const words = text.split(' '), lines = []; let line = '';
    for (const w of words) { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > max && line) { lines.push(line); line = w; } else line = t; }
    if (line) lines.push(line);
    return lines;
  }
  /** Returns a Promise<HTMLCanvasElement> with the full card (QR, code, button, best wishes, validity). */
  function drawCard(c, expiresIso, qrSvgString) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const cv = document.createElement('canvas'); cv.width = CARD.w; cv.height = CARD.h;
        const x = cv.getContext('2d');
        x.fillStyle = '#fff'; x.fillRect(0, 0, CARD.w, CARD.h);
        x.strokeStyle = '#8a3fd1'; x.lineWidth = 3; x.setLineDash([12, 8]); x.strokeRect(16, 16, CARD.w - 32, CARD.h - 32); x.setLineDash([]);
        x.textAlign = 'center';
        x.fillStyle = '#C4302B'; x.font = 'bold 44px Arial'; x.fillText('RoamWise', 360, 80);
        x.fillStyle = '#0f8f72'; x.font = 'bold 26px Arial'; x.fillText('Founder Pro for life', 360, 116);
        x.imageSmoothingEnabled = false; x.drawImage(img, CARD.qr.x, CARD.qr.y, CARD.qr.s, CARD.qr.s);
        x.fillStyle = '#1a1530'; x.font = 'bold 26px monospace'; x.fillText(c.code, 360, 640);
        x.fillStyle = '#6d2fd1'; x.beginPath();
        if (x.roundRect) x.roundRect(CARD.btn.x, CARD.btn.y, CARD.btn.w, CARD.btn.h, 14); else x.rect(CARD.btn.x, CARD.btn.y, CARD.btn.w, CARD.btn.h);
        x.fill();
        x.fillStyle = '#fff'; x.font = 'bold 28px Arial'; x.fillText('Tap to redeem', 360, 710);
        x.fillStyle = '#4a4560'; x.font = '22px Arial';
        x.fillText('Scan or tap, sign in with Google, then redeem.', 360, 768);
        x.fillStyle = '#8a3fd1'; x.font = 'bold 24px Arial'; x.fillText('A gift for the builders of Startup Garage 2026', 360, 818);
        x.font = '22px Arial';
        let y = 852; for (const l of wrap(x, 'With thanks to E-Cell and SBM NMIMS. Wishing you big ideas and bigger journeys. — Mohit and team RoamWise', 600)) { x.fillText(l, 360, y); y += 30; }
        x.fillStyle = '#6a5f80'; x.font = '19px Arial';
        x.fillText('#' + c.serial + ' · ' + (c.role === 'organiser' ? 'Organiser' : 'Student / audience') + ' · one use · valid until ' + expiresIso, 360, 950);
        resolve(cv);
      };
      img.onerror = () => reject(new Error('Could not draw a QR.'));
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(qrSvgString);
    });
  }
  const blobBytes = (cv, type, quality) => new Promise((res, rej) => cv.toBlob(b => b ? b.arrayBuffer().then(a => res(new Uint8Array(a))) : rej(new Error('Image export failed.')), type, quality));
  /** kind: 'png' | 'pdf'. onProgress(done,total). Returns Uint8Array zip. Cards are drawn one at a time to keep memory low. */
  async function buildZip(list, expiresIso, qrSvg, kind, onProgress) {
    const files = [];
    for (let i = 0; i < list.length; i++) {
      const c = list[i], cv = await drawCard(c, expiresIso, qrSvg(LINK(c.code)));
      if (kind === 'png') files.push({ name: fileStem(c) + '.png', data: await blobBytes(cv, 'image/png') });
      else {
        const jpeg = await blobBytes(cv, 'image/jpeg', 0.92), url = LINK(c.code);
        files.push({ name: fileStem(c) + '.pdf', data: pdfFromJpeg(jpeg, CARD.w, CARD.h, [{ x: CARD.btn.x, y: CARD.btn.y, w: CARD.btn.w, h: CARD.btn.h, url }, { x: CARD.qr.x, y: CARD.qr.y, w: CARD.qr.s, h: CARD.qr.s, url }]) });
      }
      if (onProgress) onProgress(i + 1, list.length);
      if (i % 10 === 9) await new Promise(r => setTimeout(r, 0));
    }
    return zip(files);
  }
  return { LINK, fileStem, message, trackerCsv, crc32, zip, pdfFromJpeg, drawCard, buildZip, CARD };
});
