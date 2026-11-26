/* Founder shop catalogue manager (/shop/manage/). Google sign-in; the Worker checks admins/{uid}.
 * Products move draft -> vote (shown in Discover as concepts people can vote on) -> live (buyable;
 * needs a Qikink or Printrove SKU per size/colour, created in that provider's dashboard first).
 * Prices are entered here and stored server-side; the storefront never trusts client prices. */
(function () {
  'use strict';
  var API = 'https://roamwise-api.founder-f53.workers.dev';
  var FB = { apiKey: 'AIzaSyDlrtpzpOb1VEmVSd9tHmu7OpmvwWosYsU', authDomain: 'roamwisepro.firebaseapp.com', projectId: 'roamwisepro', appId: '1:299014744987:web:d5c316743e6d7a10904f3e' };
  var user = null, products = [], app = document.getElementById('app');

  function h(tag, attrs) {
    var n = document.createElement(tag), a = attrs || {};
    Object.keys(a).forEach(function (k) {
      if (k === 'on') Object.keys(a.on).forEach(function (e) { n.addEventListener(e, a.on[e]); });
      else if (k === 'text') n.textContent = a[k]; else if (k === 'value') n.value = a[k]; else n.setAttribute(k, a[k]);
    });
    for (var i = 2; i < arguments.length; i++) { var c = arguments[i]; if (c == null || c === false) continue; n.append(c.nodeType ? c : String(c)); }
    return n;
  }
  function toast(t) { var e = document.getElementById('toast'); e.textContent = t; e.style.display = 'block'; clearTimeout(toast.t); toast.t = setTimeout(function () { e.style.display = 'none'; }, 3200); }
  function render(node) { app.replaceChildren(node); }
  async function call(path, body) {
    var token = await user.getIdToken();
    var r = await fetch(API + path, { method: body ? 'POST' : 'GET', headers: Object.assign({ Authorization: 'Bearer ' + token }, body ? { 'content-type': 'application/json' } : {}), body: body ? JSON.stringify(body) : undefined });
    var d = await r.json().catch(function () { return {}; });
    if (!r.ok) throw new Error(d.message || (r.status === 403 ? 'This Google account is not a RoamWise founder account.' : 'Request failed (' + r.status + ')'));
    return d;
  }

  function signInScreen() {
    render(h('section', { class: 'card' }, h('h2', { text: 'Founders only' }), h('p', { class: 'muted', text: 'Sign in with the Google account listed as a RoamWise admin.' }),
      h('button', { class: 'gold', on: { click: function () {
        var p = new firebase.auth.GoogleAuthProvider(); p.setCustomParameters({ prompt: 'select_account' });
        firebase.auth().signInWithPopup(p).catch(function (e) { if (e && /popup/.test(e.code || '')) firebase.auth().signInWithRedirect(p); else toast('Sign-in failed.'); });
      } } }, 'Continue with Google')));
  }

  async function load() {
    try { products = (await call('/shop/admin/products')).products || []; show(); }
    catch (e) { render(h('section', { class: 'card' }, h('p', { class: 'muted', text: e.message }))); }
  }

  function show(edit) {
    var list = h('section', { class: 'card' }, h('h2', { text: 'Products (' + products.length + ')' }));
    if (!products.length) list.append(h('p', { class: 'muted', text: 'Nothing yet. Add a design below as a "vote" concept to see if people want it.' }));
    else {
      var t = h('table', {}, h('tr', {}, h('th', {}), h('th', { text: 'Name' }), h('th', { text: 'Price' }), h('th', { text: 'Status' }), h('th', { text: 'Votes' }), h('th', {})));
      products.forEach(function (p) {
        t.append(h('tr', {}, h('td', {}, h('img', { src: p.image, alt: '' })), h('td', {}, p.name, h('div', { class: 'small', text: [p.type, p.collection, p.provider].filter(Boolean).join(' · ') })),
          h('td', { text: '₹' + Math.round(p.price_paise / 100) }), h('td', {}, h('span', { class: 'pill ' + p.status, text: p.status })), h('td', { text: String(p.votes || 0) }),
          h('td', {}, h('button', { on: { click: function () { show(p); window.scrollTo(0, document.body.scrollHeight); } } }, 'Edit'))));
      });
      list.append(t);
    }
    render(h('div', { style: 'display:grid;gap:14px' }, list, form(edit)));
  }

  function form(p) {
    p = p || { status: 'vote', provider: 'qikink', type: 'T-shirt', category: 'wear', max_qty: 5, variants: [] };
    var f = {};
    function field(label, key, type, opts) {
      var input = opts ? h('select', {}) : type === 'area' ? h('textarea', {}) : h('input', { type: type || 'text' });
      if (opts) opts.forEach(function (o) { input.append(h('option', { value: o, text: o })); });
      input.value = p[key] != null ? (key === 'price_rupees' ? '' : p[key]) : '';
      f[key] = input; return h('label', {}, label, input);
    }
    var price = field('Price (₹, customer pays)', 'price_rupees', 'number'); f.price_rupees.value = p.price_paise ? Math.round(p.price_paise / 100) : '';
    var vars = h('div', {});
    function addVar(v) {
      v = v || {}; var row = h('div', { class: 'var' }, h('input', { placeholder: 'id e.g. black-l', value: v.id || '' }), h('input', { placeholder: 'Label e.g. Black · L', value: v.label || '' }),
        h('input', { placeholder: 'Provider SKU (needed to go live)', value: v.sku || '' }), h('button', { on: { click: function () { row.remove(); } } }, '✕'));
      vars.append(row);
    }
    (p.variants || []).forEach(addVar); if (!(p.variants || []).length) addVar();
    var box = h('section', { class: 'card' }, h('h2', { text: p.id ? 'Edit ' + p.name : 'Add a product or concept' }),
      h('div', { class: 'grid' }, field('Name', 'name'), field('Type', 'type'), price, field('Status', 'status', null, ['draft', 'vote', 'live']),
        field('Print provider', 'provider', null, ['qikink', 'printrove', 'manual']), field('Collection', 'collection'), field('Category', 'category'), field('Max per order', 'max_qty', 'number')),
      h('label', { style: 'margin-top:10px' }, 'Image (https URL, e.g. from roamwise-media R2)', (f.image = h('input', { value: p.image || '' }))),
      h('label', { style: 'margin-top:10px' }, 'Description', (f.description = h('textarea', { value: p.description || '' }))),
      h('p', { class: 'small', text: 'Sizes / colours. For live products, first create the product in the Qikink or Printrove dashboard, then paste each SKU here.' }), vars,
      h('div', { style: 'display:flex;gap:8px;margin-top:10px;flex-wrap:wrap' },
        h('button', { on: { click: function () { addVar(); } } }, '+ Size / colour'),
        h('button', { class: 'gold', on: { click: async function () {
          var body = { id: p.id, variants: [] };
          Object.keys(f).forEach(function (k) { body[k] = f[k].value; });
          vars.querySelectorAll('.var').forEach(function (r) { var i = r.querySelectorAll('input'); if (i[1].value.trim()) body.variants.push({ id: i[0].value || i[1].value, label: i[1].value, sku: i[2].value }); });
          try { await call('/shop/admin/product', body); toast('Saved'); load(); } catch (e) { toast(e.message); }
        } } }, 'Save'),
        p.id ? h('button', { on: { click: function () { show(); } } }, 'New instead') : null));
    return box;
  }

  window.addEventListener('DOMContentLoaded', function () {
    if (!window.firebase) return render(h('section', { class: 'card' }, h('p', { class: 'muted', text: 'Sign-in could not load. Refresh and try again.' })));
    if (!firebase.apps.length) firebase.initializeApp(FB);
    var out = document.getElementById('out'); out.onclick = function () { firebase.auth().signOut(); };
    firebase.auth().onAuthStateChanged(function (u) { user = u; out.hidden = !u; if (u) load(); else signInScreen(); });
  });
})();
