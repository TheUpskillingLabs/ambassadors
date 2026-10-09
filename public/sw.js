/* The ambassador guide used to install a service worker here (sw.js) that
   cached the account's pages for use offline. The Ambassador role moved to
   OLOS (theupskillinglabs.org), so this worker only cleans up after the old
   one: a phone that installed it picks this up on its next visit, deletes
   every cache, unregisters, and reloads any open page so it loads fresh from
   the network. Kept at the same address so the old registration finds it. */
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: "window" });
      for (const client of clients) client.navigate(client.url);
    })()
  );
});
