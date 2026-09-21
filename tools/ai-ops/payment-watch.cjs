'use strict';

// Read-only production smoke check. Never signs in, creates an order, charges,
// grants Pro, logs credentials, or claims that a payment was successful.
const fs = require('node:fs');
const DEFAULT_WORKER = 'https://roamwise-api.founder-f53.workers.dev';

function assessHealth(status, data) {
  if (status !== 200 || !data || data.ok !== true || data.service !== 'roamwise-worker') {
    return 'Worker health endpoint is unavailable or unexpected';
  }
  if (!data.configured || data.configured.cashfree !== true) {
    return 'Worker reports missing Cashfree/Firebase configuration';
  }
  if (data.paymentEnvironment !== 'live') return 'Worker is not in the expected live payment environment';
  return null;
}

function assessAuthBoundary(status, data) {
  if (status !== 401 || !data || data.error !== 'unauthorized') {
    return 'Unauthenticated payment-status request was not rejected with 401';
  }
  return null;
}

async function readJson(fetcher, url) {
  // No Authorization header, payment details, or customer data are sent.
  const response = await fetcher(url, { method: 'GET', redirect: 'error', signal: AbortSignal.timeout(12000) });
  const body = await response.json().catch(() => null);
  return { status: response.status, body };
}

async function runChecks(fetcher, base) {
  const findings = [];
  let url;
  try {
    url = new URL(base || DEFAULT_WORKER);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
      throw new Error('invalid base URL');
    }
  } catch (_) {
    return { ok: false, checks: ['worker-health', 'auth-boundary'], findings: ['Worker URL must be a plain HTTPS origin'], verifiesRealPayment: false };
  }
  try {
    const health = await readJson(fetcher, new URL('/health', url).toString());
    const error = assessHealth(health.status, health.body);
    if (error) findings.push(error);
  } catch (_) {
    findings.push('Worker health request failed');
  }
  try {
    const auth = await readJson(fetcher, new URL('/cashfree/order/rw_readonly_monitor/status', url).toString());
    const error = assessAuthBoundary(auth.status, auth.body);
    if (error) findings.push(error);
  } catch (_) {
    findings.push('Unauthenticated payment-status request failed');
  }
  return { ok: findings.length === 0, checks: ['worker-health', 'auth-boundary'], findings, verifiesRealPayment: false };
}

if (require.main === module) {
  runChecks(global.fetch, process.env.ROAMWISE_WORKER_URL || DEFAULT_WORKER)
    .then(result => {
      fs.writeFileSync('payment-watch-result.json', JSON.stringify(result, null, 2) + '\n');
      console.log(result.ok ? 'Payment health smoke check passed (no charge attempted).' : 'Payment health smoke check failed: ' + result.findings.join('; '));
      process.exitCode = result.ok ? 0 : 1;
    })
    .catch(() => {
      const result = { ok: false, checks: ['worker-health', 'auth-boundary'], findings: ['Monitor itself failed'], verifiesRealPayment: false };
      fs.writeFileSync('payment-watch-result.json', JSON.stringify(result, null, 2) + '\n');
      console.error('Payment health monitor failed without exposing response contents.');
      process.exitCode = 1;
    });
}

module.exports = { assessHealth, assessAuthBoundary, runChecks };
