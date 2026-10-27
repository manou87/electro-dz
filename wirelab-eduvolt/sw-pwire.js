/* Service worker minimal : installe WireLab comme application (ouverture des .pwire).
 * v=safari-crash-v142
 * IMPORTANT : aucun listener fetch — un respondWith(fetch()) pass-through provoquait
 * des crash-loops WebKit iOS (« Un problème récurrent est survenu »).
 * Sur iPhone le panel n’enregistre plus ce SW (v141) ; fichier gardé pour desktop / PWA.
 */
self.addEventListener("install", function (ev) {
  self.skipWaiting();
});
self.addEventListener("activate", function (ev) {
  ev.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { return caches.delete(k); }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});
