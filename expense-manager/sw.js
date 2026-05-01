// ============================================================
// sw.js — Service Worker
// Strategy: Network first, cache as fallback.
// JS/CSS/HTML always fetched fresh from network.
// Only serves from cache when completely offline.
// Auto-updates without user needing to clear cache.
// ============================================================

const CACHE_NAME = 'oshi-expenses-v4';

// Files to pre-cache for offline support
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/manifest.json',
  '/js/app.js',
  '/js/auth.js',
  '/js/db.js',
  '/js/events.js',
  '/js/render.js',
  '/js/state.js',
  '/js/firebase-config.js',
];

// ---- INSTALL: cache assets ----
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_ASSETS))
  );
  // Immediately take control — don't wait for old SW to die
  self.skipWaiting();
});

// ---- ACTIVATE: delete old caches ----
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      )
    )
  );
  // Take control of all open tabs immediately
  self.clients.claim();
});

// ---- FETCH: network first, cache fallback ----
self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Skip Firebase and Google API requests — never cache these
  const url = event.request.url;
  if (
    url.includes('firebaseapp.com') ||
    url.includes('googleapis.com') ||
    url.includes('gstatic.com') ||
    url.includes('firestore.googleapis.com')
  ) {
    return; // Let browser handle normally
  }

  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // Got a fresh response — update the cache with it
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Network failed — serve from cache (offline mode)
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          // If no cache either, return offline page
          if (event.request.destination === 'document') {
            return caches.match('/index.html');
          }
        });
      })
  );
});

// ---- MESSAGE: force update from app ----
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
