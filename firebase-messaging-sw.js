/* Web push service worker (Firebase Cloud Messaging).
   Only active once RW_CONFIG.features.webPush is true AND a vapidKey is set. */
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');
firebase.initializeApp({
  apiKey:"AIzaSyDlrtpzpOb1VEmVSd9tHmu7OpmvwWosYsU",
  authDomain:"roamwisepro.firebaseapp.com",
  projectId:"roamwisepro",
  messagingSenderId:"299014744987",
  appId:"1:299014744987:web:d5c316743e6d7a10904f3e"
});
try{
  var messaging = firebase.messaging();
  messaging.onBackgroundMessage(function(payload){
    var n = payload.notification || {};
    self.registration.showNotification(n.title || 'RoamWise', {
      body: n.body || '', icon: '/icons/icon-192.png', badge: '/icons/icon-192.png'
    });
  });
}catch(e){}
