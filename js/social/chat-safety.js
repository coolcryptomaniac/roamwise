/* ============================================================================
   js/social/chat-safety.js — scam shield for trip chats
   ============================================================================
   Trip chats can include people you met through a beacon or a shared link.
   When someone ELSE's message asks for money, an OTP/PIN, a UPI ID, bank
   details or an outside payment link, the bubble gets a short warning with a
   one-tap report. Nothing is blocked or hidden: friends sharing a UPI ID still
   see it, they just see the reminder too. Pure client-side, no storage.

   Globals (classic script, see CLAUDE.md): rwChatRisk(text), rwChatRiskHTML(text).
   ========================================================================= */
var RW_CHAT_RISKS = [
  { why: 'asks for an OTP or PIN', re: /\b(otp|one[\s-]?time password|upi pin|atm pin|cvv)\b/i },
  { why: 'shares a UPI ID', re: /\b[a-z0-9._-]{2,}@(ok[a-z]+|ybl|ibl|axl|upi|paytm|apl|yapl|ptyes|ptsbi|pthdfc|ptaxis|jupiteraxis|fbl|kotak|icici|sbi|hdfcbank|axisbank|airtel|freecharge)\b/i },
  { why: 'shares bank details', re: /\b(ifsc|account\s*(no|number)|a\/c\s*no)\b|\b[A-Z]{4}0[A-Z0-9]{6}\b/ },
  { why: 'asks you to send money', re: /\b(send|transfer|pay)\b[^.?!]{0,30}\b(money|amount|advance|deposit|token amount|rs\.?|₹|inr)|\b(gift ?card|crypto|usdt|bitcoin)\b/i },
  { why: 'has an outside payment link', re: /\b(rzp\.io|razorpay\.me|paytm\.me|upi:\/\/pay|pay\.google\.com|phon\.pe|paypal\.me|bit\.ly|tinyurl\.com)\b/i }
];

function rwChatRisk(text){
  var t = String(text == null ? '' : text);
  for(var i = 0; i < RW_CHAT_RISKS.length; i++){ if(RW_CHAT_RISKS[i].re.test(t)) return RW_CHAT_RISKS[i].why; }
  return '';
}

function rwChatRiskHTML(text){
  var why = rwChatRisk(text);
  if(!why) return '';
  return '<div class="tc-risk" style="margin-top:6px;padding:6px 8px;border-radius:8px;background:rgba(248,113,113,.10);border:1px solid rgba(248,113,113,.35);font-size:11px;line-height:1.45;color:var(--t2)">'
    + '⚠️ This message ' + why + '. Never share OTPs or PINs, and pay bookings only on roamwise.co.in. '
    + '<button onclick="rwReportOpen({room:window._chatRoom})" style="background:none;border:0;color:#F87171;font-weight:700;font-size:11px;padding:0;cursor:pointer">Report</button></div>';
}

if(typeof module !== 'undefined' && module.exports){ module.exports = { rwChatRisk: rwChatRisk }; }
