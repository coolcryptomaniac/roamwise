/* RoamWise violet/blue/gold, short-first response contract.
 * No prices, inventory or checkout URLs are ever accepted from an LLM.
 */
export const TUSK_BRAND=Object.freeze({violet:'#7357F6',blue:'#3478F6',gold:'#D9AA55',background:'#111226',surface:'#1C1C38',text:'#F8F7FF',radius:18});
const allowed=Object.freeze({
 shop:{label:'Shop',url:'/shop/',checkout:'/shop/order'},
 stays:{label:'Stays',url:'/stay-and-do/',checkout:'/stays/checkout'},
 packages:{label:'Packages',url:'/packages/',checkout:null},
 treks:{label:'Treks',url:'/treks/',checkout:null},
 pro:{label:'RoamWise Pro',url:'/pro/',checkout:'/cashfree/order'},
 music:{label:'Music',url:'/music/store/',checkout:'/music/order'}
});
export function tuskCommerceCard(type,item){
 if(!allowed[type]||!item||typeof item!=='object')return null;
 const title=String(item.title||item.name||'').trim().slice(0,100);
 const id=String(item.id||'');
 if(!title||!(/^[a-zA-Z0-9_-]{1,100}$/.test(id)))return null;
 return {id,type,title,subtitle:String(item.summary||'').slice(0,160),
  imageUrl:null,price:null,availability:'check_at_checkout',
  action:{label:'View & book',href:allowed[type].url,checkoutEndpoint:allowed[type].checkout,
   requiresServerQuote:true,requiresUserApproval:true}};
}
export function tuskCompactResult(answer,cards=[],expanded=false){
 const text=String(answer||'').trim();
 return {theme:TUSK_BRAND,summary:text.slice(0,expanded?900:200),cards:cards.filter(Boolean).slice(0,4),
  hasMore:text.length>200,details:expanded?text.slice(0,8000):undefined,
  note:'Final price and availability are verified before payment. Payment does not imply confirmed booking.'};
}
export function tuskCheckoutPolicy({authenticated,serverQuoteVerified,userApproved,providerSessionCreated,paymentVerified,bookingConfirmed}={}){
 if(!authenticated)return 'sign_in_required';
 if(!serverQuoteVerified)return 'verify_quote';
 if(!userApproved)return 'await_user_approval';
 if(!providerSessionCreated)return 'create_provider_checkout';
 if(!paymentVerified)return 'await_verified_payment';
 if(!bookingConfirmed)return 'await_booking_confirmation';
 return 'confirmed';
}
