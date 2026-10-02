/* Service worker minimal : installe WireLab comme application (ouverture des .pwire). v=plan-xy-zoomout-r3 */
self.addEventListener("install", function (ev) { self.skipWaiting(); });
self.addEventListener("activate", function (ev) { ev.waitUntil(self.clients.claim()); });
self.addEventListener("fetch", function (ev) { ev.respondWith(fetch(ev.request)); });
