/* Service worker minimal : installe PanelWire comme application (ouverture des .pwire). v=20260930 */
self.addEventListener("install", function (ev) {
  self.skipWaiting();
});
self.addEventListener("activate", function (ev) {
  ev.waitUntil(self.clients.claim());
});
self.addEventListener("fetch", function (ev) {
  ev.respondWith(fetch(ev.request));
});
