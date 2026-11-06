import test from 'node:test';
import assert from 'node:assert/strict';
import {createManualUpiInstruction,manualUpiClaimStatus} from '../worker/lib/package-manual-upi.mjs';
import {authorizePackageInstallment,supplierPayoutEligibility} from '../worker/lib/package-payment-guards.mjs';
const booking={id:'package_booking_123',status:'supplier_confirmed',supplierApproved:true,customerTermsAccepted:true,quoteExpiresAt:'2099-01-01T00:00:00Z'};
const installment={status:'unpaid',bookingId:booking.id,amountMinor:125000,ordinal:1};
test('manual UPI disabled unless both merchant-bank verified and feature enabled',()=>{
 assert.equal(createManualUpiInstruction({env:{},booking,installment}).available,false);
 assert.equal(createManualUpiInstruction({env:{PACKAGE_DIRECT_UPI_ENABLED:'true',DIRECT_UPI_VPA:'roamwisepay@ybl'},booking,installment}).available,false);
});
test('manual UPI instruction never confirms payment',()=>{
 const x=createManualUpiInstruction({env:{PACKAGE_DIRECT_UPI_ENABLED:'true',PACKAGE_UPI_MERCHANT_VERIFIED:'true',DIRECT_UPI_VPA:'roamwisepay@ybl'},booking,installment});
 assert.equal(x.available,true);assert.equal(x.paid,false);assert.equal(x.bookingConfirmed,false);
 assert.match(x.uri,/upi:\/\/pay\?/);assert.match(x.uri,/am=1250.00/);assert.equal(manualUpiClaimStatus().paid,false);
});
test('cashfree installment rejects missing agreement even with production flag',()=>{
 const x=authorizePackageInstallment({actorUid:'uid',env:{PACKAGE_CASHFREE_LIVE_ENABLED:'true',CASHFREE_ENV:'production'},quote:{customerUid:'uid',status:'supplier_confirmed',expiresAt:'2099-01-01'},installment});
 assert.equal(x.authorized,false);
});
test('supplier payout never approved without verified settlement',()=>{
 const x=supplierPayoutEligibility({env:{PACKAGE_AUTO_PAYOUT_ENABLED:'true'},booking:{status:'confirmed'},supplier:{verifiedPayee:false},ledger:{providerReconciled:true,availableMinor:100000,supplierDueMinor:100000}});
 assert.equal(x.authorized,false);
});
