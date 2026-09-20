/* Cashfree transport diagnostics: log only fixed classifications and a safe
 * system error code. Never log request headers, body, response, raw exception,
 * customer details, credentials, tokens, or Cashfree payment-session IDs. */
export function classifyCashfreeTransportError(error){
  const message=String(error && error.message || '');
  const causeMessage=String(error && error.cause && error.cause.message || '');
  const text=(message+' '+causeMessage).toLowerCase();
  let category='unknown';
  if(/dns|enotfound|eai_again|name resolution/.test(text)) category='dns';
  else if(/certificate|tls|ssl|cert_/.test(text)) category='tls';
  else if(/timed? ?out|abort|etimedout/.test(text)) category='timeout';
  else if(/refused|econnreset|socket|connect/.test(text)) category='connection';
  else if(/forbidden|blocked|denied/.test(text)) category='blocked';
  const candidate=error && (error.cause && error.cause.code || error.code);
  const code=typeof candidate==='string' && /^[A-Z0-9_]{1,40}$/.test(candidate) ? candidate : 'unknown';
  return {category,code};
}

export async function cashfreeTransportFetch(url, options, transport=fetch, report=console.error){
  try { return await transport(url,options); }
  catch(error){
    const operation=options && options.method==='GET' ? 'get_order' : 'create_order';
    report('cashfree_transport_failure', {operation,...classifyCashfreeTransportError(error)});
    throw error;
  }
}
