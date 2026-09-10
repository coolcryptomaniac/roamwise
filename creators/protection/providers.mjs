const PROVIDERS = Object.freeze({
  cashfree_easy_split: {
    label: 'Cashfree Easy Split',
    kind: 'marketplace_settlement',
    currency: 'INR',
    trueEscrow: false,
    docs: 'https://www.cashfree.com/docs/api-reference/payments/latest/split/easy-split-overview'
  },
  razorpay_route: {
    label: 'Razorpay Route',
    kind: 'marketplace_settlement',
    currency: 'INR',
    trueEscrow: false,
    docs: 'https://razorpay.com/route/'
  },
  bank_escrow: {
    label: 'Bank-led digital escrow',
    kind: 'escrow',
    currency: 'INR',
    trueEscrow: true,
    docs: 'https://castler.com/'
  }
});

function required(value, name) {
  if (!String(value || '').trim()) throw new Error(`${name} is not configured`);
  return String(value).trim();
}

function cashfreeBase(env) {
  return String(env.CASHFREE_ENV || 'sandbox') === 'live' ? 'https://api.cashfree.com' : 'https://sandbox.cashfree.com';
}

async function jsonRequest(url, init, provider) {
  const response = await fetch(url, init);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.message || body.error_description || `${provider} request failed`);
    error.status = response.status;
    error.provider = provider;
    throw error;
  }
  return body;
}

function cashfreeHeaders(env, key) {
  return {
    'content-type': 'application/json',
    'x-api-version': env.CASHFREE_API_VERSION || '2026-01-01',
    'x-client-id': required(env.CASHFREE_APP_ID, 'CASHFREE_APP_ID'),
    'x-client-secret': required(env.CASHFREE_SECRET_KEY, 'CASHFREE_SECRET_KEY'),
    'x-request-id': key,
    'x-idempotency-key': key
  };
}

export function providerCatalog() {
  return Object.fromEntries(Object.entries(PROVIDERS).map(([id, provider]) => [id, { ...provider }]));
}

export function resolveProvider(env = {}) {
  const id = String(env.CREATOR_PROTECTION_PROVIDER || 'cashfree_easy_split');
  const provider = PROVIDERS[id];
  if (!provider) throw new Error('Unsupported creator protection provider');
  const approved = String(env.CREATOR_PROTECTED_HOLD_APPROVED || '').toLowerCase() === 'true';
  if (!approved) throw new Error('Protected-hold capability is not contractually approved. Keep campaigns in waitlist mode.');
  if (id === 'bank_escrow') {
    required(env.ESCROW_PROVIDER_API_BASE, 'ESCROW_PROVIDER_API_BASE');
    required(env.ESCROW_PROVIDER_API_KEY, 'ESCROW_PROVIDER_API_KEY');
  }
  return { id, ...provider };
}

export async function createCashfreeFundingOrder(campaign, brand, env, key) {
  const base = cashfreeBase(env);
  const body = {
    order_id: `rwcc_${campaign.id}`.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 45),
    order_amount: Number((campaign.totalPayableMinor / 100).toFixed(2)),
    order_currency: 'INR',
    customer_details: {
      customer_id: String(brand.uid).replace(/[^A-Za-z0-9_-]/g, '').slice(0, 45),
      customer_phone: required(brand.phone, 'brand phone').replace(/\D/g, '').slice(-10),
      customer_email: required(brand.email, 'brand email').slice(0, 160)
    },
    order_note: `RoamWise funded creator campaign ${campaign.id}`.slice(0, 180),
    order_meta: env.CREATOR_PAYMENT_RETURN_URL ? { return_url: env.CREATOR_PAYMENT_RETURN_URL } : undefined,
    order_tags: { campaign_id: campaign.id, protection: 'creator_campaign' }
  };
  const result = await jsonRequest(`${base}/pg/orders`, {
    method: 'POST', headers: cashfreeHeaders(env, key), body: JSON.stringify(body)
  }, 'cashfree_easy_split');
  return {
    provider: 'cashfree_easy_split',
    providerRef: result.order_id,
    checkout: { kind: 'cashfree_session', paymentSessionId: result.payment_session_id, orderId: result.order_id, environment: base.includes('sandbox') ? 'sandbox' : 'production' }
  };
}

export async function releaseCashfreeToCreator(campaign, creator, env, key) {
  if (String(env.CASHFREE_DELAYED_SPLIT_APPROVED || '').toLowerCase() !== 'true') {
    throw new Error('Cashfree delayed split is not enabled for this merchant contract');
  }
  const vendorId = required(creator.providerVendorId, 'creator providerVendorId');
  const creatorPercentage = Number((campaign.creatorReceivesMinor * 100 / campaign.totalPayableMinor).toFixed(4));
  const split = [{ vendor_id: vendorId, percentage: creatorPercentage, tags: { campaign_id: campaign.id } }];
  return jsonRequest(`${cashfreeBase(env)}/pg/easy-split/orders/${encodeURIComponent(campaign.providerRef)}/split`, {
    method: 'POST', headers: cashfreeHeaders(env, key), body: JSON.stringify({ split, disable_split: true })
  }, 'cashfree_easy_split');
}

export async function createBankEscrowInstruction(campaign, brand, env, key) {
  const base = required(env.ESCROW_PROVIDER_API_BASE, 'ESCROW_PROVIDER_API_BASE').replace(/\/+$/, '');
  return jsonRequest(`${base}/transactions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${required(env.ESCROW_PROVIDER_API_KEY, 'ESCROW_PROVIDER_API_KEY')}`, 'idempotency-key': key },
    body: JSON.stringify({
      external_id: campaign.id,
      currency: 'INR',
      amount_minor: campaign.totalPayableMinor,
      beneficiary_amount_minor: campaign.creatorReceivesMinor,
      payer: { external_id: brand.uid, email: brand.email },
      release_policy: { type: 'milestones', milestones: campaign.milestones }
    })
  }, 'bank_escrow');
}

export async function createFundingOrder(campaign, brand, env, key) {
  const provider = resolveProvider(env);
  if (provider.id === 'cashfree_easy_split') return createCashfreeFundingOrder(campaign, brand, env, key);
  if (provider.id === 'bank_escrow') return createBankEscrowInstruction(campaign, brand, env, key);
  throw new Error('Razorpay Route adapter requires merchant-specific Route account terms before activation');
}

export async function releaseToCreator(campaign, creator, env, key) {
  const provider = resolveProvider(env);
  if (provider.id === 'cashfree_easy_split') return releaseCashfreeToCreator(campaign, creator, env, key);
  if (provider.id === 'bank_escrow') {
    const base = required(env.ESCROW_PROVIDER_API_BASE, 'ESCROW_PROVIDER_API_BASE').replace(/\/+$/, '');
    return jsonRequest(`${base}/transactions/${encodeURIComponent(campaign.providerRef)}/release`, {
      method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${required(env.ESCROW_PROVIDER_API_KEY, 'ESCROW_PROVIDER_API_KEY')}`, 'idempotency-key': key },
      body: JSON.stringify({ external_id: campaign.id, beneficiary_id: creator.providerVendorId, amount_minor: campaign.creatorReceivesMinor })
    }, 'bank_escrow');
  }
  throw new Error('Provider release adapter is unavailable');
}
