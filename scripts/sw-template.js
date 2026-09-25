/* Service worker — generated at build time by src/integrations/offline.mjs.
   Precaches every page, the refreshers and the boilerplate deck so they load
   in airplane mode after one visit. Navigation: network first (fresh copy
   when online), cache fallback. Assets: cache first. */
const CACHE = "__CACHE_NAME__";
const PRECACHE = __PRECACHE__;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function pageKey(url) {
  // /present?short and /present/ share one cached document; the query is
  // read client-side. Directory-format pages are cached with a trailing slash.
  let p = url.pathname;
  if (!p.endsWith("/") && !p.includes(".")) p += "/";
  return p;
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(pageKey(url), copy));
          }
          return res;
        })
        .catch(() =>
          caches.match(pageKey(url)).then((hit) => hit || caches.match("/offline/"))
        )
    );
    return;
  }

  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
    )
  );
});
