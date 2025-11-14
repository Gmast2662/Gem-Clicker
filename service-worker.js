// Gem Clicker - Service Worker for Offline Support
// ⚠️ IMPORTANT: Update this version number when releasing new versions!
// Match this with version.json for consistency
const CACHE_VERSION = '1.7.0';
const BUILD_NUMBER = 122;
const CACHE_NAME = `gem-clicker-v${CACHE_VERSION}-b${BUILD_NUMBER}`;

const urlsToCache = [
    './',
    './index.html',
    './game.js',
    './styles.css',
    './config.json',
    './tips.json',
    './changelog.json',
    './version.json',
    './favicon.svg',
    './manifest.json',
    './sounds/arcade click.mp3',
    './sounds/arcade buy.mp3',
    './sounds/arcade achievement.mp3'
];

// Install event - cache all resources
self.addEventListener('install', event => {
    console.log(`📦 Service Worker installing - v${CACHE_VERSION} (build ${BUILD_NUMBER})`);
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📦 Caching app resources');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log(`✅ Version v${CACHE_VERSION} cached, activating...`);
                return self.skipWaiting();
            })
    );
});

// Message event - listen for update requests
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                
                // Clone the request
                const fetchRequest = event.request.clone();
                
                return fetch(fetchRequest).then(response => {
                    // Check if valid response
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    
                    // Clone the response
                    const responseToCache = response.clone();
                    
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseToCache);
                    });
                    
                    return response;
                });
            })
            .catch(() => {
                // Offline and not in cache - return a fallback
                return new Response('Offline - please check your connection', {
                    headers: { 'Content-Type': 'text/plain' }
                });
            })
    );
});

