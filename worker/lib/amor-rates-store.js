/* Opens the sealed Amor rate book inside the Worker. Nothing here is secret: the sealed file is RSA-OAEP-256 +
 * AES-256-GCM ciphertext, and only the Worker holds the private key (secret AMOR_RATES_KEY, PKCS#8 PEM).
 *   GET /stays/rates-key  -> the PUBLIC key (JWK), used by tools/amor-rates-seal.mjs to encrypt a new rate book.
 * The decrypted book stays in memory only; it is never returned by any endpoint. */
import SEALED from '../data/amor-rates.sealed.json' with { type: 'json' };
import { setAmorRates, amorRatesLoaded } from './amor-rates.js';

const b64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
let keyCache = null;

async function privateKey(env) {
  if (keyCache) return keyCache;
  const pem = String(env.AMOR_RATES_KEY || '');
  if (!pem.includes('PRIVATE KEY')) return null;
  const der = b64(pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, ''));
  keyCache = await crypto.subtle.importKey('pkcs8', der, { name: 'RSA-OAEP', hash: 'SHA-256' }, true, ['decrypt']);
  return keyCache;
}

export async function publicKeyJwk(env) {
  const k = await privateKey(env); if (!k) return null;
  const j = await crypto.subtle.exportKey('jwk', k);
  return { kty: 'RSA', n: j.n, e: j.e, alg: 'RSA-OAEP-256', use: 'enc' };
}

export async function openSealed(sealed, key) {
  const aesRaw = await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, key, b64(sealed.key));
  const aes = await crypto.subtle.importKey('raw', aesRaw, 'AES-GCM', false, ['decrypt']);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(sealed.iv) }, aes, b64(sealed.data));
  return JSON.parse(new TextDecoder().decode(plain));
}

/* Loads the rate book once per isolate. Returns false when it cannot (no key yet, or no sealed book). */
export async function ensureAmorRates(env) {
  if (amorRatesLoaded()) return true;
  if (!SEALED || !SEALED.data) return false;
  const key = await privateKey(env || {}); if (!key) return false;
  try { setAmorRates(await openSealed(SEALED, key)); return true; } catch (_) { return false; }
}
