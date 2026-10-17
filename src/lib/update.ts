/**
 * The site's host may cache index.html for minutes, and an iPhone home-screen
 * app holds on to it even longer. When the app opens or comes back to the
 * foreground, fetch a fresh index.html and reload if it points to a newer build.
 */
/** The built script and stylesheet this page is running, e.g. "assets/index-abc.js". */
function currentAssets(): string | null {
  const els = document.querySelectorAll<HTMLScriptElement | HTMLLinkElement>(
    'script[src*="assets/"], link[rel="stylesheet"][href*="assets/"]',
  );
  const names = [...els].map((el) => ("src" in el ? el.src : el.href).split("/assets/")[1]);
  return names.length ? names.sort().join(" ") : null;
}

async function checkForUpdate() {
  const mine = currentAssets();
  if (!mine) return; // dev server
  try {
    const res = await fetch(`./index.html?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) return;
    const html = await res.text();
    const latest = [...html.matchAll(/(?:src|href)="[^"]*assets\/([^"]+\.(?:js|css))"/g)]
      .map((m) => m[1])
      .sort()
      .join(" ");
    if (latest && latest !== mine) location.reload();
  } catch {
    // offline: keep the current version
  }
}

export function watchForUpdates() {
  checkForUpdate();
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") checkForUpdate();
  });
}
