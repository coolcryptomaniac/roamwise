export const CAMPAIGN_KINDS = new Set(['paid', 'hybrid', 'barter']);
export const CAMPAIGN_STATES = Object.freeze({
  DRAFT: 'draft',
  PUBLISHED: 'published',
  OFFER_ACCEPTED: 'offer_accepted',
  FUNDING_PENDING: 'funding_pending',
  FUNDED: 'funded',
  IN_PROGRESS: 'in_progress',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  DISPUTED: 'disputed',
  RELEASE_PENDING: 'release_pending',
  PAID: 'paid',
  REFUNDED: 'refunded',
  CANCELLED: 'cancelled'
});

const ACTIONS = Object.freeze({
  publish: { from: ['draft'], to: 'published', roles: ['brand', 'admin'] },
  accept_offer: { from: ['published'], to: 'offer_accepted', roles: ['brand', 'admin'] },
  start_funding: { from: ['offer_accepted'], to: 'funding_pending', roles: ['brand', 'admin'] },
  confirm_funding: { from: ['funding_pending'], to: 'funded', roles: ['system', 'admin'] },
  start_work: { from: ['funded'], to: 'in_progress', roles: ['creator', 'admin'] },
  submit_work: { from: ['in_progress'], to: 'submitted', roles: ['creator', 'admin'] },
  approve_work: { from: ['submitted'], to: 'approved', roles: ['brand', 'admin'] },
  open_dispute: { from: ['funded', 'in_progress', 'submitted', 'approved'], to: 'disputed', roles: ['brand', 'creator', 'admin'] },
  request_release: { from: ['approved'], to: 'release_pending', roles: ['brand', 'system', 'admin'] },
  confirm_release: { from: ['release_pending'], to: 'paid', roles: ['system', 'admin'] },
  confirm_refund: { from: ['funding_pending', 'funded', 'disputed'], to: 'refunded', roles: ['system', 'admin'] },
  cancel: { from: ['draft', 'published', 'offer_accepted'], to: 'cancelled', roles: ['brand', 'admin'] }
});

export function asMinor(value, field = 'amount') {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 0) throw new Error(`${field} must be a non-negative integer in paise`);
  return number;
}

function text(value, max, field, required = false) {
  const out = String(value || '').trim();
  if (required && !out) throw new Error(`${field} is required`);
  if (out.length > max) throw new Error(`${field} exceeds ${max} characters`);
  return out;
}

export function quoteCampaign(input = {}, config = {}) {
  const kind = String(input.kind || '').toLowerCase();
  if (!CAMPAIGN_KINDS.has(kind)) throw new Error('kind must be paid, hybrid, or barter');
  const creatorFeeMinor = asMinor(input.creatorFeeMinor || 0, 'creatorFeeMinor');
  const travelReimbursementMinor = asMinor(input.travelReimbursementMinor || 0, 'travelReimbursementMinor');
  if (kind === 'barter' && (creatorFeeMinor || travelReimbursementMinor)) throw new Error('Barter campaigns cannot contain a cash fee or reimbursement');
  if (kind !== 'barter' && creatorFeeMinor < 100) throw new Error('Paid and hybrid campaigns require a creator fee');
  const protectedMinor = creatorFeeMinor + travelReimbursementMinor;
  const serviceFeeBps = asMinor(config.serviceFeeBps ?? 1500, 'serviceFeeBps');
  const serviceTaxBps = asMinor(config.serviceTaxBps ?? 0, 'serviceTaxBps');
  const serviceFeeMinor = Math.round(protectedMinor * serviceFeeBps / 10000);
  const serviceTaxMinor = Math.round(serviceFeeMinor * serviceTaxBps / 10000);
  return {
    creatorFeeMinor,
    travelReimbursementMinor,
    protectedMinor,
    serviceFeeMinor,
    serviceTaxMinor,
    totalPayableMinor: protectedMinor + serviceFeeMinor + serviceTaxMinor,
    creatorReceivesMinor: protectedMinor,
    currency: 'INR'
  };
}

