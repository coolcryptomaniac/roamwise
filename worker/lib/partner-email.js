/* ============================================================================
   worker/lib/partner-email.js — RoamWise-branded HTML emails for partners
   ============================================================================
   One template for every automated partner message (creators now; artists and
   properties use the same shell). Plain-text twin always included. Never puts
   prices, supplier rates, phone numbers or other partners' contacts in mail.
   Named exports only. */
const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const SITE = 'https://roamwise.co.in';

/* The promotion strip rotates weekly so repeat readers see something new. */
export const PROMOS = Object.freeze([
  { title: 'Founding Traveller Credit', text: 'Prepay travel credit and get bonus value on future RoamWise trips.', url: SITE + '/credit/' },
  { title: 'Ailon Tusk, our AI trip planner', text: 'Plan a Himalayan trip in a minute and book signed stays.', url: SITE + '/' },
  { title: 'Signed stays in the Himalaya', text: 'Hand-picked stays in Kumaon, Corbett, Himachal and Gir.', url: SITE + '/escapes/' },
]);
export function promoFor(date = new Date()){
  const week = Math.floor(date.getTime() / (7 * 864e5));
  return PROMOS[week % PROMOS.length];
}

export function firstName(name){ return String(name || '').trim().split(/\s+/)[0].slice(0, 30) || 'there'; }

/** kind: 'match' | 'profile'. Returns { subject, html, text }. */
export function partnerEmail({ kind, name, propertyName, unsubUrl, now = new Date() }){
  const hi = firstName(name), promo = promoFor(now);
  const copy = kind === 'match' ? {
    subject: `A stay collaboration for you at ${propertyName}`.slice(0, 90),
    lead: `Good news, ${hi}: ${propertyName} is looking for creators like you, and our matcher put you near the top.`,
    body: 'It is a hosted stay in exchange for honest content. Reply to this email and we will share the dates, what the stay includes and what they would like you to create. Nothing is booked until you say yes.',
    cta: 'Reply to say interested', ctaUrl: 'mailto:support@roamwise.co.in?subject=' + encodeURIComponent('Interested: ' + propertyName),
  } : {
    subject: 'One detail to start matching you with stays',
    lead: `Thanks for joining the RoamWise creator network, ${hi}.`,
    body: 'We match creators with partner stays nearest them first, and your profile has no home town yet. Reply with your town (and your WhatsApp number if you would like quicker updates), and we will start sending you collaborations that fit.',
    cta: 'Reply with your town', ctaUrl: 'mailto:support@roamwise.co.in?subject=' + encodeURIComponent('My home town'),
  };
  const html = `<!doctype html><html><body style="margin:0;background:#f4efe6;font-family:Arial,Helvetica,sans-serif;color:#1d1d1f">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4efe6;padding:24px 0"><tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden">
<tr><td style="background:#0b0f14;padding:18px 24px"><span style="color:#E8BA6C;font-size:20px;font-weight:bold;letter-spacing:.3px">Roam<span style="color:#ffffff">Wise</span></span><br><span style="color:#b9b2a6;font-size:12px">Travel the Himalaya, smarter</span></td></tr>
<tr><td style="padding:26px 24px 8px;font-size:17px;line-height:1.5;font-weight:bold">${esc(copy.lead)}</td></tr>
<tr><td style="padding:4px 24px 18px;font-size:15px;line-height:1.6;color:#3a3a3c">${esc(copy.body)}</td></tr>
<tr><td style="padding:0 24px 24px"><a href="${esc(copy.ctaUrl)}" style="display:inline-block;background:#C8913E;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:10px">${esc(copy.cta)}</a></td></tr>
<tr><td style="padding:0 24px 22px"><table role="presentation" width="100%" style="background:#fbf6ec;border:1px solid #efe2c8;border-radius:10px"><tr><td style="padding:14px 16px;font-size:13px;line-height:1.5"><b style="color:#8a5a14">${esc(promo.title)}</b><br>${esc(promo.text)} <a href="${esc(promo.url)}" style="color:#8a5a14">Take a look</a></td></tr></table></td></tr>
<tr><td style="padding:0 24px 22px;font-size:14px;line-height:1.5">Regards,<br><b>Mohit Pandey</b><br>Founder, RoamWise<br><a href="${SITE}" style="color:#8a5a14">roamwise.co.in</a> · support@roamwise.co.in</td></tr>
<tr><td style="background:#f7f5f1;padding:14px 24px;font-size:11px;line-height:1.5;color:#6e6e73">You are receiving this because you applied to the RoamWise creator network and agreed to be contacted.${unsubUrl ? ` <a href="${esc(unsubUrl)}" style="color:#6e6e73">Unsubscribe</a>.` : ''}</td></tr>
</table></td></tr></table></body></html>`;
  const text = `${copy.lead}\n\n${copy.body}\n\n${copy.cta}: reply to this email or write to support@roamwise.co.in\n\n${promo.title}: ${promo.text} ${promo.url}\n\nRegards,\nMohit Pandey\nFounder, RoamWise\nroamwise.co.in\n\nYou are receiving this because you applied to the RoamWise creator network and agreed to be contacted.${unsubUrl ? ' Unsubscribe: ' + unsubUrl : ''}`;
  return { subject: copy.subject, html, text };
}
