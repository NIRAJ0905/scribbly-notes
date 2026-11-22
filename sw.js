const CACHE_NAME = 'scribbly-notes-v4';
const CACHE_PREFIX = 'scribbly-notes-';
const ASSETS = [
  './',
  './index.html',
  './css/reset.css',
  './css/variables.css',
  './css/fonts.css',
  './css/layout.css',
  './css/paper.css',
  './css/components.css',
  './js/main.js',
  './js/state.js',
  './js/jitter.js',
  './js/paginator.js',
  './js/previewRenderer.js',
  './js/canvasExporter.js',
  './js/pdfExporter.js',
  './js/uiControls.js',
  './assets/fonts/style-one/StyleOne-Regular.ttf',
  './assets/fonts/style-two/StyleTwo-Regular.ttf',
  './assets/fonts/style-three/StyleThree-Regular.ttf'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(request).then(async (cached) => {
      if (cached) return cached;

      try {
        return await fetch(request);
      } catch (error) {
        if (request.mode === 'navigate') {
          const appShell = await caches.match('./index.html');
          if (appShell) return appShell;
        }
        throw error;
      }
    })
  );
});
