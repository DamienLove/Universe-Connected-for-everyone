
const CACHE_NAME = 'universe-connected-v3'; // Incremented version to force update
const urlsToCache = [
  './',
  './index.html',
  './index.tsx',
  './manifest.json',
  './metadata.json',
  './types.ts',
  './components/App.tsx',
  './components/AudioUploadModal.tsx',
  './components/BackgroundEffects.tsx',
  './components/ChapterTransition.tsx',
  './components/constants.ts',
  './components/CreditsModal.tsx',
  './components/CrossroadsModal.tsx',
  './components/LevelTransition.tsx',
  './components/LoreTooltip.tsx',
  './components/MilestoneVisual.tsx',
  './components/NodeInspector.tsx',
  './components/Notification.tsx',
  './components/RadialMenu.tsx',
  './components/SettingsModal.tsx',
  './components/Simulation.tsx',
  './components/SplashScreen.tsx',
  './components/Tutorial.tsx',
  './components/UpgradeCard.tsx',
  './components/UpgradeModal.tsx',
  './hooks/KarmaParticles.tsx',
  './hooks/useBackgroundEffects.ts',
  './hooks/useGameLoop.ts',
  './hooks/useParticles.ts',
  './hooks/useWorldScale.ts',
  './services/AudioService.ts',
  './services/geminiService.ts',
  './services/promptService.ts',
  'https://cdn.tailwindcss.com',
  'https://aistudiocdn.com/react@^19.1.1',
  'https://aistudiocdn.com/react-dom@^19.1.1/client',
  'https://aistudiocdn.com/@google/genai@^1.21.0'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache and caching assets');
        return Promise.all(
          urlsToCache.map(url => {
            return cache.add(url).catch(err => {
              console.error(`Failed to cache ${url}:`, err);
            });
          })
        );
      })
  );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Cache hit - return response
                if (response) {
                    return response;
                }

                return fetch(event.request).then(
                    (response) => {
                        // Check if we received a valid response
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                           if (response && response.type === 'opaque') {
                             // Don't cache opaque responses (e.g., from CDNs without CORS)
                           } else {
                             console.log('Fetch failed for:', event.request.url);
                           }
                           return response;
                        }

                        // IMPORTANT: Clone the response. A response is a stream
                        // and because we want the browser to consume the response
                        // as well as the cache consuming the response, we need
                        // to clone it so we have two streams.
                        const responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    }
                );
            })
    );
});


self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});