/* Server-only atomic reservation primitives using Firestore create-if-absent.
 * These are permanent, fail-closed claims, not a mutable balance store.
 * A crashed or uncertain supplier request must be reconciled manually before any retry.
 * No direct integration into existing wallet or supplier flow yet. */
import { createDocIfAbsent } from './firestore-rest.js';
const ID=/^[A-Za-z0-9_-]{1,100}$/;
export function claimId(kind,id){
 if(!ID.test(kind)||!ID.test(id))throw new Error('invalid_claim_key');
 return kind+'__'+id;
}
export async function reserveOnce({env,accessToken,projectId,kind,id,amountPaise=0,now=new Date(),create=createDocIfAbsent}){
 if(!Number.isSafeInteger(amountPaise)||amountPaise<0)throw new Error('invalid_amount');
 const key=claimId(kind,id);
 const created=await create(env,accessToken,projectId,'financeClaims',key,{kind,id,amountPaise,state:'reserved',createdAt:now.toISOString()});
 return {reserved:created,key,reason:created?'reserved':'duplicate_or_uncertain'};
}
/* This alone does NOT enforce a total daily spending cap. Implement an atomic
 * budget aggregate transaction that validates spent+reserved+new <= 50000
 * before using this primitive in paid API calls. */
