/* RoamWise Work — the intern and employee portal backend (D1: team_* tables, migration 0002).
 *
 * Members sign in with Google (Firebase ID token). Everything about a person lives in one place:
 * application -> offer -> onboarding (offer, NDA and policy acceptance, UPI) -> active (tasks, daily log,
 * stipend and bonus records, documents and certificates) -> exit (notice, last day) -> alumni.
 *
 * Members only ever read their own record and can only write: their application, acceptances,
 * UPI, daily log, task completion and exit request. Pay, status, role and documents are founder-only.
 *
 *   GET  /team/me                      own profile, pay, docs, tasks, recent logs, timeline (404 = not on the team yet)
 *   POST /team/apply                   { name, phone, college, track, kind, note }
 *   POST /team/accept                  { what: offer | nda | policy }
 *   POST /team/upi                     { upi }
 *   POST /team/log                     { day: YYYY-MM-DD, hours, summary }
 *   POST /team/task                    { id }  (mark done)
 *   POST /team/exit                    { reason, lastDay }
 *   GET  /team/admin/list              founder: every member with counts
 *   POST /team/admin/invite            founder: { email, name, kind, track, role_title, stipend_monthly, start_date, end_date }
 *   POST /team/admin/update            founder: { id, ...fields }
 *   POST /team/admin/pay               founder: { id?, member_id, kind, period, amount, status, utr, note }
 *   POST /team/admin/doc               founder: { member_id, kind, title, url }
 *   POST /team/admin/task              founder: { member_id, title, detail, due }
 */
import { json } from '../lib/http.js';
import { verifyFirebaseIdToken } from '../lib/firebase-verify.js';
import { sendMail } from '../lib/mailer.js';

const FIREBASE_PROJECT = 'roamwisepro';
const FOUNDER = 'founder@roamwise.co.in';
const TRACKS = ['finance', 'marketing', 'ops', 'partnerships', 'content', 'design', 'engineering', 'general'];
const STATUSES = ['applied', 'offered', 'onboarding', 'active', 'exiting', 'alumni', 'declined'];
const ADMIN_FIELDS = ['name', 'phone', 'college', 'kind', 'track', 'role_title', 'status', 'start_date', 'end_date',
  'stipend_monthly', 'stipend_note', 'manager', 'note', 'last_day', 'exit_reason'];
const day = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || '')) ? String(s) : null;
const str = (v, n = 200) => String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);
const rid = () => crypto.randomUUID().replace(/-/g, '').slice(0, 16);

async function body(request) { try { return await request.json(); } catch (e) { return {}; } }

async function who(request, deps) {
  const m = /^Bearer\s+(.+)$/i.exec(request.headers.get('authorization') || '');
  if (!m) return null;
  try {
    const c = await (deps.verifyIdToken || verifyFirebaseIdToken)(m[1], FIREBASE_PROJECT);
    if (!c || !c.email || c.email_verified === false) return null;
    return { uid: c.uid || c.user_id || c.sub, email: String(c.email).toLowerCase(), name: c.name || '' };
  } catch (e) { return null; }
}

async function event(db, memberId, what) { await db.prepare('INSERT INTO team_events (member_id, what) VALUES (?, ?)').bind(memberId, str(what, 300)).run(); }

/* The caller's member row. A row invited by email gets its uid the first time that Google account signs in. */
async function memberFor(db, me) {
  let row = await db.prepare('SELECT * FROM team_members WHERE uid = ?').bind(me.uid).first();
  if (row) return row;
  row = await db.prepare('SELECT * FROM team_members WHERE email = ? AND uid IS NULL').bind(me.email).first();
  if (row) { await db.prepare("UPDATE team_members SET uid = ?, updated_at = datetime('now') WHERE id = ?").bind(me.uid, row.id).run(); row.uid = me.uid; await event(db, row.id, 'Signed in for the first time'); }
  return row || null;
}

