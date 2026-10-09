/**
 * RoamWise Gmail relay - Google Apps Script web app.
 * Sends mail from the Google account that owns this script. Free.
 * Setup steps: see EMAIL-PUSH-SETUP.md (repo root).
 *
 * Script property required:  RELAY_SECRET  (long random string; same value as the
 * Worker secret GMAIL_RELAY_SECRET).
 * Optional script property:  RESERVE  (mail slots to keep unused, default 10).
 *
 * Google's own daily quota is the real limit (about 100 recipients/day on a free
 * Gmail account, 1,500 on Google Workspace). We stop when only RESERVE are left,
 * so the founder can still send his own mail.
 */
function doPost(e) {
  var props = PropertiesService.getScriptProperties();
  var body;
  try { body = JSON.parse(e.postData.contents); } catch (err) { return out_({ ok: false, reason: 'bad_json' }); }
  var secret = props.getProperty('RELAY_SECRET');
  if (!secret || !body || body.secret !== secret) return out_({ ok: false, reason: 'unauthorized' });
  var to = String(body.to || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to) || to.length > 254) return out_({ ok: false, reason: 'bad_to' });
  var subject = String(body.subject || '').slice(0, 200);
  if (!subject) return out_({ ok: false, reason: 'bad_subject' });
  var reserve = parseInt(props.getProperty('RESERVE') || '10', 10);
  if (MailApp.getRemainingDailyQuota() <= reserve) return out_({ ok: false, reason: 'cap' });
  var opts = { name: 'RoamWise', replyTo: 'support@roamwise.co.in' };
  if (body.html) opts.htmlBody = String(body.html).slice(0, 100000);
  try {
    MailApp.sendEmail(to, subject, String(body.text || subject).slice(0, 50000), opts);
  } catch (err) {
    return out_({ ok: false, reason: 'error' });
  }
  return out_({ ok: true, remaining: MailApp.getRemainingDailyQuota() });
}

/** Opening the URL in a browser only says it is alive; it sends nothing. */
function doGet() { return out_({ ok: true, service: 'roamwise-gmail-relay' }); }

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
