export const ITEM_TYPES = Object.freeze(['partner', 'automation', 'support', 'compliance']);
export const ITEM_STATUSES = Object.freeze(['research', 'pending', 'active', 'blocked', 'resolved', 'retired']);

function clean(value, max, field, required = false) {
  const out = String(value || '').trim();
  if (required && !out) throw new Error(field + ' is required');
  if (out.length > max) throw new Error(field + ' exceeds ' + max + ' characters');
  return out;
}

function nonNegative(value, field) {
  const number = Number(value || 0);
  if (!Number.isSafeInteger(number) || number < 0) throw new Error(field + ' must be a non-negative integer');
  return number;
}

export function followTheSunRegion(date = new Date()) {
  const hour = date.getUTCHours();
  if (hour < 8) return 'APAC';
  if (hour < 16) return 'EMEA';
  return 'AMER';
}

export function requiresHuman(category) {
  return ['safety', 'payment', 'refund', 'security', 'privacy', 'legal', 'account_access'].includes(String(category || '').toLowerCase());
}

export function classifySupport(input = {}, date = new Date()) {
  const subject = clean(input.subject, 180, 'subject', true);
  const message = clean(input.message, 5000, 'message', true);
  const haystack = (subject + ' ' + message).toLowerCase();
  const groups = [
    { category: 'safety', priority: 'critical', words: ['sos', 'emergency', 'lost trekker', 'injury', 'injured', 'unsafe', 'medical emergency'] },
    { category: 'security', priority: 'critical', words: ['hacked', 'data breach', 'stolen account', 'credential', 'unauthorized access'] },
    { category: 'privacy', priority: 'high', words: ['privacy', 'delete my data', 'personal data', 'consent'] },
    { category: 'refund', priority: 'high', words: ['refund', 'chargeback', 'money back'] },
    { category: 'payment', priority: 'high', words: ['charged', 'payment failed', 'double charged', 'payout', 'escrow'] },
    { category: 'account_access', priority: 'high', words: ['cannot login', "can't login", 'locked out', 'otp', 'verification code'] },
    { category: 'legal', priority: 'high', words: ['legal notice', 'regulator', 'subpoena', 'compliance complaint'] },
    { category: 'booking', priority: 'normal', words: ['booking', 'cancel hotel', 'flight change', 'reservation'] }
  ];
  const match = groups.find(group => group.words.some(word => haystack.includes(word)));
  const category = match ? match.category : 'general';
  const priority = match ? match.priority : 'normal';
  const humanGate = requiresHuman(category);
  return {
    category,
    priority,
    queueRegion: followTheSunRegion(date),
    humanGate,
    aiMayDraft: Boolean(input.aiConsent) && !['safety', 'security', 'legal'].includes(category),
    acknowledgement: humanGate
      ? 'Your request is logged and routed to a human operator. No financial, legal, safety or account-access action will be taken automatically.'
      : 'Your request is logged. Automation may prepare a response, with escalation available to a human operator.'
  };
}

export function normalizeItem(input = {}, now = new Date()) {
  const type = String(input.type || '').toLowerCase();
  const status = String(input.status || 'pending').toLowerCase();
  if (!ITEM_TYPES.includes(type)) throw new Error('Unsupported global-operations item type');
  if (!ITEM_STATUSES.includes(status)) throw new Error('Unsupported global-operations item status');
  const priority = String(input.priority || 'normal').toLowerCase();
  if (!['low', 'normal', 'high', 'critical'].includes(priority)) throw new Error('Unsupported priority');
  return {
    type,
    name: clean(input.name, 180, 'name', true),
    detail: clean(input.detail, 5000, 'detail'),
    contact: clean(input.contact, 220, 'contact'),
    provider: clean(input.provider, 160, 'provider'),
    owner: clean(input.owner, 120, 'owner'),
    region: clean(input.region || 'GLOBAL', 40, 'region'),
    status,
    priority,
    humanGate: Boolean(input.humanGate),
    monthlyCostMinor: nonNegative(input.monthlyCostMinor, 'monthlyCostMinor'),
    dueAt: clean(input.dueAt, 40, 'dueAt'),
    evidenceUrl: clean(input.evidenceUrl, 800, 'evidenceUrl'),
    sourceUrl: clean(input.sourceUrl, 800, 'sourceUrl'),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };
}

