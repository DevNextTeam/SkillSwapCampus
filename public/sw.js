const CACHE_NAME = "skillswap-campus-v3";

const APP_FILES = ["/", "/index.html"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_FILES))
      .catch((error) => {
        // A failed precache must not prevent the browser from installing
        // the worker; navigation can still be served from the network.
        console.warn("SkillSwap precache skipped:", error);
      })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name.startsWith("skillswap-campus-") && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

function isSafeToCache(request, response) {
  if (!response || response.status !== 200 || response.type !== "basic") return false;
  if (request.method !== "GET" || request.headers.has("range")) return false;

  const headers = response.headers;
  const cacheControl = (headers.get("Cache-Control") || "").toLowerCase();
  if (cacheControl.includes("no-store") || cacheControl.includes("private")) return false;
  if (headers.has("Content-Range")) return false;

  const contentType = (headers.get("Content-Type") || "").toLowerCase();
  return !contentType.includes("application/json");
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Never cache API calls, authenticated content, cross-origin requests,
  // non-GET requests, or byte-range media requests.
  if (
    url.origin !== self.location.origin ||
    request.method !== "GET" ||
    request.headers.has("range") ||
    url.pathname.includes("/backend/")
  ) {
    return;
  }

  // Icons and other frequently updated branding assets stay network-fresh.
  if (url.pathname.startsWith("/icons/")) {
    event.respondWith(fetch(request));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () =>
        (await caches.match("/index.html")) || Response.error()
      )
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(async (cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      const response = await fetch(request);
      if (isSafeToCache(request, response)) {
        const responseCopy = response.clone();
        event.waitUntil(
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseCopy))
        );
      }
      return response;
    })
  );
});
