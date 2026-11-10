/* No bank or UPI settlement destination is ever inferred from a public UPI handle.
 * This policy is read-only and must be verified in Cashfree merchant account.
 */
export const REQUESTED_COLLECTION_UPI='roamwisepay@ybl';
export function settlementReadiness({bankVerified=false,cashfreeMerchantBankVerified=false,upiOwnershipVerified=false,beneficiaryNameMatches=false}={}){
 const checks={bankVerified:bankVerified===true,cashfreeMerchantBankVerified:cashfreeMerchantBankVerified===true,upiOwnershipVerified:upiOwnershipVerified===true,beneficiaryNameMatches:beneficiaryNameMatches===true};
 return {ready:Object.values(checks).every(Boolean),checks,requestedUpi:REQUESTED_COLLECTION_UPI,canChangePayouts:false,reason:Object.values(checks).every(Boolean)?'verification_complete_no_mutation':'merchant_bank_and_upi_verification_required'};
}
