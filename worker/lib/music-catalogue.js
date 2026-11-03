/* RoamWise music store catalogue: the ONLY source of what can be bought and for how much.
 * One sellable item per release in music/releases.json (a test keeps the two in sync).
 * The browser never sends a price. Download prices are integer paise, Rs 10 to Rs 20 (1000-2000).
 * Audio files are NOT in this repo: they live in private object storage under tracks/<id>.mp3 (and optional .wav). */
export const MUSIC_CATALOGUE = Object.freeze({
  version: 1,
  currency: 'INR',
  downloadPaise: 2000,
  releases: Object.freeze([
    Object.freeze({ id: "g3--_QBX8wQ", title: "Akele Hain" }),
    Object.freeze({ id: "gwi_qN111zo", title: "Jaad Haigo" }),
    Object.freeze({ id: "iSsnlA-2IV0", title: "Pahadon Ki Oor" }),
    Object.freeze({ id: "4qzO5qfz1EU", title: "Almar Ko Mall Ma" }),
    Object.freeze({ id: "y0JPHqJCoHU", title: "Hanste Rehna" }),
    Object.freeze({ id: "4zswsza1QyE", title: "Bheege Badan" }),
    Object.freeze({ id: "NauVRXmEhbg", title: "Myar Birau" }),
    Object.freeze({ id: "0JDsofi8mJc", title: "Swa Baga Re" }),
    Object.freeze({ id: "_ZSEEgGlFp4", title: "My Love" }),
    Object.freeze({ id: "j_4GnMbbpCQ", title: "Trip to Ladakh" }),
    Object.freeze({ id: "UhATfgbGtUU", title: "Lift You Up" }),
    Object.freeze({ id: "_OnrHUucfdE", title: "Falling in to love again" }),
    Object.freeze({ id: "6mE_d-0zrLE", title: "Cosmic Pulse" }),
    Object.freeze({ id: "n4RtApM-Sj0", title: "Bas Tu Hai" }),
    Object.freeze({ id: "IZZ39hZ0t_A", title: "Periodic Table" }),
    Object.freeze({ id: "548lqAvO1NY", title: "Theory of Relativity" }),
    Object.freeze({ id: "JmWJT15RQ1Q", title: "AI" }),
    Object.freeze({ id: "D1oqEmLqNcc", title: "Shiva Tandava Strotam" }),
    Object.freeze({ id: "pCkLRDQouNs", title: "Vogue" }),
    Object.freeze({ id: "ZtCFDf64QsY", title: "Vogue v1" }),
    Object.freeze({ id: "L-U-A-o1G6Q", title: "Rave To Hell" }),
    Object.freeze({ id: "4NP49mnH768", title: "Almora Ki Raatein" }),
    Object.freeze({ id: "MhB6tofEoGI", title: "Myar Pahad - Himalyan AI Dreamcode" }),
    Object.freeze({ id: "Ueh_jAROV5I", title: "GHAAM (घाम) ONE LIGHT, 100 VOICES" }),
    Object.freeze({ id: "48xD4AnsVac", title: "Kainchi Dham - Bheed Nhin Bhakti" }),
  ]),
});
