// @ts-nocheck
/* ============================================================================
   js/admin/notification-composer.js
   ----------------------------------------------------------------------------
   Push-notification composer for the admin "Notifications" tab.

   WIRING STATUS, CHECKED AGAINST THE REPO AT WRITE TIME: the parallel
   `claude/push-notifications` branch (worker/handlers/push.js's admin-only
   `POST /push/send`, which verifies a Firebase ID token, confirms the caller
   is a real admin, looks up the target user's registered FCM tokens SERVER-
   SIDE from Firestore, and sends via FCM) had NOT been merged into main as
   of this file's commit — `git log origin/main..origin/claude/push-notifications`
   showed 3 unmerged commits. That endpoint also only ever targets ONE `uid`
   at a time by design (see its header comment) — there is no broadcast/topic
   send yet either.

   So this file builds the composer UI SHELL against a `notificationQueue`
   Firestore collection a real sender can consume later — it does NOT call
   any send endpoint and does NOT claim a notification was delivered. Every
   queued doc's status stays 'queued' until a human or a future scheduled
   job (fed by /push/send once that branch lands, or the Firebase Console's
   own composer — see PUSH-NOTIFICATIONS-SETUP.md) actually sends it and
   flips the status by hand or via that job. Follow-up, not done here: point
   a small sender at this queue and call /push/send once per queued 'uid'
   target (that endpoint is single-target, so an 'all' target would need the
   sender to fan out one call per registered user — do this server-side,
   never by having the browser loop over every user's uid itself).

   Pure validation + HTML-string functions only; the Firestore read/write
   and DOM wiring live in admin/index.html.
   ========================================================================= */
var RWNotificationComposer = (function(){
  var MAX_TITLE = 100, MAX_BODY = 500, MAX_URL = 500;
  var TARGET_TYPES = ['all','uid'];

  /** Mirrors worker/handlers/push.js's own field limits (MAX_TITLE/MAX_BODY/
   *  MAX_URL) on the push-notifications branch, so a queued entry is already
   *  shaped to pass that validation once a sender consumes it. */
  function normalizeNotification(input){
    var title = String(input && input.title || '').trim().slice(0, MAX_TITLE);
    var body = String(input && input.body || '').trim().slice(0, MAX_BODY);
    var url = String(input && input.url || '').trim().slice(0, MAX_URL);
    var targetType = TARGET_TYPES.indexOf(input && input.targetType) > -1 ? input.targetType : 'all';
    var targetUid = String(input && input.targetUid || '').trim().slice(0, 128);
    if(!title) return { ok:false, error:'Title is required.' };
    if(!body) return { ok:false, error:'Body is required.' };
    if(targetType === 'uid' && !targetUid) return { ok:false, error:'Add a target UID, or switch target to "All users".' };
    return { ok:true, notification: {
      title: title, body: body, url: url,
      target: targetType === 'uid' ? { type:'uid', uid:targetUid } : { type:'all' },
      status: 'queued'
    }};
  }

  function targetLabel(target){
    if(!target) return 'All users';
    return target.type === 'uid' ? ('One user: ' + target.uid) : 'All users';
  }

  function renderQueueHtml(queue, helpers){
    var esc = (helpers && helpers.esc) || function(s){ return String(s==null?'':s); };
    var when = (helpers && helpers.when) || function(){ return ''; };
    var rows = (queue || []).map(function(n){
      var tag = n.status === 'sent' ? '<span class="tag good">sent</span>' : (n.status === 'failed' ? '<span class="tag warn">failed</span>' : '<span class="tag">queued — not sent</span>');
      return '<div class="row"><div class="grow"><strong>' + esc(n.title) + '</strong> ' + tag +
        '<div class="meta">' + esc(n.body) + '</div>' +
        '<div class="meta">To: ' + esc(targetLabel(n.target)) + (n.url ? ' &middot; opens ' + esc(n.url) : '') + ' &middot; queued ' + when(n.createdAt) + '</div></div>' +
        '<div class="actions">' + (n.status === 'queued' ? '<button class="btn small" onclick="markNotificationSent(\'' + esc(n.id) + '\')">Mark sent</button>' : '') +
        '<button class="btn danger small" onclick="deleteNotificationQueueItem(\'' + esc(n.id) + '\')">Delete</button></div></div>';
    }).join('');
    return '<div class="alert"><b>Not wired to a live sender yet.</b> Queuing here does not deliver anything — see this file\'s header for exact status and the follow-up needed once <code>claude/push-notifications</code> lands.</div>' +
      '<div class="list" style="margin-top:12px">' + (rows || '<div class="empty">Nothing queued. Compose one below.</div>') + '</div>';
  }

  return {
    MAX_TITLE: MAX_TITLE, MAX_BODY: MAX_BODY, MAX_URL: MAX_URL, TARGET_TYPES: TARGET_TYPES,
    normalizeNotification: normalizeNotification,
    targetLabel: targetLabel,
    renderQueueHtml: renderQueueHtml
  };
})();
