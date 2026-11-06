/* Normalize creator social links. Avoid relative internal links and unsafe protocols. */
export function instagramUrl(value=''){
 let raw=String(value||'').trim();
 if(!raw)return '';
 raw=raw.replace(/^@/,'');
 if(/^https?:\/\//i.test(raw)){
  try{const u=new URL(raw);const host=u.hostname.toLowerCase().replace(/^www\./,'');
   if(host!=='instagram.com'&&host!=='instagr.am')return '';
   const handle=u.pathname.split('/').filter(Boolean)[0]||'';
   if(!/^[A-Za-z0-9._]{1,30}$/.test(handle))return '';
   return 'https://www.instagram.com/'+handle+'/';
  }catch{return ''}
 }
 raw=raw.replace(/^(?:www\.)?instagram\.com\//i,'').split(/[/?#]/)[0];
 if(!/^[A-Za-z0-9._]{1,30}$/.test(raw))return '';
 return 'https://www.instagram.com/'+raw+'/';
}
