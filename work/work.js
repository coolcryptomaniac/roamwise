/* RoamWise Work — team portal. Google sign-in (Firebase) + the Worker's /team/* API (D1).
   Every value from the server is set with textContent, never innerHTML. */
(function () {
  'use strict';
  var API = 'https://roamwise-api.founder-f53.workers.dev';
  var FB = { apiKey: 'AIzaSyDlrtpzpOb1VEmVSd9tHmu7OpmvwWosYsU', authDomain: 'roamwisepro.firebaseapp.com', projectId: 'roamwisepro', appId: '1:299014744987:web:d5c316743e6d7a10904f3e' };
  var TRACKS = { finance: 'Finance & Strategy', marketing: 'Marketing & Growth', ops: 'Operations', partnerships: 'Partnerships & B2B', content: 'Content & Creators', design: 'Design', engineering: 'Engineering', general: 'General' };
  var STEPS = ['applied', 'offered', 'onboarding', 'active', 'exiting', 'alumni'];
  var STEP_LABEL = { applied: 'Applied', offered: 'Offer', onboarding: 'Onboarding', active: 'Active', exiting: 'Exit', alumni: 'Alumni', declined: 'Closed' };
  var app, user, data, tab = 'today', isAdminView = /[?&]admin=1/.test(location.search);

  function h(tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k]; if (v == null || v === false) return;
      if (k === 'text') el.textContent = v; else if (k === 'on') Object.keys(v).forEach(function (e) { el.addEventListener(e, v[e]); });
      else if (k === 'class') el.className = v; else el.setAttribute(k, v === true ? '' : v);
    });
    for (var i = 2; i < arguments.length; i++) { var c = arguments[i]; if (c == null || c === false) continue; (Array.isArray(c) ? c : [c]).forEach(function (x) { if (x != null && x !== false) el.appendChild(typeof x === 'string' ? document.createTextNode(x) : x); }); }
    return el;
  }
  function toast(msg) { var t = h('div', { class: 'toast', role: 'status', text: msg }); document.body.appendChild(t); setTimeout(function () { t.remove(); }, 2600); }
  function money(n) { return '₹' + Number(n || 0).toLocaleString('en-IN'); }
  function date(s) { if (!s) return '—'; var d = new Date(String(s).replace(' ', 'T') + (/Z|T\d\d:\d\d:\d\d\.\d+Z$/.test(s) || s.length <= 10 ? '' : 'Z')); return isNaN(d) ? s : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
  function todayIST() { return new Date(Date.now() + 19800000).toISOString().slice(0, 10); }
  function render() { app.replaceChildren.apply(app, [].slice.call(arguments)); }

  async function call(path, body) {
    var token = await user.getIdToken();
    var r = await fetch(API + path, { method: body ? 'POST' : 'GET', headers: Object.assign({ authorization: 'Bearer ' + token }, body ? { 'content-type': 'application/json' } : {}), body: body ? JSON.stringify(body) : undefined });
    var j = {}; try { j = await r.json(); } catch (e) { /* empty */ }
    if (!r.ok) { var err = new Error(j.message || j.error || ('HTTP ' + r.status)); err.status = r.status; err.code = j.error; throw err; }
    return j;
  }
  async function act(path, body, ok) {
    try { data = await call(path, body); if (ok) toast(ok); dashboard(); } catch (e) { toast(e.message); }
  }

  /* ---------- screens ---------- */
  function signInScreen() {
    render(h('section', { class: 'card hero' },
      h('p', { class: 'eyebrow', text: 'Team portal' }),
      h('h1', null, 'Your work at ', h('em', { text: 'RoamWise' })),
      h('p', { class: 'muted', text: 'Offer, onboarding, tasks, daily log, stipend, bonus, certificates and exit, all in one place.' }),
      h('button', { class: 'google', on: { click: signIn } }, h('img', { src: 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg', alt: '', width: 20, height: 20 }), 'Continue with Google'),
      h('p', { class: 'small', text: 'Use the Google account your offer was sent to. New here? Sign in and apply.' })));
  }
  function signIn() {
    var p = new firebase.auth.GoogleAuthProvider(); p.setCustomParameters({ prompt: 'select_account' });
    firebase.auth().signInWithPopup(p).catch(function (e) { if (e && /popup/.test(e.code || '')) firebase.auth().signInWithRedirect(p); else toast('Sign-in failed. Try again.'); });
  }
  function applyScreen() {
    var f = {};
    function field(name, label, el) { f[name] = el; return h('label', null, label, el); }
    var track = h('select', null, Object.keys(TRACKS).map(function (k) { return h('option', { value: k, text: TRACKS[k] }); }));
    var kind = h('select', null, h('option', { value: 'intern', text: 'Internship' }), h('option', { value: 'employee', text: 'Full-time role' }));
    render(h('section', { class: 'card' },
      h('p', { class: 'eyebrow', text: 'Join the team' }),
      h('h2', { text: 'Apply to RoamWise' }),
      h('p', { class: 'muted', text: 'Signed in as ' + user.email + '. If you already have an offer, sign out and use the email it was sent to.' }),
      h('div', { class: 'grid' },
        h('div', { class: 'two' }, field('name', 'Full name', h('input', { value: user.displayName || '', autocomplete: 'name' })), field('phone', 'Phone (WhatsApp)', h('input', { inputmode: 'tel', autocomplete: 'tel' }))),
        h('div', { class: 'two' }, field('college', 'College / current company', h('input')), h('div', { class: 'two' }, field('kind', 'Type', kind), field('track', 'Area', track))),
        field('note', 'Why RoamWise, and what you would like to work on', h('textarea')),
        h('button', { class: 'primary', on: { click: async function () {
          this.disabled = true;
          await act('/team/apply', { name: f.name.value, phone: f.phone.value, college: f.college.value, kind: f.kind.value, track: f.track.value, note: f.note.value }, 'Application sent. We will reply by email.');
        } } }, 'Send application'))));
  }

  function steps(status) {
    var i = STEPS.indexOf(status);
    return h('div', { class: 'steps', role: 'list', 'aria-label': 'Your journey' }, STEPS.map(function (s, k) { return h('span', { role: 'listitem', class: k === i ? 'on' : (k < i ? 'past' : ''), text: STEP_LABEL[s] }); }));
  }
  function header(m) {
    return h('section', { class: 'card' },
      h('div', { class: 'who' }, h('div', { class: 'avatar', text: (m.name || '?').trim().charAt(0).toUpperCase() }),
        h('div', null, h('h2', { style: 'margin:0', text: m.name }), h('p', { class: 'muted', style: 'margin:2px 0 0', text: (m.role_title || TRACKS[m.track] || '') + ' · ' + (m.kind === 'employee' ? 'Employee' : 'Intern') }),
          h('div', { class: 'row', style: 'margin-top:6px' }, h('span', { class: 'chip ' + m.status, text: STEP_LABEL[m.status] || m.status }), m.start_date ? h('span', { class: 'small', text: date(m.start_date) + (m.end_date ? ' → ' + date(m.end_date) : '') }) : null))),
      h('div', { style: 'margin-top:14px' }, steps(m.status)));
  }

  function offerCard(m) {
    return h('section', { class: 'card' },
      h('p', { class: 'eyebrow', text: 'Your offer' }),
      h('h2', { text: (m.role_title || TRACKS[m.track]) + ' at RoamWise' }),
      h('div', { class: 'list' },
        h('div', { class: 'item' }, h('span', { text: 'Type' }), h('b', { text: m.kind === 'employee' ? 'Full-time' : 'Internship' })),
        h('div', { class: 'item' }, h('span', { text: 'Area' }), h('b', { text: TRACKS[m.track] })),
        h('div', { class: 'item' }, h('span', { text: 'Dates' }), h('b', { text: m.start_date ? date(m.start_date) + (m.end_date ? ' → ' + date(m.end_date) : '') : 'To be agreed' })),
        h('div', { class: 'item' }, h('span', { text: m.kind === 'employee' ? 'Salary (monthly)' : 'Stipend (monthly)' }), h('b', { text: m.stipend_monthly ? money(m.stipend_monthly) : (m.stipend_note || 'Unpaid / performance-linked') }))),
      h('p', { class: 'small', text: 'Flexible hours and remote work. A certificate is issued on successful completion. You can continue your studies alongside.' }),
      h('div', { class: 'row' }, h('button', { class: 'primary', on: { click: function () { act('/team/accept', { what: 'offer' }, 'Offer accepted. Welcome aboard!'); } } }, 'Accept offer')));
  }

  var TERMS = {
    nda: ['Confidentiality agreement', 'Keep RoamWise business information private: partner and supplier rates, margins, guest and customer details, unreleased plans, code and passwords. Use them only for your RoamWise work, never share them outside the team or on social media, and return or delete them when you leave. This continues after your time at RoamWise.'],
    policy: ['Team policy', 'Flexible hours; add a short daily log on days you work. Be honest about what you did. Treat guests, partners and teammates with respect. Never promise prices, payments or commissions to partners unless the founder has agreed them in writing. Stipend, bonus and incentives are paid by UPI against the records shown here. Either side can end the internship with notice through this portal.']
  };
  function onboarding(m) {
    var upi = h('input', { value: m.upi || '', placeholder: 'yourname@bank', autocomplete: 'off' });
    function step(done, title, body) { return h('div', { class: 'check' + (done ? ' ok' : '') }, h('span', { class: 'tick', text: done ? '✓' : '' }), h('div', { class: 'grow' }, h('b', { text: title }), body)); }
    function term(key, done) {
      return step(done, TERMS[key][0], h('div', null, h('details', { class: 'terms' }, h('summary', { text: 'Read' }), h('p', { text: TERMS[key][1] })),
        done ? h('p', { class: 'small', text: 'Accepted ' + date(m[key + '_accepted_at']) }) : h('button', { style: 'margin-top:8px', on: { click: function () { act('/team/accept', { what: key }, 'Accepted'); } } }, 'I agree')));
    }
    return h('section', { class: 'card' },
      h('p', { class: 'eyebrow', text: 'Onboarding' }), h('h2', { text: 'Four steps to get started' }),
      h('div', { class: 'list' },
        step(!!m.offer_accepted_at, 'Offer accepted', h('p', { class: 'small', text: m.offer_accepted_at ? date(m.offer_accepted_at) : 'Waiting' })),
        term('nda', !!m.nda_accepted_at), term('policy', !!m.policy_accepted_at),
        step(!!m.upi, 'UPI ID for stipend and bonus', h('div', { class: 'row', style: 'margin-top:8px' }, upi, h('button', { on: { click: function () { act('/team/upi', { upi: upi.value }, 'UPI saved'); } } }, 'Save')))),
      h('p', { class: 'small', text: 'You become Active as soon as all four are done.' }));
  }

  function todayTab(m) {
    var d = h('input', { type: 'date', value: todayIST(), max: todayIST() }), hrs = h('input', { type: 'number', min: 0, max: 16, step: 0.5, value: 4 }), sum = h('textarea', { placeholder: 'What did you work on today? Links welcome.' });
    var open = data.tasks.filter(function (t) { return t.status === 'open'; }), done = data.tasks.filter(function (t) { return t.status !== 'open'; });
    return [
      h('section', { class: 'card' }, h('h2', { text: 'Tasks' }),
        open.length ? h('div', { class: 'list' }, open.map(function (t) {
          return h('div', { class: 'item' }, h('div', { class: 'grow' }, h('b', { text: t.title }), t.detail ? h('p', { class: 'small', text: t.detail }) : null, t.due ? h('p', { class: 'small', text: 'Due ' + date(t.due) }) : null),
            h('button', { on: { click: function () { act('/team/task', { id: t.id }, 'Nice work'); } } }, 'Done'));
        })) : h('p', { class: 'muted', text: 'No open tasks. Check with the founder or pick something from your area.' }),
        done.length ? h('p', { class: 'small', text: done.length + ' task(s) completed.' }) : null),
      h('section', { class: 'card' }, h('h2', { text: 'Daily log' }),
        h('div', { class: 'grid' }, h('div', { class: 'two' }, h('label', null, 'Date', d), h('label', null, 'Hours', hrs)), h('label', null, 'What you did', sum),
          h('button', { class: 'primary', on: { click: function () { act('/team/log', { day: d.value, hours: hrs.value, summary: sum.value }, 'Logged'); } } }, 'Save log')),
        data.logs.length ? h('div', { class: 'list', style: 'margin-top:12px' }, data.logs.slice(0, 7).map(function (l) { return h('div', { class: 'item' }, h('div', { class: 'grow' }, h('b', { text: date(l.day) + (l.hours ? ' · ' + l.hours + ' h' : '') }), h('p', { class: 'small', text: l.summary }))); })) : null)];
  }
  function payTab(m) {
    return [h('section', { class: 'card' }, h('h2', { text: 'Stipend & bonus' }),
      h('div', { class: 'stats' }, h('div', { class: 'stat' }, h('b', { text: m.stipend_monthly ? money(m.stipend_monthly) : '—' }), h('span', { class: 'small', text: 'Monthly' })),
        h('div', { class: 'stat' }, h('b', { text: money(data.totals.paid) }), h('span', { class: 'small', text: 'Paid so far' })),
        h('div', { class: 'stat' }, h('b', { text: money(data.totals.due) }), h('span', { class: 'small', text: 'Due' }))),
      h('p', { class: 'small', text: 'Paid by UPI to ' + (m.upi || 'your UPI ID (add it in Onboarding)') + '. Questions: reply to the founder by email.' }),
      data.pay.length ? h('div', { class: 'list' }, data.pay.map(function (p) {
        return h('div', { class: 'item' }, h('div', { class: 'grow' }, h('b', { text: p.kind.charAt(0).toUpperCase() + p.kind.slice(1) + (p.period ? ' · ' + p.period : '') }), h('p', { class: 'small', text: (p.status === 'paid' ? 'Paid ' + date(p.paid_at) + (p.utr ? ' · UTR ' + p.utr : '') : 'Due') + (p.note ? ' · ' + p.note : '') })),
          h('b', { text: money(p.amount) }), h('span', { class: 'chip ' + p.status, text: p.status }));
      })) : h('p', { class: 'muted', text: 'No payments recorded yet.' }))];
  }
  function docsTab() {
    return [h('section', { class: 'card' }, h('h2', { text: 'Documents & certificates' }),
      data.docs.length ? h('div', { class: 'list' }, data.docs.map(function (d) {
        return h('div', { class: 'item' }, h('div', { class: 'grow' }, h('b', { text: d.title }), h('p', { class: 'small', text: d.kind + ' · ' + date(d.issued_at) })), h('a', { class: 'btn', href: d.url, target: '_blank', rel: 'noopener', style: 'display:inline-flex;align-items:center' }, 'Open'));
      })) : h('p', { class: 'muted', text: 'Your offer letter, certificate and experience letter will appear here.' }),
      h('p', { class: 'small' }, 'Anyone can check a RoamWise certificate at ', h('a', { href: '/certificates/verify/', text: 'roamwise.co.in/certificates/verify' }), '.'))];
  }
  function timelineTab() {
    return [h('section', { class: 'card' }, h('h2', { text: 'Timeline' }), h('div', { class: 'list' }, data.events.map(function (e) { return h('div', { class: 'item' }, h('span', { text: e.what }), h('span', { class: 'small', text: date(e.at) })); })))];
  }
  function exitTab(m) {
    if (m.status === 'exiting') return [h('section', { class: 'card' }, h('h2', { text: 'Exit in progress' }), h('p', { class: 'muted', text: 'Last day: ' + date(m.last_day) + '. Finish your log and hand over open tasks. Your certificate and final payment will appear here.' }))];
    if (m.status === 'alumni') return [h('section', { class: 'card' }, h('h2', { text: 'Thank you' }), h('p', { class: 'muted', text: 'You are part of RoamWise alumni. Your documents stay available here.' }))];
    var last = h('input', { type: 'date', min: todayIST() }), why = h('textarea', { placeholder: 'Optional: why you are leaving, and anything we could do better' });
    return [h('section', { class: 'card' }, h('h2', { text: 'Leaving RoamWise' }), h('p', { class: 'muted', text: 'Pick your last working day. The founder will confirm handover, final stipend and your certificate.' }),
      h('div', { class: 'grid' }, h('label', null, 'Last working day', last), h('label', null, 'Reason', why),
        h('button', { on: { click: function () { if (confirm('Start your exit?')) act('/team/exit', { lastDay: last.value, reason: why.value }, 'Exit started'); } } }, 'Start exit')))];
  }

  function dashboard() {
    var m = data.member, parts = [header(m)];
    if (m.status === 'applied') parts.push(h('section', { class: 'card' }, h('h2', { text: 'Application received' }), h('p', { class: 'muted', text: 'Thanks! The founder will review it and reply by email. If you get an offer it will appear right here.' })));
    if (m.status === 'declined') parts.push(h('section', { class: 'card' }, h('p', { class: 'muted', text: 'This application is closed. Thank you for your interest in RoamWise.' })));
    if (m.status === 'offered') parts.push(offerCard(m));
    if (m.status === 'onboarding') parts.push(onboarding(m));
    if (['active', 'onboarding', 'exiting', 'alumni'].indexOf(m.status) >= 0) {
      var tabs = [['today', 'Today'], ['pay', 'Pay'], ['docs', 'Documents'], ['timeline', 'Timeline'], ['exit', 'Exit']];
      parts.push(h('nav', { class: 'tabs', role: 'tablist' }, tabs.map(function (t) { return h('button', { role: 'tab', 'aria-selected': String(tab === t[0]), on: { click: function () { tab = t[0]; dashboard(); } } }, t[1]); })));
      parts = parts.concat(({ today: todayTab, pay: payTab, docs: docsTab, timeline: timelineTab, exit: exitTab })[tab](m));
    }
    if (isAdminView) parts.push(h('section', { class: 'card' }, h('a', { href: '?admin=1', text: 'Founder view ↗' })));
    render.apply(null, parts);
  }

  async function load() {
    render(h('section', { class: 'card hero' }, h('p', { class: 'muted', text: 'Loading your workspace…' })));
    if (isAdminView && window.RWWorkAdmin) { try { return await window.RWWorkAdmin.show(app, call, h, toast); } catch (e) { if (e.status !== 403) return toast(e.message); } }
    try { data = await call('/team/me'); dashboard(); }
    catch (e) { if (e.code === 'not_member') applyScreen(); else render(h('section', { class: 'card hero' }, h('p', { class: 'muted', text: 'Could not load: ' + e.message }), h('button', { on: { click: load } }, 'Retry'))); }
  }

  function start() {
    app = document.getElementById('app');
    if (!window.firebase) return render(h('section', { class: 'card hero' }, h('p', { class: 'muted', text: 'Sign-in could not load. Check your connection and refresh.' })));
    if (!firebase.apps.length) firebase.initializeApp(FB);
    var out = document.getElementById('signOut');
    out.onclick = function () { firebase.auth().signOut(); };
    firebase.auth().onAuthStateChanged(function (u) { user = u; out.hidden = !u; if (u) load(); else signInScreen(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
