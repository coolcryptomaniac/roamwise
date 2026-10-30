// Normalize a Cashfree PAYMENT_SUCCESS_WEBHOOK event into the internal booking
// payment shape. Booking identity must be resolved from trusted order storage,
// never from customer-controlled webhook metadata.
export function normalizeCashfreePaymentEvent(webhook, booking) {
 if (!webhook || webhook.type !== 'PAYMENT_SUCCESS_WEBHOOK') return { accepted:false, reason:'unsupported_event' };
 const data=webhook.data;
 const order=data?.order, payment=data?.payment;
 if (!order || !payment || typeof order.order_id !== 'string' || !order.order_id ||
     typeof payment.cf_payment_id !== 'string' && typeof payment.cf_payment_id !== 'number')
   return { accepted:false, reason:'invalid_payload' };
 if (!booking || booking.orderId !== order.order_id || !/^[a-zA-Z0-9_-]{8,100}$/.test(String(booking.id||'')))
   return { accepted:false, reason:'unknown_order' };
 // Cashfree payment IDs must be canonical decimal integers; do not allow
 // scientific notation, fractions or objects to become claim document IDs.
 const paymentId=String(payment.cf_payment_id);
 if (!/^[0-9]{1,30}$/.test(paymentId) ||
     (typeof payment.cf_payment_id === 'number' && (!Number.isSafeInteger(payment.cf_payment_id) || payment.cf_payment_id <= 0)) ||
     /^0+$/.test(paymentId)) return { accepted:false, reason:'invalid_payment_id' };
 const amount=Number(order.order_amount);
 if (!Number.isFinite(amount) || amount <= 0 || !Number.isSafeInteger(Math.round(amount*100)) ||
     Math.abs(amount*100-Math.round(amount*100))>1e-7)
   return { accepted:false, reason:'invalid_amount' };
 return { accepted:true, payload:{
   bookingId:booking.id, amountMinor:Math.round(amount*100),
   event:{orderId:order.order_id,status:payment.payment_status === 'SUCCESS'?'SUCCESS':'NOT_PAID',
     currency:order.order_currency,paymentId},
 } };
}
