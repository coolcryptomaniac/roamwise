import { createHmac, timingSafeEqual } from 'node:crypto';

// Cashfree webhook signature: base64(HMAC-SHA256(secret, timestamp + raw body)).
// Verify ORIGINAL bytes; JSON re-serialization changes the signed payload.
export function createCashfreeWebhookVerifier(secret, { maxClockSkewSeconds = 300, now = () => Date.now() } = {}) {
 if (typeof secret !== 'string' || secret.length < 16) throw new TypeError('Cashfree webhook signing secret required');
 if (!Number.isSafeInteger(maxClockSkewSeconds) || maxClockSkewSeconds < 0) throw new RangeError('Invalid skew');
 return async ({ rawBody, headers }) => {
   if (!Buffer.isBuffer(rawBody) || !headers || typeof headers !== 'object') return false;
   const normalized = Object.fromEntries(Object.entries(headers).map(([k,v])=>[k.toLowerCase(),v]));
   const timestamp = normalized['x-webhook-timestamp'];
   const signature = normalized['x-webhook-signature'];
   if (typeof timestamp !== 'string' || !/^\d{10}$/.test(timestamp) || typeof signature !== 'string' || !/^[A-Za-z0-9+/]{43}=$/.test(signature)) return false;
   const seconds = Number(timestamp);
   if (!Number.isSafeInteger(seconds) || Math.abs(now() / 1000 - seconds) > maxClockSkewSeconds) return false;
   const actual = Buffer.from(signature, 'base64');
   const expected = createHmac('sha256', secret).update(timestamp, 'utf8').update(rawBody).digest();
   return actual.length === expected.length && timingSafeEqual(actual, expected);
 };
}
