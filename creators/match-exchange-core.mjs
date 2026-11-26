/* Pure helpers for the creator ↔ property number exchange (rules: matchInterest, contactCards). */
export const KEY_RE=/^(creator|property)-[A-Za-z0-9_-]{1,90}$/;
export const validKey=k=>typeof k==='string'&&KEY_RE.test(k);
export const kindOf=k=>validKey(k)?k.split('-')[0]:'';
export const pairId=(from,to)=>from+'__'+to;
export function canRequest(from,to){return validKey(from)&&validKey(to)&&from!==to&&kindOf(from)!==kindOf(to)}
/* Split interest docs into mutual, incoming-only and outgoing-only listing keys. */
export function classify(me,docs){
 const out=new Set(),inc=new Set();
 for(const d of docs||[]){if(!d)continue;if(d.from===me&&validKey(d.to))out.add(d.to);else if(d.to===me&&validKey(d.from))inc.add(d.from)}
 const mutual=[...out].filter(k=>inc.has(k)).sort();
 return {mutual,incoming:[...inc].filter(k=>!out.has(k)).sort(),outgoing:[...out].filter(k=>!inc.has(k)).sort()};
}
export function cleanCard({phone='',whatsapp='',email=''}={}){
 const card={};const tel=v=>String(v).trim();
 if(tel(phone)){if(!/^[+0-9 ()-]{6,20}$/.test(tel(phone)))throw Error('Phone: digits, spaces, + ( ) - only');card.phone=tel(phone)}
 if(tel(whatsapp)){if(!/^[+0-9 ()-]{6,20}$/.test(tel(whatsapp)))throw Error('WhatsApp: digits, spaces, + ( ) - only');card.whatsapp=tel(whatsapp)}
 if(tel(email)){if(tel(email).length>120||!/^[^@ ]+@[^@ ]+$/.test(tel(email)))throw Error('Email looks wrong');card.email=tel(email)}
 return card;
}
