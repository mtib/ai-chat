// This is a service worker for caching assets and providing offline functionality

// Build version from environment variables or fallback to timestamp
const BUILD_VERSION = Date.now().toString();

// Cache names with versioning for easier updates
const STATIC_CACHE_NAME = `story-crafter-static-${BUILD_VERSION}`;
const DYNAMIC_CACHE_NAME = `story-crafter-dynamic-${BUILD_VERSION}`;
const ASSET_CACHE_NAME = `story-crafter-assets-${BUILD_VERSION}`;
const DALLE_IMAGES_CACHE_NAME = `story-crafter-dalle-images-v1`;
const GOOGLE_FONTS_CACHE_NAME = `story-crafter-google-fonts-v1`;

// Resources to precache for immediate offline use
const STATIC_ASSETS = [
    '/',
    '/index.html',
];

// Helper function to check if URL is from Azure Blob Storage (DALL-E images)
// or if it's a proxied DALL-E image URL
const isDalleImage = (url) => {
    return url.includes('oaidalleapiprodscus.blob.core.windows.net') ||
        (url.includes('/proxy/') && url.includes('?auth='));
};

// Helper function to check if URL is from Google Fonts
const isGoogleFont = (url) => {
    return url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com');
};

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

    const currentCaches = [STATIC_CACHE_NAME, DYNAMIC_CACHE_NAME, ASSET_CACHE_NAME, DALLE_IMAGES_CACHE_NAME, GOOGLE_FONTS_CACHE_NAME];

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
        // Special handling for DALL-E images from Azure Blob Storage
        if (isDalleImage(event.request.url)) {
            event.respondWith(
                caches.match(event.request).then(cachedResponse => {
                    if (cachedResponse) {
                        // Return cached DALL-E image if we have it
                        console.log('[Service Worker] Serving cached DALL-E image:', event.request.url);
                        return cachedResponse;
                    }

                    console.log('[Service Worker] Fetching DALL-E image from network:', event.request.url);
                    // Otherwise fetch from network and cache permanently
                    return fetch(event.request)
                        .then(response => {
                            // Clone the response before using it
                            const clonedResponse = response.clone();

                            if (!response) {
                                console.log('[Service Worker] No response from fetch for DALL-E image:', event.request.url);
                                return null;
                            }

                            // Store in DALL-E images cache permanently
                            console.log('[Service Worker] Caching DALL-E image:', event.request.url);
                            caches.open(DALLE_IMAGES_CACHE_NAME)
                                .then(cache => cache.put(event.request, clonedResponse));

                            return response;
                        })
                        .catch(err => {
                            console.log('[Service Worker] DALL-E image fetch failed:', err);
                            // Return a fallback or null
                            return null;
                        });
                })
            );
            return;
        }

        // Special handling for Google Fonts
        if (isGoogleFont(event.request.url)) {
            event.respondWith(
                caches.match(event.request).then(cachedResponse => {
                    if (cachedResponse) {
                        // Return cached Google Font if we have it
                        console.log('[Service Worker] Serving cached Google Font:', event.request.url);
                        return cachedResponse;
                    }

                    console.log('[Service Worker] Fetching Google Font from network:', event.request.url);
                    // Otherwise fetch from network and cache permanently
                    return fetch(event.request)
                        .then(response => {
                            // Clone the response before using it
                            const clonedResponse = response.clone();

                            if (!response) {
                                console.log('[Service Worker] No response from fetch for Google Font:', event.request.url);
                                return null;
                            }

                            // Store in Google Fonts cache permanently
                            console.log('[Service Worker] Caching Google Font:', event.request.url);
                            caches.open(GOOGLE_FONTS_CACHE_NAME)
                                .then(cache => cache.put(event.request, clonedResponse));

                            return response;
                        })
                        .catch(err => {
                            console.log('[Service Worker] Google Font fetch failed:', err);
                            // Return a fallback or null
                            return null;
                        });
                })
            );
            return;
        }

        return; // For other cross-origin requests, just pass through
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
