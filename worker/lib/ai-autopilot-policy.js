/* Safe model selection policy. Does not call a provider or authorize writes.
 * Caller must enforce spend reservations, tool permissions and review gates. */
const ROUTES=Object.freeze({
 customer_support:{model:'gpt-6-luna',risk:'low',write:false},
 translation:{model:'gpt-6-luna',risk:'low',write:false},
 lead_scoring:{model:'gpt-6.1-terra',risk:'medium',write:false},
 marketing_draft:{model:'gpt-6.1-terra',risk:'medium',write:false},
 itinerary_draft:{model:'gpt-6.1-terra',risk:'medium',write:false},
 code_review:{model:'gpt-6.1-sol',risk:'high',write:false},
 operations_exception:{model:'gpt-6.1-sol',risk:'high',write:false},
 complex_audit:{model:'gpt-6-astra',risk:'high',write:false},
});
const BLOCKED=new Set(['wallet_transfer','refund','partner_payout','supplier_order','expense_payment','publish_unverified_offer','credential_rotation','production_deploy']);
export function routeAiTask({task,requestedAction='draft',verified=false}={}){
 if(BLOCKED.has(requestedAction))return {allowed:false,reason:'deterministic_transaction_required',requiresApproval:true};
 const r=ROUTES[task];
 if(!r)return {allowed:false,reason:'unknown_task',requiresApproval:true};
 if(requestedAction!=='draft'&&requestedAction!=='read')return {allowed:false,reason:'unsupported_action',requiresApproval:true};
 if(!verified&&['operations_exception','complex_audit'].includes(task))return {allowed:false,reason:'source_evidence_required',requiresApproval:true};
 return {allowed:true,model:r.model,risk:r.risk,requiresApproval:r.risk==='high',readOnly:true};
}
export function policyTasks(){return Object.keys(ROUTES);}
