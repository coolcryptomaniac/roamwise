/* RoamWise Admin investor library + outreach enhancements.
   The previous curated investor dataset is hydrated from the pinned pre-upgrade
   commit so the admin keeps its local fallback while VC Hunter remains the
   primary current source. */
window.RW_INVESTORS = window.RW_INVESTORS || [
  {category:"Travel / Pre-seed",name:"Antler",website:"https://www.antler.co/pitch",stage:"Pre-Seed to Seed",cheque:"Varies by geography",sectors:"AI, consumer, travel, software"},
  {category:"Consumer",name:"India Quotient",website:"https://www.indiaquotient.in/",stage:"Paper stage to Seed",cheque:"$150K-$2M stated range",sectors:"Consumer, internet, technology"},
  {category:"Pre-seed",name:"First Cheque",website:"https://www.firstcheque.vc/",stage:"Idea to Seed",cheque:"Up to $500K",sectors:"Consumer internet, technology"},
  {category:"Travel",name:"Travel Capitalist Ventures",website:"https://travelcapitalist.com/funding/",stage:"Travel specialist",cheque:"Varies",sectors:"Travel, B2C, B2B, B2B2C"}
];
window.RW_INVESTOR_SUMMARY = window.RW_INVESTOR_SUMMARY || {total:window.RW_INVESTORS.length};

(function hydrateLegacyLibrary(){
  const pinned="https://raw.githubusercontent.com/coolcryptomaniac/roamwise/5d2b92f0b7c6eba72b1a5251eb39352b74c27726/admin/investors-data.js";
  fetch(pinned,{cache:"force-cache"}).then(r=>{if(!r.ok)throw new Error("legacy investor library unavailable");return r.text()}).then(txt=>{
    const before=window.RW_INVESTORS;
    try{(0,Function)(txt)()}catch(e){console.warn("Legacy investor library parse failed",e);window.RW_INVESTORS=before;return}
    if(typeof window.renderVCs==="function")window.renderVCs();
  }).catch(e=>console.warn(e.message));
})();

