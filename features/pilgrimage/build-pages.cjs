/* Generate public HTML entries with explicit, classic defer scripts. No framework/build dependency. */
'use strict';
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const repo = path.resolve(__dirname, '../..'), sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'destinations.js'), 'utf8'), sandbox);
const sites = sandbox.window.RWPilgrimage.sites;
const coreScripts = ['data/config.js', 'core/validation.js', 'core/i18n.js', 'ui/context.js'].map(s => '../features/kainchi-yatra/' + s);
const devotionScripts = ['../features/pilgrimage/ritual-context.js', ...['data/ritual-script.js', 'data/strings-ritual-voice.js', 'ui/bhakti-access.js', 'ui/ritual-voice.js', 'ui/panditji.js', 'ui/ritual.js'].map(s => '../features/kainchi-yatra/' + s)];
const pageScripts = ['../features/pilgrimage/destinations.js', '../features/pilgrimage/strings.js', '../features/pilgrimage/page.js'];
const scriptsFor = slug => [...coreScripts, ...(slug === 'pilgrimage' ? [] : devotionScripts), ...pageScripts];
const styles = ['../features/kainchi-yatra/ui/kainchi.css', '../features/kainchi-yatra/ui/ritual.css', '../features/kainchi-yatra/ui/panditji.css', '../features/pilgrimage/pilgrimage.css'];
function esc(s) { return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function html(site) {
  const id = site ? site.id : 'pilgrimage', title = site ? site.name.en : 'Sacred journeys', intro = site ? site.intro.en : 'Plan Char Dham, Panch Kedar, Kumbh, Kainchi Dham, Vaishno Devi, Kashi and Tirumala journeys with sourced guidance and digital devotion.';
  return `<!doctype html>
<html lang="en"><head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#080910"><meta name="description" content="${esc(intro)}">
  <meta name="referrer" content="no-referrer"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'none'; font-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'">
  <title>${esc(title)} · RoamWise</title><link rel="canonical" href="https://roamwise.co.in/${id}/"><link rel="icon" href="../icons/icon-192.png">
${styles.map(s => `  <link rel="stylesheet" href="${s}">`).join('\n')}
${scriptsFor(id).map(s => `  <script src="${s}" defer></script>`).join('\n')}
</head><body data-site="${id}" data-terrain="${site ? site.terrain : 'mountain'}">
<a class="skip" href="#main">Skip to content</a>
<header class="topbar"><a class="brand" href="../pilgrimage/" data-p="brand">RoamWise · Sacred journeys</a><div class="langs"><button type="button" data-lang="en" aria-pressed="true">English</button><button type="button" data-lang="hi" aria-pressed="false">हिन्दी</button><a class="back" href="../">RoamWise ↗</a></div></header>
<main id="main">
<section class="sacred-hero"><div class="sacred-orbit" aria-hidden="true"><span>${site ? site.symbol : 'ॐ'}</span></div><div class="sacred-intro"><p class="eyebrow" data-p="kicker">FAITH · PREPARATION · CARE</p><h1 ${site ? 'data-site-copy="name"' : 'data-p="h"'}>${esc(title)}</h1><p ${site ? 'data-site-copy="intro"' : 'data-p="intro"'}>${esc(intro)}</p><div class="row-actions"><a class="button-link" href="${site ? '#plan' : '#journeys'}" data-p="plan">Prepare my visit</a>${site ? '<a class="button-link quiet" href="#bhakti" data-p="bhakti">Digital devotion</a><a class="text-link" href="#sources" data-p="sources">Official notices</a>' : ''}</div></div></section>
<p class="notice small" data-p="boundary">Independent RoamWise planning aid. No government or temple affiliation. Verify with the authority before travel. No official pass or live crowd measurement.</p>
${site ? `<nav class="journey-nav" aria-label="Page sections"><a href="#plan" data-p="plan">Prepare my visit</a><a href="#bhakti" data-p="bhakti">Digital devotion</a><a href="#sources" data-p="sources">Official notices</a><a href="../pilgrimage/" data-p="home">All journeys</a></nav>
<section class="panel" id="plan"><p class="eyebrow" data-p="kicker"></p><h2 data-p="planner_h">Your group’s next steps</h2><p data-site-copy="preparation">${esc(site.preparation.en)}</p>
<div class="visit-form"><label><span data-p="shrine">Place / shrine</span><select id="visit-shrine"></select></label><label><span data-p="date">Visit date</span><input id="visit-date" type="date" required></label><label><span data-p="group">People in your group</span><input id="visit-group" type="number" min="1" max="60" value="1" required></label><label><span data-p="origin">Starting place (optional)</span><input id="visit-origin" maxlength="120"></label></div>
<p id="calendar-note" class="message" role="status" aria-live="polite"></p><p class="muted small" data-p="calendar"></p><div class="row-actions"><a id="visit-map" class="button-link" href="#plan" target="_blank" rel="noopener noreferrer" data-p="maps">Open map directions ↗</a><a id="visit-share" class="button-link quiet" href="#plan" target="_blank" rel="noopener noreferrer" data-p="share">Share visit plan on WhatsApp ↗</a><button type="button" id="visit-print" class="quiet" data-p="print">Print my checklist</button></div><p class="muted small" data-p="map_note"></p>
<h3 data-p="checklist">Before your group leaves</h3><div id="visit-checks" class="visit-checks"></div><p class="muted small" data-p="checklist_note"></p>
<h3 data-p="dates_h">Dates & current access</h3><p data-site-copy="dates">${esc(site.dates.en)}</p></section>
<section class="panel" id="bhakti"><p class="eyebrow" data-p="kicker"></p><h2 data-p="devotion_h">Meet your digital devotional guide</h2><p data-p="devotion_intro"></p><p id="devotion-lock" class="notice" role="status"></p><a class="text-link" href="../" data-p="signin">Open RoamWise / sign in →</a><button id="standard-begin" type="button" data-p="standard">Begin guided digital session</button><div id="standard-session"></div>
<form id="custom-form" class="visit-form"><label><span data-p="name">Your name</span><input id="custom-name" maxlength="60" autocomplete="name" required></label><label><span data-p="wellwishers">People you remember (optional)</span><textarea id="custom-people" rows="2" maxlength="180"></textarea></label><label><span data-p="intention">Intention</span><select id="custom-intention"><option value="peace" data-p="peace">Peace</option><option value="gratitude" data-p="gratitude">Gratitude</option><option value="health" data-p="health">Wellbeing</option><option value="journey" data-p="journey">Journey</option></select></label><button id="custom-begin" type="submit" data-p="custom">Create my personal session</button></form><p class="muted small" data-p="privacy"></p><div id="custom-session"></div></section>
<section class="panel" id="sources"><h2 data-p="sources_h">Check the authority directly</h2><p id="source-age" class="muted small"></p><div id="source-links" class="source-links">${site.sources.map(s => `<a class="source-card" href="${s[1]}" target="_blank" rel="noopener noreferrer">${esc(s[0])} ↗</a>`).join('')}</div><h3 data-p="services_h">Parking, facilities & help</h3><p data-p="facilities"></p><p data-p="safety"></p><a class="button-link emergency" href="tel:112" data-p="emergency">Emergency · 112</a><p class="muted small" data-p="emergency_note"></p></section>` : ''}
<section id="journeys"><h2 data-p="${site ? 'explore' : 'home'}">${site ? 'Explore another journey' : 'All journeys'}</h2><div id="journey-list" class="journey-list">${sites.map(s => `<a class="journey-card" href="../${s.id}/"><h3>${esc(s.name.en)}</h3><p>${esc(s.intro.en)}</p></a>`).join('')}</div></section>
<noscript><p>JavaScript is needed for the local planner and devotional animation. Official links and other journey pages remain available.</p></noscript>
</main><footer><a href="../pilgrimage/" data-p="home">All journeys</a> · <a href="../kainchi/">Kainchi Dham</a> · <a href="../privacy.html">Privacy</a><p class="small muted" data-p="boundary"></p></footer>
</body></html>\n`;
}
if (require.main === module) {
 let drift = false;
 for (const site of [null, ...sites]) {
  const file = path.join(repo, site ? site.id : 'pilgrimage', 'index.html'), source = html(site);
  if (process.argv.includes('--check')) { if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== source) { console.error('Entry drift: ' + file); drift = true; } }
  else { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, source); }
 }
 if (drift) process.exitCode = 1;
}
module.exports = { scriptsFor, styles };
