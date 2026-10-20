// Offline cache (service worker). vite.config.ts fills in FILES (every file of the build) and
// VERSION, and writes it as sw.js next to index.html. Plain JS: it runs outside the app.
const VERSION = "__VERSION__";
const FILES = __FILES__;
const CACHE = `sprout-${VERSION}`;
const FONTS = "sprout-fonts";

self.addEventListener("install", (event) => {
  // Everything the app can show (pictures, recordings, code) is saved on the first visit,
  // so words never opened before still work without internet.
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(["./", ...FILES])));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("sprout-") && k !== CACHE && k !== FONTS).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Google Fonts: keep a copy so the app's fonts also show offline.
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    event.respondWith(
      caches.open(FONTS).then((c) =>
        c.match(req).then(
          (hit) =>
            hit ||
            fetch(req).then((res) => {
              if (res.ok) c.put(req, res.clone());
              return res;
            }),
        ),
      ),
    );
    return;
  }

  const scope = new URL(self.registration.scope).pathname;
  if (url.origin !== location.origin || !url.pathname.startsWith(scope)) return;
  // The test site lives inside the real one (…/teste/) and has its own worker.
  if (url.pathname.slice(scope.length).startsWith("teste/")) return;
  // The "is there a new version?" check (update.ts) must always reach the internet.
  if (url.searchParams.has("t")) return;

  if (req.mode === "navigate") {
    // Opening the app: the newest page when online, the saved one offline.
    event.respondWith(fetch(req).catch(() => caches.match("./", { ignoreSearch: true })));
    return;
  }
  // Pictures, recordings and code have the build hash in their name: the saved copy is always right.
  event.respondWith(caches.match(req).then((hit) => hit || fetch(req)));
});
