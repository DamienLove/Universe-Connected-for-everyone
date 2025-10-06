const CACHE_NAME = 'universe-connected-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/index.tsx',
  '/components/App.tsx',
  '/components/constants.ts',
  '/types.ts',
  '/services/useGameLoop.ts',
  '/hooks/useParticles.ts',
  '/services/useBackgroundEffects.ts',
  '/hooks/useWorldScale.ts',
  '/services/geminiService.ts',
  '/services/BackgroundEffects.tsx',
  '/services/AudioService.ts',
  '/Notification.tsx',
  '/components/UpgradeCard.tsx',
  '/components/SplashScreen.tsx',
  '/components/Simulation.tsx',
  '/components/Tutorial.tsx',
  '/components/MilestoneVisual.tsx',
  '/components/RadialMenu.tsx',
  '/components/LoreTooltip.tsx',
  '/UpgradeModal.tsx',
  '/hooks/KarmaParticles.tsx',
  '/CrossroadsModal.tsx',
  '/components/NodeInspector.tsx',
  '/components/SettingsModal.tsx',
  '/components/CreditsModal.tsx',
  '/components/AudioUploadModal.tsx',
  '/components/ChapterTransition.tsx',
  '/components/LevelTransition.tsx',
  '/manifest.json',
  '/metadata.json'
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