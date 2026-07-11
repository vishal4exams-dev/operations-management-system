const CACHE_NAME = "oms-v36";

const urlsToCache = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.json"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache =>
        cache.addAll(
          urlsToCache.map(url =>
            new Request(url, {
              cache: "reload"
            })
          )
        )
      )
  );

  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );

  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);
  const isSameOrigin = requestUrl.origin === self.location.origin;

  if (!isSameOrigin) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.ok) {
          const responseCopy = response.clone();

          caches.open(CACHE_NAME)
            .then(cache =>
              cache.put(event.request, responseCopy)
            );
        }

        return response;
      })
      .catch(() =>
        caches.match(event.request)
          .then(response =>
            response || caches.match("./index.html")
          )
      )
  );
});
