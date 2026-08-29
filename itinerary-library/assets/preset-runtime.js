(()=>{
  const qs=new URLSearchParams(location.search);
  const p=document.querySelector('.progress');
  if(p)addEventListener('scroll',()=>{const d=document.documentElement;p.style.width=((d.scrollTop/Math.max(1,d.scrollHeight-d.clientHeight))*100)+'%'});
  const io=('IntersectionObserver'in window)?new IntersectionObserver(es=>es.forEach(e=>e.isIntersecting&&e.target.classList.add('show')),{threshold:.08}):null;
  document.querySelectorAll('.day').forEach(x=>io?io.observe(x):x.classList.add('show'));
  const allowed=['crimson-moon','scarlet-pilgrim','eastern-frontier','crimson-expedition'];
  const theme=qs.get('theme'); if(theme&&allowed.includes(theme))document.body.className='theme-'+theme+(document.body.classList.contains('share-mode')?' share-mode':'');
  document.querySelectorAll('[data-theme]').forEach(b=>b.onclick=()=>{for(const t of allowed)document.body.classList.remove('theme-'+t);document.body.classList.add('theme-'+b.dataset.theme)});
  const body=document.body;
  const clean=s=>(s||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,' ').trim();
  const esc=s=>String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  function userName(){
    let n=qs.get('user')||qs.get('username')||qs.get('traveler')||body.dataset.shareUser||'';
    try{if(!n&&parent&&parent!==window){n=parent.RW_USER?.displayName||parent.RW_USER?.name||parent.rwUser?.displayName||parent.firebase?.auth?.()?.currentUser?.displayName||'';if(!n){const em=parent.firebase?.auth?.()?.currentUser?.email||'';if(em)n=em.split('@')[0]}}}catch(e){}
    if(!n){for(const k of ['rwUserName','rw_username','displayName','userName']){try{n=localStorage.getItem(k)||''}catch(e){} if(n)break}}
    return String(n||'').trim().slice(0,64);
  }
  function stamp(){let s=document.querySelector('.share-stamp');if(!s)return;const n=userName();const img=s.querySelector('img');if(img){img.onerror=()=>{img.onerror=null;img.src='../../assets/roamwise-mark.svg'};img.src='../../../icon-512.png'}s.querySelector('.for').textContent=n?('Made by RoamWise for '+n):'Made by RoamWise';if(qs.get('share')==='1')body.classList.add('share-mode')}
  stamp();
  async function share(){
    let n=userName(); if(!n&&'prompt'in window)n=(prompt('Name to show on the RoamWise share stamp:','')||'').trim().slice(0,64);
    const u=new URL(location.href);u.searchParams.set('share','1');if(n)u.searchParams.set('user',n);history.replaceState(null,'',u);body.dataset.shareUser=n;qs.set('share','1');if(n)qs.set('user',n);body.classList.add('share-mode');stamp();
    const title=document.title, text=n?`Made by RoamWise for ${n}`:'Made by RoamWise';
    if(navigator.share){try{await navigator.share({title,text,url:u.href});return}catch(e){if(e?.name==='AbortError')return}}
    try{await navigator.clipboard.writeText(u.href);alert('Branded share link copied. Share/screenshot this view with the RoamWise stamp visible.')}catch(e){}
  }
  document.querySelectorAll('[data-share]').forEach(b=>b.addEventListener('click',share));
  function mapFrame(holder,q){if(!holder||holder.dataset.loaded)return;holder.dataset.loaded='1';const f=document.createElement('iframe');f.loading='lazy';f.referrerPolicy='no-referrer-when-downgrade';f.title='Local map: '+q;f.src='https://www.google.com/maps?q='+encodeURIComponent(q)+'&output=embed';holder.appendChild(f)}
  const main=document.querySelector('[data-main-map]');if(main)main.onclick=()=>{const h=document.querySelector('.live-map'),q=[body.dataset.destination,body.dataset.gateway,body.dataset.region,body.dataset.country].filter(Boolean).join(', ');h.classList.toggle('open');if(h.classList.contains('open'))mapFrame(h,q)};
  document.querySelectorAll('.day').forEach(d=>{const b=d.querySelector('.day-map-btn'),h=d.querySelector('.day-map');if(!b||!h)return;b.onclick=()=>{h.classList.toggle('open');if(h.classList.contains('open')){const title=d.querySelector('h3')?.textContent||body.dataset.destination;mapFrame(h,title+', '+body.dataset.region+', '+body.dataset.country)}}});
  function upgradePhoto(url){try{const outer=new URL(url);if(outer.hostname==='images.weserv.nl'){let src=outer.searchParams.get('url');if(src){const inner=new URL(src);const a=inner.pathname.split('/');const i=a.indexOf('thumb');if(i>=0&&a.length>i+4){inner.pathname=[...a.slice(0,i),...a.slice(i+1,-1)].join('/');src=inner.href}outer.searchParams.set('url',src);outer.searchParams.set('w','1800');outer.searchParams.set('h','1100');outer.searchParams.set('fit','cover');outer.searchParams.set('q','86');return outer.href}}return url}catch(e){return url}}
  function getParentPhotos(){try{return (parent&&parent!==window&&parent.RW_PHOTOS_DATA)||window.RW_PHOTOS_DATA||null}catch(e){return window.RW_PHOTOS_DATA||null}}
  function loadRootPhotos(){return new Promise(resolve=>{const existing=getParentPhotos();if(existing)return resolve(existing);const s=document.createElement('script');s.src='../../../destination-photos.js';s.onload=()=>resolve(getParentPhotos());s.onerror=()=>resolve(null);document.head.appendChild(s)})}
  function findPhoto(db,key){if(!db||!key)return null;const n=clean(key),entries=Object.entries(db);for(const [k,v]of entries)if(clean(k)===n)return [k,v];if(n.length>3){for(const [k,v]of entries){const x=clean(k);if(x.includes(n)||n.includes(x))return[k,v]}}return null}
  async function photos(){const db=await loadRootPhotos();if(!db)return;let keys=[];try{keys=JSON.parse(body.dataset.photoKeys||'[]')}catch(e){}keys=[body.dataset.gateway,body.dataset.destination,...keys].filter(Boolean);const found=[];const seen=new Set();for(const k of keys){const hit=findPhoto(db,k);if(hit&&!seen.has(hit[1])){seen.add(hit[1]);found.push(hit);if(found.length>=5)break}}if(!found.length)return;const hero=document.querySelector('.hero-photo');if(hero){hero.style.backgroundImage=`url("${upgradePhoto(found[0][1])}")`;hero.classList.add('ready')}
    const anchor=document.querySelector('.local-intel-section')||document.querySelector('main .section');if(!anchor)return;const sec=document.createElement('section');sec.className='section local-photo-section';sec.id='rwLocalPhotos';sec.innerHTML='<h2>Local <em>Frames</em></h2><p class="lead">Destination imagery is pulled from the existing RoamWise photo library when a verified local match exists. The cinematic engine keeps the route readable even when imagery is unavailable.</p><div class="local-frames"></div>';const grid=sec.querySelector('.local-frames');found.slice(0,5).forEach(([name,url])=>{const f=document.createElement('figure');f.className='local-frame';f.innerHTML='<img loading="lazy" referrerpolicy="no-referrer" alt="'+esc(name)+'"><span>'+esc(name)+'</span>';f.querySelector('img').src=upgradePhoto(url);grid.appendChild(f)});anchor.after(sec)}
  photos();
})();