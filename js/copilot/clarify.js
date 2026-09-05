// @ts-nocheck
// Moved verbatim from app.js — Cross-questioning: when the only destination
// match is a common English word, this asks instead of guessing.
// Called from js/copilot/rich-reply.js.
/* ==================== CROSS-QUESTIONING ====================
   When the only candidate destination is a common English word that merely
   HAPPENS to name a hamlet somewhere, guessing is worse than asking. */
var RW_COMMON_WORDS = /^(you|your|yours|yourself|youre|u|ur|me|my|mine|myself|we|us|our|ours|they|them|their|he|him|his|she|her|hers|it|its|tusk|ailon|roamwise|bot|ai|assistant|hello|hey|hi|namaste|thanks|thank|please|sorry|all|say|under|over|about|mean|share|send|nice|good|best|top|new|old|big|small|long|short|first|last|next|only|even|both|most|much|many|more|less|same|other|such|own|off|out|up|down|in|on|at|to|for|and|but|or|so|as|if|then|than|when|while|where|why|how|what|who|which|of|be|is|are|was|were|do|did|has|have|had|can|will|would|should|could|may|might|must|no|not|yes|ok|okay|well|just|very|too|also|still|back|again|here|there|now|today|day|days|week|month|year|time|trip|tour|plan|go|going|come|coming|see|do|make|take|get|give|want|need|like|know|think|feel|find|use|work|help|try|ask|tell|call|keep|let|put|show|turn|start|stop|end|open|close|hold|bring|move|live|play|run|walk|talk|read|write|hear|watch|look|seem|leave|stay|book|visit|travel|explore|discover)$/i;
function rwNeedsClarify(dest, parsed, geo){
  if(!dest) return false;
  if(parsed && parsed.multi) return false;
  var d = String(dest).trim();
  if(d.indexOf(' ')>-1) return false;                    /* multi-word names are rarely accidents */
  if(!RW_COMMON_WORDS.test(d)) return false;             /* a real place name, carry on */
  if(typeof rwKnownMap==='function' && rwKnownMap()[d.toLowerCase()]) return false;
  return true;                                            /* common word + not a known place = ask */
}
function rwClarifyWordHTML(word, parsed){
  var days = parsed && parsed.days ? parsed.days : null;
  var suggest = ['Goa','Manali','Jaipur','Kerala','Rishikesh'];
  return '<div class="tk-card"><div class="tk-sec">'
    +'<div style="font-size:13.5px;line-height:1.65">\ud83e\udded I\u2019m not sure what you meant by \u201c<b>'+esc2(word)+'</b>\u201d.<br>'
    +'<span style="color:var(--t2);font-size:12.5px">There is a tiny village called '+esc2(word)+' in Spain, but I doubt that\u2019s it \u2014 so I\u2019d rather ask than send you somewhere absurd.</span></div>'
    +'<div class="tk-lab" style="margin-top:11px">Did you mean</div>'
    +'<div class="tk-chips">'
    +'<button class="tk-chip gold" onclick="cpFollow(\''+(days?days+' days ':'')+'india trip\')">\ud83c\uddee\ud83c\uddf3 A trip around India</button>'
    + suggest.map(function(sx){ return '<button class="tk-chip" onclick="cpFollow(\''+(days?days+' days in ':'')+sx+'\')">'+sx+'</button>'; }).join('')
    +'</div>'
    +'<div style="font-size:11px;color:var(--t3);margin-top:10px">Or just type the city and country \u2014 e.g. \u201c'+(days||5)+' days in Udaipur, India\u201d.</div>'
    +'</div></div>';
}
