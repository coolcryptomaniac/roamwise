/* RoamWise Partner Marketplace v3.1
 * Trust layer for verified direct stays, request-to-book and confirmation-gated payment.
 * Security-sensitive booking data is refreshed from Firestore immediately before create.
 */
(function () {
  'use strict';

  var query = new URLSearchParams(location.search);
  var DEMO = query.get('mode') === 'demo' || query.get('lab') === '1';
  var PROD = /^(www\.)?roamwise\.co\.in$/i.test(location.hostname);
  var roomCache = {};
  var admin = false;
  var syncingRooms = false;

  function $(selector, root) { return (root || document).querySelector(selector); }
  function $$(selector, root) { return Array.from((root || document).querySelectorAll(selector)); }
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function now() { return new Date().toISOString(); }
  function money(value) { return '₹' + Math.round(Number(value || 0)).toLocaleString('en-IN'); }
  function firebaseParts() {
    try { return { db: firebase.firestore(), auth: firebase.auth() }; }
    catch (_) { return { db: null, auth: null }; }
  }
  function user() {
    try { return firebase.auth().currentUser; }
    catch (_) { return null; }
  }
  function safeHttps(value) {
    try {
      var u = new URL(String(value || '').trim());
      return u.protocol === 'https:' ? u.href : '';
    } catch (_) { return ''; }
  }
  function validUpi(value) {
    return /^[\w.\-]{2,}@[A-Za-z][A-Za-z0-9.\-]{1,}$/.test(String(value || '').trim());
  }
  function closeModal() {
    var m = $('#modal');
    if (m) m.classList.remove('open');
  }
  function showModal(html) {
    var m = $('#modal'), box = $('#modalbox');
    if (!m || !box) return;
    box.innerHTML = html;
    m.classList.add('open');
  }
  function bookingData(button) {
    try { return JSON.parse(button.dataset.book || '{}'); }
    catch (_) { return null; }
  }
  function roomKey(listing) { return listing.partnerUid + '/' + listing.roomId; }

  async function getRoom(listing, fresh) {
    var F = firebaseParts();
    var key = roomKey(listing);
    if (!fresh && roomCache[key]) return roomCache[key];
    if (!F.db || !listing.partnerUid || !listing.roomId) return null;
    try {
      var doc = await F.db.collection('partners').doc(listing.partnerUid)
        .collection('rooms').doc(listing.roomId).get();
      if (!doc.exists) return null;
      var room = doc.data() || {};
      room._id = doc.id;
      roomCache[key] = room;
      return room;
    } catch (_) { return null; }
  }

  function roomIsApproved(room, listing) {
    return !!(
      room &&
      room.marketplaceApproved === true &&
      room.open !== false &&
      String(room.partnerUid || '') === String(listing.partnerUid || '')
    );
  }

  function freshListing(listing, room) {
    var publicPay = room.paymentPublic || {};
    return Object.assign({}, listing, {
      partnerUid: room.partnerUid,
      roomId: room._id,
      propertyId: listing.propertyId || room.partnerUid,
      name: room.property || listing.name,
      room: room.room || listing.room,
      zone: room.zone || listing.zone,
      area: room.area || listing.area,
      price: Number(room.price || 0),
      maxGuests: Number(room.maxGuests || 2),
      heroImage: safeHttps(room.heroImage),
      cancel: String(room.cancel || listing.cancel || '').slice(0, 400),
      paymentPublic: {
        upiId: validUpi(publicPay.upiId) ? publicPay.upiId : '',
        paymentLink: safeHttps(publicPay.paymentLink)
      }
    });
  }

  async function validateDirectCards() {
    if (DEMO) return;
    await Promise.all($$('.result.direct').map(async function (card) {
      var button = $('[data-book]', card);
      var listing = button && bookingData(button);
      if (!listing) return;
      card.classList.add('rw-v3-checking');
      var room = await getRoom(listing, false);
      if (!roomIsApproved(room, listing)) {
        card.remove();
        return;
      }
      button.dataset.book = JSON.stringify(freshListing(listing, room));
      button.textContent = 'View stay & request';
      card.classList.remove('rw-v3-checking');
      card.classList.add('rw-v3-verified');
      var badge = $('.pill.green', card);
      if (badge) badge.textContent = '✓ Verified host';
    }));

    var results = $('#results');
    if (results && !$('.result.direct', results) && !$('#rwV3NoDirect')) {
      results.insertAdjacentHTML('afterbegin',
        '<div id="rwV3NoDirect" class="rw-v3-empty">' +
        '<b>No verified direct stay is live here yet.</b>' +
        '<span>RoamWise only labels rooms verified after host approval. More hotel choices remain available below.</span>' +
        '</div>');
    }
  }

  function polishProduction() {
    if (!PROD || DEMO) return;
    document.body.classList.add('rw-partner-v3');
    $$('.role[data-role]').forEach(function (button) {
      var role = button.dataset.role;
      if (role === 'admin') {
        button.style.display = admin ? '' : 'none';
        return;
      }
      var labels = {
        customer: ['⌂', 'Find stays', 'Verified direct stays'],
        owner: ['＋', 'List your place', 'Hotel or homestay application'],
        partner: ['⌘', 'Host dashboard', 'Rooms, requests & earnings']
      }[role];
      if (!labels) return;
      $('.ic', button).textContent = labels[0];
      $('b', button).textContent = labels[1];
      $('small', button).textContent = labels[2];
    });

    var active = $('.role.on[data-role]');
    var role = active ? active.dataset.role : 'customer';
    var eyebrow = $('#eyebrow'), title = $('#heroTitle'), text = $('#heroText');
    if (role === 'owner') {
      eyebrow.textContent = 'HOST WITH ROAMWISE · 8% COMMISSION';
      title.innerHTML = 'Keep your rates. <em>Keep more.</em>';
      text.textContent = 'Verify your email, submit your property, pass review, then manage rooms and direct guest requests.';
    } else if (role === 'partner') {
      eyebrow.textContent = 'HOST COMMAND CENTRE';
      title.innerHTML = 'Your rooms. <em>Your guest relationship.</em>';
      text.textContent = 'Manage rooms, requests, payment preferences and completed-stay earnings from one workspace.';
    } else {
      eyebrow.textContent = 'ROAMWISE STAYS · VERIFIED DIRECT HOSTS';
      title.innerHTML = 'Stay local. <em>Book with confidence.</em>';
      text.textContent = 'Verified local stays first, host confirmation before payment, and ₹0 guest booking fee.';
    }

    if (!$('#rwV3Trust')) {
      $('.hero').insertAdjacentHTML('beforeend',
        '<div id="rwV3Trust" class="rw-v3-trust">' +
        '<span><b>8%</b> host commission</span>' +
        '<span><b>₹0</b> guest fee</span>' +
        '<span><b>Verified</b> before listing</span>' +
        '<span><b>Direct</b> host confirmation</span>' +
        '</div>');
    }
    if (!$('#rwV3How')) {
      $('.footer').insertAdjacentHTML('beforebegin',
        '<section id="rwV3How" class="rw-v3-how"><small>HOW DIRECT BOOKING WORKS</small><div>' +
        '<article><b>01</b><h3>Request</h3><p>Choose a verified room, dates and payment preference.</p></article>' +
        '<article><b>02</b><h3>Host confirms</h3><p>The property checks availability before any payment action appears.</p></article>' +
        '<article><b>03</b><h3>Pay as chosen</h3><p>Pay at property, verified UPI, or an HTTPS hosted checkout page.</p></article>' +
        '</div></section>');
    }
  }

  async function loadIdentity() {
    var current = user(), F = firebaseParts();
    admin = false;
    if (current && F.db) {
      try { admin = (await F.db.collection('admins').doc(current.uid).get()).exists; }
      catch (_) { admin = false; }
    }
    polishProduction();
    if (admin) showLegacyRepair();
  }

  function requireVerifiedOwner(event) {
    if (DEMO) return false;
    var button = event.target.closest && event.target.closest('#submitOwner');
    var current = user();
    if (!button || !current || current.emailVerified) return false;
    event.preventDefault();
    event.stopImmediatePropagation();
    current.sendEmailVerification().catch(function () {});
    alert('Verify your email before submitting a property. We sent a verification link; open it and reload this page.');
    return true;
  }

  async function approvePartner(uid) {
    var F = firebaseParts(), current = user();
    if (!F.db || !current) throw new Error('Sign in as founder/admin first.');
    var adminDoc = await F.db.collection('admins').doc(current.uid).get();
    if (!adminDoc.exists) throw new Error('Founder/admin access required.');

    var ref = F.db.collection('partners').doc(uid);
    var doc = await ref.get();
    if (!doc.exists) throw new Error('Partner not found.');
    var partner = doc.data() || {}, verification = partner.verification || {};
    if (!(verification.ownerAttestation && verification.rateAttestation && verification.walkthroughConsent)) {
      if (!confirm('Legacy application: continue only if owner/contact, rates/location and walkthrough readiness were checked manually. Approve?')) return;
    }

    await ref.set({
      status: 'active',
      verified: true,
      verifiedState: 'verified',
      commissionPct: Number(partner.commissionPct || 8),
      approvedAt: now(),
      verification: Object.assign({}, verification, {
        identity: 'verified', property: 'verified', overall: 'verified', reviewedAt: now()
      })
    }, { merge: true });

    var rooms = await ref.collection('rooms').limit(100).get();
    var jobs = [];
    rooms.forEach(function (room) {
      jobs.push(room.ref.set({
        marketplaceApproved: true,
        partnerUid: uid,
        partnerVerifiedAt: now(),
        updatedAt: now()
      }, { merge: true }));
    });
    await Promise.all(jobs);
    location.reload();
  }

  function interceptApproval(event) {
    var button = event.target.closest && event.target.closest('[data-liveapprove]');
    if (!button) return false;
    event.preventDefault();
    event.stopImmediatePropagation();
    button.disabled = true;
    button.textContent = 'Approving…';
    approvePartner(button.dataset.liveapprove).catch(function (err) {
      button.disabled = false;
      button.textContent = 'Approve';
      alert(err.message || err);
    });
    return true;
  }

  async function showLegacyRepair() {
    if (!admin || !$('#saveTravel') || $('#rwLegacyRepair')) return;
    var F = firebaseParts();
    try {
      var query = await F.db.collection('partners').where('status', '==', 'active').limit(100).get();
      var legacy = [];
      query.forEach(function (doc) { if ((doc.data() || {}).verified !== true) legacy.push(doc); });
      if (!legacy.length) return;
      var panel = document.createElement('div');
      panel.id = 'rwLegacyRepair';
      panel.className = 'rw-v3-adminfix';
      panel.innerHTML = '<div><b>' + legacy.length + ' legacy active partner(s) need repair</b>' +
        '<span>Old approval used a non-boolean verification value, but Firestore requires verified:true.</span></div>' +
        '<button>Repair now</button>';
      $('#view').insertBefore(panel, $('#view').firstChild);
      $('button', panel).onclick = async function () {
        this.disabled = true;
        for (var i = 0; i < legacy.length; i++) {
          var ref = legacy[i].ref;
          await ref.set({ verified: true, verifiedState: 'verified' }, { merge: true });
          var rooms = await ref.collection('rooms').limit(100).get();
          var jobs = [];
          rooms.forEach(function (room) {
            jobs.push(room.ref.set({
              marketplaceApproved: true,
              partnerUid: ref.id,
              partnerVerifiedAt: now(),
              updatedAt: now()
            }, { merge: true }));
          });
          await Promise.all(jobs);
        }
        location.reload();
      };
    } catch (_) {}
  }

  async function syncApprovedRooms() {
    if (DEMO || syncingRooms) return;
    var current = user(), F = firebaseParts();
    if (!current || !F.db) return;
    syncingRooms = true;
    try {
      var partnerDoc = await F.db.collection('partners').doc(current.uid).get();
      var partner = partnerDoc.exists ? partnerDoc.data() : null;
      if (!partner || partner.status !== 'active' || partner.verified !== true) return;
      var rooms = await partnerDoc.ref.collection('rooms').limit(100).get();
      var jobs = [];
      rooms.forEach(function (room) {
        var data = room.data() || {};
        if (data.marketplaceApproved !== true || data.partnerUid !== current.uid) {
          jobs.push(room.ref.set({
            marketplaceApproved: true,
            partnerUid: current.uid,
            partnerVerifiedAt: partner.approvedAt || now(),
            updatedAt: now()
          }, { merge: true }));
        }
      });
      await Promise.all(jobs);
    } catch (_) {}
    finally { syncingRooms = false; }
  }

  function guardHostPaymentLink(event) {
    var button = event.target.closest && event.target.closest('#rwHostSave');
    if (!button) return false;
    var raw = String(($('#rwHostPayLink') || {}).value || '').trim();
    if (raw && !safeHttps(raw)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      var msg = $('#rwHostMsg');
      if (msg) msg.textContent = 'Hosted payment links must use HTTPS.';
      return true;
    }
    setTimeout(syncApprovedRooms, 1200);
    return false;
  }

  function currentTrip() {
    return {
      checkIn: String(($('#checkin') || {}).value || ''),
      checkOut: String(($('#checkout') || {}).value || ''),
      guests: Math.max(1, Number(($('#guests') || {}).value || 1))
    };
  }
  function nightsBetween(from, to) {
    var n = Math.round((new Date(to + 'T12:00:00') - new Date(from + 'T12:00:00')) / 86400000);
    return n > 0 ? n : 0;
  }
  function paymentMethods(room) {
    var pay = room.paymentPublic || {};
    var methods = [{ id: 'pay_at_property', name: 'Pay at property', sub: 'No prepayment through RoamWise.' }];
    if (validUpi(pay.upiId)) methods.push({ id: 'upi_after_confirmation', name: 'UPI after confirmation', sub: 'UPI unlocks only after confirmation.' });
    if (safeHttps(pay.paymentLink)) methods.push({ id: 'secure_link_after_confirmation', name: 'Secure payment page', sub: 'HTTPS hosted checkout after confirmation.' });
    return methods;
  }

  function openBooking(listing, room) {
    var trip = currentTrip();
    var nights = nightsBetween(trip.checkIn, trip.checkOut);
    if (!nights) return alert('Choose valid check-in and check-out dates.');
    if (trip.guests > Number(room.maxGuests || 2)) return alert('This room sleeps up to ' + Number(room.maxGuests || 2) + ' guests.');
    var fresh = freshListing(listing, room);
    var total = fresh.price * nights;
    showModal(
      '<div class="rw-v3-book"><button id="rwV3Close" class="rw-v3-x">×</button>' +
      '<div class="rw-v3-bookhero" ' + (fresh.heroImage ? 'style="background-image:linear-gradient(180deg,rgba(6,8,15,.1),rgba(6,8,15,.94)),url(&quot;' + esc(fresh.heroImage) + '&quot;)"' : '') + '>' +
      '<small>✓ VERIFIED ROAMWISE HOST</small><h2>' + esc(fresh.name) + '</h2><p>' + esc([fresh.room, fresh.area || fresh.zone].filter(Boolean).join(' · ')) + '</p></div>' +
      '<div class="rw-v3-bookgrid"><section><h3>Request this stay</h3>' +
      '<div class="rw-v3-dates"><span><b>' + esc(trip.checkIn) + '</b>Check-in</span><span><b>' + esc(trip.checkOut) + '</b>Check-out</span><span><b>' + trip.guests + '</b>Guests</span></div>' +
      '<label>Name<input id="rwV3Name" autocomplete="name"></label>' +
      '<label>Phone / WhatsApp<input id="rwV3Phone" autocomplete="tel"></label>' +
      '<label>Arrival note<textarea id="rwV3Note" maxlength="500"></textarea></label>' +
      '<div class="rw-v3-pay"><b>Pay only after confirmation</b>' + paymentMethods(fresh).map(function (method, i) {
        return '<label><input type="radio" name="rwV3Pay" value="' + method.id + '" ' + (i ? '' : 'checked') + '>' +
          '<span><strong>' + method.name + '</strong><small>' + method.sub + '</small></span></label>';
      }).join('') + '</div>' +
      '<div id="rwV3Auth"></div><button id="rwV3Send" class="rw-v3-primary">Send request →</button>' +
      '<p class="rw-v3-fine">The final amount and payment destination are revalidated from the live room immediately before your request is written.</p>' +
      '</section><aside><div class="rw-v3-price"><span>' + money(fresh.price) + '/night</span><p>' + money(fresh.price) + ' × ' + nights + ' nights</p><b>' + money(total) + '</b><small>Total stay · ₹0 guest booking fee</small></div>' +
      '<div class="rw-v3-policy"><b>Cancellation</b><span>' + esc(fresh.cancel || 'The host confirms terms before payment.') + '</span></div></aside></div></div>'
    );
    $('#rwV3Close').onclick = closeModal;
    $('#rwV3Send').onclick = function () { submitBooking(fresh, trip, nights); };
  }

  async function ensureVerifiedAuth(current) {
    if (!current) return null;
    await current.reload();
    current = user();
    if (!current || !current.emailVerified) return null;
    // Force a fresh Firebase ID token so Firestore Rules sees email_verified=true immediately.
    await current.getIdToken(true);
    return current;
  }

  function showBookingAuth(listing, room) {
    var host = $('#rwV3Auth'), F = firebaseParts();
    if (!host || !F.auth) return;
    host.innerHTML = '<div class="rw-v3-auth"><b>Sign in to send the request</b>' +
      '<input id="rwV3Email" type="email" placeholder="Email"><input id="rwV3Pass" type="password" placeholder="Password (6+ characters)">' +
      '<div><button id="rwV3Login">Sign in</button><button id="rwV3Create">Create account</button></div><small id="rwV3Msg"></small></div>';

    async function go(create) {
      var email = $('#rwV3Email').value.trim(), pass = $('#rwV3Pass').value;
      if (!email || pass.length < 6) return $('#rwV3Msg').textContent = 'Enter a valid email and 6+ character password.';
      try {
        var result = create ? await F.auth.createUserWithEmailAndPassword(email, pass) : await F.auth.signInWithEmailAndPassword(email, pass);
        var current = (result && result.user) || user();
        current = await ensureVerifiedAuth(current);
        if (!current) {
          var pending = user();
          if (pending) await pending.sendEmailVerification().catch(function () {});
          $('#rwV3Msg').textContent = 'Verify your email, then reload this page and continue.';
          return;
        }
        openBooking(listing, room);
      } catch (err) {
        $('#rwV3Msg').textContent = err.message || 'Sign in failed.';
      }
    }
    $('#rwV3Login').onclick = function () { go(false); };
    $('#rwV3Create').onclick = function () { go(true); };
  }

  async function submitBooking(modalListing, trip, nights) {
    var current = user();
    if (!current) {
      var cachedRoom = await getRoom(modalListing, true);
      return showBookingAuth(modalListing, cachedRoom || modalListing);
    }
    current = await ensureVerifiedAuth(current);
    if (!current) {
      var pending = user();
      if (pending) pending.sendEmailVerification().catch(function () {});
      return alert('Verify your email before booking. We sent the verification link again.');
    }

    var name = String(($('#rwV3Name') || {}).value || '').trim().slice(0, 120);
    var phone = String(($('#rwV3Phone') || {}).value || '').trim().slice(0, 80);
    var note = String(($('#rwV3Note') || {}).value || '').trim().slice(0, 500);
    var method = ($('input[name="rwV3Pay"]:checked') || {}).value || 'pay_at_property';
    if (!name) return alert('Add the traveller name.');

    // Critical integrity check: discard every modal-time price/payment field and rebuild from a fresh room read.
    var latestRoom = await getRoom(modalListing, true);
    if (!roomIsApproved(latestRoom, modalListing)) return alert('This room is no longer approved for direct booking.');
    var latest = freshListing(modalListing, latestRoom);
    if (!latest.price || latest.price <= 0) return alert('The host is updating this room price. Please try again shortly.');
    if (trip.guests > latest.maxGuests) return alert('The room capacity changed. It now sleeps up to ' + latest.maxGuests + ' guests.');

    var snapshot = { kind: method };
    if (method === 'upi_after_confirmation') {
      if (!validUpi(latest.paymentPublic.upiId)) return alert('UPI is no longer available for this room. Choose another payment method.');
      snapshot.upiId = latest.paymentPublic.upiId;
    } else if (method === 'secure_link_after_confirmation') {
      var paymentUrl = safeHttps(latest.paymentPublic.paymentLink);
      if (!paymentUrl) return alert('The secure payment page is no longer available. Choose another payment method.');
      snapshot.url = paymentUrl;
    } else if (method !== 'pay_at_property') {
      return alert('That payment method is no longer available.');
    }

    var amount = latest.price * nights;
    var record = {
      ref: 'RW-' + Date.now().toString(36).toUpperCase(),
      status: 'requested',
      bookingVersion: 'marketplace-v3',
      partnerUid: latest.partnerUid,
      propertyId: latest.propertyId || latest.partnerUid,
      roomId: latest.roomId,
      guestUid: current.uid,
      guestName: name,
      guestEmail: current.email || '',
      guestPhone: phone,
      note: note,
      property: latest.name || '',
      room: latest.room || '',
      zone: latest.zone || '',
      area: latest.area || '',
      checkIn: trip.checkIn,
      checkOut: trip.checkOut,
      guests: trip.guests,
      nights: nights,
      roomPrice: latest.price,
      amount: amount,
      commissionPctSnapshot: Number(latest.commissionPct || 8),
      paymentMethod: method,
      paymentSnapshot: snapshot,
      paymentStatus: 'awaiting_host_confirmation',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      at: now()
    };

    var button = $('#rwV3Send');
    if (button) { button.disabled = true; button.textContent = 'Sending…'; }
    try {
      await firebaseParts().db.collection('roomBookings').add(record);
      showModal('<div class="rw-v3-success"><span>✓</span><small>REQUEST SENT</small><h2>' + esc(record.ref) + '</h2>' +
        '<p>' + esc(record.property) + ' now has your request. Payment remains locked until the host confirms.</p>' +
        '<button id="rwV3Done" class="rw-v3-primary">Done</button></div>');
      $('#rwV3Done').onclick = function () { closeModal(); setTimeout(renderPaymentStatuses, 150); };
    } catch (err) {
      if (button) { button.disabled = false; button.textContent = 'Send request →'; }
      alert(err.message || err);
    }
  }

  function interceptBooking(event) {
    if (DEMO) return false;
    var button = event.target.closest && event.target.closest('[data-book]');
    if (!button) return false;
    event.preventDefault();
    event.stopImmediatePropagation();
    var listing = bookingData(button);
    if (!listing) return true;
    button.disabled = true;
    var old = button.textContent;
    button.textContent = 'Checking…';
    getRoom(listing, true).then(function (room) {
      if (!roomIsApproved(room, listing)) throw new Error('This room is not currently verified for direct booking.');
      openBooking(listing, room);
    }).catch(function (err) {
      alert(err.message || err);
    }).finally(function () {
      button.disabled = false;
      button.textContent = old;
    });
    return true;
  }

  function upiDeepLink(booking) {
    var upiId = (booking.paymentSnapshot || {}).upiId;
    if (!validUpi(upiId)) return '';
    return 'upi://pay?' + new URLSearchParams({
      pa: upiId,
      pn: booking.property || 'RoamWise Host',
      am: String(Number(booking.amount || 0).toFixed(2)),
      cu: 'INR',
      tn: 'RoamWise ' + (booking.ref || 'booking')
    });
  }

  async function renderPaymentStatuses() {
    if (DEMO || !$('#results') || $('#rwV3Bookings')) return;
    var current = user(), F = firebaseParts();
    if (!current || !F.db) return;
    try {
      var query = await F.db.collection('roomBookings').where('guestUid', '==', current.uid).limit(50).get();
      var bookings = [];
      query.forEach(function (doc) { bookings.push(Object.assign({ _id: doc.id }, doc.data() || {})); });
      if (!bookings.length) return;
      bookings.sort(function (a, b) { return String(b.at || '').localeCompare(String(a.at || '')); });
      var section = document.createElement('section');
      section.id = 'rwV3Bookings';
      section.className = 'rw-v3-bookings';
      section.innerHTML = '<div class="rw-v3-sectionhead"><small>MY DIRECT STAYS</small><h2>Requests & payment status</h2></div>' + bookings.map(function (booking) {
        var status = booking.status || 'requested';
        var action = '';
        if (status === 'requested') action = '<span class="rw-v3-wait">Waiting for host confirmation — do not prepay</span>';
        else if (status === 'declined') action = '<span class="rw-v3-declined">Host could not confirm this request</span>';
        else if (status === 'confirmed' || status === 'completed') {
          if (booking.paymentMethod === 'pay_at_property') action = '<span class="rw-v3-payready">Pay at property · no online payment needed</span>';
          else if (booking.paymentMethod === 'upi_after_confirmation' && upiDeepLink(booking)) action = '<a class="rw-v3-paybtn" href="' + esc(upiDeepLink(booking)) + '">Pay ' + money(booking.amount) + ' by UPI</a>';
          else if (booking.paymentMethod === 'secure_link_after_confirmation' && safeHttps((booking.paymentSnapshot || {}).url)) action = '<a class="rw-v3-paybtn" target="_blank" rel="noopener" href="' + esc(safeHttps(booking.paymentSnapshot.url)) + '">Open secure payment page ↗</a>';
          else action = '<span class="rw-v3-payready">Confirmed · contact host for payment</span>';
        }
        return '<article><div><b>' + esc(booking.property || 'Stay') + '</b><span>' + esc(booking.room || '') + ' · ' + esc(booking.checkIn || '') + ' → ' + esc(booking.checkOut || '') + '</span></div>' +
          '<em>' + esc(status) + '</em><strong>' + money(booking.amount || 0) + '</strong>' + action + '</article>';
      }).join('');
      $('#results').appendChild(section);
      $$('#results > .card').forEach(function (card) {
        var heading = $('h2', card);
        if (heading && heading.textContent.trim() === 'My trips') card.style.display = 'none';
      });
    } catch (_) {}
  }

  function repaint() {
    polishProduction();
    validateDirectCards();
    if ($('#addRoom')) syncApprovedRooms();
    if (admin) showLegacyRepair();
    setTimeout(renderPaymentStatuses, 80);
  }

  function captureClick(event) {
    if (requireVerifiedOwner(event)) return;
    if (interceptApproval(event)) return;
    if (guardHostPaymentLink(event)) return;
    if (event.target.closest && event.target.closest('#roomSave')) {
      setTimeout(function () { roomCache = {}; syncApprovedRooms(); }, 1200);
    }
    interceptBooking(event);
  }

  // Registered immediately so this capture guard exists before marketplace-v2.js is evaluated.
  document.addEventListener('click', captureClick, true);

  function init() {
    polishProduction();
    var view = $('#view');
    if (view) new MutationObserver(function () { setTimeout(repaint, 60); }).observe(view, { childList: true, subtree: true });
    var F = firebaseParts();
    if (F.auth) F.auth.onAuthStateChanged(function () {
      roomCache = {};
      setTimeout(function () { loadIdentity(); syncApprovedRooms(); repaint(); }, 80);
    });
    setTimeout(repaint, 300);
    setTimeout(repaint, 1100);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();

  window.RWPartnerMarketplaceV3 = {
    version: '3.1.0',
    validateCards: validateDirectCards,
    syncRooms: syncApprovedRooms,
    payments: renderPaymentStatuses
  };
})();
