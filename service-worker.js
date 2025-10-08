
const CACHE_NAME = 'universe-connected-v2';
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
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }

        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          (response) => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

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
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
