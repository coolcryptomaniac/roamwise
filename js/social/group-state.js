// @ts-nocheck
/* ==================== SOCIAL: GROUP CHAT SHARED STATE ====================
   Extracted verbatim from app.js (Phase 4c modularization).
   The Secure Trip Group Chat (js/social/group-chat.js + group-chat-social.js)
   and the Trip Board (js/social/trip-board.js) are two feature files that both
   read/write the SAME live chat room — this is the seam that resolves that
   entanglement: the mutable room state and the single message-write API live
   here, loaded before either feature file, so both depend on one source of
   truth instead of duplicating it. ==================================== */
var _chatUnsub=null, _chatRoom=null;
function chatPost(kind, payload, text){
  if(!_chatRoom || !user) return Promise.reject(new Error('no room'));
  /* @tusk in the group chat — anyone can ask, the answer lands for everyone */
  try{
    if(kind==='text' && /^@tusk\b/i.test(String(text||''))) setTimeout(function(){ rwChatAskTusk(text); }, 300);
  }catch(e){}
  /* expireAt drives the 30-day Firestore TTL policy (set in the console). This is
     what keeps the DB tiny at scale — messages self-delete; users export to keep. */
  var expireAt = firebase.firestore.Timestamp.fromMillis(Date.now() + 30*24*60*60*1000);
  return db.collection('tripchats').doc(_chatRoom).collection('msgs').add({
    kind:kind||'text', text:String(text||'').slice(0,1000),
    payload:payload||null, uid:user.uid,
    name:(user.displayName||user.email||'Traveller').split('@')[0],
    at:firebase.firestore.FieldValue.serverTimestamp(),
    expireAt: expireAt
  });
}
var _chatMsgs = [];
