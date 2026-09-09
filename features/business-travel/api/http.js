/* Bounded JSON input and private, non-cacheable JSON responses. */
const MAX_BODY = 131072;
export function reply(value, status = 200, extra = {}) {
  return new Response(JSON.stringify(value), { status, headers: {
    'Content-Type': 'application/json', 'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff', ...extra
  } });
}
export async function body(request) {
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') || '')) throw { status: 415, code: 'json_required' };
  if (Number(request.headers.get('content-length')) > MAX_BODY) throw { status: 413, code: 'body_too_large' };
  if (!request.body) throw { status: 400, code: 'report_required' };
  const reader = request.body.getReader();
  let timer;
  try {
    return await Promise.race([
      (async () => {
        const chunks = []; let size = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > MAX_BODY) throw { status: 413, code: 'body_too_large' };
          chunks.push(value);
        }
        const bytes = new Uint8Array(size); let offset = 0;
        for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
        try { return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); }
        catch (_) { throw { status: 400, code: 'invalid_json' }; }
      })(),
      new Promise((_, reject) => { timer = setTimeout(() => reject({ status: 408, code: 'body_timeout' }), 5000); })
    ]);
  } finally { clearTimeout(timer); reader.cancel().catch(() => {}); }
}
