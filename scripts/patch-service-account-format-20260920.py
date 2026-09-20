#!/usr/bin/env python3
from pathlib import Path
p=Path('worker/lib/service-account.js')
s=p.read_text(encoding='utf-8')
old='''  let sa;
  try {
    sa = JSON.parse(raw);
  } catch (e) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON');
  }
  if (!sa.client_email || !sa.private_key || !sa.project_id) {
'''
new='''  // Cloudflare secrets can be pasted as raw JSON or a Base64-encoded JSON
  // payload. The old implementation treated encoded values as "configured"
  // in /health, but failed every payment during server OAuth with a bogus
  // "sign-in expired" error. Decode only this private server-side secret;
  // never echo the key or the input back to a client or log.
  let sa;
  try { sa = JSON.parse(raw); } catch (_) { /* may be Base64 JSON */ }
  if (typeof sa === 'string') {
    try { sa = JSON.parse(sa); } catch (_) { /* a JSON string of Base64 */ }
  }
  if (!sa || typeof sa !== 'object' || Array.isArray(sa)) {
    const encoded = String(typeof sa === 'string' ? sa : raw).trim().replace(/\\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
    if (encoded.length > 65536 || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON or Base64 JSON');
    }
    try {
      const bytes = Uint8Array.from(atob(encoded), c => c.charCodeAt(0));
      sa = JSON.parse(new TextDecoder().decode(bytes));
    } catch (_) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON or Base64 JSON');
    }
  }
  if (!sa || typeof sa !== 'object' || Array.isArray(sa) || !sa.client_email || !sa.private_key || !sa.project_id) {
'''
assert s.count(old)==1, f'expected exact snippet once; found {s.count(old)}'
p.write_text(s.replace(old,new),encoding='utf-8')
print('Firebase service-account parser supports raw JSON and Base64 JSON, without exposing secrets.')
