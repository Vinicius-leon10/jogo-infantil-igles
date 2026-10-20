import { defineConfig, type Plugin } from "vite";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

/** Writes sw.js (src/sw.js with the list of every built file), so the app works offline. */
function offlineCache(): Plugin {
  let outDir = "dist";
  return {
    name: "sprout-offline-cache",
    apply: "build",
    configResolved(c) {
      outDir = c.build.outDir;
    },
    writeBundle(_, bundle) {
      const files = Object.keys(bundle).filter((f) => f !== "index.html" && !f.endsWith(".map"));
      const version = createHash("sha1").update(files.sort().join()).digest("hex").slice(0, 10);
      const source = readFileSync(fileURLToPath(new URL("./src/sw.js", import.meta.url)), "utf8")
        .replace("__VERSION__", version)
        .replace("__FILES__", JSON.stringify(files));
      writeFileSync(join(outDir, "sw.js"), source);
    },
  };
}

export default defineConfig({
  // Relative asset paths so the build works at any sub-path (GitHub Pages serves /jogo-infantil-igles/).
  base: "./",
  plugins: [react(), tailwindcss(), offlineCache()],
  define: {
    // Shown in the levels screen footer; set from the commit in the deploy workflow.
    __APP_VERSION__: JSON.stringify((process.env.GITHUB_SHA ?? "dev").slice(0, 7)),
    // SPROUT_ENV=teste builds the test site (separate saved data + "TESTE" badge).
    __APP_ENV__: JSON.stringify(process.env.SPROUT_ENV === "teste" ? "teste" : "producao"),
  },
  resolve: {
    alias: [
      // Recordings under evaluation (parents' area "Escolher vozes") exist only in the test version.
      ...(process.env.SPROUT_ENV === "teste"
        ? []
        : [{ find: /^\.\/voiceTakes$/, replacement: fileURLToPath(new URL("./src/lib/voiceTakes.none.ts", import.meta.url)) }]),
      { find: "@", replacement: fileURLToPath(new URL("./src", import.meta.url)) },
    ],
  },
});
