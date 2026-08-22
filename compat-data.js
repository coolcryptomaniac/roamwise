/* ============================================================================
   RW_COMPAT — the Travel Compatibility Engine
   ============================================================================
   WHY THIS IS DIFFERENT FROM EVERY GROUP-TRAVEL PLATFORM WE COULD FIND:

   WeRoad matches strangers by AGE and LANGUAGE. That is the whole model, and
   it is used by the biggest funded player in the category (EUR 130M revenue,
   100,000 travellers in 2025). Age is a proxy so crude it barely predicts
   anything: a 28-year-old who wants 6am starts and a 28-year-old who wants to
   drink until 3am will have a miserable week together.

   What actually predicts whether a group gets on is not demography. It is
   BEHAVIOURAL FIT on a handful of axes where a mismatch causes friction every
   single day of a trip:

     · when you get up            (the fight that happens every morning)
     · how fast you move          (three sights a day vs one, slowly)
     · what you'll spend          (the fight that happens every evening)
     · plan vs improvise          (the fight that happens at every junction)
     · social energy              (talk all day vs need silence)
     · comfort floor              (dorm vs private room)

   These are the six things groups actually argue about. Nobody matches on
   them. That is the engine.

   HOW THE SCORE WORKS — deliberately explainable, never a black box:
   each axis is 1-5. We compare two travellers axis by axis, weight the axes
   that cause the most friction, and return a percentage WITH the reason. A
   traveller can always see why they matched or didn't, and disagree.
   ========================================================================= */

window.RW_AXES = [
  { k:'clock', label:'Your day starts', weight:1.4,
    ends:['Sunrise person','Slow mornings'],
    scale:['Up at 5, out by 6','Early-ish, breakfast then go','Normal, out by 9',
           'Lazy start, out by 11','Afternoons are my morning'],
    friction:'Wake-up time is the argument that repeats every single day of a trip.' },

  { k:'pace', label:'Your pace', weight:1.3,
    ends:['See everything','Sit somewhere good'],
    scale:['Four things a day, minimum','Three things, moving','Two things, unhurried',
           'One thing, properly','One place, all week'],
    friction:'A fast traveller with a slow one means one is always waiting and the other always rushed.' },

  { k:'spend', label:'What you\u2019ll spend', weight:1.5,
    ends:['Counting every rupee','Comfort matters more'],
    scale:['Dhabas and dorms','Cheap but clean','Middle, splurge sometimes',
           'Comfortable throughout','Best available'],
    friction:'The single biggest cause of group breakdown. Somebody always feels either poor or exploited.' },

  { k:'plan', label:'Plan or improvise', weight:1.1,
    ends:['Everything booked','See what happens'],
    scale:['Hour-by-hour, booked','Days planned, hours loose','Rough shape only',
           'Direction, not a plan','Wake up and decide'],
    friction:'Planners feel unsafe with improvisers. Improvisers feel trapped by planners.' },

  { k:'social', label:'Social energy', weight:1.0,
    ends:['Always together','Need my own time'],
    scale:['Together all day, every day','Together mostly','Half and half',
           'Some solo hours daily','Solo days, meet at dinner'],
    friction:'Someone who needs alone time will quietly resent a group that never splits up.' },

  { k:'comfort', label:'Comfort floor', weight:1.2,
    ends:['Anything with a roof','Private room, always'],
    scale:['Dorms, floors, tents','Basic private is fine','Clean private room',
           'Good room with a bathroom','Nothing below a proper hotel'],
    friction:'You find out on night one, and by then you have already paid.' }
];

/* Trip-level chemistry. A group is not just pairwise fit — a group of five
   4s and one 1 has a specific problem: one person is the odd one out. */
window.RW_GROUP_RULES = [
  { id:'outlier', label:'The odd one out',
    test:'One person sits 2+ points away from everyone else on a high-friction axis',
    say:'One traveller is going to feel out of step every day. Worth naming before you go, not after.' },
  { id:'split', label:'A group that is really two groups',
    test:'The group clusters into two camps with a gap between them',
    say:'This will naturally split into two groups. That is fine if you plan for it, painful if you do not.' },
  { id:'tight', label:'Genuinely well matched',
    test:'Everyone within 1 point on the high-friction axes',
    say:'This group will barely have to negotiate. Rare, and worth protecting.' }
];
