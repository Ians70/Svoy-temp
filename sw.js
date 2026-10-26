// Offline cache scoped to this GitHub Pages project (/svoy-temp/).
const CACHE = 'svoy-temp-v0.2';
const APP_FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
const APP_URLS = APP_FILES.map(file => new URL(file, self.location.href).href);
const APP_PATH = new URL(self.registration.scope).pathname;

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(APP_URLS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith('svoy-temp-') && key !== CACHE).map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || !url.pathname.startsWith(APP_PATH)) return;

  // Network-first gives users updated GitHub Pages deployments when online,
  // while retaining the last successfully loaded version for offline use.
  event.respondWith(fetch(request).then(response => {
    if (response.ok) {
      const copy = response.clone();
      event.waitUntil(caches.open(CACHE).then(cache => cache.put(request, copy)).catch(() => {}));
    }
    return response;
  }).catch(async () => {
    const cached = await caches.match(request);
    return cached || (request.mode === 'navigate' ? caches.match(new URL('./index.html', self.location.href).href) : Response.error());
  }));
});
