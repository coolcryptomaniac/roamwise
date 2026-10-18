(function () {
  'use strict';
  var data;
  var esc = function(v){return String(v == null ? '' : v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
  window.rwArtistOutreachStart = async function () {
    var target = document.getElementById('artistProspects');
    if (!CURRENT_ADMIN) return;
    try {
      if (!data) {var r = await fetch('../creators/artists-data.json');if(!r.ok)throw Error('Prospects could not load.');data=await r.json();}
      target.innerHTML=data.properties.map(function(p){return '<div class="row"><div class="grow"><strong>'+esc(p.name)+'</strong><div class="meta">'+esc(p.city)+' · '+esc(p.state)+'<br>'+esc(p.evidence)+'<br>'+(p.contact.email?esc(p.contact.email):'Official route only; resolve contact first')+'</div></div><div class="actions"><a class="btn small" href="'+esc(p.contact.sourceUrl)+'" target="_blank" rel="noopener">Source</a><button class="btn primary small" data-art-save="'+esc(p.id)+'">Save to private CRM</button></div></div>'}).join('');
    } catch(e) {target.textContent=e.message;}
  };
  document.addEventListener('click',async function(e){
    var button=e.target.closest('[data-art-save]');if(!button || !CURRENT_ADMIN || !data)return;
    var p=data.properties.find(function(x){return x.id===button.dataset.artSave});if(!p)return;
    button.disabled=true;
    try {
      var id='artist-property-'+p.id,ref=db.collection('crm').doc(id),old=await ref.get();
      if(old.exists){toast('This artist prospect is already saved. Existing contact status was preserved.');return;}
      await ref.set({seg:'property',segment:'property',name:p.name,city:p.city,country:'India',email:p.contact.email,contactRoute:p.contact.sourceUrl,emailSource:p.contact.sourceUrl,sourceUrl:p.sourceUrl,evidence:p.evidence,sourceCheckedAt:p.checkedAt,status:'research',source:'Firecrawl artist/hotel shortlist',artistId:'natasha-guleria',outreachApproved:false,emailConfirmed:!!p.contact.verified,publicBusinessInbox:!!p.contact.verified,publishedRouteVerified:!!p.contact.verified,contactConflict:!!p.contact.ambiguous,createdAt:FV.serverTimestamp(),createdBy:CURRENT_ADMIN.uid});
      toast('Saved privately. No email was sent by this button.');
    } catch(err) {toast(err.message,true);} finally {button.disabled=false;}
  });
})();