export function normalizeSettings(input = {}) {
  const coreHeadcount = nonNegative(input.coreHeadcount, 'coreHeadcount');
  const headcountCap = nonNegative(input.headcountCap || 20, 'headcountCap');
  if (headcountCap < 5 || headcountCap > 20) throw new Error('headcountCap must stay between 5 and 20');
  return {
    coreHeadcount,
    contractorCount: nonNegative(input.contractorCount, 'contractorCount'),
    headcountCap,
    ownedAssetCount: nonNegative(input.ownedAssetCount, 'ownedAssetCount'),
    recurringWorkflowCount: nonNegative(input.recurringWorkflowCount, 'recurringWorkflowCount'),
    monthlyToolBudgetMinor: nonNegative(input.monthlyToolBudgetMinor, 'monthlyToolBudgetMinor'),
    updatedAt: new Date().toISOString()
  };
}

export function computeMetrics(settings = {}, items = [], now = new Date()) {
  const active = items.filter(item => !['resolved', 'retired'].includes(item.status));
  const automations = items.filter(item => item.type === 'automation');
  const activeAutomations = automations.filter(item => item.status === 'active').length;
  const workflowCount = Number(settings.recurring_workflow_count ?? settings.recurringWorkflowCount ?? 0);
  const monthlyCostMinor = items
    .filter(item => ['active', 'pending'].includes(item.status))
    .reduce((sum, item) => sum + Number(item.monthly_cost_minor ?? item.monthlyCostMinor ?? 0), 0);
  const overdueCompliance = active.filter(item => item.type === 'compliance' && item.due_at && Date.parse(item.due_at) < now.getTime());
  const critical = active.filter(item => item.priority === 'critical');
  const humanQueue = active.filter(item => item.human_gate || item.humanGate);
  const headcount = Number(settings.core_headcount ?? settings.coreHeadcount ?? 0);
  const cap = Number(settings.headcount_cap ?? settings.headcountCap ?? 20);
  const ownedAssets = Number(settings.owned_asset_count ?? settings.ownedAssetCount ?? 0);
  return {
    coreHeadcount: headcount,
    headcountCap: cap,
    headcountWithinCap: headcount <= cap,
    ownedAssetCount: ownedAssets,
    assetLightTargetMet: ownedAssets === 0,
    automationCoveragePct: workflowCount ? Math.min(100, Math.round(activeAutomations * 100 / workflowCount)) : 0,
    openSupport: active.filter(item => item.type === 'support').length,
    overdueCompliance: overdueCompliance.length,
    humanApprovalQueue: humanQueue.length,
    criticalRisks: critical.length,
    monthlyToolCostMinor: monthlyCostMinor,
    monthlyToolBudgetMinor: Number(settings.monthly_tool_budget_minor ?? settings.monthlyToolBudgetMinor ?? 0),
    healthy: headcount <= cap && ownedAssets === 0 && overdueCompliance.length === 0 && critical.length === 0
  };
}

export function riskSweep(items = [], now = new Date()) {
  const cutoff = now.getTime() + 72 * 60 * 60 * 1000;
  return items.filter(item => {
    if (['resolved', 'retired'].includes(item.status)) return false;
    if (item.priority === 'critical') return true;
    const due = Date.parse(item.due_at || item.dueAt || '');
    return Number.isFinite(due) && due <= cutoff;
  }).map(item => ({
    id: item.id,
    type: item.type,
    name: item.name,
    priority: item.priority,
    reason: item.priority === 'critical' ? 'critical_priority' : 'due_within_72_hours'
  }));
}
