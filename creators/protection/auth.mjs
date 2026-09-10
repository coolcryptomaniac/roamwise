let keyCache = { expiresAt: 0, keys: {} };

function decodePart(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(normalized), c => c.charCodeAt(0))));
}

async function firebaseKeys() {
  if (Date.now() < keyCache.expiresAt && Object.keys(keyCache.keys).length) return keyCache.keys;
  const response = await fetch('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com');
  if (!response.ok) throw new Error('Could not load Firebase signing keys');
  const maxAge = Number((response.headers.get('cache-control') || '').match(/max-age=(\d+)/)?.[1] || 1800);
  const document = await response.json();
  keyCache = { keys: Object.fromEntries((document.keys || []).map(key => [key.kid, key])), expiresAt: Date.now() + maxAge * 1000 };
  return keyCache.keys;
}

export async function verifyFirebaseToken(token, env) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) throw new Error('Invalid bearer token');
  const header = decodePart(parts[0]);
  const payload = decodePart(parts[1]);
  const projectId = String(env.FIREBASE_PROJECT_ID || 'roamwisepro');
  const now = Math.floor(Date.now() / 1000);
  if (header.alg !== 'RS256' || !header.kid) throw new Error('Unsupported token signature');
  if (payload.aud !== projectId || payload.iss !== `https://securetoken.google.com/${projectId}`) throw new Error('Token audience is invalid');
  if (!payload.sub || payload.sub.length > 128 || payload.exp <= now || payload.iat > now + 60) throw new Error('Token is expired or invalid');
  if (payload.email && payload.email_verified !== true) throw new Error('Verified email is required');
  const jwk = (await firebaseKeys())[header.kid];
  if (!jwk) throw new Error('Unknown token signing key');
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const signature = Uint8Array.from(atob(parts[2].replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(parts[2].length / 4) * 4, '=')), c => c.charCodeAt(0));
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, signature, new TextEncoder().encode(`${parts[0]}.${parts[1]}`));
  if (!ok) throw new Error('Token signature is invalid');
  return { uid: payload.sub, email: String(payload.email || '').toLowerCase(), name: String(payload.name || '') };
}

export async function authenticate(request, env) {
  const value = request.headers.get('authorization') || '';
  if (!value.startsWith('Bearer ')) throw Object.assign(new Error('Authentication required'), { status: 401 });
  let identity;
  try { identity = await verifyFirebaseToken(value.slice(7), env); }
  catch (error) { throw Object.assign(error, { status: 401 }); }
  const admins = String(env.CREATOR_PROTECTION_ADMIN_UIDS || '').split(',').map(v => v.trim()).filter(Boolean);
  if (admins.includes(identity.uid)) return { ...identity, role: 'admin', status: 'active' };
  const row = env.CREATOR_DB ? await env.CREATOR_DB.prepare('SELECT role, status, display_name, phone, provider_vendor_id, minimum_paid_minor, accepts_barter FROM cp_actors WHERE uid=?').bind(identity.uid).first() : null;
  return { ...identity, role: row?.role || 'guest', status: row?.status || 'unregistered', displayName: row?.display_name || identity.name, phone: row?.phone || '', providerVendorId: row?.provider_vendor_id || '', minimumPaidCampaignMinor: Number(row?.minimum_paid_minor || 0), acceptsBarter: Boolean(row?.accepts_barter) };
}

export function requireActor(actor, roles, active = true) {
  if (!roles.includes(actor.role)) throw Object.assign(new Error('This account does not have the required role'), { status: 403 });
  if (active && actor.status !== 'active' && actor.role !== 'admin') throw Object.assign(new Error('KYC and account approval are required'), { status: 403 });
}
