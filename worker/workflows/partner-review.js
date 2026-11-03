import { WorkflowEntrypoint } from 'cloudflare:workers';

// Safe pilot: durable approval waiting, no automated sending or external side effects.
// Workflow is defined for manual, authenticated evaluation only.
export class RoamWisePartnerReviewWorkflow extends WorkflowEntrypoint {
  async run(event, step) {
    const p = event.payload || {};
    const review = await step.do('validate partner submission', async () => {
      const kind = String(p.category || '');
      if (!['properties','creators','business'].includes(kind)) throw new Error('invalid_category');
      if (typeof p.leadId !== 'string' || !/^[a-zA-Z0-9_-]{6,100}$/.test(p.leadId)) throw new Error('invalid_lead_id');
      return { leadId:p.leadId, category:kind, submittedAt:new Date().toISOString() };
    });
    const approval = await step.waitForEvent('await staff review', { event:'review-decision',timeout:'7 days' });
    const decision = await step.do('record decision', async () => ({
      leadId: review.leadId, category:review.category,
      approved: approval?.payload?.approved === true,
      note: 'Decision only. Never sends AgentMail, publishes listings, or transfers funds.'
    }));
    return decision;
  }
}
