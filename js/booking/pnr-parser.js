// @ts-nocheck
/* ===== PNR / BOOKING SMS PARSER (rw-v51) ==================================
   No IRCTC API needed — people already HAVE the SMS. Paste it and we pull out
   the train, PNR, date and stations, then hand straight to Arrival Mode. */
function rwParsePNR(text){
  var t=String(text||'');
  var out={};
  var pnr=t.match(/\b(?:PNR\s*(?:No\.?|Number)?[:\s-]*)?(\d{10})\b/i);
  if(pnr) out.pnr=pnr[1];
  var trn=t.match(/\b(\d{5})\b(?!\d)/);
  if(trn && trn[1]!==out.pnr) out.train=trn[1];
  var nm=t.match(/\b(\d{5})\s*[\/\-]?\s*([A-Z][A-Za-z\s]{3,28}(?:EXP|EXPRESS|SF|SUPERFAST|RAJDHANI|SHATABDI|DURONTO|VANDE BHARAT|JANSHATABDI|MAIL))/i);
  if(nm) out.trainName=nm[2].trim();
  var dt=t.match(/\b(\d{1,2})[-\/\s]([A-Za-z]{3,9}|\d{1,2})[-\/\s](\d{2,4})\b/);
  if(dt) out.date=dt[0];
  var seg=t.match(/\b([A-Z]{2,5})\s*(?:-|to|\u2192|=>)\s*([A-Z]{2,5})\b/);
  if(seg){ out.from=seg[1]; out.to=seg[2]; }
  var st=t.match(/\b(CNF|RAC|WL\/?\d*|CAN|Confirmed|Waitlist)\b/i);
  if(st) out.status=st[1].toUpperCase();
  var dep=t.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  if(dep) out.time=dep[0];
  out.found=Object.keys(out).length>0;
  return out;
}
function openPnrPaste(){
  rwForm('\ud83c\udfab Paste your booking SMS', [
    {key:'sms', label:'Paste the IRCTC SMS or PNR', placeholder:'e.g. PNR 4512367890, 12017 SHATABDI EXP, NDLS-DDN, 14-Sep-2026, 06:10, CNF'}
  ], function(v){
    var r=rwParsePNR(v.sms||'');
    if(!r.found){ showToast('Couldn\u2019t read that \u2014 try pasting the whole SMS'); return; }
    var bits=[];
    if(r.trainName) bits.push(r.trainName); else if(r.train) bits.push('Train '+r.train);
    if(r.from&&r.to) bits.push(r.from+' \u2192 '+r.to);
    if(r.date) bits.push(r.date);
    if(r.time) bits.push(r.time);
    if(r.status) bits.push(r.status);
    showToast('\ud83c\udfab '+bits.join(' \u00b7 '));
    /* hand straight into Arrival Mode, pre-filled */
    try{
      openArrival();
      setTimeout(function(){
        var st=el('arrStation'), tm=el('arrTime');
        if(st && r.to) st.value=r.to;
        if(tm && r.time) tm.value=r.time;
        var out=el('arrivalOut');
        if(out) out.innerHTML='<div style="border:1px solid var(--gold,#E8BA6C);border-radius:12px;padding:12px;margin-bottom:10px">'
          +'<b style="font-size:13px">\ud83c\udfab Read from your SMS</b>'
          +'<div style="font-size:12.5px;color:var(--t2);margin-top:4px">'+esc2(bits.join(' \u00b7 '))+'</div>'
          +(r.status&&/WL/.test(r.status)?'<div style="font-size:12px;color:#F0A63B;margin-top:6px">\u26a0\ufe0f Still waitlisted \u2014 keep a backup plan until it confirms.</div>':'')
          +'<div style="font-size:11px;color:var(--t3);margin-top:6px">Check the station and time above, then build your trip.</div></div>';
      }, 350);
    }catch(e){ /* best-effort, ignore */ }
  });
}
