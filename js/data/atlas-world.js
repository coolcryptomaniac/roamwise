// @ts-nocheck
// WORLD ATLAS — country layer. Lazy-loads data/atlas/world-countries.json
// (GeoNames CC-BY 4.0 via geonamescache; aliases curated) and exposes
// rwAtlasCountry(name) -> record|null (sync once loaded), rwAtlasLoad() -> Promise.
// Additive: nothing else depends on it yet; COUNTRY_INFO stays the source for the planner.
var RW_ATLAS_WORLD = null, _rwAtlasWorldP = null, _rwAtlasIdx = null;
function rwAtlasNorm(s){
  return String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9 ]+/g,' ').replace(/\s+/g,' ').trim();
}
function rwAtlasIndex(data){
  var idx = {};
  (data.countries||[]).forEach(function(c){
    [c.name, c.iso, c.iso3].concat(c.aliases||[]).forEach(function(k){
      var n = rwAtlasNorm(k); if(n && !idx[n]) idx[n] = c;
    });
  });
  return idx;
}
function rwAtlasLoad(){
  if(RW_ATLAS_WORLD) return Promise.resolve(RW_ATLAS_WORLD);
  if(_rwAtlasWorldP) return _rwAtlasWorldP;
  _rwAtlasWorldP = fetch('data/atlas/world-countries.json').then(function(r){ return r.json(); }).then(function(d){
    RW_ATLAS_WORLD = d; _rwAtlasIdx = rwAtlasIndex(d); return d;
  }).catch(function(){ _rwAtlasWorldP = null; return null; });
  return _rwAtlasWorldP;
}
function rwAtlasCountry(name){
  if(!_rwAtlasIdx) return null;
  return _rwAtlasIdx[rwAtlasNorm(name)] || null;
}
if(typeof module !== 'undefined') module.exports = { rwAtlasNorm: rwAtlasNorm, rwAtlasIndex: rwAtlasIndex };
