// This is a service worker for caching assets and providing offline functionality

// Cache names with versioning for easier updates
const STATIC_CACHE_NAME = 'story-crafter-static-v1';
const DYNAMIC_CACHE_NAME = 'story-crafter-dynamic-v1';
const ASSET_CACHE_NAME = 'story-crafter-assets-v1';

// Resources to precache for immediate offline use
const STATIC_ASSETS = [
    '/',
    '/index.html',
];

// The install handler takes care of precaching static resources
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing Service Worker...');
    event.waitUntil(
        caches
            .open(STATIC_CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Pre-caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('[Service Worker] Successfully installed');
                return self.skipWaiting();
            })
            .catch(err => console.log('[Service Worker] Install error:', err))
    );
});

// The activate handler takes care of cleaning up old caches
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating Service Worker...');

    const currentCaches = [STATIC_CACHE_NAME, DYNAMIC_CACHE_NAME, ASSET_CACHE_NAME];

    event.waitUntil(
        caches
            .keys()
            .then((cacheNames) => {
                return cacheNames.filter((cacheName) => !currentCaches.includes(cacheName));
            })
            .then((cachesToDelete) => {
                return Promise.all(
                    cachesToDelete.map((cacheToDelete) => {
                        console.log('[Service Worker] Deleting old cache:', cacheToDelete);
                        return caches.delete(cacheToDelete);
                    })
                );
            })
            .then(() => {
                console.log('[Service Worker] Claiming clients');
                return self.clients.claim();
            })
    );
});

// The fetch handler serves responses from the cache when possible
// and adds new responses to the cache
self.addEventListener('fetch', (event) => {
    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Skip API requests - we don't want to cache these
    if (event.request.url.includes('/api/') ||
        event.request.url.includes('api.openai.com')) {
        return;
    }

    // For HTML navigation requests - use "network-first" strategy
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // If we got a valid response, clone it and put it in the cache
                    if (response && response.status === 200) {
                        const clonedResponse = response.clone();
                        caches.open(DYNAMIC_CACHE_NAME).then(cache => {
                            cache.put(event.request, clonedResponse);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // If network fails, try to serve from cache
                    return caches.match(event.request);
                })
        );
        return;
    }

    // For asset requests (JS, CSS, images) - use "cache-first" strategy
    if (
        event.request.destination === 'script' ||
        event.request.destination === 'style' ||
        event.request.destination === 'image' ||
        event.request.destination === 'font'
    ) {
        event.respondWith(
            caches.match(event.request)
                .then(cachedResponse => {
                    // Return cached response if available
                    if (cachedResponse) {
                        return cachedResponse;
                    }

                    // Otherwise fetch from network and cache
                    return fetch(event.request)
                        .then(response => {
                            // Clone the response before using it
                            const clonedResponse = response.clone();

                            // Only cache valid responses
                            if (!response || response.status !== 200) {
                                return response;
                            }

                            // Store in cache
                            caches.open(ASSET_CACHE_NAME)
                                .then(cache => cache.put(event.request, clonedResponse));

                            return response;
                        })
                        .catch(err => {
                            console.log('[Service Worker] Fetch failed:', err);
                            // Could return a fallback asset here if needed
                        });
                })
        );
        return;
    }

    // For all other requests - use "network with cache fallback" strategy
    event.respondWith(
        fetch(event.request)
            .then(response => {
                // If we got a valid response, clone it and put it in the cache
                if (response && response.status === 200) {
                    const clonedResponse = response.clone();
                    caches.open(DYNAMIC_CACHE_NAME)
                        .then(cache => cache.put(event.request, clonedResponse));
                }
                return response;
            })
            .catch(() => {
                // If network fails, try to serve from cache
                return caches.match(event.request);
            })
    );
});

// This allows the web app to trigger skipWaiting via
// registration.waiting.postMessage({type: 'SKIP_WAITING'})
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
