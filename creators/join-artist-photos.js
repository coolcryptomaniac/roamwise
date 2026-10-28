/* Local photo preparation. No server upload, storage, or automatic sending. */
(function () {
  'use strict';
  var input = document.getElementById('artPhotos'), preview = document.getElementById('photoPreview'), msg = document.getElementById('formMsg');
  var files = [], urls = [], problem = '', application = null, generation = 0;
  function reset() { urls.forEach(URL.revokeObjectURL); urls = []; files = []; preview.replaceChildren(); application = null; }
  function fail(text) { reset(); problem = text; msg.textContent = text; }
  input.addEventListener('change', async function () {
    var current = ++generation; reset(); problem = 'Checking photos…';
    document.getElementById('outBox').hidden = true;
    var selected = Array.from(input.files || []);
    if (selected.length > 6 || selected.reduce(function (n, f) { return n + f.size; }, 0) > 12 * 1024 * 1024) { fail('Choose up to 6 photos, with a combined size of 12 MB or less.'); return; }
    for (var f of selected) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type) || f.size > 3 * 1024 * 1024 || !f.size) { fail('Each photo must be a JPEG, PNG or WebP file, up to 3 MB.'); return; }
      var url = URL.createObjectURL(f), im = new Image(); im.src = url;
      try { await im.decode(); } catch (_) { URL.revokeObjectURL(url); if (current === generation) fail('One photo could not be read. Please choose a valid image.'); return; }
      if (current !== generation) { URL.revokeObjectURL(url); return; }
      urls.push(url); files.push(f);
      var figure = document.createElement('figure'), caption = document.createElement('figcaption');
      figure.style.margin = '0'; im.width = 120; im.height = 120; im.style.objectFit = 'contain'; im.alt = 'Selected artwork: ' + f.name;
      caption.textContent = f.name; caption.style.maxWidth = '140px'; caption.style.overflowWrap = 'anywhere'; figure.append(im, caption); preview.append(figure);
    }
    problem = ''; msg.textContent = files.length ? files.length + ' photos ready. Add artwork details and prepare your application.' : '';
  });
  document.getElementById('clearPhotos').addEventListener('click', function () { ++generation; reset(); input.value = ''; problem = ''; msg.textContent = 'Photos cleared.'; document.getElementById('outBox').hidden = true; });
  window.RWArtistPhotos = { names: function () { return files.map(function (f) { return f.name; }); }, error: function () { return problem; }, prepare: function (text, name) { application = { text: text, name: name }; }, invalidate: function () { application = null; } };
  document.getElementById('sharePhotos').addEventListener('click', async function () {
    if (!application) { msg.textContent = 'Prepare your application first.'; return; }
    var payload = { title: 'Artist application: ' + application.name, text: 'To: founder@roamwise.co.in\n\n' + application.text, files: files };
    if (!files.length || !navigator.canShare || !navigator.canShare({files: files})) { msg.textContent = 'Photo sharing is not supported here. Use the email link and attach photos manually, or download the email with photos.'; return; }
    try { await navigator.share(payload); msg.textContent = 'Share sheet closed. Confirm in your email app that the text and all photos were sent to founder@roamwise.co.in.'; } catch (e) { msg.textContent = e.name === 'AbortError' ? 'Sharing cancelled. Your application is still here.' : 'Sharing failed. Use email and attach photos manually.'; }
  });
  function base64(bytes) { var binary = ''; for (var i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192)); return btoa(binary).match(/.{1,76}/g).join('\r\n'); }
  document.getElementById('downloadMail').addEventListener('click', async function () {
    if (!application) { msg.textContent = 'Prepare your application first.'; return; }
    var app = application, selected = files.slice(), boundary = 'rw_' + Date.now();
    var parts = ['To: founder@roamwise.co.in', 'Subject: Artist gallery application', 'X-Unsent: 1', 'MIME-Version: 1.0', 'Content-Type: multipart/mixed; boundary="' + boundary + '"', '', '--' + boundary, 'Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: base64', '', base64(new TextEncoder().encode(app.text))];
    for (var f of selected) { var safe = f.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100) || 'artwork'; parts.push('--' + boundary, 'Content-Type: ' + f.type, 'Content-Disposition: attachment; filename="' + safe + '"', 'Content-Transfer-Encoding: base64', '', base64(new Uint8Array(await f.arrayBuffer()))); }
    parts.push('--' + boundary + '--', ''); var url = URL.createObjectURL(new Blob([parts.join('\r\n')], {type:'message/rfc822'})); var a = document.createElement('a'); a.href = url; a.download = 'roamwise-artist-application.eml'; a.click(); setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
    msg.textContent = 'Email file downloaded with ' + selected.length + ' photos. Open it in a compatible email app, check attachments, then send. Nothing has been submitted yet.';
  });
})();
