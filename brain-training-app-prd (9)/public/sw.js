/* BrainBolt static website service worker */
const CACHE = "brainbolt-static-v1";
const SHELL = [
  "/",
  "/index.html",
  "/styles.css?v=static-1",
  "/app.js?v=static-1",
  "/manifest.webmanifest",
  "/brainbolt-icon.svg?v=hexagon-1",
  "/icon-192.png?v=hexagon-1",
  "/icon-512.png?v=hexagon-1",
  "/icon-maskable.png?v=hexagon-1",
  "/apple-icon.png?v=hexagon-1",
  "/favicon.svg?v=hexagon-1",
  "/favicon.ico?v=hexagon-1",
  "/favicon-16x16.png?v=hexagon-1",
  "/favicon-32x32.png?v=hexagon-1"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match("/index.html"))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copy));
      }
      return response;
    }))
  );
});
