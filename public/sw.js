const CACHE_NAME = '3d-glass-planner-v5';

// Helper to resolve URLs relative to Service Worker registration scope
function getScopedUrls() {
  const scope = self.registration ? self.registration.scope : self.location.href.replace(/sw\.js.*$/, '');
  return [
    scope,
    new URL('index.html', scope).href,
    new URL('manifest.json', scope).href,
    new URL('icon.png', scope).href,
    new URL('icon-192x192.png', scope).href,
    new URL('icon-512x512.png', scope).href
  ];
}

// Install Event: pre-caches the core application shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        const assets = getScopedUrls();
        return Promise.allSettled(
          assets.map(url => cache.add(url).catch(err => console.warn('[SW] Cache item skipped:', url, err)))
        );
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event: cleans up any obsolete old cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting outdated cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Network-first strategy with cache fallback for offline readiness
self.addEventListener('fetch', (event) => {
  // Only intercept same-origin HTTP/HTTPS GET requests
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Bypass API routes from being permanently cached to prevent stale data
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Cache dynamic static assets on successful fetch
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Return cached version when offline or network fails
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If HTML navigation failed while offline, fallback to root cached index.html or scope
          if (event.request.headers.get('accept')?.includes('text/html')) {
            const scope = self.registration ? self.registration.scope : '/';
            return caches.match(new URL('index.html', scope).href)
              .then(res => res || caches.match(scope))
              .then(res => res || caches.match('/index.html'));
          }
          return new Response('Offline - No Cached Data Available', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/plain' })
          });
        });
      })
  );
});

