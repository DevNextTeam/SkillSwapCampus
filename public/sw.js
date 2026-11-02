const CACHE_NAME = "skillswap-campus-v4";
const APP_FILES = ["/", "/index.html"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_FILES))
      .catch((error) => console.warn("SkillSwap app-shell precache skipped:", error))
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
  const cacheControl = (response.headers.get("Cache-Control") || "").toLowerCase();
  if (cacheControl.includes("no-store") || cacheControl.includes("private")) return false;
  if (response.headers.has("Content-Range")) return false;
  const contentType = (response.headers.get("Content-Type") || "").toLowerCase();
  return !contentType.includes("application/json");
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Never intercept API requests, authenticated PHP endpoints, cross-origin
  // resources, mutations, uploads, or partial media requests.
  if (
    url.origin !== self.location.origin ||
    request.method !== "GET" ||
    request.headers.has("range") ||
    url.pathname.includes("/backend/")
  ) return;

  if (url.pathname.startsWith("/icons/")) {
    event.respondWith(fetch(request));
    return;
  }

  // Prefer current HTML after each release; fall back to the shell offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => (await caches.match("/index.html")) || Response.error())
    );
    return;
  }

  // Vite production assets are fingerprinted, making cache-first safe.
  event.respondWith(
    caches.match(request).then(async (cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      const response = await fetch(request);
      if (isSafeToCache(request, response)) {
        const copy = response.clone();
        event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)));
      }
      return response;
    })
  );
});
