/* ============================================================================
   RW_ROLE_RESOURCES — what each role sees under "📚 My resources".
   ============================================================================
   EDIT THIS FILE DIRECTLY to add a role, add a link, or fix anything. No code
   change needed elsewhere — the staff panel just reads this object.

   Each resource item needs: { id, label, url, note }
     id   — must be unique WITHIN its role (used to remember "done" ticks)
     url  — can be a Doc/Sheet/Drive link, or "#" for a note-only item
     note — one short line explaining why it matters (shown under the label)

   RW_RESOURCE_COMMON applies to absolutely everyone, regardless of role.
   ========================================================================= */

window.RW_RESOURCE_COMMON = {
  label: 'Everyone', icon: '🌱',
  sections: [
    { heading: 'Day one',
      items: [
        { id:'c1', label:'Join the team WhatsApp/Slack group', url:'#', note:'Ask the founder for the invite link if you are not in it yet.' },
        { id:'c2', label:'Read the handbook', url:'#', note:'Use the 📘 Read the handbook button on your desk — it covers what is and is not okay here.' },
        { id:'c3', label:'Set up your daily log habit', url:'#', note:'One line, every day you work. It is what your certificate and pay are both based on.' }
      ] },
    { heading: 'Brand basics',
      items: [
        { id:'c4', label:'RoamWise one-line pitch', url:'#',
          note:'"An AI travel planner for India — day-by-day itineraries, group cost-splitting, and honest budgets, without a subscription."' },
        { id:'c5', label:'Logo & brand colours', url:'', note:'Gold #E8BA6C on near-black #0A0C14. Ask the founder for the logo pack.' }
      ] }
  ]
};

window.RW_ROLE_RESOURCES = {

  growth: { label: 'Growth & Community', icon: '📣',
    sections: [
      { heading: 'Your tools',
        items: [
          { id:'g1', label:'Metricool / Buffer queue', url:'', note:'Where scheduled posts live. Ask founder for login.' },
          { id:'g2', label:'Content calendar sheet', url:'', note:'What is going out this week and who owns it.' },
          { id:'g3', label:'Referral & share copy', url:'#', note:'The in-app share text is in app.js under rwPassportShare / marketing.js — reuse the tone, do not reinvent it.' }
        ] },
      { heading: 'What good looks like',
        items: [
          { id:'g4', label:'Post cadence', url:'#', note:'Consistency beats volume — a plain honest post 3x/week beats 1 viral attempt.' },
          { id:'g5', label:'Never buy followers or engagement', url:'#', note:'It is against every platform\u2019s terms and it is not who RoamWise is.' }
        ] }
    ] },

  qa: { label: 'Product & QA', icon: '🐞',
    sections: [
      { heading: 'Your tools',
        items: [
          { id:'q1', label:'Bug tracker sheet', url:'', note:'RoamWise-Issue-Tracker — log every bug here, not just in chat.' },
          { id:'q2', label:'Latest build to test', url:'', note:'Ask the founder which rw-vXX build is current before you start a pass.' },
          { id:'q3', label:'Issue format', url:'#', note:'Issue / Expected / Actual / Screen / Severity — see the tracker template tab.' }
        ] },
      { heading: 'How to test well',
        items: [
          { id:'q4', label:'Test on a REAL device, not just desktop', url:'#', note:'Most of the bugs that mattered in this project were only visible on a phone.' },
          { id:'q5', label:'Screenshot everything', url:'#', note:'A screenshot has found more real bugs here than any written description.' },
          { id:'q6', label:'Try to break it, not just use it', url:'#', note:'Empty inputs, huge numbers, no internet, switching apps mid-task.' }
        ] }
    ] },

  marketing: { label: 'Marketing & Sales', icon: '💼',
    sections: [
      { heading: 'Your tools',
        items: [
          { id:'m1', label:'CRM / lead sheet', url:'', note:'Where prospective users, partners and press contacts are tracked.' },
          { id:'m2', label:'Play Store listing copy', url:'', note:'RoamWise-PlayStore-Listing.md — the current approved description and keywords.' }
        ] },
      { heading: 'Pitch essentials',
        items: [
          { id:'m3', label:'The honest pitch', url:'#', note:'AI itineraries + group cost-splitting + no subscription. Do not oversell what is not built yet.' },
          { id:'m4', label:'Never promise a feature that does not exist', url:'#', note:'If someone asks for something we do not have, say so and note it down.' }
        ] }
    ] },

  investor: { label: 'Investor Outreach', icon: '🤝',
    sections: [
      { heading: 'Your tools',
        items: [
          { id:'i1', label:'Investor contact list', url:'', note:'See the admin 🗂️ Key contacts card.' },
          { id:'i2', label:'Latest metrics snapshot', url:'', note:'See 📊 Investor metrics — MRR, users, growth. Always quote the LATEST numbers, never stale ones.' }
        ] },
      { heading: 'Ground rules',
        items: [
          { id:'i3', label:'Never share numbers without founder sign-off', url:'#', note:'Investor conversations are sensitive — confirm figures before sending.' },
          { id:'i4', label:'No verbal commitments', url:'#', note:'Only the founder can agree to terms, timelines or equity discussions.' }
        ] }
    ] },

  engineering: { label: 'Engineering', icon: '🛠️',
    sections: [
      { heading: 'Your tools',
        items: [
          { id:'e1', label:'Latest app.js / repo', url:'', note:'Ask the founder for repo access before making changes.' },
          { id:'e2', label:'Firestore rules files', url:'#', note:'Every collection\u2019s rules are documented in the outputs — read before changing permissions.' }
        ] },
      { heading: 'Ground rules',
        items: [
          { id:'e3', label:'Never commit real API keys', url:'#', note:'Secrets go through wrangler secret / Firebase config, never in the repo.' },
          { id:'e4', label:'Test before you ship', url:'#', note:'A broken build reaches real users within minutes of deploy.' }
        ] }
    ] },

  finance: { label: 'Finance', icon: '💰',
    sections: [
      { heading: 'Your tools',
        items: [
          { id:'f1', label:'Ledger / finance console', url:'#', note:'See the 💵 Finance console card in this admin panel.' },
          { id:'f2', label:'Tax basics for prize payouts', url:'#', note:'Prizes under ₹10,000 need no TDS under Section 194B — keep them there.' }
        ] }
    ] }
};
