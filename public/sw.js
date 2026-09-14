// Down4 service worker. Scoped to /down4 at registration, so the rest of the
// Scotland Yard site is never intercepted.
const CACHE = "down4-v1";
const OFFLINE_FALLBACK = "/down4";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.add(OFFLINE_FALLBACK))
      .catch(() => undefined)
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  // Supabase lives on another origin; never cache or intercept crew data.
  if (url.origin !== self.location.origin) {
    return;
  }
  // The manifest carries the crew name, so always take it fresh.
  if (url.pathname.endsWith("manifest.webmanifest")) {
    return;
  }

  // Pages: network first, cache only as an offline fallback, so a board is
  // never served stale while the network is up.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          // Only good responses are worth keeping: caching a 5xx would replay
          // an outage as the offline page long after it is over.
          if (fresh.ok) {
            const cache = await caches.open(CACHE);
            cache.put(request, fresh.clone());
          }
          return fresh;
        } catch {
          return (
            (await caches.match(request)) ||
            (await caches.match(OFFLINE_FALLBACK)) ||
            Response.error()
          );
        }
      })()
    );
    return;
  }

  // Build output and icons are content-hashed or stable: serve from cache and
  // refresh in the background.
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/")
  ) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        const network = fetch(request)
          .then((response) => {
            if (response.ok) {
              caches
                .open(CACHE)
                .then((cache) => cache.put(request, response.clone()));
            }
            return response;
          })
          .catch(() => cached);
        return cached || network;
      })()
    );
  }
});