async function profile(db, m) {
  const q = (sql) => db.prepare(sql).bind(m.id).all().then((r) => r.results || []);
  const [pay, docs, tasks, logs, events] = await Promise.all([
    q('SELECT id, kind, period, amount, status, utr, note, created_at, paid_at FROM team_pay WHERE member_id = ? ORDER BY created_at DESC'),
    q('SELECT id, kind, title, url, issued_at FROM team_docs WHERE member_id = ? ORDER BY issued_at DESC'),
    q("SELECT id, title, detail, due, status, done_at FROM team_tasks WHERE member_id = ? ORDER BY status = 'done', due"),
    q('SELECT day, hours, summary FROM team_logs WHERE member_id = ? ORDER BY day DESC LIMIT 30'),
    q('SELECT what, at FROM team_events WHERE member_id = ? ORDER BY at DESC LIMIT 40'),
  ]);
  const { note, ...member } = m;
  const paid = pay.filter((p) => p.status === 'paid').reduce((t, p) => t + p.amount, 0);
  const due = pay.filter((p) => p.status !== 'paid').reduce((t, p) => t + p.amount, 0);
  return { member, pay, docs, tasks, logs, events, totals: { paid, due } };
}

export async function handleTeam(request, env, path, deps = {}) {
  const db = env.DB;
  if (!db) return json({ error: 'not_configured', message: 'Team records are not connected yet.' }, 503);
  const isGet = request.method === 'GET';

  if (path.startsWith('team/admin/')) {
    if (!(deps.isAdmin && await deps.isAdmin(request, env))) return json({ error: 'forbidden' }, 403);
    return admin(request, env, db, path.slice(11), deps);
  }

  const me = await who(request, deps);
  if (!me) return json({ error: 'unauthorized', message: 'Sign in with Google first.' }, 401);
  const m = await memberFor(db, me);

  if (path === 'team/me' && isGet) {
    if (!m) return json({ error: 'not_member', email: me.email }, 404);
    return json(await profile(db, m));
  }
  if (path === 'team/apply' && !isGet) {
    if (m) return json({ error: 'already_member', status: m.status }, 409);
    const b = await body(request), name = str(b.name, 80) || str(me.name, 80);
    if (!name) return json({ error: 'name_required' }, 400);
    const id = rid(), track = TRACKS.includes(b.track) ? b.track : 'general', kind = b.kind === 'employee' ? 'employee' : 'intern';
    await db.prepare('INSERT INTO team_members (id, uid, email, name, phone, college, kind, track, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(id, me.uid, me.email, name, str(b.phone, 20), str(b.college, 120), kind, track, str(b.note, 600)).run();
    await event(db, id, 'Applied (' + kind + ', ' + track + ')');
    try { await (deps.sendMail || sendMail)(env, { to: FOUNDER, subject: 'RoamWise Work: new ' + kind + ' application from ' + name, text: name + ' (' + me.email + ') applied for ' + track + '.\nCollege: ' + str(b.college, 120) + '\nNote: ' + str(b.note, 600) + '\n\nReview at https://roamwise.co.in/work/?admin=1' }); } catch (e) { /* email best-effort */ }
    return json(await profile(db, await db.prepare('SELECT * FROM team_members WHERE id = ?').bind(id).first()));
  }
  if (!m) return json({ error: 'not_member' }, 404);
  const b = isGet ? {} : await body(request);

  if (path === 'team/accept') {
    const col = { offer: 'offer_accepted_at', nda: 'nda_accepted_at', policy: 'policy_accepted_at' }[b.what];
    if (!col) return json({ error: 'bad_request' }, 400);
    if (b.what === 'offer' && m.status !== 'offered') return json({ error: 'no_open_offer' }, 409);
    await db.prepare('UPDATE team_members SET ' + col + " = datetime('now'), updated_at = datetime('now') WHERE id = ?").bind(m.id).run();
    if (b.what === 'offer') await db.prepare("UPDATE team_members SET status = 'onboarding' WHERE id = ?").bind(m.id).run();
    const fresh = await db.prepare('SELECT * FROM team_members WHERE id = ?').bind(m.id).first();
    if (fresh.status === 'onboarding' && fresh.offer_accepted_at && fresh.nda_accepted_at && fresh.policy_accepted_at && fresh.upi)
      await db.prepare("UPDATE team_members SET status = 'active' WHERE id = ?").bind(m.id).run();
    await event(db, m.id, 'Accepted the ' + ({ offer: 'offer letter', nda: 'confidentiality agreement', policy: 'team policy' }[b.what]));
  } else if (path === 'team/upi') {
    const upi = str(b.upi, 60);
    if (!/^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{2,}$/.test(upi)) return json({ error: 'bad_upi', message: 'Enter a UPI ID like name@bank.' }, 400);
    await db.prepare("UPDATE team_members SET upi = ?, updated_at = datetime('now') WHERE id = ?").bind(upi, m.id).run();
    const fresh = await db.prepare('SELECT * FROM team_members WHERE id = ?').bind(m.id).first();
    if (fresh.status === 'onboarding' && fresh.offer_accepted_at && fresh.nda_accepted_at && fresh.policy_accepted_at)
      await db.prepare("UPDATE team_members SET status = 'active' WHERE id = ?").bind(m.id).run();
    await event(db, m.id, 'Updated payout UPI ID');
  } else if (path === 'team/log') {
    const d = day(b.day), summary = str(b.summary, 1500), hours = Math.max(0, Math.min(16, Number(b.hours) || 0));
    if (!d || !summary) return json({ error: 'bad_request', message: 'Add a date and what you did.' }, 400);
    if (!['active', 'onboarding', 'exiting'].includes(m.status)) return json({ error: 'not_active' }, 409);
    await db.prepare('INSERT OR REPLACE INTO team_logs (member_id, day, hours, summary) VALUES (?, ?, ?, ?)').bind(m.id, d, hours, summary).run();
  } else if (path === 'team/task') {
    const r = await db.prepare("UPDATE team_tasks SET status = 'done', done_at = datetime('now') WHERE id = ? AND member_id = ? AND status = 'open'").bind(str(b.id, 40), m.id).run();
    if (!(r.meta && r.meta.changes)) return json({ error: 'not_found' }, 404);
    const t = await db.prepare('SELECT title FROM team_tasks WHERE id = ?').bind(str(b.id, 40)).first();
    await event(db, m.id, 'Completed task: ' + (t ? t.title : ''));
  } else if (path === 'team/exit') {
    if (!['active', 'onboarding'].includes(m.status)) return json({ error: 'not_active' }, 409);
    const last = day(b.lastDay);
    if (!last) return json({ error: 'bad_request', message: 'Choose your last working day.' }, 400);
    await db.prepare("UPDATE team_members SET status = 'exiting', exit_reason = ?, last_day = ?, updated_at = datetime('now') WHERE id = ?").bind(str(b.reason, 600), last, m.id).run();
    await event(db, m.id, 'Started exit; last day ' + last);
    try { await (deps.sendMail || sendMail)(env, { to: FOUNDER, subject: 'RoamWise Work: ' + m.name + ' started their exit', text: m.name + ' set their last day as ' + last + '.\nReason: ' + str(b.reason, 600) }); } catch (e) { /* best-effort */ }
  } else return json({ error: 'not_found' }, 404);

  return json(await profile(db, await db.prepare('SELECT * FROM team_members WHERE id = ?').bind(m.id).first()));
}

async function admin(request, env, db, action, deps) {
  if (action === 'list') {
    const r = await db.prepare(`SELECT m.*, (SELECT COUNT(*) FROM team_tasks t WHERE t.member_id = m.id AND t.status = 'open') AS open_tasks,
      (SELECT COALESCE(SUM(amount),0) FROM team_pay p WHERE p.member_id = m.id AND p.status != 'paid') AS pay_due,
      (SELECT MAX(day) FROM team_logs l WHERE l.member_id = m.id) AS last_log
      FROM team_members m ORDER BY CASE m.status WHEN 'applied' THEN 0 WHEN 'exiting' THEN 1 WHEN 'onboarding' THEN 2 WHEN 'offered' THEN 3 WHEN 'active' THEN 4 ELSE 5 END, m.name`).all();
    return json({ members: r.results || [] });
  }
  const b = await body(request);
  if (action === 'invite') {
    const email = str(b.email, 120).toLowerCase(), name = str(b.name, 80);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !name) return json({ error: 'bad_request', message: 'Name and a Google email are required.' }, 400);
    if (await db.prepare('SELECT id FROM team_members WHERE email = ?').bind(email).first()) return json({ error: 'exists' }, 409);
    const id = rid();
    await db.prepare(`INSERT INTO team_members (id, email, name, kind, track, role_title, status, stipend_monthly, start_date, end_date)
      VALUES (?, ?, ?, ?, ?, ?, 'offered', ?, ?, ?)`).bind(id, email, name, b.kind === 'employee' ? 'employee' : 'intern',
      TRACKS.includes(b.track) ? b.track : 'general', str(b.role_title, 80), Number.isFinite(+b.stipend_monthly) && b.stipend_monthly !== '' ? Math.round(+b.stipend_monthly) : null,
      day(b.start_date), day(b.end_date)).run();
    await event(db, id, 'Offer created' + (b.role_title ? ': ' + str(b.role_title, 80) : ''));
    return json({ ok: true, id, link: 'https://roamwise.co.in/work/' });
  }
  const id = str(b.id || b.member_id, 40);
  if (!await db.prepare('SELECT id FROM team_members WHERE id = ?').bind(id).first()) return json({ error: 'not_found' }, 404);
  if (action === 'update') {
    const sets = [], vals = [];
    for (const k of ADMIN_FIELDS) if (k in b) {
      let v = b[k];
      if (k === 'status' && !STATUSES.includes(v)) return json({ error: 'bad_status' }, 400);
      if (k === 'track' && !TRACKS.includes(v)) return json({ error: 'bad_track' }, 400);
      if (k === 'stipend_monthly') v = v === '' || v == null ? null : Math.round(+v);
      else if (/_date$|last_day/.test(k)) v = day(v);
      else v = str(v, 600);
      sets.push(k + ' = ?'); vals.push(v);
    }
    if (!sets.length) return json({ error: 'nothing_to_update' }, 400);
    await db.prepare('UPDATE team_members SET ' + sets.join(', ') + ", updated_at = datetime('now') WHERE id = ?").bind(...vals, id).run();
    await event(db, id, 'Updated by founder: ' + Object.keys(b).filter((k) => ADMIN_FIELDS.includes(k)).join(', '));
  } else if (action === 'pay') {
    const amount = Math.round(+b.amount), kind = ['stipend', 'bonus', 'incentive', 'reimbursement'].includes(b.kind) ? b.kind : null;
    if (!kind || !(amount > 0)) return json({ error: 'bad_request' }, 400);
    const pid = str(b.pay_id, 40) || rid(), status = b.status === 'paid' ? 'paid' : 'due';
    await db.prepare(`INSERT INTO team_pay (id, member_id, kind, period, amount, status, utr, note, paid_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET kind = excluded.kind, period = excluded.period, amount = excluded.amount, status = excluded.status, utr = excluded.utr, note = excluded.note, paid_at = excluded.paid_at`)
      .bind(pid, id, kind, str(b.period, 20), amount, status, str(b.utr, 40), str(b.note, 200), status === 'paid' ? new Date().toISOString() : null).run();
    await event(db, id, (status === 'paid' ? 'Paid ' : 'Added ') + kind + ' Rs ' + amount + (b.period ? ' for ' + str(b.period, 20) : ''));
  } else if (action === 'doc') {
    const url = str(b.url, 500), title = str(b.title, 120), kind = ['offer', 'certificate', 'experience', 'relieving', 'other'].includes(b.kind) ? b.kind : 'other';
    if (!/^https:\/\//.test(url) || !title) return json({ error: 'bad_request', message: 'Title and an https link are required.' }, 400);
    await db.prepare('INSERT INTO team_docs (id, member_id, kind, title, url) VALUES (?, ?, ?, ?, ?)').bind(rid(), id, kind, title, url).run();
    await event(db, id, 'Document added: ' + title);
  } else if (action === 'task') {
    const title = str(b.title, 160);
    if (!title) return json({ error: 'bad_request' }, 400);
    await db.prepare('INSERT INTO team_tasks (id, member_id, title, detail, due) VALUES (?, ?, ?, ?, ?)').bind(rid(), id, title, str(b.detail, 1000), day(b.due)).run();
    await event(db, id, 'New task: ' + title);
  } else return json({ error: 'not_found' }, 404);
  return json(await profile(db, await db.prepare('SELECT * FROM team_members WHERE id = ?').bind(id).first()));
}

export const _test = { TRACKS, STATUSES };
