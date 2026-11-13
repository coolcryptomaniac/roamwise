#!/usr/bin/env node
/* Seals the Amor rate book so only the RoamWise Worker can read it.
 *   node tools/amor-rates-seal.mjs <private-rates.json>            fetch the Worker's public key and write
 *                                                                  worker/data/amor-rates.sealed.json
 *   node tools/amor-rates-seal.mjs --self-test                     round-trip with a throwaway key (no network)
 * The plaintext rate book must NEVER be committed. Keep it in the founder's private Drive / claude.ai project.
 * Format: RSA-OAEP-256 wraps a random AES-256-GCM key; { v, alg, key, iv, data, sealedAt, version }. */
import fs from 'node:fs';
import { webcrypto as wc } from 'node:crypto';

const KEY_URL = 'https://roamwise-api.founder-f53.workers.dev/stays/rates-key';
const OUT = new URL('../worker/data/amor-rates.sealed.json', import.meta.url);
const b64 = (u8) => Buffer.from(u8).toString('base64');

export async function seal(book, publicJwk) {
  const pub = await wc.subtle.importKey('jwk', { kty: 'RSA', n: publicJwk.n, e: publicJwk.e, alg: 'RSA-OAEP-256', ext: true }, { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['encrypt']);
  const aes = await wc.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt']);
  const iv = wc.getRandomValues(new Uint8Array(12));
  const data = await wc.subtle.encrypt({ name: 'AES-GCM', iv }, aes, new TextEncoder().encode(JSON.stringify(book)));
  const key = await wc.subtle.encrypt({ name: 'RSA-OAEP' }, pub, await wc.subtle.exportKey('raw', aes));
  return { v: 1, alg: 'RSA-OAEP-256+A256GCM', key: b64(new Uint8Array(key)), iv: b64(iv), data: b64(new Uint8Array(data)), sealedAt: new Date().toISOString(), version: book.version || null };
}

function check(book) {
  if (!book || !book.properties || !Object.keys(book.properties).length) throw new Error('Not a rate book: needs { properties: {...} }');
  for (const [id, p] of Object.entries(book.properties)) if (!p.rooms || !p.plans || !p.validFrom || !p.validTo) throw new Error(id + ': rooms, plans, validFrom and validTo are required');
}

async function main() {
  const arg = process.argv[2];
  if (arg === '--self-test') {
    const { openSealed } = await import('../worker/lib/amor-rates-store.js');
    const kp = await wc.subtle.generateKey({ name: 'RSA-OAEP', modulusLength: 3072, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['encrypt', 'decrypt']);
    const book = JSON.parse(fs.readFileSync(new URL('../tests/fixtures/amor-rates.sample.json', import.meta.url), 'utf8'));
    const back = await openSealed(await seal(book, await wc.subtle.exportKey('jwk', kp.publicKey)), kp.privateKey);
    if (JSON.stringify(back) !== JSON.stringify(book)) throw new Error('round trip failed');
    console.log('Self-test passed: sealed and opened the sample rate book.'); return;
  }
  if (!arg) throw new Error('Usage: node tools/amor-rates-seal.mjs <private-rates.json>');
  const book = JSON.parse(fs.readFileSync(arg, 'utf8')); check(book);
  const r = await fetch(KEY_URL); if (!r.ok) throw new Error('Worker key not ready (' + r.status + '); deploy the Worker first.');
  fs.writeFileSync(OUT, JSON.stringify(await seal(book, await r.json()), null, 1) + '\n');
  console.log('Sealed ' + Object.keys(book.properties).length + ' properties (' + (book.version || 'no version') + ') into worker/data/amor-rates.sealed.json');
}
if (import.meta.url === 'file://' + process.argv[1]) main().catch((e) => { console.error(e.message); process.exit(1); });