window.addEventListener("load",()=>{
  /* The main admin inline script is defined after this file. Patching on load
     ensures all original functions exist before we extend them. */
  if(typeof window.investorRows!=="function"||typeof window.openModal!=="function")return;

  function clamp(n,a=1,b=99){return Math.max(a,Math.min(b,Math.round(Number(n)||0)))}
  function statusSignal(v){
    const s=String(v.status||"").toLowerCase();
    if(/meeting|diligence|term|committed|interested/.test(s))return 24;
    if(/replied|response/.test(s))return 16;
    if(/contacted|opened|drafted/.test(s))return 6;
    if(/pass|rejected|declined/.test(s))return -32;
    if(/later|too early|future/.test(s))return -14;
    return 0;
  }
  window.vcInterestScore=function(v){
    const fit=typeof window.fitScore==="function"?window.fitScore(v):50;
    const access=Number(v.approachability||0);
    const text=((v.stage||"")+" "+(v.sectors||"")+" "+(v.thesis||"")+" "+(v.source||"")).toLowerCase();
    let score=fit*.58+(access||50)*.20+statusSignal(v);
    if(/pre.?seed|seed|angel|first cheque|day zero|paper stage/.test(text))score+=7;
    if(/travel|tourism|hospitality|consumer|marketplace|ai|artificial intelligence/.test(text))score+=5;
    if(v.email)score+=3;
    if(v._source==="vch-current"||/current|2026|official/.test(text))score+=5;
    if(v._source==="vch-historical"||/historical/.test(text))score-=14;
    return clamp(score);
  };
  window.vcInterestMeta=function(v){
    const s=window.vcInterestScore(v),status=String(v.status||"new").toLowerCase();
    let label=s>=82?"High signal":s>=66?"Promising":s>=48?"Possible fit":"Low / nurture";
    if(/meeting|diligence|term|committed|interested/.test(status))label="Active interest";
    else if(/replied|response/.test(status))label="Replied";
    else if(/pass|rejected|declined/.test(status))label="Passed";
    const reasons=[];
    if(Number(v.approachability||0)>=80)reasons.push("high approachability");
    if(/pre.?seed|seed|angel|first cheque|day zero/i.test(v.stage||""))reasons.push("stage aligned");
    if(/travel|tourism|hospitality/i.test((v.sectors||"")+" "+(v.thesis||"")))reasons.push("travel thesis");
    if(v.email)reasons.push("verified email route");
    if(v._source==="vch-current")reasons.push("current VC Hunter source");
    if(/replied|meeting|diligence|interested/i.test(status))reasons.push("actual CRM response signal");
    if(v._source==="vch-historical")reasons.push("historical only — verify current mandate");
    return {score:s,label,reasons};
  };

  window.baseDraft=function(v){
    const m=window.vcInterestMeta(v),why=(v.sectors||v.thesis||"early-stage consumer technology").split(/[,.;]/)[0].trim();
    const first=(v.keyPeople||v.name||v.firm||"").split(/[;·—]/)[0].trim();
    const hello=first&&first.split(" ").length<=4?first:"there";
    let opener,ask;
    if(m.score>=82){
      opener=`I’m reaching out because ${v.name||v.firm||"your fund"} looks unusually well aligned with RoamWise right now: ${why.toLowerCase()}, ${v.stage||"early-stage"} investing, and a strong fit with the round we are opening.`;
      ask="If this is inside your mandate, I’d like to discuss whether you could participate in or help anchor this round.";
    }else if(m.score>=62){
      opener=`I shortlisted ${v.name||v.firm||"your fund"} because your focus on ${why.toLowerCase()} appears relevant to RoamWise, particularly at ${v.stage||"our current stage"}.`;
      ask="Would you be open to a focused 15-minute fit conversation? I can send the concise deck and live product first.";
    }else{
      opener=`I’m building RoamWise and wanted to introduce it because there is some overlap with your work in ${why.toLowerCase()}. We may be early for your current mandate, so I’m approaching this as a relationship and feedback conversation rather than assuming immediate fit.`;
      ask="If now is too early, the most useful outcome would be the milestone you would want to see or an introduction to an investor who is earlier than your mandate.";
    }
    return {subject:`RoamWise — ${PITCH.stage} · AI-native travel operating system`,body:`Hi ${hello},\n\nI’m Mohit Pandey, founder of RoamWise. We are building ${String(PITCH.thesis||"").replace(/\.$/,"").toLowerCase()}.\n\n${opener}\n\nCurrent operating snapshot: ${PITCH.users} users, ${money(PITCH.revenue)} recorded revenue, ${money(PITCH.burn)} monthly burn, and ${PITCH.team} team/interns. The product is live on web and Android.\n\nWe are opening a flexible financing with a $${Number(PITCH.min).toLocaleString()} minimum close, $${Number(PITCH.target).toLocaleString()} target and $${Number(PITCH.hard).toLocaleString()} hard cap.\n\n${ask}\n\nDeck: https://www.roamwise.co.in/deck/\nLive: https://www.roamwise.co.in/live/\n\nWarm regards,\nMohit Pandey\nFounder, RoamWise\nAlmora, Uttarakhand`};
  };

  window.copyAndOpenGmail=async function(id){
    const v=VCS.find(x=>x.id===id);if(!v||!v.email)return toast("No verified professional email is saved for this target.",true);
    await saveDraft(id,"opened-gmail");
    const subject=$("draftSubject").value.trim(),body=$("draftBody").value.trim();
    try{await navigator.clipboard.writeText(subject+"\n\n"+body)}catch{}
    const url=`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(v.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(url,"_blank","noopener");toast("Full draft copied and Gmail opened.")
  };
  window.openGmailOnly=async function(id){
    const v=VCS.find(x=>x.id===id);if(!v||!v.email)return toast("No verified professional email is saved for this target.",true);
    await saveDraft(id,"opened-gmail");
    const url=`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(v.email)}&su=${encodeURIComponent($("draftSubject").value)}&body=${encodeURIComponent($("draftBody").value)}`;
    window.open(url,"_blank","noopener");
  };

  const originalRender=window.renderVCs;
  window.renderVCs=function(){
    if(!$("vcList"))return;
    const q=($("vcSearch").value||"").toLowerCase(),f=$("vcFilter").value,all=investorRows(),suggested=all.length-VCS.length;
    $("vcLibrarySummary").textContent=VCH_LOADING?`Loading VCHunter… ${VCH_CURRENT.length?VCH_CURRENT.length+" current picks loaded; historical index follows.":""}`:VCH_ERROR?`VCHunter could not load (${VCH_ERROR}). Local curated profiles remain available.`:`${suggested.toLocaleString()} deduplicated suggestions from VCHunter + RWAdmin · ${VCS.length} saved privately. Interest % is an estimate from fit/access/CRM signals — not a claim that the VC has committed interest.`;
    let rows=all.filter(v=>((v.name||"")+" "+(v.firm||"")+" "+(v.sectors||"")+" "+(v.stage||"")+" "+(v.location||"")).toLowerCase().includes(q));
    if(f==="travel")rows=rows.filter(v=>/travel|tourism|hospitality/i.test((v.sectors||"")+" "+(v.thesis||"")));
    if(f==="early")rows=rows.filter(v=>/pre.?seed|seed|angel/i.test(v.stage||""));
    if(f==="vch_current")rows=rows.filter(v=>v._source==="vch-current");
    if(f==="vch_historical")rows=rows.filter(v=>v._source==="vch-historical");
    if(f==="drafted")rows=rows.filter(v=>v.draftBody);
    rows.sort((a,b)=>vcInterestScore(b)-vcInterestScore(a)||fitScore(b)-fitScore(a));
    $("vcList").innerHTML=rows.slice(0,200).map(v=>{const m=vcInterestMeta(v);return `<div class="row"><div class="score">${fitScore(v)}</div><div class="grow"><strong>${esc(v.name||v.firm||"Unnamed target")} <span class="tag ${v._source==="vch-current"?"good":""}">${esc(sourceLabel(v))}</span> <span class="tag ${m.score>=72?"good":"warn"}">Interest ${m.score}% · ${esc(m.label)}</span></strong><div class="meta">${esc(v.stage||"stage unknown")} · ${esc(v.cheque||"cheque unknown")}${v.location?` · ${esc(v.location)}`:""}<br>${esc((v.sectors||v.thesis||"").slice(0,180))}<br><b>Why score:</b> ${esc(m.reasons.join(" · ")||"fit/access baseline")}</div></div><div class="actions">${v.website?`<a class="btn small" href="${esc(v.website)}" target="_blank" rel="noopener">Research</a>`:""}${v.linkedin?`<a class="btn small" href="${esc(v.linkedin)}" target="_blank" rel="noopener">People</a>`:""}<button class="btn primary small" onclick="openDraft('${v.id}')">${v.draftBody?"Review draft":"Smart pitch"}</button></div></div>`}).join("")||`<div class="empty">${VCH_LOADING?"Loading investor sources…":"No matches. Try a broader stage, location or sector search."}</div>`;
  };

  window.openDraft=async function(id){
    let v=investorRows().find(x=>x.id===id);if(!v)return;
    if(v._suggested){
      try{const clean={seg:"investor",name:v.name||"",firm:v.firm||"",email:v.email||"",stage:v.stage||"",cheque:v.cheque||"",sectors:v.sectors||"",thesis:v.thesis||"",website:v.website||"",linkedin:v.linkedin||"",location:v.location||"",status:"research",source:v.source||sourceLabel(v),sourceUrl:v.sourceUrl||v.website||"",matchScore:fitScore(v),approachability:Number(v.approachability||0),vchRank:v.vchRank||0,createdAt:FV.serverTimestamp(),createdBy:CURRENT_ADMIN.uid};const ref=await db.collection("crm").add(clean);v={...v,...clean,id:ref.id,_suggested:false,_source:"saved"};VCS.push(v);id=ref.id;toast("Target saved to your private pipeline.")}catch(e){toast(friendlyError(e),true);return}
    }
    const d=v.draftBody?{subject:v.draftSubject,body:v.draftBody}:baseDraft(v),m=vcInterestMeta(v);
    openModal(`<div class="modalhead"><div><div class="eyebrow">Review before sending</div><h2>${esc(v.name||v.firm)}</h2></div><button class="btn" onclick="closeModal()">Close</button></div><div class="alert ${m.score>=82?"good":""}"><b>Estimated investor interest: ${m.score}% · ${esc(m.label)}</b><div class="meta">${esc(m.reasons.join(" · ")||"fit/access baseline")}. This estimates alignment and outreach priority; it is not a claim about the VC’s private intent.</div></div>${v.source?`<div class="alert"><b>Source:</b> ${esc(v.source)}${v._source==="vch-historical"||String(v.source).includes("historical")?" — re-verify current stage, thesis and route before sending.":""}</div>`:""}<div class="field"><label>Subject</label><input id="draftSubject" class="input" value="${esc(d.subject)}"></div><div class="field" style="margin-top:10px"><label>Investor-specific email</label><textarea id="draftBody" class="input" style="min-height:340px">${esc(d.body)}</textarea></div><div class="actions" style="margin-top:12px"><button id="aiDraftBtn" class="btn primary" onclick="aiImproveDraft('${id}')">AI personalize</button><button class="btn" onclick="saveDraft('${id}')">Save</button><button class="btn" onclick="copyDraft()">Copy full draft</button>${v.email?`<button class="btn good" onclick="copyAndOpenGmail('${id}')">Copy + open Gmail</button><button class="btn good" onclick="openGmailOnly('${id}')">Open Gmail</button><button class="btn" onclick="openEmail('${id}')">Email app</button>`:""}</div><div class="meta" style="margin-top:10px">For safety, the browser opens a send-ready Gmail compose instead of silently sending. Review each claim and recipient before pressing Send.</div>`);
  };

  window.aiImproveDraft=async function(id){
    const v=VCS.find(x=>x.id===id);if(!v)return;const key=localStorage.getItem("rw_admin_ai_key"),m=vcInterestMeta(v);
    if(!key){const d=baseDraft(v);$("draftSubject").value=d.subject;$("draftBody").value=d.body;toast(`Applied structured ${m.label.toLowerCase()} draft.`);return}
    $("aiDraftBtn").disabled=true;
    const tone=m.score>=82?"high-conviction and direct, with a clear investment ask":m.score>=62?"warm, concise and fit-seeking, asking for a short conversation":"relationship-first and low-pressure, asking for feedback, milestones or an earlier-stage introduction";
    const prompt=`Rewrite this fundraising email for one investor. Interest score is an internal estimate (${m.score}/99, ${m.label}); never tell the investor that score or claim they are eager. Use a ${tone} tone. Keep every company number exact, stay under 190 words, sound direct and human, avoid hype, do not invent portfolio companies or facts, and retain both RoamWise links. Return JSON only with subject and body.\nInvestor: ${JSON.stringify({name:v.name,firm:v.firm,stage:v.stage,cheque:v.cheque,sectors:v.sectors,thesis:v.thesis,status:v.status,source:v.source})}\nCompany facts: ${JSON.stringify(PITCH)}\nDraft: ${$("draftBody").value}`;
    try{const out=await callAI(prompt);let data;try{data=JSON.parse(out.replace(/^```json\s*|\s*```$/g,""))}catch{data={subject:$("draftSubject").value,body:out}};$("draftSubject").value=data.subject||$("draftSubject").value;$("draftBody").value=data.body||out;await saveDraft(id);toast("AI personalization completed. Review before sending.")}catch(e){toast(e.message,true)}finally{$("aiDraftBtn").disabled=false}
  };

  const outreach=document.getElementById("outreach");
  if(outreach&&!document.getElementById("vcInterestExplainer")){
    const box=document.createElement("div");box.id="vcInterestExplainer";box.className="alert good";box.innerHTML="<b>Smart outreach enabled.</b> Investor emails now adapt to estimated alignment and actual CRM response signals. Use <b>Copy + open Gmail</b> for a send-ready draft. Interest percentages are prioritization estimates, never claims about a VC’s private intent.";
    const lead=outreach.querySelector(".lead");if(lead)lead.insertAdjacentElement("afterend",box);
  }
  try{window.renderVCs()}catch(e){console.warn("VC outreach enhancement render failed",e);try{originalRender()}catch{}}
});
