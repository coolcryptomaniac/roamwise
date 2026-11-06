// Payment-link handoff for a confirmed package quote.
// A real Cashfree link must be generated in the authenticated merchant dashboard
// or on a secured server. Do not invent payment links or accept arbitrary URLs.
const allowedHosts=new Set(['payments.cashfree.com','payment-links.cashfree.com','link.cashfree.com','www.cashfree.com']);
export function validateMerchantPaymentLink(raw){
 try{const u=new URL(raw);return u.protocol==='https:'&&!u.username&&!u.password&&allowedHosts.has(u.hostname)&&u.pathname.length>1&&u.searchParams.size<30;}catch{return false;}
}
export function createWhatsAppPackagePaymentMessage({bookingId,customerName,amountMinor,currency='INR',cashfreeUrl,mode='deposit',refundPolicyUrl='https://roamwise.co.in/escapes/#booking-policy'}){
 if(!/^[a-zA-Z0-9_-]{8,80}$/.test(String(bookingId||''))||
 !Number.isSafeInteger(amountMinor)||amountMinor<100||currency!=='INR'||
 !validateMerchantPaymentLink(cashfreeUrl)||!['deposit','full','balance'].includes(mode))throw Error('Unverified booking or link');
 const money=(amountMinor/100).toFixed(2);
 const label=String(customerName||'traveller').trim().slice(0,50);
 const message='Hello '+label+', your RoamWise '+mode+' payment for booking '+bookingId+
 ' is ₹'+money+'. Please pay only through this Cashfree link: '+cashfreeUrl+
 '. Review your approved quotation, due dates and refund policy before paying: '+refundPolicyUrl+
 '. Payment confirmation will follow once Cashfree verifies the receipt. For help: support@roamwise.co.in';
 return {message,shareUrl:'https://wa.me/?text='+encodeURIComponent(message),verifiedPayment:false};
}
