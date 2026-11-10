/* RoamWise operating-account policy. Only masked bank identifiers in source.
 * This module never initiates payments, payouts or beneficiary changes.
 */
export const OPERATING_ACCOUNT=Object.freeze({bank:'HDFC Bank',last4:'8061',purpose:'business_current_account',cashfreeSettlement:'active_in_founder_screenshot_2026-11-10',upi:'roamwisepay@ybl',upiLinkedAccountVerified:false,payoutsActivated:false});
const MUTATIONS=new Set(['payout','refund','beneficiary_change','bank_account_change','supplier_payment','subscription_charge','wallet_transfer']);
export function assessMoneyAction({action,founderApproved=false,providerSupported=false,verifiedAccountLast4='',beneficiaryVerified=false}={}){
 if(!MUTATIONS.has(action))return {allowed:false,reason:'unsupported_action'};
 if(!founderApproved)return {allowed:false,reason:'founder_approval_required'};
 if(!providerSupported)return {allowed:false,reason:'provider_capability_unverified'};
 if(verifiedAccountLast4!==OPERATING_ACCOUNT.last4)return {allowed:false,reason:'operating_account_mismatch'};
 if(!beneficiaryVerified)return {allowed:false,reason:'beneficiary_unverified'};
 return {allowed:true,reason:'policy_checks_passed_requires_provider_execution_controls'};
}
export function classifyBankActivity({source,verifiedCustomerPayment=false,verifiedSupplierInvoice=false,transferBetweenOwnAccounts=false}={}){
 if(transferBetweenOwnAccounts)return {revenue:false,expense:false,classification:'internal_transfer'};
 if(source==='collection'&&verifiedCustomerPayment)return {revenue:true,expense:false,classification:'verified_sale'};
 if(source==='expense'&&verifiedSupplierInvoice)return {revenue:false,expense:true,classification:'verified_business_expense'};
 return {revenue:false,expense:false,classification:'unverified_do_not_count'};
}
