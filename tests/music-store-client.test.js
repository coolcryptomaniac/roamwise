const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {JSDOM} = require('jsdom');
const root = path.join(__dirname, '..');

const TRACKS = [{id: 'g3--_QBX8wQ', title: 'Akele Hain', pricePaise: 2000, available: true}, {id: 'gwi_qN111zo', title: 'Jaad Haigo', pricePaise: 2000, available: false}];
const TIERS = [{id: 'creator', label: 'Creator licence', pricePaise: 100000, use: 'Videos'}, {id: 'feature', label: 'Feature film / series licence', pricePaise: 10000000, use: 'Films'}];
const cat = (open) => ({checkoutOpen: open, methods: {cashfree: open, upi: open}, downloadPaise: 2000, downloadUse: 'Personal listening.', upiMaxPaise: 2500000, terms: ['Term one.'], tiers: TIERS, releases: TRACKS});

function setup({open = true, routes = {}, search = '', store = {}} = {}) {
  const html = fs.readFileSync(path.join(root, 'music/store/index.html'), 'utf8').replace(/<script[^>]*><\/script>/g, '');
  const dom = new JSDOM(html, {url: 'https://www.roamwise.co.in/music/store/' + search, runScripts: 'outside-only'});
  const w = dom.window; const calls = [];
  Object.entries(store).forEach(([k, v]) => w.localStorage.setItem(k, v));
  w.fetch = async (url, opts = {}) => {
    const p = new URL(url).pathname; const body = opts.body ? JSON.parse(opts.body) : null;
    calls.push({path: p, method: opts.method || 'GET', body, headers: opts.headers});
    const r = (routes[p] || (p === '/music/catalogue' ? () => ({status: 200, body: cat(open)}) : () => ({status: 404, body: {}})))(body);
    return {ok: r.status < 400, status: r.status, json: async () => r.body};
  };
  vm.runInContext(fs.readFileSync(path.join(root, 'music/store/store.js'), 'utf8'), dom.getInternalVMContext());
  return {dom, d: w.document, calls, w};
}
const tick = () => new Promise((r) => setTimeout(r, 20));
const fill = (d) => { const s = (id, v) => { d.getElementById(id).value = v; }; s('ms-name', 'Asha Rawat'); s('ms-phone', '9876543210'); s('ms-email', 'a@example.com'); s('ms-licensee', 'Dev Films'); s('ms-project', 'Pahad'); d.getElementById('ms-agree').checked = true; };

test('lists every track; closed store shows a banner and disabled buttons', async () => {
  const {dom, d} = setup({open: false}); await tick();
  assert.equal(d.querySelectorAll('.ms-card').length, 2);
  assert.equal(d.getElementById('msBanner').hidden, false);
  assert.ok([...d.querySelectorAll('.ms-card button')].every((b) => b.disabled));
  assert.equal(d.querySelectorAll('.ms-tier').length, 3); // download + 2 licence tiers
  dom.window.close();
});

test('open store: only tracks with audio are buyable; a download order sends no price', async () => {
  const routes = {'/music/order': () => ({status: 200, body: {orderId: 'RWM-ABCDEFGHJK', token: 'tok', method: 'upi', totalPaise: 2000, upi: {amount: '20.00', uri: 'upi://pay?pa=roamwisepay%40ybl&am=20.00'}}})};
  const {dom, d, calls} = setup({routes}); await tick();
  const cards = d.querySelectorAll('.ms-card');
  assert.equal(cards[0].querySelector('button').disabled, false);
  assert.match(cards[0].querySelector('button').textContent, /₹20/);
  assert.equal(cards[1].querySelector('button').disabled, true);
  cards[0].querySelector('button').click();
  assert.equal(d.getElementById('msCheckout').hidden, false);
  assert.match(d.getElementById('msCoItem').textContent, /Akele Hain · ₹20/);
  assert.equal(d.getElementById('msTierPick').hidden, true);
  fill(d); d.querySelector('input[name="payMethod"][value="upi"]').checked = true;
  d.getElementById('msForm').requestSubmit(); await tick();
  const order = calls.find((c) => c.path === '/music/order').body;
  assert.deepEqual(Object.keys(order).sort(), ['buyer', 'item', 'method']);
  assert.deepEqual(order.item, {releaseId: 'g3--_QBX8wQ', kind: 'download'});
  assert.equal(d.getElementById('msUpi').hidden, false);
  assert.equal(d.getElementById('msUpiAmt').textContent, '₹20.00');
  assert.equal(dom.window.localStorage.getItem('rwMusicOrder.RWM-ABCDEFGHJK'), 'tok');
  dom.window.close();
});

