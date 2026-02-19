/*
  Service Worker = A script that runs in the background.
  
  It intercepts network requests and can serve cached files,
  allowing the app to work offline.
  
  Think of it as a "proxy" between your app and the internet.
*/

const CACHE_NAME = 'quran-flashcards-v4';

// Files to cache for offline use
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/data/surahs.json',
  '/manifest.json'
];

/*
  'install' event fires when the service worker is first installed.
  We use it to cache our app files.
*/
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching app files');
        return cache.addAll(FILES_TO_CACHE);
      })
  );
});

/*
  'fetch' event fires whenever the app requests a file.
  We check if it's cached first, otherwise fetch from network.
*/
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version if available, otherwise fetch
        return response || fetch(event.request);
      })
  );
});

/*
  'activate' event fires when a new service worker takes over.
  We use it to clean up old caches.
*/
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('Removing old cache:', key);
          return caches.delete(key);
        }
      }));
    })
  );
});
