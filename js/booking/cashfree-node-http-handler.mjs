// Node HTTP adapter for a trusted server route. It never parses JSON before
// Cashfree signature validation. The caller must configure TLS, routing and secrets.
export function createCashfreeNodeHttpHandler(processEvent, { maxBytes = 65536 } = {}) {
 if (typeof processEvent !== 'function') throw new TypeError('Event processor required');
 if (!Number.isSafeInteger(maxBytes) || maxBytes < 1024 || maxBytes > 1048576) throw new RangeError('Invalid body limit');
 return async (req, res) => {
   const reply = (status, body) => {
     res.statusCode = status;
     res.setHeader('content-type', 'application/json; charset=utf-8');
     res.end(JSON.stringify(body));
   };
   if (req.method !== 'POST') return reply(405, { confirmed:false, reason:'method_not_allowed' });
   const declared = Number(req.headers['content-length']);
   if (Number.isFinite(declared) && declared > maxBytes) return reply(413, { confirmed:false, reason:'payload_too_large' });
   const chunks=[];let bytes=0;
   try {
     for await (const chunk of req) {
       bytes += chunk.length;
       if (bytes > maxBytes) return reply(413, { confirmed:false, reason:'payload_too_large' });
       chunks.push(chunk);
     }
     const result=await processEvent({ rawBody:Buffer.concat(chunks), headers:req.headers });
     if (!result || !Number.isInteger(result.status) || result.status < 200 || result.status > 599)
       throw new Error('Invalid processor result');
     return reply(result.status, result.body || { confirmed:false });
   } catch {
     return reply(500, { confirmed:false, reason:'internal_error' });
   }
 };
}
