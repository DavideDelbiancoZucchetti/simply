import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Build della demo come sito statico (GitHub Pages).
// base "./" = percorsi relativi: funziona sia su https://<utente>.github.io/<repo>/ sia in locale.
export default defineConfig({
  root: "demo",
  base: "./",
  plugins: [react()],
  build: { outDir: "../dist", emptyOutDir: true },
});
