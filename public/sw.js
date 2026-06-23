const CACHE_NAME = 'workout-tracker-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Very basic cache-first, fallback to network
      // In a real app we'd cache specifics or use workbox
      return response || fetch(event.request);
    })
  );
});