export function normalizeCampaign(input = {}, config = {}) {
  const kind = String(input.kind || '').toLowerCase();
  const quote = quoteCampaign({ ...input, kind }, config);
  if (Number(input.creatorSlots || 1) !== 1) throw new Error('Create one protected contract per creator; clone a campaign for multi-creator packs');
  const deliverables = Array.isArray(input.deliverables) ? input.deliverables : [];
  if (!deliverables.length) throw new Error('At least one deliverable is required');
  const normalizedDeliverables = deliverables.slice(0, 20).map((item, index) => ({
    id: text(item.id || `deliverable_${index + 1}`, 60, 'deliverable id', true),
    label: text(item.label, 160, 'deliverable label', true),
    quantity: Math.max(1, Math.min(100, Number(item.quantity) || 1))
  }));
  const usage = String(input.usageRights || 'organic_only').toLowerCase();
  if (!['organic_only', 'paid_ads_30d', 'paid_ads_90d', 'perpetual'].includes(usage)) throw new Error('Unsupported usage-rights option');
  return {
    title: text(input.title, 140, 'title', true),
    destination: text(input.destination, 120, 'destination', true),
    description: text(input.description, 2000, 'description'),
    kind,
    creatorSlots: Math.max(1, Math.min(50, Number(input.creatorSlots) || 1)),
    deliverables: normalizedDeliverables,
    usageRights: usage,
    exclusivityDays: Math.max(0, Math.min(365, Number(input.exclusivityDays) || 0)),
    accommodationNights: Math.max(0, Math.min(90, Number(input.accommodationNights) || 0)),
    mealsIncluded: Boolean(input.mealsIncluded),
    applicationDeadline: text(input.applicationDeadline, 32, 'applicationDeadline'),
    travelStart: text(input.travelStart, 32, 'travelStart'),
    creatorMinimumMinor: asMinor(input.creatorMinimumMinor || 0, 'creatorMinimumMinor'),
    ...quote
  };
}

export function transitionCampaign(current, action, actorRole) {
  const rule = ACTIONS[action];
  if (!rule) throw new Error('Unknown campaign action');
  if (!rule.roles.includes(actorRole)) throw new Error(`${actorRole} cannot ${action}`);
  if (!rule.from.includes(current)) throw new Error(`Cannot ${action} while campaign is ${current}`);
  return rule.to;
}

export function fundingBadge(campaign = {}) {
  if (campaign.kind === 'barter') return { code: 'BARTER', label: 'Barter · opt-in only', funded: false };
  if (['funded', 'in_progress', 'submitted', 'approved', 'disputed', 'release_pending', 'paid'].includes(campaign.status)) {
    return { code: 'FUNDED', label: 'Funds verified by payment provider', funded: true };
  }
  return { code: 'FUNDING_REQUIRED', label: 'Brand payment not yet secured', funded: false };
}

export function buildMilestones(input = {}) {
  const protectedMinor = asMinor(input.protectedMinor || 0, 'protectedMinor');
  if (!protectedMinor) return [];
  const travelMinor = Math.min(asMinor(input.travelReimbursementMinor || 0, 'travelReimbursementMinor'), protectedMinor);
  const remaining = protectedMinor - travelMinor;
  const draftMinor = Math.floor(remaining * 0.4);
  const finalMinor = remaining - draftMinor;
  return [
    ...(travelMinor ? [{ key: 'travel_advance', label: 'Travel reimbursement', amountMinor: travelMinor, trigger: 'creator_check_in' }] : []),
    { key: 'draft_delivery', label: 'Draft content delivered', amountMinor: draftMinor, trigger: 'brand_approval' },
    { key: 'final_delivery', label: 'Final files and links delivered', amountMinor: finalMinor, trigger: 'brand_approval' }
  ].filter(item => item.amountMinor > 0);
}

export function canSeeCampaign(campaign, creator = {}) {
  if (campaign.status !== 'published' && campaign.status !== 'funded') return false;
  const minimum = asMinor(creator.minimumPaidCampaignMinor || 0, 'minimumPaidCampaignMinor');
  if (campaign.kind === 'barter') return creator.acceptsBarter === true;
  return Number(campaign.creatorFeeMinor || 0) >= minimum;
}

export const campaignActions = ACTIONS;
