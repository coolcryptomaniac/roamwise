// @ts-nocheck
// Moved verbatim from app.js — On-the-ground costs & street smarts: modelled
// taxi/room/meal price ranges and overcharge patterns per region.
/* ==================== ON-THE-GROUND COSTS & STREET SMARTS =================
   What a traveller actually needs the hour they land: what a taxi SHOULD cost,
   what a room SHOULD cost, what a meal SHOULD cost, and the specific ways
   people get overcharged in that region.

   These are MODELLED RANGES from published fare structures and typical rates,
   not live quotes — labelled as such everywhere they appear. We deliberately do
   NOT invent "areas to avoid" or claim any place or group is dangerous; the
   warnings here are about PRICING TRICKS and paperwork, which are checkable
   facts, not stereotypes. */
var RW_GROUND = {
  IN: {
    cur:'\u20b9',
    transport:[
      ['\ud83d\udef5 Auto-rickshaw', '\u20b925\u201335 base + \u20b915\u201320/km', 'Insist on the meter. "Meter kharab hai" means walk to the next one.'],
      ['\ud83d\ude95 App cab (Uber/Ola)', '\u20b925\u201335/km + surge', 'Always cheaper than a street taxi at a tourist spot. Book from inside, not the kerb.'],
      ['\ud83c\udfcd\ufe0f Bike taxi (Rapido)', '\u20b910\u201315/km', 'Cheapest for one person in traffic. Helmet should be provided \u2014 ask.'],
      ['\ud83d\udef5 Rented scooter', '\u20b9400\u2013700/day', 'Photograph every existing scratch before you ride off. Keep the original licence.'],
      ['\ud83d\ude8c State bus', '\u20b91\u20132/km', 'Slow but honest pricing. Book on the state RTC site, not an agent.'],
      ['\ud83d\ude82 Train (sleeper/3AC)', '\u20b90.4\u20131.2/km', 'IRCTC only. Tatkal opens 10\u201311am one day before.'],
      ['\u2708\ufe0f Domestic flight', '\u20b93,000\u20138,000', 'Cheapest 3\u20136 weeks out; Tue/Wed departures are usually lowest.']
    ],
    stay:[['Hostel dorm','\u20b9400\u2013900'],['Budget room','\u20b9800\u20131,800'],['Mid hotel','\u20b92,000\u20134,500'],['Premium','\u20b96,000+']],
    food:[['Street plate','\u20b930\u2013080'],['Dhaba thali','\u20b9100\u2013200'],['Cafe meal','\u20b9250\u2013500'],['Restaurant dinner','\u20b9600\u20131,200']],
    hacks:[
      'Ask your hotel what a fair fare is BEFORE you step out \u2014 it takes one minute and kills 90% of overcharging.',
      'Agree the price out loud before the ride starts, or use a meter/app. Never "we\u2019ll see later".',
      'At stations and airports, use the prepaid taxi counter \u2014 fixed slip, no argument.',
      '"Your hotel is closed/full, I\u2019ll take you to a better one" is a commission scheme. Call your hotel and confirm.',
      'Free bracelet, free blessing, free henna \u2014 nothing offered unprompted is free.',
      'Count change before walking away, and keep \u20b910/20/50 notes for autos.',
      'Buy SIM and tickets from official counters or apps, never from someone who approaches you.',
      'If a shop is "the only one open today because of a festival", it isn\u2019t.'
    ]
  },
  SEA: {
    cur:'$',
    transport:[
      ['\ud83c\udfcd\ufe0f Scooter rental','$5\u201310/day','Never hand over your passport as deposit \u2014 offer a copy or cash.'],
      ['\ud83d\ude95 Grab / ride app','$0.4\u20130.8/km','Use the app even for short hops; street quotes run 2\u20133x.'],
      ['\ud83d\udef5 Tuk-tuk','$2\u20135 short hop','Agree the fare first. "Very cheap tour" ends at a gem shop.'],
      ['\ud83d\ude8c Local bus','$0.3\u20131','Slow, safe, and the real price.'],
      ['\u26f4\ufe0f Ferry','$5\u201320','Book at the pier office, not through a beach tout.']
    ],
    stay:[['Hostel dorm','$5\u201312'],['Budget room','$12\u201325'],['Mid hotel','$30\u201360'],['Premium','$90+']],
    food:[['Street plate','$1\u20133'],['Local restaurant','$3\u20136'],['Tourist restaurant','$8\u201315'],['Western cafe','$6\u201312']],
    hacks:[
      'Eat where the plastic stools are \u2014 cheaper and usually better.',
      'Scooter damage claims are the classic scam: film a slow walk-around before renting.',
      '"Temple is closed today" almost always means a tuk-tuk commission run.',
      'Withdraw larger amounts less often \u2014 ATM fees are per transaction.',
      'Refuse to pay a "fine" without an official receipt; ask to go to the station.'
    ]
  },
  EU: {
    cur:'\u20ac',
    transport:[
      ['\ud83d\ude87 Metro day pass','\u20ac6\u201312','Almost always cheaper than 3 single tickets. Validate it or face a fine.'],
      ['\ud83d\ude95 Ride app','\u20ac1.5\u20132.5/km','Airport transfers often have a fixed rate \u2014 check before booking.'],
      ['\ud83d\ude86 Regional train','\u20ac0.1\u20130.2/km','Book early; walk-up fares can be triple.'],
      ['\ud83d\udeb2 City bike','\u20ac1\u20133/ride','Cheapest way to see a compact old town.']
    ],
    stay:[['Hostel dorm','\u20ac20\u201335'],['Budget room','\u20ac45\u201380'],['Mid hotel','\u20ac90\u2013150'],['Premium','\u20ac200+']],
    food:[['Bakery lunch','\u20ac4\u20138'],['Casual meal','\u20ac12\u201320'],['Sit-down dinner','\u20ac25\u201345'],['Fine dining','\u20ac60+']],
    hacks:[
      'Menu turistico near a landmark = 2x the price 3 streets away.',
      'A "cover charge" (coperto) is legal in Italy but must be on the menu \u2014 check first.',
      'Always choose to be charged in the LOCAL currency on card machines; "pay in your own currency" adds a poor exchange rate.',
      'Validate train and tram tickets \u2014 inspectors are frequent and fines are steep.'
    ]
  }
};
function rwGroundFor(geo){
  var cc = (geo && geo.cc || '').toUpperCase();
  if(cc==='IN' || cc==='NP' || cc==='LK' || cc==='BD' || cc==='PK') return {k:'IN', d:RW_GROUND.IN};
  if(['TH','VN','ID','MY','KH','LA','PH','SG','MM'].indexOf(cc)>-1) return {k:'SEA', d:RW_GROUND.SEA};
  if(['FR','IT','ES','DE','PT','CZ','NL','BE','AT','GR','HU','PL','HR'].indexOf(cc)>-1) return {k:'EU', d:RW_GROUND.EU};
  return null;
}
function groundHTML(geo, placeName){
  var g = rwGroundFor(geo); if(!g) return '';
  var d = g.d;
  function rows(list){
    return list.map(function(r){
      return '<div style="display:flex;justify-content:space-between;gap:10px;font-size:12px;padding:4px 0;border-bottom:1px solid rgba(255,255,255,.04)">'
        +'<span style="color:var(--t2);flex:1">'+r[0]+'</span><b style="white-space:nowrap">'+r[1]+'</b></div>'
        + (r[2]? '<div style="font-size:10.5px;color:var(--t3);margin:-1px 0 5px;line-height:1.5">'+r[2]+'</div>' : '');
    }).join('');
  }
  function pairs(list){
    return '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:4px">'
      + list.map(function(r){ return '<span style="font-size:11px;padding:4px 9px;border-radius:999px;border:1px solid var(--b2,#2A2A36);color:var(--t2)">'+r[0]+' <b>'+r[1]+'</b></span>'; }).join('')
      + '</div>';
  }
  return '<div style="background:var(--bg2,#12121C);border:1px solid var(--b2,#2A2A36);border-radius:14px;padding:13px 15px;margin-top:10px">'
    +'<div style="font-weight:800;font-size:12.5px">\ud83d\ude95 What things should cost in '+esc2(placeName)+'</div>'
    +'<div style="font-size:10.5px;color:var(--t3);margin-bottom:8px">Typical ranges so you know when a quote is off \u2014 estimates, not live fares.</div>'
    +'<div style="font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--gold2,#C8913E);margin-bottom:3px">Getting around</div>'
    + rows(d.transport)
    +'<div style="font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--gold2,#C8913E);margin:9px 0 2px">Per night</div>'
    + pairs(d.stay)
    +'<div style="font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--gold2,#C8913E);margin:9px 0 2px">Per meal</div>'
    + pairs(d.food)
    +'<div style="font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--gold2,#C8913E);margin:10px 0 3px">Don\u2019t get played</div>'
    + d.hacks.map(function(h){ return '<div style="font-size:11.5px;color:var(--t2);line-height:1.6;padding:2px 0">\u2022 '+h+'</div>'; }).join('')
    +'</div>';
}
