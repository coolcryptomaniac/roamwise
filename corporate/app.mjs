import {BONUS_TIERS, SOURCING_LEADS, VENUES, bonusIllustration, estimateRetreat, matchVenues, requiredFaceCostCeiling} from './retreat-core.mjs';
const $=id=>document.getElementById(id);
const fmt=n=>'₹'+Math.round(n).toLocaleString('en-IN');
const fields=['employees','nights','destination','sharing','startDate','endDate','perPerson','allocation','splitSlider','notes'];
let current=null;
function node(tag,cls,text){const el=document.createElement(tag);if(cls)el.className=cls;if(text!=null)el.textContent=text;return el;}
function add(parent,tag,cls,text){const el=node(tag,cls,text);parent.append(el);return el;}
function validateDates(){
  const a=$('startDate').value,b=$('endDate').value;
  if((a&&!b)||(!a&&b))return 'Enter both check-in and check-out dates, or leave both blank.';
  if(a&&b){const ms=Date.parse(b+'T12:00:00Z')-Date.parse(a+'T12:00:00Z');if(ms<=0)return 'Check-out must be after check-in.';if(Math.round(ms/86400000)!==Number($('nights').value))return 'Check-in/out span must equal the selected number of nights.';if(a<[new Date().getFullYear(),String(new Date().getMonth()+1).padStart(2,'0'),String(new Date().getDate()).padStart(2,'0')].join('-'))return 'Please choose future dates.';}
  return '';
}
function render(){
  try{
    current=estimateRetreat({employees:$('employees').value,nights:$('nights').value,perPerson:$('perPerson').value,sharing:$('sharing').value});
    $('totalQuote').textContent=fmt(current.total);$('perEmployee').textContent=fmt(current.perPerson);
    $('teamNumber').textContent=current.employees.toLocaleString('en-IN');$('roomNumber').textContent=current.roomsNeeded.toLocaleString('en-IN');
    $('duration').textContent=current.nights+' night'+(current.nights===1?'':'s');
    const issue=validateDates();$('estimateNote').textContent=issue || 'Planning estimate only, excluding quote-specific taxes and supplier confirmation; not a payable price.';
    renderVenues();renderSourcing();renderAllocation();
  }catch(e){current=null;$('estimateNote').textContent=e.message;}
}
function renderVenues(){
  const rail=$('venueRail');rail.replaceChildren();
  const matched=matchVenues(current.employees,Number($('sharing').value),$('destination').value);
  $('venueEmpty').hidden=matched.length>0;
  matched.forEach(p=>{
    const card=add(rail,'article','venue-card');const art=add(card,'div','venue-top');
    add(art,'span','category',p.kind+' · '+p.area);
    const body=add(card,'div','venue-body');add(body,'h3','',p.name);
    add(body,'p','',p.note);
    const chips=add(body,'div','venue-tags');
    add(chips,'span','',p.keys!=null?p.keys+' rooms/keys listed':'Room stock to confirm');
    add(chips,'span','',p.capacity);
    add(body,'p','',p.status);
    const foot=add(body,'div','venue-foot');
    add(foot,'span','', 'Supplier confirmation required');
    const a=add(foot,'a','', 'View property ↗');a.href=p.url;a.target='_blank';a.rel='noopener noreferrer';
  });
}
function renderSourcing(){
  const rail=$('sourcingRail');rail.replaceChildren();
  const dest=$('destination').value;
  const matched=SOURCING_LEADS.filter(p=>dest==='Any'||p.region===dest);
  $('sourcingEmpty').hidden=matched.length>0;
  matched.forEach(p=>{
    const card=add(rail,'article','venue-card');
    const art=add(card,'div','venue-top');add(art,'span','category','Independent sourcing · '+p.area);
    const body=add(card,'div','venue-body');
    add(body,'h3','',p.name);add(body,'p','',p.note);
    const chips=add(body,'div','venue-tags');
    add(chips,'span','',p.keys!=null?p.keys+' publicly listed rooms':'Rooms to verify');
    if(p.seats!=null)add(chips,'span','',p.seats+' advertised meeting seats');
    const rooms=Math.ceil(current.employees/Number($('sharing').value));
    const fit=p.keys!=null&&rooms>p.keys?'Room count insufficient for single venue':
      p.seats!=null&&current.employees>p.seats?'Advertised hall too small for one plenary':'Potential physical fit · not verified';
    add(body,'p','',fit);
    add(body,'p','',p.status);
    const foot=add(body,'div','venue-foot');add(foot,'span','','No partnership or inventory held');
    const a=add(foot,'a','','Official site ↗');a.href=p.url;a.target='_blank';a.rel='noopener noreferrer';
  });
}
function renderAllocation(){
  const raw=Number($('allocation').value);
  if(!Number.isFinite(raw)||raw<100000||raw>100000000){$('bonusAmount').textContent='Enter ₹1L–₹10Cr';$('tierLabel').textContent='No offer calculated';return;}
  const b=bonusIllustration(raw),split=Number($('splitSlider').value);
  $('bonusAmount').textContent='Not quoted';
  $('tierLabel').textContent=b.tier+' · illustrative allocation, no bonus offered';
  $('centralPct').textContent=split+'%';
  $('centralAmount').textContent=fmt(b.paid*split/100);
  $('individualAmount').textContent=fmt(b.paid*(100-split)/100);
  const rail=$('tierRail');rail.replaceChildren();
  BONUS_TIERS.filter(t=>t.min>=500000).forEach(t=>{
    const card=add(rail,'article','tier-card'+(t.min===b.paid?' active':''));
    add(card,'span','micro',t.label+' allocation');
    add(card,'strong','',fmt(t.min));add(card,'p','', 'Illustrative allocation · benefits require a supplier-approved proposal');
    const btn=add(card,'button','',t.min===b.paid?'Selected example':'Explore this amount');btn.type='button';
    btn.addEventListener('click',()=>{$('allocation').value=String(t.min);renderAllocation();});
  });
  // Required cost ceiling is for internal education only, not an approved quote.
  const c=requiredFaceCostCeiling({cash:b.paid,bonus:b.bonusCeiling,opsPct:0});
  document.documentElement.dataset.supplierCostCeilingPct=String(Math.round(c.maximumSupplierCostPercentOfFace));
}
function railMove(id,dir){const el=$(id);el.scrollBy({left:dir*(el.querySelector('article')?.getBoundingClientRect().width||310)+dir*17,behavior:'smooth'});}
$('venueNext').addEventListener('click',()=>railMove('venueRail',1));
$('sourceNext').addEventListener('click',()=>railMove('sourcingRail',1));$('sourcePrev').addEventListener('click',()=>railMove('sourcingRail',-1));$('venuePrev').addEventListener('click',()=>railMove('venueRail',-1));
fields.forEach(id=>$(id).addEventListener('input',render));$('destination').addEventListener('change',render);
function brief(){
  if(!current)throw new Error('Please enter a valid employee count and budget.');
  const dates=validateDates();if(dates)throw new Error(dates);
  const c=new FormData($('companyForm'));
  if(!c.get('consent'))throw new Error('Please consent to contact about your enquiry.');
  const company=String(c.get('company')||'').trim(),contact=String(c.get('contact')||'').trim(),email=String(c.get('email')||'').trim();
  if(company.length<2||contact.length<2||!/^\S+@\S+\.\S+$/.test(email))throw new Error('Please enter your company, name and work email.');
  const allocation=Number($('allocation').value);
  if(!Number.isFinite(allocation)||allocation<100000||allocation>100000000)throw new Error('Enter an allocation between ₹1 lakh and ₹10 crore.');
  return {company,contact,email,role:String(c.get('role')||'').trim(),phone:String(c.get('phone')||'').trim(),
    employees:current.employees,nights:current.nights,sharing:Number($('sharing').value),
    perPerson:current.perPerson,estimate:current.total,destination:$('destination').value,
    startDate:$('startDate').value,endDate:$('endDate').value,
    preferences:[...document.querySelectorAll('[name="preference"]:checked')].map(x=>x.value),
    notes:$('notes').value.trim(),allocation,centralSharePct:Number($('splitSlider').value),consent:true,source:'corporate-page'};
}
function messageFor(p){
  return ['RoamWise corporate retreat enquiry','Company: '+p.company,'Contact: '+p.contact+' ('+p.email+')',
    'Role: '+p.role,'Phone: '+p.phone,'Employees: '+p.employees,'Destination: '+p.destination,
    'Dates: '+(p.startDate&&p.endDate?p.startDate+' to '+p.endDate:'Flexible'),
    'Nights: '+p.nights,'Sharing: '+p.sharing,'Per person target: '+fmt(p.perPerson),
    'Illustrative retreat value: '+fmt(p.estimate),'Potential annual allocation: '+fmt(p.allocation),
    'Central retreats share: '+p.centralSharePct+'%','Preferences: '+p.preferences.join(', '),
    'Notes: '+p.notes,'All figures indicative; no booking/payment agreed.'].join('\n');
}
$('emailFallback').addEventListener('click',()=>{
  try{const p=brief();location.href='mailto:founder@roamwise.co.in?subject='+encodeURIComponent('Corporate retreat enquiry — '+p.company)+'&body='+encodeURIComponent(messageFor(p));$('formStatus').textContent='An email draft was prepared. Please send it from your email app.';}
  catch(e){$('formStatus').textContent=e.message;}
});
$('companyForm').addEventListener('submit',async e=>{
  e.preventDefault();
  const status=$('formStatus');const btn=$('sendBtn');let p;
  try{p=brief();}catch(err){status.textContent=err.message;return;}
  if(btn.disabled)return;
  // Public stage: no automatic PII transmission until CRM storage and retention are verified.
  $('emailFallback').click();
  return;
});
render();
