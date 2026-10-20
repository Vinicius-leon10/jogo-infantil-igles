// Offline cache (service worker). vite.config.ts fills in FILES (every file of the build) and
// VERSION, and writes it as sw.js next to index.html. Plain JS: it runs outside the app.
const VERSION = "68aa3f676e";
const FILES = ["assets/amazing-D-dYXFou.mp3","assets/awesome-BgNq6527.mp3","assets/bird-C4FRudCv.mp3","assets/black--8vRTxWR.webp","assets/black-BNXNlCMd.mp3","assets/blue-BYGSK9rG.webp","assets/blue-C_Yl6__F.mp3","assets/brown-BBEw42uC.mp3","assets/brown-BGkbwwcR.webp","assets/cat-DmaAthgz.mp3","assets/cow-BqpPkLlU.mp3","assets/dog-DYNiqqaR.webp","assets/dog-DqNR2AY4.mp3","assets/duck-DPmzEi45.mp3","assets/eight-CGrTjQ2B.mp3","assets/eight-DZIs3A5a.webp","assets/elephant-DbYyJBGj.mp3","assets/fantastic-C7i3D2Un.mp3","assets/fish-BvYqbl8g.mp3","assets/five-BdpT2R0m.webp","assets/five-Dmw3MA2m.mp3","assets/four-CkCWtVR0.mp3","assets/four-LDyn6JOM.webp","assets/frog-DJqg8ADl.mp3","assets/gray--sc2ZOGX.mp3","assets/gray-BfkTCVc7.webp","assets/greatjob-D3G-OAui.mp3","assets/green-BoW3ogJZ.webp","assets/green-DCB2_nrc.mp3","assets/horse-DzysaeCP.mp3","assets/index-D3MEr-xf.css","assets/index-D8w5u4b-.js","assets/lion-KhebAx0t.mp3","assets/monkey-ZOko_pi1.mp3","assets/nine-BlagM-u1.webp","assets/nine-gSprVr-X.mp3","assets/one-DgKC1Ja1.webp","assets/one-eNHd7Dxo.mp3","assets/orange-D0kZ_W4H.webp","assets/orange-T5BTNHhH.mp3","assets/perfect-BF_fL0Kj.mp3","assets/pig-DAIUSBtN.mp3","assets/pink-D-2O5ZWo.mp3","assets/pink-DOTjGIgc.webp","assets/purple-DMtEVZUd.webp","assets/purple-HaE5Gm3-.mp3","assets/rabbit-CnpTefIr.mp3","assets/red-Ccfc_R1K.webp","assets/red-VN6nrIEe.mp3","assets/seven-COkW8BQj.mp3","assets/seven-JIb9h0qL.webp","assets/sheep-BzPiYqwf.mp3","assets/six-BJfr7w2W.webp","assets/six-fdht9BDX.mp3","assets/ten-B_E06_sx.mp3","assets/ten-BtTgaA-a.webp","assets/three-CHH1fJ2r.webp","assets/three-CdPY1Ixr.mp3","assets/two-7BXE5V2p.mp3","assets/two-CuxLYSQF.webp","assets/welldone-Bop0sxCq.mp3","assets/white-BJUgTRiG.webp","assets/white-BVUeBUhP.mp3","assets/yellow-B_Pzuoko.mp3","assets/yellow-mVm01zQ2.webp","assets/youdidit-CvwKHrzC.mp3","assets/zero-B9EkGt9J.mp3","assets/zero-BpJaClFL.webp"];
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
