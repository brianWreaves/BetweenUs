const CACHE_NAME = "betweenus-shell-v5";
const PRECACHE_URLS = ["/", "/training", "/manifest.webmanifest"];

function shouldCache(response) {
  return (
    response &&
    response.ok &&
    (response.type === "basic" || response.type === "cors")
  );
}

function putInCache(request, response) {
  if (!shouldCache(response)) {
    return Promise.resolve();
  }

  const responseToCache = response.clone();
  return caches
    .open(CACHE_NAME)
    .then((cache) => cache.put(request, responseToCache))
    .catch(() => undefined);
}

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch(() => undefined),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(request);
          event.waitUntil(putInCache(request, networkResponse));
          return networkResponse;
        } catch {
          const cachedPage = await caches.match(request);
          if (cachedPage) return cachedPage;

          const shell = await caches.match("/");
          if (shell) return shell;

          return Response.error();
        }
      })(),
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cached = await caches.match(request);
      if (cached) return cached;

      try {
        const networkResponse = await fetch(request);
        event.waitUntil(putInCache(request, networkResponse));
        return networkResponse;
      } catch {
        if (request.destination === "document") {
          const shell = await caches.match("/");
          if (shell) return shell;
        }
        return Response.error();
      }
    })(),
  );
});
