// Minimal service worker used only to clean up old PWA behavior.

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
      self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try {
        await self.clients.claim();
        // Unregister this service worker so the site behaves like a normal web app
        if (self.registration && self.registration.unregister) {
          await self.registration.unregister();
        }
      } catch (error) {
        // Swallow errors; goal is just to best-effort clean up
        console.error("[PWA] Cleanup service worker error:", error);
      }
    })()
  );
});

// No fetch handler: all requests go straight to the network with normal browser caching.

