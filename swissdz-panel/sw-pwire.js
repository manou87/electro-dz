/* Service worker minimal : installe WireLab comme application (ouverture des .pwire). v=20261002-pinch-board-r4 */
self.addEventListener("install", function (ev) {
  self.skipWaiting();
});
self.addEventListener("activate", function (ev) {
  ev.waitUntil(self.clients.claim());
});
self.addEventListener("fetch", function (ev) {
  ev.respondWith(fetch(ev.request));
});
