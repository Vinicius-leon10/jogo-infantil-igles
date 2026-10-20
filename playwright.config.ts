import { defineConfig } from "@playwright/test";

/**
 * Regression suite (npm test). Two builds are served, exactly like the real sites:
 * - real version under the GitHub Pages sub-path, on port 4173
 * - test version (SPROUT_ENV=teste), on port 4174
 */
export default defineConfig({
  testDir: "tests",
  timeout: 60_000,
  fullyParallel: true,
  workers: 4,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:4173/jogo-infantil-igles/",
    viewport: { width: 390, height: 844 },
    // The offline cache (service worker) would answer requests the tests block or inspect (the
    // word MP3s, index.html); only R53, which tests it, turns it on.
    serviceWorkers: "block",
    // Like a phone: audio may only start after a tap.
    launchOptions: { args: ["--autoplay-policy=user-gesture-required"] },
  },
  webServer: [
    {
      command:
        "npx vite build --outDir dist-test-prod --emptyOutDir && npx vite preview --outDir dist-test-prod --port 4173 --strictPort --base /jogo-infantil-igles/",
      url: "http://localhost:4173/jogo-infantil-igles/",
      timeout: 120_000,
    },
    {
      command:
        "npx vite build --outDir dist-test-teste --emptyOutDir && npx vite preview --outDir dist-test-teste --port 4174 --strictPort",
      env: { SPROUT_ENV: "teste" },
      url: "http://localhost:4174/",
      timeout: 120_000,
    },
  ],
});
