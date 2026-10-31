// Pure state transitions for interruptible voice; no microphone starts automatically.
export function nextVoiceTurn(state,event){
 const current=state||{mode:'idle',turn:0};
 switch(event){
 case 'listen': return {mode:'listening',turn:current.turn};
 case 'speech-end': return current.mode==='listening'?{mode:'thinking',turn:current.turn+1}:current;
 case 'reply': return current.mode==='thinking'?{...current,mode:'speaking'}:current;
 case 'interrupt': return {mode:'listening',turn:current.turn+1};
 case 'stop': return {mode:'idle',turn:current.turn+1};
 default: return current;
 }
}
