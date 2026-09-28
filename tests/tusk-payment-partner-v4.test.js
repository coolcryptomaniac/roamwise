const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('one V4 property MOU controls onboarding and approval', () => {
  const files = ['partner/mou/index.html','partner/join/index.html','partner/app.js','partner/marketplace.js','partner/audit/index.html'];
  for(const file of files) assert.match(read(file), /RW-PMOU-2026-09-27-V4/, `${file} is not on V4`);
  for(const file of files) assert.doesNotMatch(read(file), /RW-PMOU-2026-09-23-V[23]/, `${file} still accepts an old MOU`);
  const mou = read('partner/mou/index.html');
  assert.match(mou, /Partner Free[\s\S]*7%/);
  assert.match(mou, /Partner Desk[\s\S]*5%/);
  assert.match(mou, /never both/i);
  assert.match(mou, /No commission is charged on a cancelled, no-show or fully refunded stay/i);
});

test('property invite publishes the same prices and canonical application path', () => {
  const invite = read('partner/invite/property/index.html');
  assert.match(invite, /Partner Free[\s\S]*7%/);
  assert.match(invite, /₹249 monthly[\s\S]*₹2,499 yearly[\s\S]*₹5,999 for 3 years[\s\S]*5%/);
  assert.match(invite, /\/partner\/join\//);
  assert.match(invite, /shareBtn/);
});

test('Tusk booking hands off to verified inventory and payment-after-confirmation', () => {
  const booking = read('js/booking/form.js');
  const market = read('partner/marketplace.js');
  assert.match(booking, /tusk_verified_stay_handoff/);
  assert.match(booking, /\/partner\/\?role=customer&destination=/);
  assert.match(market, /paymentStatus:'awaiting_host_confirmation'/);
  assert.match(market, /paymentMethod==='roamwise_cashfree_after_confirmation'/);
  assert.match(market, /Pay securely with Cashfree/);
  assert.match(market, /marketplaceApproved===true/);
  assert.match(market, /data-rw-payment-connector/);
  assert.match(market, /Pay after host confirmation/);
  assert.match(market, /b\.textContent!=='Request this room'/);
  assert.match(market, /var p=listing\.paymentPublic\|\|\{\},a=\[\];if\(platformPay\.cashfreeEnabled/);
  assert.match(market, /a\.push\(\{id:'pay_at_property'/);
});

test('Pro checkout has an immediate safe launcher and privacy-safe diagnostics', () => {
  const html = read('index.html');
  const client = read('js/payments/payment-resilience.js');
  const worker = read('worker/handlers/payment-events.js');
  assert.match(html, /js\/payments\/payment-resilience\.js/);
  assert.doesNotMatch(html, /onclick="[^"]*openPay\(\)/);
  assert.match(client, /nothing was charged/);
  assert.match(client, /checkout_left/);
  assert.match(worker, /const ALLOWED=new Set/);
  assert.doesNotMatch(worker, /email|phone|utr|bank|card/i);
});

test('normal customers use Ailon Tusk Automatic without provider controls', () => {
  const settings = read('js/ui/settings-modal.js');
  const providers = read('js/copilot/ai-providers.js');
  const worker = read('worker/handlers/ai.js');
  assert.match(settings, /window\.RW_IS_ADMIN!==true/);
  assert.match(providers, /Authorization':'Bearer/);
  assert.match(worker, /cloudflareAI/);
  assert.match(worker, /sarvamAI/);
  assert.match(worker, /groqAI/);
});
