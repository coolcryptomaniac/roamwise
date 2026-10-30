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
    ,{id:'quick-dry-towel',name:'Freshen up. Pack down.',type:'Compact travel towel',category:'travel',motif:'FRESH START',tone:'cream',sizes:false,description:'A compact towel candidate for stays, gym visits and travel. Absorbency, drying time, material and wash durability must pass sample checks before sale.'}
    ,{id:'backpack-rain-cover',name:'A little cover for the journey.',type:'Backpack rain cover',category:'travel',motif:'RAIN READY',tone:'green',sizes:false,description:'A cover candidate for everyday commutes and wet-weather travel. Backpack capacity, fastening and water resistance are pending verification; not a waterproof guarantee.'}
    ,{id:'laundry-shoe-bag',name:'Keep the clean things clean.',type:'Reusable laundry / shoe bag',category:'travel',motif:'SORT. PACK. REPEAT.',tone:'blue',sizes:false,description:'A washable bag candidate to separate shoes or used clothes in your luggage. Dimensions, seams, closures and wash performance pending sample approval.'}
    ,{id:'pahad-bag-charm',name:'A tiny piece of pahad.',type:'Mountain / buransh bag charm',category:'style',motif:'LITTLE JOYS',tone:'red',sizes:false,description:'An original mountain or buransh-inspired charm concept for totes and backpacks. Material, fastening, design rights and supplier still to be approved; decorative accessory, not climbing equipment.'}
    ,{id:'woven-phone-strap',name:'Colour for your everyday carry.',type:'Woven phone wrist strap',category:'style',motif:'COLOUR ON THE GO',tone:'violet',sizes:false,description:'A colourful woven strap candidate for everyday travel photos and outings. Case compatibility, attachment strength and comfort need sample checks; no anti-drop or anti-theft guarantee.'}
    ,{id:'aipan-bandana',name:'One scarf. Your own style.',type:'Aipan-inspired bandana / bag scarf',category:'style',motif:'KUMAON IN COLOUR',tone:'gold',sizes:false,description:'An original RoamWise print direction for a wearable bandana or bag accent. Fabric, dimensions, colourfastness and printing supplier pending approval. Styling concept, not protective headwear.'}
  ];
  root.RWShopProviders = [
    {id:'qikink',name:'Qikink',role:'India-first sample candidate',status:'not_connected',url:'https://qikink.com/'},
    {id:'printrove',name:'Printrove',role:'India alternative to sample-test',status:'not_connected',url:'https://printrove.com/'},
    {id:'printify',name:'Printify',role:'Compare by product and destination',status:'not_connected',url:'https://printify.com/'}
  ];
  root.RWShopCatalog = products;
  if (typeof module !== 'undefined') module.exports = products;
})(typeof window !== 'undefined' ? window : globalThis);
