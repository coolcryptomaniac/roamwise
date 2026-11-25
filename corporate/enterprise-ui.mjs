import {ENTERPRISE_DEFAULTS,modelEnterprise} from './enterprise-core.mjs';
const form=document.getElementById('enterpriseScenario');
const output=document.getElementById('enterpriseBreakdown');
const format=n=>'₹'+Math.round(n).toLocaleString('en-IN');
let current=null;
function writeLine(label,value){
  const div=document.createElement('div');div.className='enterprise-line';
  const l=document.createElement('span');l.textContent=label;
  const n=document.createElement('b');n.textContent=value;
  div.append(l,n);output.append(div);
}
function read(){
  const data=new FormData(form);
  const o={};
  for(const key of Object.keys(ENTERPRISE_DEFAULTS))o[key]=data.get(key);
  return modelEnterprise(o);
}
function refresh(){
  const error=document.getElementById('enterpriseError');
  try{
    current=read();error.textContent='';
    document.getElementById('enterpriseLicense').textContent=format(current.licenseFee);
    document.getElementById('enterpriseBookings').textContent=format(current.bookingValue);
    output.replaceChildren();
    current.segments.forEach(x=>writeLine(x.name,format(x.value)));
    writeLine('Total planned client expenditure (licence + bookings)',format(current.projectedClientSpend));
    writeLine('10% contribution goal on confirmed bookings only',format(current.minimumBookingContributionGoal));
  }catch(e){
    current=null;
    error.textContent=e.message;
    document.getElementById('enterpriseLicense').textContent='—';
    document.getElementById('enterpriseBookings').textContent='—';
    output.replaceChildren();
  }
}
form.addEventListener('input',refresh);
form.addEventListener('change',refresh);
document.getElementById('useEnterpriseBrief').addEventListener('click',()=>{
  const error=document.getElementById('enterpriseError');
  if(!current){error.textContent='Correct the annual programme inputs before continuing.';return;}
  const notes=document.getElementById('notes');
  const employees=document.getElementById('employees');
  const p=current.inputs;
  // This creates only an editable proposal note. It neither activates licences
  // nor provisions employee accounts, partner rates, cash or tokens.
  const stamp='[Enterprise scenario] ';
  const details=stamp+
    p.employees+' employees; '+format(current.licenseFee)+' proposed annual licence; '+
    p.departmentTrips+' × '+p.departmentSize+' department offsites @ '+format(p.departmentPerHead)+'/person; '+
    p.leadershipTrips+' × '+p.leadershipSize+' leadership retreats @ '+format(p.leadershipPerHead)+'/person; '+
    p.workationBookings+' workations @ '+format(p.workationPerBooking)+'; '+
    p.personalBookings+' employee holiday bookings @ '+format(p.personalPerBooking)+'. '+
    'Travel value '+format(current.bookingValue)+' indicative; no bookings or credits confirmed.';
  let original=notes.value||'';
  // Replace only the prior generated scenario, retaining preceding customer notes.
  const pos=original.indexOf(stamp);
  if(pos>=0) original=original.slice(0,pos).trim();
  const joined=(original?original+'\n':'')+details;
  if(joined.length>800){error.textContent='The detailed programme exceeds the notes limit; shorten your other notes to include it.';return;}
  notes.value=joined;
  employees.value=String(p.employees);
  employees.dispatchEvent(new Event('input',{bubbles:true}));
  document.getElementById('enquire').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
  error.textContent='Added the editable scenario to your corporate request. No data has been sent.';
});
refresh();
