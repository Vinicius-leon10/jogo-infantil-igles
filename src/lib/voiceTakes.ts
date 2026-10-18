// New recordings waiting for the owner's pick (scripts/make-voices.mjs --takes), keyed "<id>-a|b|c".
// Test version only: the official build swaps this module for voiceTakes.none.ts (vite.config.ts),
// so it neither ships nor loads the files.
export const TAKE_URLS: Record<string, string> = Object.fromEntries(
  Object.entries(
    import.meta.glob<string>("../assets/voice-takes/*.mp3", { eager: true, query: "?url", import: "default" }),
  ).map(([path, url]) => [path.slice(path.lastIndexOf("/") + 1, -".mp3".length), url]),
);
