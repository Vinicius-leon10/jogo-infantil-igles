import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  // Relative asset paths so the build works at any sub-path (GitHub Pages serves /jogo-infantil-igles/).
  base: "./",
  plugins: [react(), tailwindcss()],
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
