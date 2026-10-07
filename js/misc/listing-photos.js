// @ts-nocheck
/* Admin-uploaded listing photos. The partner admin compresses each photo in the browser and stores it in
   config/photo_<partnerId>_<n> (public read, admin write: the existing `match /config/{doc}` rule). A listing
   carries `photoCount`; photos are fetched lazily so the list itself stays small. Only strict base64
   webp/jpeg data URLs are ever rendered. Repo photos under assets/property-photos/ still take priority. */
function rwUploadedPhotoOk(src){
  return typeof src==='string' && src.length<400000 && /^data:image\/(?:webp|jpeg);base64,[A-Za-z0-9+\/]+=*$/.test(src);
}
function rwPhotoDocId(partnerId, n){
  return 'photo_'+String(partnerId||'').replace(/[^a-z0-9_]/gi,'')+'_'+n;
}
function rwLoadUploadedPhotos(x, done){
  var n=Math.min(4, Number(x&&x.photoCount)||0);
  if(!n || x._uplState || typeof db==='undefined' || !db){ if(done) done(false); return; }
  x._uplState='loading';
  var jobs=[]; for(var i=0;i<n;i++){ (function(k){
    jobs.push(db.collection('config').doc(rwPhotoDocId(x.id,k)).get().then(function(d){ return d.exists?d.data():null; }).catch(function(){ return null; }));
  })(i); }
  Promise.all(jobs).then(function(list){
    var add=list.filter(function(p){ return p&&rwUploadedPhotoOk(p.src); }).map(function(p){
      return { src:p.src, alt:String(p.alt||x.name).slice(0,160), caption:String(p.caption||'').slice(0,120) };
    });
    x.photos=(x.photos||[]).concat(add);
    x._uplState='done';
    if(done) done(add.length>0);
  });
}
