(function(){'use strict';
var FB={apiKey:'AIzaSyDlrtpzpOb1VEmVSd9tHmu7OpmvwWosYsU',authDomain:'roamwisepro.firebaseapp.com',projectId:'roamwisepro',appId:'1:299014744987:web:d5c316743e6d7a10904f3e'};
var msg=document.getElementById('msg'),out=document.getElementById('out'),id=(new URLSearchParams(location.search).get('id')||'').replace(/[^A-Za-z0-9_-]/g,'').slice(0,120);
function say(t){msg.textContent=t;msg.hidden=false;}
function load(user){
  if(!user){say('Sign in to RoamWise to see your invoice, then open this page again.');return;}
  if(!id){say('No invoice was selected.');return;}
  firebase.firestore().doc('invoices/'+id).get().then(function(d){
    if(!d.exists){say('Your invoice is created automatically after a payment is verified, usually within a day. Please check again later.');return;}
    var inv=d.data();if(!inv.customer||inv.customer.uid!==user.uid){say('This invoice belongs to a different account.');return;}
    msg.hidden=true;out.replaceChildren(RWInvoiceRender.render(inv,{showFlags:false}));document.getElementById('print').hidden=false;
  }).catch(function(){say('Could not load this invoice right now. Please try again.');});
}
document.getElementById('print').addEventListener('click',function(){window.print();});
window.addEventListener('load',function(){
  try{if(!firebase.apps.length)firebase.initializeApp(FB);firebase.auth().onAuthStateChanged(load);}catch(e){say('Invoice cannot load right now.');}
});
})();
