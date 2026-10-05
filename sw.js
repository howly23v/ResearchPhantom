// Network-first for mutable catalogs and app shell; offline fallback.
const CACHE_NAME = 'grterm-v3';
const ASSETS = ['./', './index.html', './manifest.json', './data/seed.json'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      const response = await fetch(event.request);
      if (response.ok) {
        // Cache only the last opened daily snapshot, not an entire year's payloads.
        if (url.pathname.includes('/data/snapshots/')) {
          const keys = await cache.keys();
          await Promise.all(keys.filter(k => new URL(k.url).pathname.includes('/data/snapshots/') && k.url !== event.request.url).map(k => cache.delete(k)));
        }
        await cache.put(event.request, response.clone());
      }
      return response;
    } catch (error) {
      const cached = await cache.match(event.request);
      if (cached) return cached;
      throw error;
    }
  })());
});
