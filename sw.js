/* SaWWA Souq — Service Worker (basic cache-first for static assets) */
const CACHE = "sawwa-v7";
const ASSETS = [
  "/",
  "/index.html",
  "/shop.html",
  "/product.html",
  "/cart.html",
  "/checkout.html",
  "/account.html",
  "/wishlist.html",
  "/faq.html",
  "/contact.html",
  "/track.html",
  "/about.html",
  "/policy.html",
  "/css/identity.css",
  "/css/style.css",
  "/css/alerts.css",
  "/css/rtl.css",
  "/js/config.js",
  "/js/i18n.js",
  "/js/wishlist.js",
  "/js/notifications.js",
  "/js/shipping.js",
  "/js/coupons.js",
  "/js/tracking.js",
  "/js/store.js",
  "/js/cart.js",
  "/js/aurora.js",
  "/js/ui.js",
  "/assets/logo.svg",
  "/assets/favicon.svg",
  "/manifest.json"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  e.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res.ok && res.type === "basic") {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(req, clone));
        }
        return res;
      }).catch(() => caches.match("/index.html"));
    })
  );
});