// Sets the shop checkout switches in Firestore config/shop (flags only, no secrets, no prices).
// Run by .github/workflows/shop-config.yml with the FIREBASE_SERVICE_ACCOUNT repository secret.
//
//   FIREBASE_SERVICE_ACCOUNT_JSON=... node tools/shop-config-set.mjs --enabled=true --cashfree=true --upi=true --environment=live
//
// Only the fields passed are written (PATCH with an update mask); anything else an admin set stays as it is.
// qikinkEnabled sends PAID orders to Qikink automatically (Qikink charges the wallet); qikinkEnvironment must
// match QIKINK_ENV in worker/wrangler.toml. The script prints the flags it read back and exits 1 on any error.
import { getServiceAccountAccessToken, parseServiceAccount } from '../worker/lib/service-account.js';
import { getDoc, updateDoc } from '../worker/lib/firestore-rest.js';

const PROJECT = 'roamwisepro';
const arg = (name) => {
  const hit = process.argv.find((a) => a.startsWith('--' + name + '='));
  return hit ? hit.slice(name.length + 3) : undefined;
};
const bool = (name) => {
  const v = arg(name);
  if (v === undefined) return undefined;
  if (v !== 'true' && v !== 'false') throw new Error('--' + name + ' must be true or false');
  return v === 'true';
};

export function buildPatch(opts, nowIso, actor) {
  const patch = {};
  for (const [key, field] of [['enabled', 'enabled'], ['cashfree', 'cashfreeEnabled'], ['upi', 'upiEnabled'], ['qikink', 'qikinkEnabled']]) {
    if (opts[key] !== undefined) patch[field] = opts[key];
  }
  if (opts.environment !== undefined) {
    if (!['live', 'sandbox'].includes(opts.environment)) throw new Error('--environment must be live or sandbox');
    patch.environment = opts.environment;
  }
  if (opts.qikinkEnvironment !== undefined) {
    if (!['live', 'sandbox'].includes(opts.qikinkEnvironment)) throw new Error('--qikink-environment must be live or sandbox');
    patch.qikinkEnvironment = opts.qikinkEnvironment;
  }
  if (!Object.keys(patch).length) throw new Error('nothing to change');
  patch.updatedAt = nowIso;
  patch.updatedBy = String(actor || 'github-actions').slice(0, 80);
  return patch;
}

async function main() {
  const env = { FIREBASE_SERVICE_ACCOUNT_JSON: process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.FIREBASE_SERVICE_ACCOUNT };
  const sa = parseServiceAccount(env);
  if (sa.project_id !== PROJECT) throw new Error('service account is not for ' + PROJECT);
  const patch = buildPatch({ enabled: bool('enabled'), cashfree: bool('cashfree'), upi: bool('upi'), environment: arg('environment'),
    qikink: bool('qikink'), qikinkEnvironment: arg('qikink-environment') },
    new Date().toISOString(), process.env.GITHUB_ACTOR);
  const token = await getServiceAccountAccessToken(env);
  await updateDoc(env, token, PROJECT, 'config/shop', patch);
  const now = await getDoc(env, token, PROJECT, 'config/shop') || {};
  const show = ['enabled', 'cashfreeEnabled', 'upiEnabled', 'environment', 'qikinkEnabled', 'qikinkEnvironment', 'updatedAt'];
  console.log('config/shop now:', JSON.stringify(Object.fromEntries(show.map((k) => [k, now[k] === undefined ? null : now[k]]))));
}

if (import.meta.url === 'file://' + process.argv[1]) {
  main().catch((e) => { console.error('shop-config-set failed:', e.message); process.exit(1); });
}
