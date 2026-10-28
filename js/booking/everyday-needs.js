// @ts-nocheck
/* Prepare a traveller-reviewed request; no inventory, price or purchase promises. */
function rwEverydayRequest(values){
  var purposes={
    monthly:'a monthly or relocation stay; check kitchen, Wi-Fi, laundry and deposit terms',
    work:'a work, exam or interview trip; check commute time and reliable arrival',
    family:'a family visit; ask about room layout and access needs',
    medical:'accommodation and ordinary transport near a hospital; ask about distance and access, not medical details',
    transfer:'a station, airport or local transfer; prefer electric transport where available and suitable',
    pilgrimage:'pilgrimage travel logistics; ask about walking distance, access and transport'
  };
  var tiers={budget:'budget essentials',comfort:'comfort and convenience',premium:'premium privacy and space'};
  var place=String(values.place||'').replace(/[<>\u0000-\u001f]/g,' ').replace(/\s+/g,' ').trim().slice(0,80);
  var budget=Number(values.budget);
  if(!Object.prototype.hasOwnProperty.call(purposes,values.purpose)||!Object.prototype.hasOwnProperty.call(tiers,values.tier)||!place||!Number.isInteger(budget)||budget<1||budget>10000000) return '';
  return 'Help plan '+purposes[values.purpose]+' near '+place+'. Preference: '+tiers[values.tier]+'. Maximum total budget for the whole request: INR '+budget+'. Ask for dates, people and missing details first. If the budget cannot cover it, explain the gap. Show only sourced options; mark unverified details. Confirm final prices and availability with the provider. No booking or payment without my approval.';
}
function rwEverydayInit(){
  var form=document.getElementById('rwEverydayForm');
  if(!form) return;
  form.addEventListener('submit',function(event){
    event.preventDefault();
    var status=document.getElementById('rwEverydayStatus'),input=document.getElementById('heroInput');
    if(!form.reportValidity()) return;
    var request=rwEverydayRequest({purpose:form.elements.purpose.value,place:form.elements.place.value,tier:form.elements.tier.value,budget:form.elements.budget.value});
    if(!request){status.textContent='Check your destination and enter a whole-rupee total budget.';return;}
    if(!input){status.textContent='The trip chat is unavailable. Use the browsing links below.';return;}
    if(input.value.trim()){
      status.textContent='You have an unsent chat draft. Send or clear it, then prepare this request.';
      input.focus();return;
    }
    input.value=request;
    input.dispatchEvent(new Event('input',{bubbles:true}));
    status.textContent='Your request is ready in Ailon Tusk. Review it and press Send.';
    input.scrollIntoView({block:'center',behavior:'auto'});
    input.focus({preventScroll:true});
  });
}
if(typeof document!=='undefined')rwEverydayInit();