test('licence: tier choice changes the price, feature licence hides direct UPI, terms must be accepted', async () => {
  const {dom, d, calls} = setup(); await tick();
  d.querySelectorAll('.ms-card')[0].querySelectorAll('button')[1].click();
  assert.equal(d.getElementById('msTierPick').hidden, false);
  assert.equal(d.getElementById('msLicFields').hidden, false);
  assert.match(d.getElementById('msCoItem').textContent, /Creator licence.*₹1,000/);
  assert.equal(d.getElementById('msUpiOpt').hidden, false);
  const feature = d.querySelector('input[name="tier"][value="feature"]'); feature.checked = true; feature.dispatchEvent(new dom.window.Event('change'));
  assert.match(d.getElementById('msCoItem').textContent, /₹1,00,00,000|₹10,000,000|₹1,00,000/);
  assert.equal(d.getElementById('msUpiOpt').hidden, true);
  fill(d); d.getElementById('ms-agree').checked = false;
  d.getElementById('msForm').requestSubmit(); await tick();
  assert.match(d.getElementById('msError').textContent, /terms/);
  assert.equal(calls.filter((c) => c.path === '/music/order').length, 0);
  dom.window.close();
});

test('returning from payment shows the download link and the licence certificate', async () => {
  const status = {orderId: 'RWM-ABCDEFGHJK', status: 'paid', method: 'cashfree', label: 'Feature film / series licence', releaseTitle: 'Akele Hain',
    download: {url: 'https://api.example/music/download/RWM-ABCDEFGHJK?exp=1&sig=2', remaining: 10},
    certificate: {licenceNo: 'RWM-ABCDEFGHJK', tierLabel: 'Feature film / series licence', track: 'Akele Hain', licensee: '<img src=x onerror=alert(1)>', project: 'Pahad', issuedAt: '2026-11-03T10:00:00Z', licensor: 'Mohit Pandey', use: 'Films', credit: 'Music: "Akele Hain"', terms: ['One.'], termsVersion: '2026-11-03'}};
  const {dom, d, calls} = setup({search: '?order_id=RWM-ABCDEFGHJK', store: {'rwMusicOrder.RWM-ABCDEFGHJK': 'tok'}, routes: {'/music/order/RWM-ABCDEFGHJK/status': () => ({status: 200, body: status})}});
  await tick(); await tick();
  assert.equal(calls.find((c) => c.path.endsWith('/status')).headers.authorization, 'Bearer tok');
  assert.equal(d.getElementById('msDownload').hidden, false);
  assert.match(d.getElementById('msDownload').href, /music\/download\/RWM-ABCDEFGHJK/);
  assert.equal(d.getElementById('msCert').hidden, false);
  assert.equal(d.querySelector('#msCert img'), null); // server text is never parsed as HTML
  assert.match(d.getElementById('msCert').textContent, /Feature film/);
  dom.window.close();
});

test('licence check page: invalid format is rejected locally; valid number is looked up', async () => {
  const {dom, d, calls} = setup({routes: {'/music/licence/RWM-ABCDEFGHJK': () => ({status: 200, body: {valid: true, tier: 'Creator licence', track: 'Akele Hain', licensee: 'Dev Films', issuedAt: '2026-11-03T10:00:00Z'}})}}); await tick();
  d.getElementById('ms-lic-no').value = 'bad'; d.getElementById('msVerify').requestSubmit(); await tick();
  assert.match(d.getElementById('msVerifyOut').textContent, /does not look like/);
  d.getElementById('ms-lic-no').value = 'rwm-abcdefghjk'; d.getElementById('msVerify').requestSubmit(); await tick();
  assert.match(d.getElementById('msVerifyOut').textContent, /Valid: Creator licence/);
  assert.ok(calls.some((c) => c.path === '/music/licence/RWM-ABCDEFGHJK'));
  dom.window.close();
});
