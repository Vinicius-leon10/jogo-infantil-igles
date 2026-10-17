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
  },
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});
