/* RoamWise Work — founder view (/work/?admin=1). The Worker checks admins/{uid}; others get 403. */
(function () {
  'use strict';
  var TRACKS = ['finance', 'marketing', 'ops', 'partnerships', 'content', 'design', 'engineering', 'general'];
  var STATUSES = ['applied', 'offered', 'onboarding', 'active', 'exiting', 'alumni', 'declined'];
  function opts(h, list, sel) { return list.map(function (v) { return h('option', { value: v, selected: v === sel, text: v }); }); }

  async function show(app, call, h, toast) {
    var res = await call('/team/admin/list'), members = res.members || [];
    async function run(path, body, ok) { try { await call(path, body); toast(ok); show(app, call, h, toast); } catch (e) { toast(e.message); } }

    var inv = { email: h('input', { placeholder: 'Google email', type: 'email' }), name: h('input', { placeholder: 'Full name' }), role_title: h('input', { placeholder: 'Role title, e.g. Finance & Strategy Intern' }),
      kind: h('select', null, opts(h, ['intern', 'employee'], 'intern')), track: h('select', null, opts(h, TRACKS, 'finance')),
      stipend_monthly: h('input', { type: 'number', placeholder: 'Monthly stipend ₹ (blank = unpaid)' }), start_date: h('input', { type: 'date' }), end_date: h('input', { type: 'date' }) };
    var invite = h('section', { class: 'card' }, h('p', { class: 'eyebrow', text: 'Founder view' }), h('h2', { text: 'Send an offer' }),
      h('div', { class: 'grid' }, h('div', { class: 'two' }, inv.name, inv.email), inv.role_title, h('div', { class: 'two' }, inv.kind, inv.track), inv.stipend_monthly,
        h('div', { class: 'two' }, h('label', null, 'Start', inv.start_date), h('label', null, 'End', inv.end_date)),
        h('button', { class: 'primary', on: { click: function () { var b = {}; Object.keys(inv).forEach(function (k) { b[k] = inv[k].value; }); run('/team/admin/invite', b, 'Offer created. Ask them to sign in at roamwise.co.in/work with that email.'); } } }, 'Create offer')));

    var list = h('section', { class: 'card' }, h('h2', { text: 'Team (' + members.length + ')' }), h('div', { class: 'list' }, members.map(function (m) {
      var st = h('select', null, opts(h, STATUSES, m.status)), stip = h('input', { type: 'number', value: m.stipend_monthly == null ? '' : m.stipend_monthly }), role = h('input', { value: m.role_title || '' });
      var pk = h('select', null, opts(h, ['stipend', 'bonus', 'incentive', 'reimbursement'], 'stipend')), pa = h('input', { type: 'number', placeholder: 'Amount ₹' }), pp = h('input', { placeholder: 'Period e.g. 2026-11' }), pu = h('input', { placeholder: 'UTR (if paid)' });
      var tt = h('input', { placeholder: 'Task title' }), td = h('input', { type: 'date' }), dt = h('input', { placeholder: 'Document title' }), du = h('input', { placeholder: 'https:// link' }), dk = h('select', null, opts(h, ['certificate', 'offer', 'experience', 'relieving', 'other'], 'certificate'));
      return h('div', { class: 'adminrow' },
        h('div', { class: 'row' }, h('b', { text: m.name }), h('span', { class: 'chip ' + m.status, text: m.status }), h('span', { class: 'small', text: m.email + ' · ' + m.kind + ' · ' + m.track + (m.last_log ? ' · last log ' + m.last_log : '') + (m.open_tasks ? ' · ' + m.open_tasks + ' open tasks' : '') + (m.pay_due ? ' · ₹' + m.pay_due + ' due' : '') })),
        m.note ? h('p', { class: 'small', text: '“' + m.note + '”' }) : null,
        h('details', null, h('summary', { text: 'Manage' }), h('div', { class: 'grid', style: 'margin-top:10px' },
          h('div', { class: 'two' }, h('label', null, 'Status', st), h('label', null, 'Monthly stipend ₹', stip)), h('label', null, 'Role title', role),
          h('button', { on: { click: function () { run('/team/admin/update', { id: m.id, status: st.value, stipend_monthly: stip.value, role_title: role.value }, 'Saved'); } } }, 'Save'),
          h('h3', { text: 'Record pay' }), h('div', { class: 'two' }, pk, pa), h('div', { class: 'two' }, pp, pu),
          h('div', { class: 'row' }, h('button', { on: { click: function () { run('/team/admin/pay', { member_id: m.id, kind: pk.value, amount: pa.value, period: pp.value, status: 'due' }, 'Added as due'); } } }, 'Add as due'),
            h('button', { on: { click: function () { run('/team/admin/pay', { member_id: m.id, kind: pk.value, amount: pa.value, period: pp.value, utr: pu.value, status: 'paid' }, 'Recorded as paid'); } } }, 'Record paid')),
          h('h3', { text: 'Assign task' }), h('div', { class: 'two' }, tt, td), h('button', { on: { click: function () { run('/team/admin/task', { member_id: m.id, title: tt.value, due: td.value }, 'Task assigned'); } } }, 'Assign'),
          h('h3', { text: 'Add document or certificate' }), h('div', { class: 'two' }, dt, dk), du, h('button', { on: { click: function () { run('/team/admin/doc', { member_id: m.id, title: dt.value, kind: dk.value, url: du.value }, 'Document added'); } } }, 'Add document'))));
    })));
    app.replaceChildren(invite, list);
  }
  window.RWWorkAdmin = { show: show };
})();
