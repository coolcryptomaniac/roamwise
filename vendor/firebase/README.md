# Self-hosted Firebase JS SDK (compat) 10.14.1 and qrcodejs 1.0.0

Byte-for-byte copies of the files previously loaded from
`https://www.gstatic.com/firebasejs/10.14.1/` and
`https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js`
(Firebase SDK: Apache-2.0; qrcodejs: MIT).

Why: those hosts were render-blocking in `<head>`. On a weak connection the page
painted nothing (black screen) until they answered. Same-origin copies load over
the already-open connection, are cached by the service worker and work offline.

To upgrade Firebase: download the four `firebase-*-compat.js` files for the new
version from gstatic, put them in `vendor/firebase/<version>/`, update the four
`<script>` tags in `index.html` and the SHA-256 list below.

```
ab1b63a9da4d418fee727518b6487c6021d1404bc2b58eac1499323334e17f83  firebase/10.14.1/firebase-app-check-compat.js
2ac3f051aa8c357f050c18b6a8d57867f59ed85b61949acf21142139581f5cc4  firebase/10.14.1/firebase-app-compat.js
444be4c9e8bb4d16d2778177bb35fcad0f7b5b3927a81e6095a4978bad324572  firebase/10.14.1/firebase-auth-compat.js
a0f75faf230ae93e1618625b89d32497fed320eae790227c06aace4fc127d9ae  firebase/10.14.1/firebase-firestore-compat.js
c541ef06327885a8415bca8df6071e14189b4855336def4f36db54bde8484f36  qrcodejs/1.0.0/qrcode.min.js
```
