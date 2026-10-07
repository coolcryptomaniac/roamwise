/* Partner outcome reporting. Talks only to the Worker's /stay/mine and /stay/report
   with the signed-in partner's own Firebase ID token. Never touches payments. */
(function(){
'use strict';
var $=function(id){return document.getElementById(id)};
var auth,db,base='',rows=[];
function say(t,bad){var m=$('msg');m.textContent=t||'';m.style.color=bad?'var(--bad)':'var(--ok)'}
function inr(n){return '₹'+Math.round(Number(n)||0).toLocaleString('en-IN')}
function node(tag,text,cls){var e=document.createElement(tag);if(text!=null)e.textContent=text;if(cls)e.className=cls;return e}
async function workerBase(){
  if(base)return base;
  var d=await db.collection('config').doc('app').get(),v=d.exists?(d.data()||{}).WORKER_URL:'';
  var u=new URL(String(v||''));if(u.protocol!=='https:')throw new Error('Service address is not configured.');
  return base=u.href.replace(/\/+$/,'');
}
async function call(path,opts){
  var token=await auth.currentUser.getIdToken();
  var res=await fetch((await workerBase())+path,Object.assign({headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'}},opts||{}));
  var data=await res.json().catch(function(){return{}});
  if(!res.ok)throw new Error(data.message||data.error||('Error '+res.status));
  return data;
}
function monthOf(r){return String(r.checkIn||r.createdAt||'').slice(0,7)}
function render(){
  var month=$('month').value,list=$('list');list.textContent='';
  var shown=rows.filter(function(r){return !month||monthOf(r)===month});
  if(!shown.length){list.appendChild(node('p','No enquiries in this month yet.'));return}
  shown.forEach(function(r){
    var c=node('div',null,'card row');
    var head=node('div');head.appendChild(node('code',r.code));head.appendChild(document.createTextNode(' '));head.appendChild(node('span',r.status==='enquired'?'waiting for your report':r.status.replace('_',' '),'tag'));
    c.appendChild(head);
    c.appendChild(node('div','Enquired '+String(r.createdAt).slice(0,10)+(r.checkIn?' · check-in '+r.checkIn:'')+(r.amount?' · '+inr(r.amount):''),'meta'));
    if(r.locked){c.appendChild(node('div','Settled by RoamWise. Contact us to change it.','meta'));list.appendChild(c);return}
    var st=node('select');[['completed','Guest stayed (completed)'],['cancelled','Cancelled'],['no_show','Did not arrive']].forEach(function(o){var op=node('option',o[1]);op.value=o[0];st.appendChild(op)});
    var amt=node('input');amt.type='number';amt.min='1';amt.inputMode='numeric';amt.placeholder='Total stay value in ₹ (if completed)';amt.setAttribute('aria-label','Stay value in rupees');
    var ci=node('input');ci.type='date';ci.setAttribute('aria-label','Check-in date');
    var go=node('button','Save');go.type='button';
    st.onchange=function(){amt.disabled=st.value!=='completed'};
    go.onclick=async function(){
      go.disabled=true;
      try{
        var body={code:r.code,status:st.value};if(st.value==='completed')body.amount=Number(amt.value);if(ci.value)body.checkIn=ci.value;
        await call('/stay/report',{method:'POST',body:JSON.stringify(body)});
        say('Saved '+r.code+'.');await load();
      }catch(e){say(e.message,true);go.disabled=false}
    };
    [st,amt,ci,go].forEach(function(e){c.appendChild(e)});
    list.appendChild(c);
  });
}
async function load(){
  try{var d=await call('/stay/mine');rows=d.rows||[];$('who').textContent='Property id: '+d.partnerId;render()}
  catch(e){say(e.message,true)}
}
function start(){
  if(!window.firebase||!window.RW_PARTNER_CONFIG){setTimeout(start,150);return}
  if(!firebase.apps.length)firebase.initializeApp(window.RW_PARTNER_CONFIG.firebase);
  auth=firebase.auth();db=firebase.firestore();
  $('month').value=new Date().toISOString().slice(0,7);
  $('month').onchange=render;$('load').onclick=load;
  $('signout').onclick=function(){auth.signOut()};
  $('signin').onclick=function(){auth.signInWithEmailAndPassword($('em').value.trim(),$('pw').value).catch(function(e){say(e.message,true)})};
  $('google').onclick=function(){auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()).catch(function(e){say(e.message,true)})};
  auth.onAuthStateChanged(function(u){
    $('login').classList.toggle('hidden',!!u);$('app').classList.toggle('hidden',!u);
    if(u){say('');load()}
  });
}
start();
})();
