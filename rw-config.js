/* ============================================================================
   RoamWise runtime config — THE SWITCH.
   Loaded BEFORE app.js. Change one value here to move between backends.
   Nothing else in the app needs to change, and you can flip back instantly.
   ========================================================================= */
window.RW_CONFIG = {

  /* 'firebase'   = current production. Everything talks straight to Firestore.
     'worker'     = route AI + heavy calls through your Cloudflare Worker.
     'auto'       = try the worker, fall back to firebase if it is unreachable.
     Start with 'firebase'. Switch to 'auto' to test safely in production.     */
  backend: 'firebase',

  /* Your deployed Worker URL. Leave blank until you have one.
     e.g. 'https://roamwise-api.<your-subdomain>.workers.dev'                  */
  workerUrl: '',

  /* Feature switches — turn things off instantly without a rebuild.           */
  features: {
    beacon:   true,
    realms:   true,
    passport: true,
    contest:  true,   // set false to hide prize messaging (e.g. during review)
    webPush:  false   // turn on after you add the VAPID key below
  },

  /* Web push (browser). Get this from:
     Firebase Console > Project settings > Cloud Messaging > Web Push certificates */
  vapidKey: ''
};

/* Helper the app uses to decide where to send a request. Safe if unset. */
window.rwApi = function(path){
  var c = window.RW_CONFIG || {};
  if ((c.backend === 'worker' || c.backend === 'auto') && c.workerUrl) {
    return c.workerUrl.replace(/\/+$/,'') + '/' + String(path||'').replace(/^\/+/,'');
  }
  return null; // null => caller uses the existing direct-to-Firebase path
};
