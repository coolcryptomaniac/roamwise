/* RoamWise Agent — daily ops. Runs in GitHub Actions. No secrets are ever printed. */
const fs = require('fs');
const BASE = 'https://www.roamwise.co.in';
const IST = () => new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

async function check(url, mustContain) {
  const t0 = Date.now();
  try {
    const r = await fetch(url, { redirect: 'follow' });
    const txt = await r.text();
    const ok = r.status === 200 && (!mustContain || txt.toLowerCase().includes(mustContain.toLowerCase()));
    return { url, ok, status: r.status, ms: Date.now() - t0, kb: Math.round(txt.length / 1024) };
  } catch (e) {
    return { url, ok: false, status: 'ERR', ms: Date.now() - t0, kb: 0, err: String(e.message || e).slice(0, 80) };
  }
}

function bar(v, max) {
  const w = Math.max(1, Math.round((v / Math.max(1, max)) * 20));
  return '█'.repeat(w) + '░'.repeat(20 - w);
}

(async () => {
  const L = [];
  L.push(`# 🥷 RoamWise Daily Report`);
  L.push(`*${IST()} IST · generated automatically by your GitHub agent*`);
  L.push('');

  /* ---------- 1. HEALTH ---------- */
  const checks = await Promise.all([
    check(BASE + '/', 'RoamWise'),
    check(BASE + '/privacy.html', 'privacy'),
    check(BASE + '/sitemap.xml', '<urlset'),
    check(BASE + '/guides/', 'Crowd-Smart'),
    check(BASE + '/blog/', 'RoamWise Blog'),
  ]);
  const down = !checks[0].ok;
  if (down) fs.writeFileSync('DOWN', '1');
  L.push('## 🩺 Site health');
  L.push('| Page | Status | Speed | Size |');
  L.push('|---|---|---|---|');
  checks.forEach(c => L.push(`| ${c.url.replace(BASE, '') || '/'} | ${c.ok ? '✅ 200' : '🔴 ' + c.status} | ${c.ms}ms | ${c.kb}KB |`));
  if (down) L.push(`\n> 🔴 **THE SITE IS DOWN.** Check GitHub Pages: repo → Settings → Pages. If GitHub shows an outage, wait; otherwise re-save the Pages setting.`);
  L.push('');

  /* ---------- 2. FUNNEL (needs FIREBASE_SERVICE_ACCOUNT secret) ---------- */
  let hadStats = false;
  const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (sa) {
    try {
      const admin = require('firebase-admin');
      admin.initializeApp({ credential: admin.credential.cert(JSON.parse(sa)) });
      const db = admin.firestore();

      const days = [...Array(7)].map((_, i) => new Date(Date.now() - i * 864e5).toISOString().slice(0, 10));
      const snaps = await Promise.all(days.map(d => db.collection('stats').doc(d).get()));
      const sum = k => snaps.reduce((t, s) => t + ((s.exists && s.data()[k]) || 0), 0);
      const today = snaps[0].exists ? snaps[0].data() : {};

      const steps = [['visits', 'Visits'], ['searches', 'Searches'], ['signups', 'Sign-ups'], ['pay_opens', 'Pay opens'], ['utr_submits', 'UTRs'], ['event_plans', 'Event plans'], ['pdf_opens', 'PDF opens'], ['pdf_generated', 'PDFs made']];
      const max = Math.max(1, sum('visits'));
      L.push('## 📈 7-day funnel');
      L.push('```');
      steps.forEach(([k, l]) => L.push(`${l.padEnd(12)} ${bar(sum(k), max)} ${sum(k)}   (today: ${today[k] || 0})`));
      L.push('```');

      const v = sum('visits');
      const diag = v === 0
        ? '💡 **Zero visits — a traffic problem, not a product problem.** Fire the admin Marketing-tab posts today.'
        : sum('signups') === 0
          ? '💡 Visitors but no sign-ups — push the Journey Card and Pro moments (both need accounts).'
          : sum('utr_submits') === 0
            ? '💡 Sign-ups but no payment attempts — the nudge and launch-price line should convert; check pay_opens.'
            : '✅ Funnel flowing — scale the top: more posts, more Reels.';
      L.push(`\n${diag}\n`);

      const [usersC, proC, pendC] = await Promise.all([
        db.collection('users').count().get(),
        db.collection('users').where('pro', '==', true).count().get(),
        db.collection('claims').where('status', '==', 'pending').count().get(),
      ]);
      L.push('## 👥 Accounts & money');
      L.push(`- Users: **${usersC.data().count}** · Pro: **${proC.data().count}** · Pending claims: **${pendC.data().count}**${pendC.data().count ? ' ⚠️ approve them in the admin console!' : ''}`);

      const reqs = await db.collection('requests').orderBy('created', 'desc').limit(5).get();
      if (!reqs.empty) {
        L.push('\n## 💡 Latest user ideas');
        reqs.docs.forEach(d => L.push(`- "${(d.data().text || '').slice(0, 120)}"`));
      }
      hadStats = true;
    } catch (e) {
      L.push(`## 📈 Funnel\n> ⚠️ Stats unavailable: ${String(e.message || e).slice(0, 120)} — check the FIREBASE_SERVICE_ACCOUNT secret.\n`);
    }
  } else {
    L.push('## 📈 Funnel\n> Add the `FIREBASE_SERVICE_ACCOUNT` secret to unlock the visitor funnel, revenue and user-ideas digest here (SETUP.md, step 3).\n');
  }

  /* ---------- 3. HANDOFF TO CLAUDE ---------- */
  L.push('## 🤝 Monday move — paste this to Claude');
  L.push('```');
  L.push(`RoamWise weekly loop. Health: ${down ? 'SITE DOWN' : 'all green'}.`);
  L.push(hadStats ? 'Funnel + ideas above — pick the highest-impact improvement, implement it in index.html, and build the new APK + AAB.' : 'No stats yet — focus: traffic. Draft this week\'s 3 Reels scripts + 1 Reddit post from the Marketing playbook.');
  L.push('```');
  L.push('');
  L.push(`*Agent v1 · runs daily 09:00 IST + weekly SEO refresh Sundays · revoke anytime: repo → Settings → Secrets*`);

  fs.writeFileSync('report.md', L.join('\n'));
  console.log((down ? '🔴 DOWN' : '✅ healthy') + ' · report.md written' + (hadStats ? ' · stats included' : ' · health-only'));
})();
