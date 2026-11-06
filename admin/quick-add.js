/* admin/quick-add.js - founder-only page: record a person who agreed by email reply, phone or in person.
   Same Firebase project and admins/{uid} check as admin/hub.js. Writes one document to `crm` (the founder may create
   any crm record under firestore.rules). The record shape comes from creators/quick-add-core.mjs. */
import { buildRecord, parseReplyText, prefillFromQuery } from '../creators/quick-add-core.mjs';

const CFG = { apiKey: 'AIzaSyDlrtpzpOb1VEmVSd9tHmu7OpmvwWosYsU', authDomain: 'roamwisepro.firebaseapp.com', projectId: 'roamwisepro', storageBucket: 'roamwisepro.firebasestorage.app', messagingSenderId: '299014744987', appId: '1:299014744987:web:d5c316743e6d7a10904f3e' };
const $ = (s) => document.querySelector(s);
const val = (id) => { const e = document.getElementById(id); return e ? e.value : ''; };
const setv = (id, v) => { const e = document.getElementById(id); if (e && v != null && v !== '') e.value = v; };

function say(text, bad) { const m = $('#qaMsg'); m.className = bad ? 'qa-err' : 'qa-ok'; m.textContent = text; }
function showFor() { const t = val('f_type'); document.querySelectorAll('[data-for]').forEach((n) => { n.hidden = n.getAttribute('data-for') !== t; }); }

function collect() {
  const t = val('f_type');
  return {
    via: val('f_via'), confirmedOn: val('f_confirmedOn'), name: val('f_name'), email: val('f_email'), phone: val('f_phone'),
    town: val('f_town'), places: val('f_places'), youtube: val('f_youtube'), instagram: val('f_instagram'), niche: val('f_niche'),
    viewsMin: val('f_viewsMin'), viewsMax: val('f_viewsMax'), radiusKm: val('f_radiusKm'), region: val('f_region'),
    dealTypes: val('f_dealTypes'), cashMin: val('f_cashMin'), stage: val('f_stage'),
    link: t === 'artist' ? val('f_link_artist') : val('f_link_property'), themes: val('f_themes'), medium: val('f_medium'),
    contactPerson: val('f_contactPerson'), rooms: val('f_rooms'), tags: val('f_tags'), vehicles: val('f_vehicles'), operatorType: val('f_operatorType'),
    said: val('f_said'), note: val('f_note'), consent: $('#f_consent').checked,
  };
}

function prefill() {
  const q = prefillFromQuery(location.search);
  if (['creator', 'artist', 'property', 'transport'].includes(q.type)) setv('f_type', q.type);
  for (const k of ['name', 'email', 'phone', 'town', 'places', 'youtube', 'instagram', 'niche', 'dealTypes', 'region', 'radiusKm', 'viewsMin', 'viewsMax', 'said', 'note']) setv('f_' + k, q[k]);
  if (q.via) setv('f_via', q.via);
}

function start(db, user) {
  $('#qaAuth').hidden = true; $('#qaApp').hidden = false;
  setv('f_confirmedOn', new Date().toISOString().slice(0, 10));
  prefill(); showFor();
  $('#f_type').addEventListener('change', showFor);
  $('#qaParse').addEventListener('click', () => {
    const p = parseReplyText(val('f_paste'));
    setv('f_name', p.name); setv('f_email', p.email); setv('f_phone', p.phone);
    const yt = p.urls.find((u) => /youtu\.?be/i.test(u)), ig = p.urls.find((u) => /instagram\.com/i.test(u));
    setv('f_youtube', yt); setv('f_instagram', ig); setv('f_said', p.snippet);
    say('Filled what could be found. Check every field before saving.');
  });
  $('#qaForm').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const type = val('f_type'), out = buildRecord(type, collect(), { adminUid: user.uid });
    if (!out.ok) return say(out.errors.join(' '), true);
    $('#qaSave').disabled = true;
    try {
      /* one record per email: if this address is already in the CRM, say so instead of creating a duplicate */
      if (out.record.email) {
        const dup = await db.collection('crm').where('email', '==', out.record.email).limit(1).get();
        if (!dup.empty) { say('This email is already in the CRM (' + (dup.docs[0].data().seg || 'unknown') + '). Open that record instead of adding a second one.', true); return; }
      }
      const rec = Object.assign({}, out.record, { createdAt: firebase.firestore.FieldValue.serverTimestamp(), createdBy: user.uid });
      const ref = await db.collection('crm').add(rec);
      say('Saved ' + out.record.name + ' as ' + type + ' (record ' + ref.id + '). They now appear in the ' + (type === 'creator' ? 'creator roster and creator admin' : 'CRM list for ' + type) + '.');
      $('#qaForm').reset(); setv('f_confirmedOn', new Date().toISOString().slice(0, 10)); showFor();
    } catch (e) { say('Could not save: ' + (e.code || e.message), true); }
    finally { $('#qaSave').disabled = false; }
  });
}

firebase.apps.length || firebase.initializeApp(CFG);
const auth = firebase.auth(), db = firebase.firestore();
const isAdmin = async (u) => { try { return !!u && u.emailVerified && (await db.collection('admins').doc(u.uid).get()).exists; } catch (_) { return false; } };
auth.onAuthStateChanged(async (u) => {
  if (u && await isAdmin(u)) return start(db, u);
  $('#qaApp').hidden = true; $('#qaAuth').hidden = false;
  if (u) { $('#qaAuthMsg').textContent = 'This account is not a RoamWise admin.'; }
});
$('#qaLogin').addEventListener('submit', async (ev) => {
  ev.preventDefault(); $('#qaAuthMsg').textContent = '';
  try { await auth.signInWithEmailAndPassword($('#qaEmail').value.trim(), $('#qaPass').value); } catch (e) { $('#qaAuthMsg').textContent = 'Sign-in failed: ' + (e.code || e.message); }
});
