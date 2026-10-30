/* Public concepts only. No supplier SKU, stock or purchase availability implied. */
(function(root) {
  'use strict';
  const products = [
    {id:'panchachuli-tee',fulfilment:'pod',name:'Five peaks. One home.',type:'Oversized tee',category:'wear',motif:'PANCHACHULI',tone:'violet',sizes:true,description:'A quiet mountain-line graphic. Proposed heavyweight cotton, with fit and fabric awaiting sample approval.'},
    {id:'aipan-tee',fulfilment:'pod',name:'Aipan, in everyday life.',type:'RoamWise design tee',category:'wear',motif:'AIPAN / ऐपन',tone:'red',sizes:true,description:'A red-and-white design direction inspired by Kumaon. Final artwork will be supplied and approved by RoamWise before printing.'},
    {id:'pahad-hoodie',fulfilment:'pod',name:'Take the hills with you.',type:'Mountain hoodie',category:'wear',motif:'PAHAD',tone:'gold',sizes:true,description:'A layered mountain graphic for cool evenings. Fabric weight and warmth have not yet been tested; this is not technical winter gear.'},
    {id:'almora-tote',fulfilment:'pod',name:'Almora to global.',type:'Everyday tote',category:'travel',motif:'ALMORA → GLOBAL',tone:'cream',sizes:false,description:'A simple carry-all concept for books, small finds and unhurried days. Material and load capacity pending samples.'},
    {id:'packing-cubes',name:'A place for everything.',type:'Packing cube set',category:'travel',motif:'PACK LIGHT',tone:'green',sizes:false,description:'A travel-essential sourcing shortlist. Supplier, dimensions, materials and final selection are not yet confirmed.'},
    {id:'tech-organiser',name:'Work from somewhere.',type:'Tech organiser',category:'travel',motif:'GO SLOW. STAY READY.',tone:'blue',sizes:false,description:'A proposed organiser for cables and small accessories. Supplier and product specifications pending verification.'}
  ];
  root.RWShopProviders = [
    {id:'qikink',name:'Qikink',role:'India-first sample candidate',status:'not_connected',url:'https://qikink.com/'},
    {id:'printrove',name:'Printrove',role:'India alternative to sample-test',status:'not_connected',url:'https://printrove.com/'},
    {id:'printify',name:'Printify',role:'Compare by product and destination',status:'not_connected',url:'https://printify.com/'}
  ];
  root.RWShopCatalog = products;
  if (typeof module !== 'undefined') module.exports = products;
})(typeof window !== 'undefined' ? window : globalThis);
