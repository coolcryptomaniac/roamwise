// @ts-nocheck
/* Admin notification composer. Draft -> explicit admin approval -> backend queue.
   It NEVER sends from the browser. A Worker endpoint may dispatch approved
   messages after checking user consent, offer verification, and frequency caps. */
var RWNotificationComposer = (function(){
  var MAX_TITLE = 100, MAX_BODY = 500, MAX_URL = 500;
  var TARGET_TYPES = ['all','uid'];
  var CATEGORIES = ['booking','account','safety','travel','offers'];

  /** Mirrors worker/handlers/push.js's own field limits (MAX_TITLE/MAX_BODY/
   *  MAX_URL) on the push-notifications branch, so a queued entry is already
   *  shaped to pass that validation once a sender consumes it. */
  function normalizeNotification(input){
    var title = String(input && input.title || '').trim().slice(0, MAX_TITLE);
    var body = String(input && input.body || '').trim().slice(0, MAX_BODY);
    var url = String(input && input.url || '').trim().slice(0, MAX_URL);
    var category = String(input && input.category || 'travel');
    var reviewedContent = !!(input && input.reviewedContent === true);
    var verifiedOfferId = String(input && input.verifiedOfferId || '').trim().slice(0,80);
    if(CATEGORIES.indexOf(category) < 0) return {ok:false,error:'Choose a valid notification topic.'};
    var targetType = TARGET_TYPES.indexOf(input && input.targetType) > -1 ? input.targetType : 'all';
    var targetUid = String(input && input.targetUid || '').trim().slice(0, 128);
    if(!title) return { ok:false, error:'Title is required.' };
    if(!body) return { ok:false, error:'Body is required.' };
    if(targetType === 'uid' && !targetUid) return { ok:false, error:'Add a target UID, or switch target to "All users".' };
    if(targetType === 'all' && !['travel','offers'].includes(category))
      return {ok:false,error:'Bookings, safety and account alerts require one specific user.'};
    if(!/^https:\/\/(?:www\.)?roamwise\.co\.in\//.test(url) || url.indexOf('/admin/') > 0)
      return {ok:false,error:'Choose a safe RoamWise page as the tap destination.'};
    if(category === 'travel' && !reviewedContent)
      return {ok:false,error:'Review the travel information before queuing it.'};
    if(category === 'offers' && !verifiedOfferId)
      return {ok:false,error:'A verified live offer ID from config/notificationOffers is required.'};
    return { ok:true, notification: {
      title: title, body: body, url: url, category: category, reviewedContent: reviewedContent, verifiedOfferId: verifiedOfferId,
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
      var status = n.status === 'completed'
        ? '<span class="tag good">completed · '+Number(n.deliveredCount||0)+' delivered</span>'
        : n.status === 'approved'
        ? '<span class="tag warn">approved · pending delivery</span>'
        : n.status === 'queued'
        ? '<span class="tag">draft · not sent</span>'
        : '<span class="tag">'+esc(n.status || 'unknown')+'</span>';
      var id = String(n.id || '').replace(/[^A-Za-z0-9_-]/g,'');
      var actions = n.status === 'queued'
        ? '<button class="btn small good" onclick="approveNotificationQueueItem(\\''+id+'\\')">Review &amp; approve</button>'
        : n.status === 'approved'
        ? '<button class="btn small" onclick="revokeNotificationQueueItem(\\''+id+'\\')">Revoke</button>' : '';
      return '<div class="row"><div class="grow"><strong>'+esc(n.title)+'</strong> '+status+
        '<div class="meta">'+esc(n.body)+'</div>'+
        '<div class="meta">Topic: '+esc(n.category||'legacy')+
        ' · To: '+esc(targetLabel(n.target))+
        (n.url?' · opens '+esc(n.url):'')+
        ' · queued '+when(n.createdAt)+'</div></div>'+
        '<div class="actions">'+actions+
        '<button class="btn danger small" onclick="deleteNotificationQueueItem(\\''+id+'\\')">Delete</button></div></div>';
    }).join('');
    return '<div class="alert"><b>Delivery requires approval.</b> Drafts and old queued notifications are never sent automatically. Verified offers need a separate active entry in <code>config/notificationOffers</code>; offers and travel ideas require recipient opt-in.</div>'
      + '<div class="list" style="margin-top:12px">'+(rows||'<div class="empty">No campaigns queued.</div>')+'</div>';
  }

  return {
    MAX_TITLE: MAX_TITLE, MAX_BODY: MAX_BODY, MAX_URL: MAX_URL, TARGET_TYPES: TARGET_TYPES, CATEGORIES: CATEGORIES,
    normalizeNotification: normalizeNotification,
    targetLabel: targetLabel,
    renderQueueHtml: renderQueueHtml
  };
})();
