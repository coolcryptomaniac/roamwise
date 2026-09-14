const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const context = {URL, window:{localStorage:null}};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'js/boot/auth-security.js'), 'utf8'), context);
const policy = context.RWAuthSecurity;

function storage(){
  const data = new Map();
  return {setItem:(key,value)=>data.set(key,String(value)),getItem:key=>data.has(key)?data.get(key):null};
}

test('new passwords require length plus a letter and number', () => {
  assert.equal(policy.passwordStatus('short1').ok, false);
  assert.equal(policy.passwordStatus('onlyletterslong').ok, false);
  assert.equal(policy.passwordStatus('safe-travel-2026').ok, true);
});

test('successful providers are remembered locally without storing an email', () => {
  const local = storage();
  assert.equal(policy.rememberProvider('google.com', local), 'Google');
  assert.equal(policy.lastProvider(local), 'Google');
  assert.equal(local.getItem(policy.LAST_PROVIDER_KEY), 'google.com');
});

test('credential errors give provider guidance without confirming whether an email exists', () => {
  const message = policy.friendlyMessage({code:'auth/invalid-credential'}, 'signin');
  assert.match(message, /Try Google/);
  assert.match(message, /does not reveal registered emails/);
});

test('email action return URLs are restricted to RoamWise HTTPS hosts', () => {
  assert.equal(policy.safeContinueUrl('https://evil.example/phish'), policy.RETURN_URL);
  assert.equal(policy.safeContinueUrl('javascript:alert(1)'), policy.RETURN_URL);
  assert.equal(policy.safeContinueUrl('https://www.roamwise.co.in/trip?id=1'), 'https://www.roamwise.co.in/trip?id=1');
});

test('Firestore claim and referral rules bind identity, document id and commission caps', () => {
  const rules = fs.readFileSync(path.join(root, 'firestore.rules'), 'utf8');
  assert.match(rules, /request\.resource\.data\.refRate <= 0\.30/);
  assert.match(rules, /request\.resource\.data\.userUID == request\.auth\.uid/);
  assert.match(rules, /id == request\.resource\.data\.code \+ '__' \+ request\.auth\.uid/);
  assert.match(rules, /hasOnly\(\['uid', 'email', 'utr', 'amount'/);
});
